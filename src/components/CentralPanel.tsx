/**
 * CentralPanel.tsx – Painel Central com Abas
 *
 * Abas: 🗺️ Mapa de Risco | 📈 Histórico 10 anos | 🌪️ Desastres
 *
 * A aba de Mapa delega para ResilienceMap (D3).
 * A aba de Histórico busca dados via Open-Meteo Archive e exibe HistoricalChart.
 * A aba de Desastres exibe DisasterTimeline + card de recomendações.
 */

import React, { useState, useEffect, lazy, Suspense } from "react";
import ResilienceMap from "./ResilienceMap";
import type { ResilienceAnalysis, AnnualSummary, DisasterEvent, PluvioAnomaly } from "../types";
import { fetchAnnualSummaries, fetchCurrentMonthAnomaly, getDisasterTimeline } from "../services/historicalService";

const HistoricalChart = lazy(() => import("./charts/HistoricalChart"));
const DisasterTimeline = lazy(() => import("./charts/DisasterTimeline"));

interface Props {
    analysis: ResilienceAnalysis | null;
    loading: boolean;
}

type Tab = "mapa" | "historico" | "desastres";

const TAB_CONFIG: { id: Tab; icon: string; label: string }[] = [
    { id: "mapa", icon: "🗺️", label: "Mapa de Risco" },
    { id: "historico", icon: "📈", label: "Histórico 10 anos" },
    { id: "desastres", icon: "🌪️", label: "Desastres" },
];

const riskColor = (v: number) =>
    v > 70 ? "#f43f5e" : v > 45 ? "#f59e0b" : v > 20 ? "#3b82f6" : "#10b981";

