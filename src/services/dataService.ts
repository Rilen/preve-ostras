/**
 * dataService.ts – Serviço de Dados
 *
 * Estratégia SEM Cloud Functions (plano Spark gratuito do Firebase):
 * - As APIs públicas do IBGE e Open-Meteo são chamadas diretamente do browser.
 * - Os dados obtidos são salvos no Firestore como cache persistente.
 * - Leituras subsequentes vêm do Firestore (sem bater nas APIs toda vez).
 */

import {
    collection,
    query,
    orderBy,
    getDocs,
    doc,
    writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type {
    SidraData,
    WeatherData,
    TideData,
    ResilienceAnalysis,
    BairroRisco,
    PredictiveAlert,
} from "../types";

// ─── Constantes de API ───────────────────────────────────────────────────────

const IBGE_CODE_RIO_DAS_OSTRAS = "3304524";
const SIDRA_URL = `https://apisidra.ibge.gov.br/values/t/6579/n6/${IBGE_CODE_RIO_DAS_OSTRAS}/v/9324/p/all`;
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const RIO_DAS_OSTRAS_LAT = -22.5269;
const RIO_DAS_OSTRAS_LON = -41.945;

// ─── Leituras do Firestore (cache) ──────────────────────────────────────────

export const getDemographicData = async (): Promise<SidraData[]> => {
    const q = query(collection(db, "ibge_populacao"), orderBy("ano", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SidraData);
};

export const getWeatherData = async (): Promise<WeatherData[]> => {
    const q = query(collection(db, "clima_historico"), orderBy("data", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as WeatherData);
};

// ─── Sincronização direta do Browser (sem Cloud Functions) ──────────────────

/**
 * Busca a série histórica de população de Rio das Ostras no IBGE SIDRA
 * diretamente do browser e salva no Firestore como cache.
 *
 * O SIDRA permite CORS de qualquer origem — não é necessário um proxy.
 */
export const syncSidraData = async (): Promise<{ count: number }> => {
    console.info("[SIDRA] Buscando dados no IBGE...");

    const response = await fetch(SIDRA_URL);
    if (!response.ok) throw new Error(`IBGE SIDRA: HTTP ${response.status}`);

    const raw: Record<string, string>[] = await response.json();
    if (!raw || raw.length <= 1) throw new Error("Nenhum dado retornado pelo IBGE.");

    // O 1º item é cabeçalho de metadados; os demais são os registros
    const records = raw.slice(1);

    // D2C = código do período (ano), V = valor (população)
    const isValidYear = (v: string) => /^\d{4}$/.test(v.trim());

    const batch = writeBatch(db);
    const colRef = collection(db, "ibge_populacao");
    let count = 0;

    for (const row of records) {
        const anoRaw = (row["D2C"] ?? "").trim();
        const popRaw = row["V"] ?? "";
        if (!isValidYear(anoRaw)) continue;

        const ano = parseInt(anoRaw, 10);
        const populacao = parseFloat(popRaw);
        if (isNaN(populacao)) continue;

        batch.set(doc(colRef, String(ano)), { ano, populacao });
        count++;
    }

    await batch.commit();
    console.info(`[SIDRA] ${count} registros salvos no Firestore.`);
    return { count };
};

/**
 * Busca os últimos 30 dias de dados meteorológicos de Rio das Ostras
 * via Open-Meteo diretamente do browser e salva no Firestore como cache.
 *
 * Open-Meteo é uma API aberta, gratuita e sem chave — permite CORS.
 */
export const syncWeatherData = async (): Promise<{ count: number }> => {
    console.info("[Weather] Buscando dados na Open-Meteo...");

    const params = new URLSearchParams({
        latitude: String(RIO_DAS_OSTRAS_LAT),
        longitude: String(RIO_DAS_OSTRAS_LON),
        past_days: "30",
        daily: "temperature_2m_max,precipitation_sum,wind_speed_10m_max",
        timezone: "America/Sao_Paulo",
    });

    const response = await fetch(`${OPEN_METEO_URL}?${params}`);
    if (!response.ok) throw new Error(`Open-Meteo: HTTP ${response.status}`);

    const data = await response.json();
    const daily = data?.daily ?? {};
    if (!daily.time?.length) throw new Error("Nenhum dado meteorológico retornado.");

    const { time, temperature_2m_max: temps, precipitation_sum: preci, wind_speed_10m_max: winds } = daily;

    const batch = writeBatch(db);
    const colRef = collection(db, "clima_historico");
    let count = 0;

    for (let i = 0; i < time.length; i++) {
        if (temps[i] == null) continue;
        const dateStr: string = time[i];
        batch.set(doc(colRef, dateStr), {
            data: dateStr,
            temp_max: Number(temps[i]),
            precipitacao: preci[i] != null ? Number(preci[i]) : 0,
            vento_max: winds[i] != null ? Number(winds[i]) : 0,
        });
        count++;
    }

    await batch.commit();
    console.info(`[Weather] ${count} registros salvos no Firestore.`);
    return { count };
};

// ─── Cálculo de Análise de Resiliência ──────────────────────────────────────

/**
 * Mapeamento oficial dos setores de monitoramento de Rio das Ostras.
 * Coordenadas X / Y expressas em % (0–100) para posicionamento no mapa SVG.
 */
const SETORES: Record<string, { topo: number; x: number; y: number; info: string }> = {
    "Setor A": { topo: 1.2, x: 35.0, y: 55.0, info: "Bosque / Recanto" },
    "Setor B": { topo: 1.3, x: 48.0, y: 52.0, info: "Operário / Casa Grande" },
    "Setor C": { topo: 1.5, x: 62.0, y: 65.0, info: "Centro / Boca da Barra" },
    "Setor D": { topo: 1.4, x: 68.0, y: 68.0, info: "Nova Esperança" },
    "Setor E": { topo: 1.4, x: 45.0, y: 35.0, info: "Nova Cidade / Village" },
    "Setor F": { topo: 1.2, x: 60.0, y: 38.0, info: "Jardim Mariléa" },
    "Setor G": { topo: 1.1, x: 75.0, y: 55.0, info: "Costazul / Colinas" },
    "Setor H": { topo: 1.0, x: 72.0, y: 20.0, info: "Âncora / Village" },
    "Setor I": { topo: 0.8, x: 10.0, y: 15.0, info: "Rocha Leão" },
    "Setor J": { topo: 0.9, x: 45.0, y: 10.0, info: "Cantagalo" },
    "Setor K": { topo: 1.3, x: 22.0, y: 50.0, info: "Serramar / Palmital" },
    "Setor L": { topo: 1.1, x: 88.0, y: 22.0, info: "Mar do Norte" },
    "Setor M": { topo: 1.5, x: 28.0, y: 78.0, info: "C. Praiana / Beira Mar" },
    "Setor N": { topo: 1.6, x: 78.0, y: 45.0, info: "Ouro Verde / Recreio" },
    "Setor O": { topo: 1.1, x: 85.0, y: 35.0, info: "Enseada / Terra Firme" },
};

const SETORES_COSTEIROS = new Set(["Setor C", "Setor G", "Setor M", "Setor N", "Setor O"]);

const getSimulatedTide = (): TideData => {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    const phase = (hours % 12.42) / 12.42;
    const altura = Math.sin(phase * 2 * Math.PI) * 0.7 + 0.8;
    return {
        altura,
        status: Math.cos(phase * 2 * Math.PI) > 0 ? "enchendo" : "vazante",
        proximaPreamar: "Em 3h 15min",
    };
};

export const getWeeklyImpactAnalysis = async (): Promise<ResilienceAnalysis | null> => {
    let [weather, demographic] = await Promise.all([
        getWeatherData(),
        getDemographicData(),
    ]);

    // ── Fallback automático: Firestore vazio → busca direto da Open-Meteo ───────
    // Isso acontece na primeira abertura do app, antes de qualquer sincronização.
    if (weather.length < 7) {
        console.info("[Analysis] Firestore vazio — buscando Open-Meteo em modo leitura direta...");
        try {
            const params = new URLSearchParams({
                latitude: String(RIO_DAS_OSTRAS_LAT),
                longitude: String(RIO_DAS_OSTRAS_LON),
                past_days: "30",
                daily: "temperature_2m_max,precipitation_sum,wind_speed_10m_max",
                timezone: "America/Sao_Paulo",
            });
            const res = await fetch(`${OPEN_METEO_URL}?${params}`);
            if (res.ok) {
                const json = await res.json();
                const { time, temperature_2m_max: temps, precipitation_sum: preci, wind_speed_10m_max: winds } = json.daily ?? {};
                if (time?.length) {
                    weather = (time as string[]).map((data: string, i: number) => ({
                        data,
                        temp_max: temps[i] ?? 0,
                        precipitacao: preci[i] ?? 0,
                        vento_max: winds[i] ?? 0,
                    }));
                }
            }
        } catch (e) {
            console.warn("[Analysis] Fallback Open-Meteo falhou:", e);
        }
    }

    if (weather.length < 7) return null;


    const last7 = weather.slice(-7);
    const maxPrecip = Math.max(...last7.map((d) => d.precipitacao));
    const peakDay = last7.find((d) => d.precipitacao === maxPrecip);
    const avgPrecip = last7.reduce((s, d) => s + d.precipitacao, 0) / 7;

    let satAcum = 0;
    const historicoSaturacao = last7.map((d) => {
        satAcum = satAcum * 0.8 + d.precipitacao;
        return Math.min(100, (satAcum / 50) * 100);
    });
    const currentSat = satAcum;

    let tendencia: ResilienceAnalysis["tendenciaPopulacional"] = "estável";
    if (demographic.length >= 2) {
        const last = demographic[demographic.length - 1].populacao;
        const prev = demographic[demographic.length - 2].populacao;
        if (last > prev) tendencia = "crescente";
        else if (last < prev) tendencia = "decrescente";
    }

    const popMultiplier = tendencia === "crescente" ? 1.25 : 1.0;
    const tide = getSimulatedTide();

    const bairros: BairroRisco[] = Object.entries(SETORES).map(([nome, cfg]) => {
        const tideFactor = tide.altura > 1.2 && SETORES_COSTEIROS.has(nome) ? 1.3 : 1.0;
        const riscoFinal = Math.min(100, (currentSat / 40) * 100 * cfg.topo * popMultiplier * tideFactor);
        let fator = "Monitoramento";
        if (cfg.topo > 1.4) fator = "Topografia Crítica";
        else if (tideFactor > 1.0) fator = "Influência de Maré";
        else if (popMultiplier > 1.1) fator = "Adensamento";
        return { nome, risco: riscoFinal, fator, info: cfg.info, x: cfg.x, y: cfg.y };
    });

    const alertas: PredictiveAlert[] = [];
    if (currentSat > 30) {
        alertas.push({
            nivel: currentSat > 60 ? "crítico" : "médio",
            mensagem: `Alta saturação acumulada (${currentSat.toFixed(0)} mm). Risco de alagamento em baixadas.`,
            bairro: "Setor N (Ouro Verde)",
            tempoEstimado: "Próximas 12h",
        });
    }
    if (tide.status === "enchendo" && tide.altura > 1.0) {
        alertas.push({
            nivel: "alto",
            mensagem: "Maré em ascensão dificultando escoamento nos Setores C, G e L.",
            bairro: "Eixo Costeiro",
            tempoEstimado: "Próximas 2h",
        });
    }

    const mobilidadeStatus =
        currentSat > 70 ? "interrompido" : currentSat > 40 ? "alerta" : "fluido";
    const viasPrincipais = [
        { nome: "Rod. Amaral Peixoto (Centro)", impacto: Math.min(100, currentSat * 1.2 + tide.altura * 20) },
        { nome: "Av. Jane Maria (Jardim Mariléa)", impacto: Math.min(100, currentSat * 1.1) },
        { nome: "Rua Bangu (Ouro Verde)", impacto: Math.min(100, currentSat * 1.5) },
    ];

    const riscoEpidemiologico = Math.min(100, currentSat * 0.8 + popMultiplier * 10);
    const alertaDoencas =
        riscoEpidemiologico > 60 ? ["Risco de Leptospirose", "Hepatite A"] : ["Monitoramento Preventivo"];

    const estabilidadeEletrica = Math.max(0, 100 - maxPrecip / 2);
    const cargaDrenagem = Math.min(100, currentSat * 1.1 + tide.altura * 5);

    return {
        picoChuva: maxPrecip,
        dataPico: peakDay?.data ?? "",
        mediaSemanal: avgPrecip,
        indiceRisco: Math.min(100, (currentSat / 50) * 100 * popMultiplier),
        tendenciaPopulacional: tendencia,
        saturacaoAcumulada: historicoSaturacao,
        bairrosAfetados: bairros,
        mareAtual: tide,
        alertasPreditivos: alertas,
        mobilidade: { status: mobilidadeStatus, viasPrincipais },
        saude: { riscoEpidemiologico, alertaDoencas },
        infraestrutura: { estabilidadeEletrica, cargaDrenagem },
    };
};
