/**
 * historicalService.ts – Serviço de Dados Históricos
 *
 * Responsável por:
 * 1. Buscar 10 anos de dados meteorológicos via Open-Meteo Archive API (CORS livre).
 * 2. Agregar por ano: total de chuva, pico diário, dias de chuva, vento máx, temp.
 * 3. Calcular anomalia pluviométrica do mês atual vs. média histórica (2015–2024).
 * 4. Expor a linha do tempo curada de eventos de desastre em Rio das Ostras.
 *
 * Nota: A Open-Meteo Archive API permite consultas desde 1940, é gratuita e não
 * exige chave de API. Endpoint: https://archive-api.open-meteo.com/v1/archive
 */

import type { AnnualSummary, ClassificacaoAnual, DisasterEvent, PluvioAnomaly } from "../types";

const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const LAT = -22.5269;
const LON = -41.945;
const TZ = "America/Sao_Paulo";

// ─── Dados históricos: busca todos os anos de uma vez ───────────────────────

/**
 * Busca dados meteorológicos diários de START_YEAR até END_YEAR via Open-Meteo Archive.
 * Retorna um resumo agregado por ano, com anomalia calculada sobre a média do período.
 */
export const fetchAnnualSummaries = async (
    startYear = 2015,
    endYear = 2024,
): Promise<AnnualSummary[]> => {
    const startDate = `${startYear}-01-01`;
    const endDate = `${endYear}-12-31`;

    const params = new URLSearchParams({
        latitude: String(LAT),
        longitude: String(LON),
        start_date: startDate,
        end_date: endDate,
        daily: "precipitation_sum,wind_speed_10m_max,temperature_2m_max",
        timezone: TZ,
    });

    const res = await fetch(`${ARCHIVE_URL}?${params}`);
    if (!res.ok) throw new Error(`Open-Meteo Archive: HTTP ${res.status}`);

    const json = await res.json();
    const { time, precipitation_sum, wind_speed_10m_max, temperature_2m_max } = json.daily;

    // Agrupa dados por ano
    const byYear: Record<number, { prec: number[]; wind: number[]; temp: number[]; dates: string[] }> = {};

    for (let i = 0; i < time.length; i++) {
        const year = parseInt(time[i].slice(0, 4), 10);
        if (!byYear[year]) byYear[year] = { prec: [], wind: [], temp: [], dates: [] };
        byYear[year].prec.push(precipitation_sum[i] ?? 0);
        byYear[year].wind.push(wind_speed_10m_max[i] ?? 0);
        byYear[year].temp.push(temperature_2m_max[i] ?? 0);
        byYear[year].dates.push(time[i]);
    }

    const summaries: AnnualSummary[] = Object.entries(byYear).map(([anoStr, d]) => {
        const ano = parseInt(anoStr, 10);

        const precipitacaoTotal = d.prec.reduce((a, b) => a + b, 0);
        const diasComChuva = d.prec.filter((v) => v > 1).length;
        const picoDiario = Math.max(...d.prec);
        const picoDiarioData = d.dates[d.prec.indexOf(picoDiario)] ?? "";
        const ventoPico = Math.max(...d.wind);
        const tempMaxMedia = d.temp.reduce((a, b) => a + b, 0) / d.temp.length;

        return { ano, precipitacaoTotal, diasComChuva, picoDiario, picoDiarioData, ventoPico, tempMaxMedia, anomaliaPct: 0, classificacao: "normal" };
    });

    // Calcula média histórica e anomalia
    const media = summaries.reduce((s, x) => s + x.precipitacaoTotal, 0) / summaries.length;
    summaries.forEach((s) => {
        s.anomaliaPct = ((s.precipitacaoTotal - media) / media) * 100;
        s.classificacao = classifyYear(s.precipitacaoTotal, media);
    });

    return summaries.sort((a, b) => a.ano - b.ano);
};

const classifyYear = (total: number, media: number): ClassificacaoAnual => {
    const ratio = total / media;
    if (ratio < 0.75) return "seco";
    if (ratio < 1.15) return "normal";
    if (ratio < 1.40) return "umido";
    return "muito_umido";
};

// ─── Anomalia do Mês Atual ───────────────────────────────────────────────────

