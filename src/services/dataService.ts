import { db } from './firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface SidraData {
    ano: number;
    populacao: number;
}

export interface WeatherData {
    data: string;
    temp_max: number;
    precipitacao: number;
    vento_max: number;
}

export const getDemographicData = async (): Promise<SidraData[]> => {
    const q = query(collection(db, 'ibge_populacao'), orderBy('ano', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as SidraData);
};

export const getWeatherData = async (): Promise<WeatherData[]> => {
    const q = query(collection(db, 'clima_historico'), orderBy('data', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as WeatherData);
};

export const syncSidraData = async () => {
    const fetchSidra = httpsCallable(functions, 'fetch_sidra_data');
    return await fetchSidra();
};

export const syncWeatherData = async () => {
    const fetchWeather = httpsCallable(functions, 'fetch_weather_data');
    return await fetchWeather();
};

export interface TideData {
    altura: number;
    status: 'enchendo' | 'vazante';
    proximaPreamar: string;
}

export interface PredictiveAlert {
    nivel: 'baixo' | 'médio' | 'alto' | 'crítico';
    mensagem: string;
    bairro: string;
    tempoEstimado: string;
}

export interface ResilienceAnalysis {
    picoChuva: number;
    dataPico: string;
    mediaSemanal: number;
    indiceRisco: number;
    tendenciaPopulacional: 'crescente' | 'estável' | 'decrescente';
    saturacaoAcumulada: number[];
    bairrosAfetados: { nome: string; risco: number; fator: string; info: string; x: number; y: number }[];
    mareAtual: TideData;
    alertasPreditivos: PredictiveAlert[];
    mobilidade: {
        status: 'fluido' | 'alerta' | 'interrompido';
        viasPrincipais: { nome: string; impacto: number }[];
    };
    saude: {
        riscoEpidemiologico: number;
        alertaDoencas: string[];
    };
    infraestrutura: {
        estabilidadeEletrica: number;
        cargaDrenagem: number;
    };
}

// Mapeamento Oficiais de Setores de Monitoramento (Conforme Plano Municipal)
// X: Oeste -> Leste | Y: Norte -> Sul
const FATORES_TOPOGRAFICOS: Record<string, { topo: number; x: number; y: number; info: string }> = {
    'Setor A': { topo: 1.2, x: 35.0, y: 55.0, info: 'Bosque/Recanto' },
    'Setor B': { topo: 1.3, x: 48.0, y: 52.0, info: 'Operário/Casa Grande' },
    'Setor C': { topo: 1.5, x: 62.0, y: 65.0, info: 'Centro/Boca da Barra' },
    'Setor D': { topo: 1.4, x: 68.0, y: 68.0, info: 'Nova Esperança' },
    'Setor E': { topo: 1.4, x: 45.0, y: 35.0, info: 'Nova Cidade/Village' },
    'Setor F': { topo: 1.2, x: 60.0, y: 38.0, info: 'Jardim Mariléa' },
    'Setor G': { topo: 1.1, x: 75.0, y: 55.0, info: 'Costazul/Colinas' },
    'Setor H': { topo: 1.0, x: 72.0, y: 20.0, info: 'Âncora/Village' },
    'Setor I': { topo: 0.8, x: 10.0, y: 15.0, info: 'Rocha Leão' },
    'Setor J': { topo: 0.9, x: 45.0, y: 10.0, info: 'Cantagalo' },
    'Setor K': { topo: 1.3, x: 22.0, y: 50.0, info: 'Serramar/Palmital' },
    'Setor L': { topo: 1.1, x: 88.0, y: 22.0, info: 'Mar do Norte' },
    'Setor M': { topo: 1.5, x: 28.0, y: 78.0, info: 'C. Praiana/Beira Mar' },
    'Setor N': { topo: 1.6, x: 78.0, y: 45.0, info: 'Ouro Verde/Recreio' },
    'Setor O': { topo: 1.1, x: 85.0, y: 35.0, info: 'Enseada/Terra Firme' }
};

// Simulador de Maré Astronômica (Baseado em Macaé/RDO)
const getSimulatedTide = (): TideData => {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    // Maré semi-diurna (~12.4h por ciclo)
    const cycle = 12.42;
    const phase = (hours % cycle) / cycle;
    const height = Math.sin(phase * 2 * Math.PI) * 0.7 + 0.8; // Oscila entre 0.1m e 1.5m

    return {
        altura: height,
        status: Math.cos(phase * 2 * Math.PI) > 0 ? 'enchendo' : 'vazante',
        proximaPreamar: "Em 3h 15min" // Simplificado para o demo
    };
};

export const getWeeklyImpactAnalysis = async (): Promise<ResilienceAnalysis | null> => {
    const weather = await getWeatherData();
    const demographic = await getDemographicData();

    if (weather.length < 7) return null;

    const last7Days = weather.slice(-7);
    const maxPrecip = Math.max(...last7Days.map(d => d.precipitacao));
    const peakDay = last7Days.find(d => d.precipitacao === maxPrecip);
    const avgPrecip = last7Days.reduce((acc, d) => acc + d.precipitacao, 0) / 7;

    let currentSaturacaoValue = 0;
    const historicoSaturacao = last7Days.map(d => {
        currentSaturacaoValue = (currentSaturacaoValue * 0.8) + d.precipitacao;
        return Math.min(100, (currentSaturacaoValue / 50) * 100);
    });

    let tendency: 'crescente' | 'estável' | 'decrescente' = 'estável';
    if (demographic.length >= 2) {
        if (demographic[demographic.length - 1].populacao > demographic[demographic.length - 2].populacao) {
            tendency = 'crescente';
        }
    }

    const popMultiplier = tendency === 'crescente' ? 1.25 : 1.0;
    const tide = getSimulatedTide();

    const bairros = Object.keys(FATORES_TOPOGRAFICOS).map(nome => {
        const config = FATORES_TOPOGRAFICOS[nome];
        const topoFactor = config.topo;
        // Risco aumenta se a maré estiver alta (> 1.2m) em setores específicos da costa (C, G, M, N, O)
        const tideSensitiveSectors = ['Setor C', 'Setor G', 'Setor M', 'Setor N', 'Setor O'];
        const tideFactor = (tide.altura > 1.2 && tideSensitiveSectors.includes(nome)) ? 1.3 : 1.0;
        const riscoBase = (currentSaturacaoValue / 40) * 100;
        const riscoFinal = Math.min(100, riscoBase * topoFactor * popMultiplier * tideFactor);

        let fatorDesc = 'Monitoramento';
        if (topoFactor > 1.4) fatorDesc = 'Topografia Crítica';
        else if (tideFactor > 1.0) fatorDesc = 'Influência de Maré';
        else if (popMultiplier > 1.1) fatorDesc = 'Adensamento';

        return { nome, risco: riscoFinal, fator: fatorDesc, info: config.info, x: config.x, y: config.y };
    });

    // Lógica Preditiva (Simulando previsão de amanhã baseada na média semanal)
    const alertas: PredictiveAlert[] = [];
    if (currentSaturacaoValue > 30) {
        alertas.push({
            nivel: currentSaturacaoValue > 60 ? 'crítico' : 'médio',
            mensagem: `Setor com alta saturação (${currentSaturacaoValue.toFixed(0)}mm). Risco de transbordo de canais e alagamento em áreas de baixada.`,
            bairro: 'Setor N (Ouro Verde)',
            tempoEstimado: 'Próximas 12h'
        });
    }

    if (tide.status === 'enchendo' && tide.altura > 1.0) {
        alertas.push({
            nivel: 'alto',
            mensagem: "Maré em ascensão dificultando escoamento nos setores C, G e L.",
            bairro: 'Eixo Costeiro',
            tempoEstimado: 'Próximas 2h'
        });
    }

    // Lógica de Mobilidade
    const mobilityStatus = currentSaturacaoValue > 70 ? 'interrompido' : currentSaturacaoValue > 40 ? 'alerta' : 'fluido';
    const vias = [
        { nome: 'Rod. Amaral Peixoto (Centro)', impacto: Math.min(100, (currentSaturacaoValue * 1.2) + (tide.altura * 20)) },
        { nome: 'Av. Jane Maria (Jardim Mariléa)', impacto: Math.min(100, currentSaturacaoValue * 1.1) },
        { nome: 'Rua Bangu (Ouro Verde)', impacto: Math.min(100, currentSaturacaoValue * 1.5) }
    ];

    // Lógica de Saúde e Infra
    const healthRisk = Math.min(100, (currentSaturacaoValue * 0.8) + (popMultiplier * 10));
    const healthAlerts = healthRisk > 60 ? ['Risco de Leptospirose', 'Hepatite A'] : ['Monitoramento Preventivo'];

    const infraStability = Math.max(0, 100 - (maxPrecip / 2));
    const drainageLoad = Math.min(100, (currentSaturacaoValue * 1.1) + (tide.altura * 5));

    return {
        picoChuva: maxPrecip,
        dataPico: peakDay?.data || '',
        mediaSemanal: avgPrecip,
        indiceRisco: Math.min(100, (currentSaturacaoValue / 50) * 100 * popMultiplier),
        tendenciaPopulacional: tendency,
        saturacaoAcumulada: historicoSaturacao,
        bairrosAfetados: bairros,
        mareAtual: tide,
        alertasPreditivos: alertas,
        mobilidade: {
            status: mobilityStatus,
            viasPrincipais: vias
        },
        saude: {
            riscoEpidemiologico: healthRisk,
            alertaDoencas: healthAlerts
        },
        infraestrutura: {
            estabilidadeEletrica: infraStability,
            cargaDrenagem: drainageLoad
        }
    };
};

