/**
 * types.ts – Interfaces e Tipos Compartilhados
 *
 * Centraliza todos os contratos de dados usados entre
 * serviços, componentes e Cloud Functions.
 */

// ─── Dados demográficos (IBGE SIDRA) ────────────────────────────────────────

export interface SidraData {
    ano: number;
    populacao: number;
}

// ─── Dados meteorológicos (Open-Meteo) ──────────────────────────────────────

export interface WeatherData {
    data: string;       // ISO date: "YYYY-MM-DD"
    temp_max: number;   // °C
    precipitacao: number; // mm
    vento_max: number;  // km/h
}

// ─── Maré Astronômica ───────────────────────────────────────────────────────

export interface TideData {
    altura: number;                        // metros
    status: "enchendo" | "vazante";
    proximaPreamar: string;                // descrição textual
}

// ─── Alertas Preditivos ─────────────────────────────────────────────────────

export interface PredictiveAlert {
    nivel: "baixo" | "médio" | "alto" | "crítico";
    mensagem: string;
    bairro: string;
    tempoEstimado: string;
}

// ─── Análise Semanal de Impacto (resultado principal) ───────────────────────

export interface ResilienceAnalysis {
    picoChuva: number;
    dataPico: string;
    mediaSemanal: number;
    indiceRisco: number;                   // 0–100
    tendenciaPopulacional: "crescente" | "estável" | "decrescente";
    saturacaoAcumulada: number[];          // um valor por dia (últimos 7 dias)
    bairrosAfetados: BairroRisco[];
    mareAtual: TideData;
    alertasPreditivos: PredictiveAlert[];
    mobilidade: MobilidadeStatus;
    saude: SaudeStatus;
    infraestrutura: InfraestruturaStatus;
}

export interface BairroRisco {
    nome: string;
    risco: number;   // 0–100
    fator: string;   // descrição do fator dominante
    info: string;    // bairros do setor
    x: number;       // posição no mapa % (0–100)
    y: number;       // posição no mapa % (0–100)
}

export interface MobilidadeStatus {
    status: "fluido" | "alerta" | "interrompido";
    viasPrincipais: {
        nome: string;
        impacto: number; // 0–100
    }[];
}

export interface SaudeStatus {
    riscoEpidemiologico: number; // 0–100
    alertaDoencas: string[];
}

export interface InfraestruturaStatus {
    estabilidadeEletrica: number; // 0–100
    cargaDrenagem: number;        // 0–100
}