/**
 * Calcula a anomalia pluviométrica do mês atual comparado à média histórica
 * dos mesmos meses de 2015 a 2024 via Open-Meteo Archive.
 */
export const fetchCurrentMonthAnomaly = async (): Promise<PluvioAnomaly> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    const today = now.toISOString().slice(0, 10);
    const lastDayN = new Date(year, month, 0).getDate();
    const diasRestantes = lastDayN - now.getDate();

    // Mês atual
    const mesStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const histStart = `2015-${String(month).padStart(2, "0")}-01`;
    const histEnd = `2024-${String(month).padStart(2, "0")}-${String(lastDayN).padStart(2, "0")}`;

    const [resCurrent, resHist] = await Promise.all([
        fetch(`${ARCHIVE_URL}?${new URLSearchParams({
            latitude: String(LAT), longitude: String(LON),
            start_date: mesStart, end_date: today,
            daily: "precipitation_sum", timezone: TZ,
        })}`),
        fetch(`${ARCHIVE_URL}?${new URLSearchParams({
            latitude: String(LAT), longitude: String(LON),
            start_date: histStart, end_date: histEnd,
            daily: "precipitation_sum", timezone: TZ,
        })}`),
    ]);

    const [curJson, histJson] = await Promise.all([resCurrent.json(), resHist.json()]);

    const acumuladoAtual = (curJson.daily.precipitation_sum as number[])
        .reduce((a: number, b: number) => a + (b ?? 0), 0);

    // Média do mesmo mês ao longo dos anos históricos
    const histPrec: number[] = histJson.daily.precipitation_sum ?? [];
    const mediaHistorica = histPrec.reduce((a: number, b: number) => a + (b ?? 0), 0) / 10; // ~10 anos

    const anomaliaPct = mediaHistorica > 0
        ? ((acumuladoAtual - mediaHistorica) / mediaHistorica) * 100
        : 0;

    let tendencia: PluvioAnomaly["tendencia"] = "normal";
    if (anomaliaPct > 100) tendencia = "critico";
    else if (anomaliaPct > 30) tendencia = "acima";

    return { mes: month, ano: year, mediaHistorica, acumuladoAtual, anomaliaPct, tendencia, diasRestantes };
};

// ─── Linha do Tempo de Desastres (dados curados) ─────────────────────────────

/**
 * Retorna a linha do tempo curada de eventos de desastre registrados em
 * Rio das Ostras. Fontes: S2iD (MIDR), Defesa Civil RDO, imprensa local.
 *
 * Nota: O S2iD não expõe API pública — estes dados foram extraídos manualmente
 * e são atualizados a cada nova ocorrência significativa.
 */
