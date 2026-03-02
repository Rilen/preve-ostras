/**
 * SidebarLeft.tsx – Painel Esquerdo: Maré + Saturação + Saúde/Infra
 */

import React from "react";
import type { ResilienceAnalysis } from "../types";

interface Props {
    analysis: ResilienceAnalysis | null;
    loading: boolean;
}

const SkeletonBlock: React.FC<{ h?: string }> = ({ h = "h-20" }) => (
    <div className={`${h} rounded-xl bg-white/[0.03] animate-pulse`} />
);

const SidebarLeft: React.FC<Props> = ({ analysis, loading }) => {
    if (loading) return (
        <aside className="sidebar-left">
            {[...Array(5)].map((_, i) => <SkeletonBlock key={i} h={i === 0 ? "h-32" : "h-20"} />)}
        </aside>
    );

    return (
        <aside className="sidebar-left">

            {/* ── Cabeçalho da coluna ────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-1 mb-1">
                <span className="label-tactical">Monitoramento Costeiro</span>
                <span className="badge badge-blue">LIVE</span>
            </div>

            {/* ── Maré Astronômica ───────────────────────────────────────────── */}
            <div className="card card-blue p-4">
                <div className="label-tactical mb-3">Maré Atual · Macaé/RDO</div>
                <div className="flex items-end justify-between">
                    <div>
                        <div className={`metric-giant ${analysis ? "text-gradient-blue" : "text-slate-600"}`}>
                            {analysis ? `${analysis.mareAtual.altura.toFixed(2)}` : "--"}
                            <span className="text-lg font-semibold text-slate-400 ml-1">m</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <svg
                                className={`w-4 h-4 text-blue-400 transition-transform duration-700 ${analysis?.mareAtual.status === "enchendo" ? "" : "rotate-180"}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14M5 12l7 7 7-7" />
                            </svg>
                            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest font-mono">
                                {analysis?.mareAtual.status ?? "—"}
                            </span>
                        </div>
                    </div>
                    {/* Gráfico de onda simplificado */}
                    <div className="w-20 h-16 relative overflow-hidden opacity-60">
                        <svg viewBox="0 0 80 60" className="w-full h-full">
                            <defs>
                                <linearGradient id="wave-g" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,30 C10,20 20,40 30,30 C40,20 50,40 60,30 C70,20 80,40 80,30 L80,60 L0,60 Z"
                                fill="url(#wave-g)" />
                            <path d="M0,30 C10,20 20,40 30,30 C40,20 50,40 60,30 C70,20 80,40 80,30"
                                fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                        </svg>
                    </div>
                </div>
                <div className="divider mt-3" />
                <div className="flex justify-between mt-2.5 text-xs">
                    <span className="text-slate-500">Próx. Preamar</span>
                    <span className="text-slate-200 font-semibold font-mono">
                        {analysis?.mareAtual.proximaPreamar ?? "—"}
                    </span>
                </div>
            </div>

            {/* ── Saturação Acumulada (7 dias) ───────────────────────────────── */}
            <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="label-tactical">Saturação Acumulada</span>
                    <span className="text-xs font-mono text-slate-500">7 dias</span>
                </div>

                {analysis?.saturacaoAcumulada ? (
                    <>
                        <div className="flex items-end gap-1.5 h-20 mb-3">
                            {analysis.saturacaoAcumulada.map((v, i) => {
                                const color = v > 70 ? "bg-rose-500" : v > 40 ? "bg-amber-400" : "bg-blue-500";
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                        <div
                                            className={`w-full rounded-t-md ${color} opacity-80 group-hover:opacity-100 transition-all duration-300`}
                                            style={{ height: `${Math.max(8, v)}%` }}
                                            title={`Dia ${i + 1}: ${v.toFixed(0)}%`}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Valor atual de saturação */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Nível atual</span>
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const v = analysis.saturacaoAcumulada[analysis.saturacaoAcumulada.length - 1];
                                    return (
                                        <>
                                            <div className="progress-bar w-24">
                                                <div
                                                    className={`progress-fill ${v > 70 ? "bg-rose-500" : v > 40 ? "bg-amber-400" : "bg-blue-500"}`}
                                                    style={{ width: `${v}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold font-mono text-slate-200">{v.toFixed(0)}%</span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-24 flex items-center justify-center text-slate-600 text-xs">
                        Sem dados climáticos
                    </div>
                )}
            </div>

            {/* ── Pico e Média de Precipitação ───────────────────────────────── */}
            {analysis && (
                <div className="card p-4">
                    <div className="label-tactical mb-3">Precipitação · 7 dias</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="text-slate-500 text-[10px] mb-1 font-mono uppercase tracking-wider">Pico</div>
                            <div className="text-2xl font-black text-gradient-blue">{analysis.picoChuva.toFixed(1)}</div>
                            <div className="text-slate-500 text-xs">mm</div>
                        </div>
                        <div>
                            <div className="text-slate-500 text-[10px] mb-1 font-mono uppercase tracking-wider">Média</div>
                            <div className="text-2xl font-black text-slate-200">{analysis.mediaSemanal.toFixed(1)}</div>
                            <div className="text-slate-500 text-xs">mm/dia</div>
                        </div>
                    </div>
                    {analysis.dataPico && (
                        <div className="mt-3 text-[10px] text-slate-500 font-mono">
                            Pico em {new Date(analysis.dataPico + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Saúde Epidemiológica ───────────────────────────────────────── */}
            {analysis && (
                <div className="card card-rose p-4">
                    <div className="label-tactical mb-3">Risco Epidemiológico</div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl font-black" style={{
                            color: analysis.saude.riscoEpidemiologico > 60 ? "#fb7185" : "#34d399"
                        }}>
                            {analysis.saude.riscoEpidemiologico.toFixed(0)}%
                        </div>
                        <div className="flex-1">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${analysis.saude.riscoEpidemiologico}%`,
                                        background: analysis.saude.riscoEpidemiologico > 60
                                            ? "linear-gradient(to right, #f43f5e, #fb923c)"
                                            : "linear-gradient(to right, #10b981, #34d399)"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {analysis.saude.alertaDoencas.map((d) => (
                            <span key={d} className={`badge ${analysis.saude.riscoEpidemiologico > 60 ? "badge-rose" : "badge-green"}`}>
                                {d}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Infraestrutura ─────────────────────────────────────────────── */}
            {analysis && (
                <div className="card card-amber p-4">
                    <div className="label-tactical mb-3">Integridade da Rede</div>
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <span className="text-xs text-slate-400">Estabilidade Elétrica</span>
                                <span className="text-xs font-bold font-mono text-slate-200">
                                    {analysis.infraestrutura.estabilidadeEletrica.toFixed(0)}%
                                </span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill bg-amber-400"
                                    style={{ width: `${analysis.infraestrutura.estabilidadeEletrica}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <span className="text-xs text-slate-400">Carga de Drenagem</span>
                                <span className="text-xs font-bold font-mono text-slate-200">
                                    {analysis.infraestrutura.cargaDrenagem.toFixed(0)}%
                                </span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${analysis.infraestrutura.cargaDrenagem}%`,
                                        background: analysis.infraestrutura.cargaDrenagem > 70
                                            ? "linear-gradient(to right, #f43f5e, #fb923c)"
                                            : "linear-gradient(to right, #f59e0b, #fbbf24)"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Rodapé ─────────────────────────────────────────────────────── */}
            <div className="mt-auto pt-4 border-t border-white/5">
                <p className="label-tactical text-center leading-loose">
                    Preve-Ostras © 2025<br />Rio das Ostras / RJ
                </p>
            </div>

        </aside>
    );
};

export default SidebarLeft;
