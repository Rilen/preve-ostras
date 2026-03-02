/**
 * SidebarRight.tsx – Painel Direito: Alertas + Mobilidade + Pop + Score
 */

import React, { useEffect, useState } from "react";
import type { ResilienceAnalysis, SidraData } from "../types";
import { getDemographicData } from "../services/dataService";

interface Props {
    analysis: ResilienceAnalysis | null;
    loading: boolean;
}

const SkeletonBlock: React.FC<{ h?: string }> = ({ h = "h-20" }) => (
    <div className={`${h} rounded-xl bg-white/[0.03] animate-pulse`} />
);

const riskColor = (v: number) =>
    v > 70 ? "#fb7185" : v > 45 ? "#fbbf24" : "#34d399";

const SidebarRight: React.FC<Props> = ({ analysis, loading }) => {
    const [sidra, setSidra] = useState<SidraData[]>([]);

    useEffect(() => {
        getDemographicData().then(setSidra).catch(console.error);
    }, []);

    if (loading) return (
        <aside className="sidebar-right">
            {[...Array(5)].map((_, i) => <SkeletonBlock key={i} h={i === 0 ? "h-28" : "h-20"} />)}
        </aside>
    );

    // Score de turismo baseado no indiceRisco
    const tourismScore = analysis
        ? Math.round(Math.max(0, 100 - analysis.indiceRisco * 0.8))
        : null;

    const latestPop = sidra.length > 0 ? sidra[sidra.length - 1] : null;
    const prevPop = sidra.length > 1 ? sidra[sidra.length - 2] : null;
    const popDelta = latestPop && prevPop
        ? ((latestPop.populacao - prevPop.populacao) / prevPop.populacao * 100)
        : null;

    return (
        <aside className="sidebar-right">

            {/* ── Cabeçalho da coluna ────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-1 mb-1">
                <span className="label-tactical">Análise Preditiva</span>
                {analysis && (
                    <span className={`badge ${analysis.indiceRisco > 60 ? "badge-rose" : "badge-green"}`}>
                        RISCO {analysis.indiceRisco.toFixed(0)}%
                    </span>
                )}
            </div>

            {/* ── Score de Turismo ───────────────────────────────────────────── */}
            <div className="card card-blue p-4">
                <div className="label-tactical mb-3">Score de Turismo · Rio das Ostras</div>
                <div className="flex items-center gap-4">
                    {/* Gauge circular */}
                    <div className="relative w-20 h-20 shrink-0">
                        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                            <circle
                                cx="40" cy="40" r="32" fill="none"
                                stroke={tourismScore !== null ? riskColor(100 - tourismScore) : "#334155"}
                                strokeWidth="6"
                                strokeDasharray={`${2 * Math.PI * 32}`}
                                strokeDashoffset={`${2 * Math.PI * 32 * (1 - (tourismScore ?? 0) / 100)}`}
                                strokeLinecap="round"
                                style={{ filter: `drop-shadow(0 0 6px ${riskColor(100 - (tourismScore ?? 0))})`, transition: "stroke-dashoffset 1s ease" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-lg font-black text-slate-100 leading-none">
                                {tourismScore ?? "--"}
                            </span>
                            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">/100</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="text-lg font-black text-slate-100 leading-tight">
                            {tourismScore === null ? "Sem dados" :
                                tourismScore > 80 ? "Excelente" :
                                    tourismScore > 60 ? "Favorável" :
                                        tourismScore > 40 ? "Moderado" : "Desfavorável"}
                        </div>
                        <div className="label-tactical mt-1">Aptidão climática geral</div>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                            <span className="badge badge-green">🐢 Tartaruga</span>
                            <span className="badge badge-blue">🐳 Baleia</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Alertas Preditivos ─────────────────────────────────────────── */}
            <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="label-tactical">Alertas Ativos</span>
                    {analysis && (
                        <span className="text-xs font-mono text-slate-500">
                            {analysis.alertasPreditivos.length} alerta{analysis.alertasPreditivos.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {!analysis || analysis.alertasPreditivos.length === 0 ? (
                    <div className="flex items-center gap-3 py-3">
                        <span className="pulse-dot pulse-dot-green w-2 h-2" />
                        <span className="text-xs text-slate-400">Nenhum alerta crítico ativo</span>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {analysis.alertasPreditivos.map((a, i) => {
                            const colors = {
                                crítico: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400", dot: "pulse-dot-rose" },
                                alto: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", dot: "pulse-dot-amber" },
                                médio: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", dot: "pulse-dot-blue" },
                                baixo: { bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-400", dot: "pulse-dot-green" },
                            }[a.nivel];
                            return (
                                <div key={i} className={`${colors.bg} border ${colors.border} rounded-xl p-3`}>
                                    <div className="flex items-start gap-2">
                                        <span className={`pulse-dot ${colors.dot} w-2 h-2 mt-0.5 shrink-0`} />
                                        <div className="min-w-0">
                                            <div className={`text-[10px] font-bold uppercase tracking-widest font-mono ${colors.text} mb-1`}>
                                                {a.nivel.toUpperCase()} · {a.bairro}
                                            </div>
                                            <p className="text-xs text-slate-300 leading-relaxed">{a.mensagem}</p>
                                            <div className="text-[10px] text-slate-500 mt-1 font-mono">{a.tempoEstimado}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Mobilidade Viária ──────────────────────────────────────────── */}
            {analysis && (
                <div className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="label-tactical">Mobilidade Viária</span>
                        <span className={`badge ${analysis.mobilidade.status === "fluido" ? "badge-green" :
                                analysis.mobilidade.status === "alerta" ? "badge-amber" :
                                    "badge-rose"
                            }`}>
                            <span className={`pulse-dot ${analysis.mobilidade.status === "fluido" ? "pulse-dot-green" :
                                    analysis.mobilidade.status === "alerta" ? "pulse-dot-amber" :
                                        "pulse-dot-rose"
                                } w-1.5 h-1.5`} />
                            {analysis.mobilidade.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="space-y-2.5">
                        {analysis.mobilidade.viasPrincipais.map((v) => (
                            <div key={v.nome}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs text-slate-400 truncate max-w-[70%]">{v.nome}</span>
                                    <span className="text-xs font-bold font-mono" style={{ color: riskColor(v.impacto) }}>
                                        {v.impacto.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill transition-all duration-700"
                                        style={{ width: `${v.impacto}%`, background: riskColor(v.impacto) }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Tendência Populacional ─────────────────────────────────────── */}
            {latestPop && (
                <div className="card card-emerald p-4">
                    <div className="label-tactical mb-3">Crescimento Populacional</div>
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="text-2xl font-black text-gradient-blue">
                                {(latestPop.populacao / 1000).toFixed(1)}
                                <span className="text-sm font-semibold text-slate-400 ml-1">mil hab.</span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-1">Estimativa {latestPop.ano}</div>
                        </div>
                        {popDelta !== null && (
                            <div className={`text-right ${popDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                <div className="text-lg font-black font-mono">
                                    {popDelta >= 0 ? "▲" : "▼"} {Math.abs(popDelta).toFixed(1)}%
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">vs. {prevPop?.ano}</div>
                            </div>
                        )}
                    </div>
                    {analysis && (
                        <>
                            <div className="divider mt-3" />
                            <div className="flex justify-between mt-2.5">
                                <span className="text-xs text-slate-500">Tendência</span>
                                <span className={`badge ${analysis.tendenciaPopulacional === "crescente" ? "badge-green" :
                                        analysis.tendenciaPopulacional === "decrescente" ? "badge-rose" :
                                            "badge-blue"
                                    }`}>
                                    {analysis.tendenciaPopulacional.toUpperCase()}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Setor de Maior Risco ───────────────────────────────────────── */}
            {analysis && (() => {
                const top = [...analysis.bairrosAfetados].sort((a, b) => b.risco - a.risco)[0];
                return (
                    <div className="card p-4">
                        <div className="label-tactical mb-3">Setor Mais Crítico</div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-base font-black text-slate-100">{top.nome}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{top.info}</div>
                                <div className="mt-1.5">
                                    <span className="badge badge-amber">{top.fator}</span>
                                </div>
                            </div>
                            <div className="text-3xl font-black text-glow-rose" style={{ color: riskColor(top.risco) }}>
                                {top.risco.toFixed(0)}%
                            </div>
                        </div>
                    </div>
                );
            })()}

        </aside>
    );
};

export default SidebarRight;