export const getDisasterTimeline = (): DisasterEvent[] => [
    {
        id: "rdo-2026-03-01",
        data: "2026-03-01",
        tipo: "emergencia_civil",
        nivel: "emergencia",
        titulo: "Estado de Emergência — 20 bairros submersos",
        descricao:
            "190 mm de chuva em 24 horas provocam submersão de 20 bairros, transbordamento do Canal Medeiros e do Rio Jundiá. Prefeitura decreta Estado de Emergência.",
        bairrosAfetados: ["Ouro Verde", "Recreio", "Nova Esperança", "Boca da Barra", "Centro", "Jardim Mariléa"],
        precipitacaoMm: 190,
        fonte: "Prefeitura de Rio das Ostras / Defesa Civil (01/03/2026)",
    },
    {
        id: "rdo-2026-02-04",
        data: "2026-02-04",
        tipo: "alagamento",
        nivel: "alerta",
        titulo: "91 mm em 2 horas — metade da chuva mensal em uma tarde",
        descricao:
            "Evento extremo concentrado causa alagamentos expressivos. Volume equivalente à metade da média histórica de fevereiro (≈ 180 mm) em apenas 120 minutos.",
        bairrosAfetados: ["Ouro Verde", "Operário", "Nova Cidade"],
        precipitacaoMm: 91,
        fonte: "Defesa Civil Rio das Ostras (04/02/2026)",
    },
    {
        id: "rdo-2026-01",
        data: "2026-01-31",
        tipo: "enchente",
        nivel: "alerta",
        titulo: "Janeiro 2026 — 253 mm, recorde histórico mensal",
        descricao:
            "Acumulado de 253 mm supera a média histórica de janeiro (≈ 180 mm) em 40%. Interrupção de eletricidade, internet e telefonia em bairros periféricos.",
        bairrosAfetados: ["Serramar", "Palmital", "Bosque"],
        precipitacaoMm: 253,
        fonte: "Prefeitura de Rio das Ostras (jan/2026)",
    },
    {
        id: "rdo-2024-12",
        data: "2024-12-23",
        tipo: "enchente",
        nivel: "alerta",
        titulo: "Natal 2024 — Canal Medeiros transborda",
        descricao:
            "Chuvas acumuladas na semana do Natal causam transbordamento do Canal Medeiros. Famílias desalojadas na rua Bangu e arredores.",
        bairrosAfetados: ["Ouro Verde", "Recreio"],
        precipitacaoMm: 145,
        fonte: "Defesa Civil / Imprensa local (dez/2024)",
    },
    {
        id: "rdo-2024-03",
        data: "2024-03-08",
        tipo: "alagamento",
        nivel: "atencao",
        titulo: "Março 2024 — Rod. Amaral Peixoto interditada",
        descricao:
            "Frente fria traz 80 mm em 6 horas. Rodovia Amaral Peixoto interditada no trecho Centro–Boca da Barra por alagamento.",
        bairrosAfetados: ["Centro", "Boca da Barra"],
        precipitacaoMm: 80,
        fonte: "INEA / Defesa Civil (mar/2024)",
    },
    {
        id: "rdo-2023-02",
        data: "2023-02-14",
        tipo: "deslizamento",
        nivel: "alerta",
        titulo: "Fevereiro 2023 — Deslizamento no Rocha Leão",
        descricao:
            "Chuvas intensas (120 mm em 12h) estabilizam taludes no bairro Rocha Leão. Duas residências evacuadas por risco de solapamento.",
        bairrosAfetados: ["Rocha Leão"],
        precipitacaoMm: 120,
        fonte: "Defesa Civil Rio das Ostras (fev/2023)",
    },
    {
        id: "rdo-2022-04",
        data: "2022-04-02",
        tipo: "ventania",
        nivel: "atencao",
        titulo: "Abril 2022 — Ventania 92 km/h derruba árvores",
        descricao:
            "Sistema frontal intenso traz rajadas de até 92 km/h. Quedas de árvores e postes em Costazul e Âncora.",
        bairrosAfetados: ["Costazul", "Âncora"],
        ventoKmh: 92,
        fonte: "REDEMET / Imprensa local (abr/2022)",
    },
    {
        id: "rdo-2020-02",
        data: "2020-02-06",
        tipo: "enchente",
        nivel: "emergencia",
        titulo: "Fevereiro 2020 — 180 mm/24h, alerta máximo",
        descricao:
            "Uma das piores enchentes da última decade. Rio Jundiá transborda em 3 pontos. Área da Boca da Barra completamente alagada por 18 horas.",
        bairrosAfetados: ["Boca da Barra", "Centro", "Nova Esperança"],
        precipitacaoMm: 180,
        fonte: "S2iD / Defesa Civil Rio das Ostras (fev/2020)",
    },
    {
        id: "rdo-2018-12",
        data: "2018-12-10",
        tipo: "alagamento",
        nivel: "alerta",
        titulo: "Dezembro 2018 — Temporada de verão comprometida",
        descricao:
            "Frente fria pré-verão provoca 130 mm em 8h. Temporada de turismo afetada com alagamentos no acesso à Praia da Barra/Coroa.",
        bairrosAfetados: ["Costa Praiana", "Beira Mar"],
        precipitacaoMm: 130,
        fonte: "Defesa Civil / Imprensa (dez/2018)",
    },
    {
        id: "rdo-2017-01",
        data: "2017-01-14",
        tipo: "enchente",
        nivel: "alerta",
        titulo: "Janeiro 2017 — Vila Operária alagada",
        descricao:
            "Chuvas de verão acumulam 160 mm em 48h. Canal em Vila Operária transborda criando ilhamento temporário.",
        bairrosAfetados: ["Operário", "Casa Grande"],
        precipitacaoMm: 160,
        fonte: "Prefeitura de Rio das Ostras (jan/2017)",
    },
];
