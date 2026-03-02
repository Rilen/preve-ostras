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

// ─── Histórico Anual ────────────────────────────────────────────────────────

export type ClassificacaoAnual = 'seco' | 'normal' | 'umido' | 'muito_umido';

export interface AnnualSummary {
    ano: number;
    precipitacaoTotal: number;  // mm acumulado no ano
    diasComChuva: number;       // dias com precipitação > 1 mm
    picoDiario: number;         // mm no dia de maior precipitação
    picoDiarioData: string;     // data do pico (ISO)
    ventoPico: number;          // km/h maior rajada do ano
    tempMaxMedia: number;       // °C média das máximas
    anomaliaPct: number;        // % vs média histórica do conjunto
    classificacao: ClassificacaoAnual;
}

// ─── Eventos de Desastre ────────────────────────────────────────────────────

export type TipoDesastre =
    | 'enchente'
    | 'alagamento'
    | 'deslizamento'
    | 'ventania'
    | 'granizo'
    | 'emergencia_civil';

export type NivelDesastre = 'ocorrencia' | 'atencao' | 'alerta' | 'emergencia';

export interface DisasterEvent {
    id: string;
    data: string;                  // ISO date: "YYYY-MM-DD"
    tipo: TipoDesastre;
    nivel: NivelDesastre;
    titulo: string;
    descricao: string;
    bairrosAfetados: string[];
    precipitacaoMm?: number;       // mm registrado no evento
    ventoKmh?: number;             // rajada máxima registrada
    fonte: string;
}

// ─── Anomalia Pluviométrica ─────────────────────────────────────────────────

export type TendenciaAnomalia = 'normal' | 'acima' | 'critico';

export interface PluvioAnomaly {
    mes: number;                   // 1–12
    ano: number;
    mediaHistorica: number;        // mm — média do mesmo mês em anos anteriores
    acumuladoAtual: number;        // mm — acumulado até hoje neste mês
    anomaliaPct: number;           // % acima/abaixo da média
    tendencia: TendenciaAnomalia;
    diasRestantes: number;         // dias que faltam para fechar o mês
}