const CentralPanel: React.FC<Props> = ({ analysis, loading }) => {
    const [tab, setTab] = useState<Tab>("mapa");

    // ─── Dados históricos ──────────────────────────────────────────────────────
    const [annuals, setAnnuals] = useState<AnnualSummary[]>([]);
    const [anomaly, setAnomaly] = useState<PluvioAnomaly | null>(null);
    const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
    const [histLoading, setHistLoading] = useState(false);
    const [histError, setHistError] = useState<string | null>(null);

    useEffect(() => {
        setDisasters(getDisasterTimeline());
    }, []);

    useEffect(() => {
        if (tab !== "historico" || annuals.length > 0) return;
        setHistLoading(true);
        setHistError(null);

        Promise.all([fetchAnnualSummaries(2015, 2024), fetchCurrentMonthAnomaly()])
            .then(([sums, anom]) => { setAnnuals(sums); setAnomaly(anom); })
            .catch((e) => setHistError(e.message ?? "Erro ao buscar dados históricos"))
            .finally(() => setHistLoading(false));
    }, [tab, annuals.length]);

    // ─── Métricas derivadas para o painel de desastres ────────────────────────
    const totalEmergencias = disasters.filter((d) => d.nivel === "emergencia").length;
    const ultimoEvento = disasters[0];
    const tipoMaisFrequente = (() => {
        const count: Record<string, number> = {};
        disasters.forEach((d) => { count[d.tipo] = (count[d.tipo] ?? 0) + 1; });
        return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    })();
    const emojiTipo: Record<string, string> = {
        enchente: "🌊", alagamento: "💧", deslizamento: "⛰️",
        ventania: "🌪️", granizo: "🧊", emergencia_civil: "🚨",
    };

    return (
        <div className="flex flex-col h-full">

            {/* ─── Barra de Abas ─────────────────────────────────────────────────── */}
            <div className="shrink-0 flex items-center justify-between px-5 py-0 border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="flex items-center gap-1">
                    {TAB_CONFIG.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-4 text-xs font-bold tracking-wide border-b-2 transition-all duration-200 ${tab === t.id
                                    ? "border-blue-400 text-blue-400"
                                    : "border-transparent text-slate-500 hover:text-slate-300 hover:border-white/20"
                                }`}
                        >
                            <span>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Info rápida contextual na barra de abas */}
                <div className="flex items-center gap-4 pr-2">
                    {tab === "historico" && anomaly && (
                        <span className={`badge ${anomaly.tendencia === "critico" ? "badge-rose" :
                                anomaly.tendencia === "acima" ? "badge-amber" : "badge-blue"
                            }`}>
                            Anomalia {anomaly.anomaliaPct > 0 ? "+" : ""}{anomaly.anomaliaPct.toFixed(0)}%
                        </span>
                    )}
                    {tab === "desastres" && (
                        <span className="label-tactical">{disasters.length} eventos registrados</span>
                    )}
                    {tab === "mapa" && analysis && (
                        <div className="flex items-center gap-2">
                            <span className="label-tactical">Scroll=Zoom · Drag=Pan · 2×=Reset</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Conteúdo da Aba ───────────────────────────────────────────────── */}

            {/* ABA: Mapa */}
            {tab === "mapa" && (
                <ResilienceMap analysis={analysis} loading={loading} />
            )}

            {/* ABA: Histórico */}
            {tab === "historico" && (
                <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
                    <div className="flex items-center justify-between shrink-0">
                        <div>
                            <div className="label-tactical">Precipitação Anual · Rio das Ostras</div>
                            <div className="text-base font-bold text-slate-200 mt-0.5">
                                2015 – 2024 · Open-Meteo ERA5
                            </div>
                        </div>
                        {annuals.length > 0 && (() => {
                            const media = annuals.reduce((s, a) => s + a.precipitacaoTotal, 0) / annuals.length;
                            const maisUmido = annuals.reduce((m, a) => a.precipitacaoTotal > m.precipitacaoTotal ? a : m);
                            const maisSeco = annuals.reduce((m, a) => a.precipitacaoTotal < m.precipitacaoTotal ? a : m);
                            return (
                                <div className="flex gap-3">
                                    {[
                                        { label: "Média dec.", value: `${media.toFixed(0)} mm`, color: "#94a3b8" },
                                        { label: `Mais úmido (${maisUmido.ano})`, value: `${maisUmido.precipitacaoTotal.toFixed(0)} mm`, color: "#f43f5e" },
                                        { label: `Mais seco (${maisSeco.ano})`, value: `${maisSeco.precipitacaoTotal.toFixed(0)} mm`, color: "#f59e0b" },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="card px-3 py-2 text-right">
                                            <div className="label-tactical">{label}</div>
                                            <div className="text-sm font-black font-mono mt-0.5" style={{ color }}>{value}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                    {histLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3">
                            <div className="spinner w-8 h-8" />
                            <span className="label-tactical">Buscando 10 anos de dados via Open-Meteo Archive...</span>
                        </div>
                    ) : histError ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="card card-rose p-6 text-center max-w-sm">
                                <div className="text-2xl mb-2">⚠️</div>
                                <div className="text-xs text-rose-300 font-mono">{histError}</div>
                            </div>
                        </div>
                    ) : (
                        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="spinner w-6 h-6" /></div>}>
                            <div className="flex-1 min-h-0">
                                <HistoricalChart data={annuals} anomaly={anomaly} />
                            </div>
                        </Suspense>
                    )}
                </div>
            )}

            {/* ABA: Desastres */}
            {tab === "desastres" && (
                <div className="flex-1 overflow-hidden grid grid-cols-[1fr_300px] gap-0">

                    {/* Timeline */}
                    <div className="overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <div>
                                <div className="label-tactical">Linha do Tempo · Eventos Registrados</div>
                                <div className="text-base font-bold text-slate-200 mt-0.5">
                                    Rio das Ostras · 2017–2026 · Fontes: S2iD / Defesa Civil
                                </div>
                            </div>
                        </div>
                        <Suspense fallback={<div className="spinner w-6 h-6" />}>
                            <DisasterTimeline events={disasters} />
                        </Suspense>
                    </div>

                    {/* Painel de estatísticas e recomendações */}
                    <div className="border-l border-white/5 p-5 overflow-y-auto flex flex-col gap-4">

                        {/* Stats */}
                        <div>
                            <div className="label-tactical mb-3">Estatísticas do Período</div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: "Eventos totais", value: disasters.length, color: "#60a5fa" },
                                    { label: "Emergências", value: totalEmergencias, color: "#fb7185" },
                                    { label: "Só no verão", value: disasters.filter((d) => ["12", "01", "02", "03"].includes(d.data.slice(5, 7))).length, color: "#fbbf24" },
                                    { label: "Com dado mm", value: disasters.filter((d) => d.precipitacaoMm).length, color: "#34d399" },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="card p-3">
                                        <div className="label-tactical">{label}</div>
                                        <div className="text-2xl font-black font-mono mt-1" style={{ color }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mais frequente */}
                        <div className="card p-4">
                            <div className="label-tactical mb-2">Tipo Mais Frequente</div>
                            <div className="text-2xl mb-1">{emojiTipo[tipoMaisFrequente] || "⚠️"}</div>
                            <div className="text-sm font-bold text-slate-200 capitalize">{tipoMaisFrequente.replace("_", " ")}</div>
                        </div>

                        {/* Último evento */}
                        {ultimoEvento && (
                            <div className={`card p-4 ${ultimoEvento.nivel === "emergencia" ? "card-rose" : "card-amber"}`}>
                                <div className="label-tactical mb-2">Evento Mais Recente</div>
                                <div className="text-sm font-bold text-slate-200 leading-snug">{ultimoEvento.titulo}</div>
                                <div className="label-tactical mt-1.5">
                                    {new Date(ultimoEvento.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                                </div>
                            </div>
                        )}

                        {/* Recomendações */}
                        <div className="card p-4">
                            <div className="label-tactical mb-3">Recomendações · Verão</div>
                            <div className="space-y-2.5">
                                {[
                                    { icon: "🌡️", text: "Monitorar acumulado 48h via CEMADEN" },
                                    { icon: "📻", text: "Ativar plantão da Defesa Civil acima de 50 mm/h" },
                                    { icon: "🚗", text: "Barrar acesso à Boca da Barra com > 100 mm/24h" },
                                    { icon: "🏠", text: "Mapear famílias em área de risco (Rocha Leão, N, O)" },
                                    { icon: "📡", text: "Integrar alertas CEMADEN-RJ em tempo real" },
                                ].map(({ icon, text }) => (
                                    <div key={text} className="flex items-start gap-2">
                                        <span className="text-sm mt-0.5 shrink-0">{icon}</span>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Anomalia atual */}
                        {analysis && (
                            <div className="card p-4">
                                <div className="label-tactical mb-2">Risco Atual (Análise)</div>
                                <div className="text-3xl font-black font-mono" style={{
                                    color: riskColor(analysis.indiceRisco),
                                    textShadow: `0 0 20px ${riskColor(analysis.indiceRisco)}`
                                }}>
                                    {analysis.indiceRisco.toFixed(0)}/100
                                </div>
                                <div className="label-tactical mt-1">{analysis.indiceRisco > 60 ? "⚠️ Acima do limiar" : "✅ Dentro do normal"}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CentralPanel;
