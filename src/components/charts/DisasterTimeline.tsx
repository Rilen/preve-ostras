/**
 * DisasterTimeline.tsx – Linha do Tempo de Eventos de Desastre
 *
 * Exibe os eventos históricos de Rio das Ostras em ordem cronológica reversa
 * com codificação por tipo e nível de severidade.
 */

import React, { useState } from "react";
import type { DisasterEvent, NivelDesastre, TipoDesastre } from "../../types";

interface Props {
    events: DisasterEvent[];
}

const TIPO_EMOJI: Record<TipoDesastre, string> = {
    enchente: "🌊",
    alagamento: "💧",
    deslizamento: "⛰️",
    ventania: "🌪️",
    granizo: "🧊",
    emergencia_civil: "🚨",
};

const NIVEL_STYLE: Record<NivelDesastre, { line: string; badge: string; border: string }> = {
    ocorrencia: { line: "bg-slate-500", badge: "badge-blue", border: "border-slate-500/20" },
    atencao: { line: "bg-amber-400", badge: "badge-amber", border: "border-amber-400/20" },
    alerta: { line: "bg-rose-500", badge: "badge-rose", border: "border-rose-500/20" },
    emergencia: { line: "bg-rose-600 animate-pulse", badge: "badge-rose", border: "border-rose-600/40" },
};

const DisasterTimeline: React.FC<Props> = ({ events }) => {
    const [expanded, setExpanded] = useState<string | null>(events[0]?.id ?? null);

    const sorted = [...events].sort((a, b) => b.data.localeCompare(a.data));

    return (
        <div className="relative flex flex-col gap-2 overflow-y-auto pr-2" style={{ maxHeight: "100%" }}>

            {sorted.map((ev, idx) => {
                const style = NIVEL_STYLE[ev.nivel];
                const isOpen = expanded === ev.id;
                const date = new Date(ev.data + "T12:00:00");
                const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

                return (
                    <div key={ev.id} className="relative flex gap-3">
                        {/* Linha vertical da timeline */}
                        <div className="flex flex-col items-center shrink-0">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 z-10 ${style.line}`} />
                            {idx < sorted.length - 1 && (
                                <div className="w-px flex-1 bg-white/[0.06] mt-1 min-h-[16px]" />
                            )}
                        </div>

                        {/* Card do evento */}
                        <div
                            className={`flex-1 card border mb-3 ${style.border} cursor-pointer transition-all duration-200 ${isOpen ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"}`}
                            onClick={() => setExpanded(isOpen ? null : ev.id)}
                        >
                            <div className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-base leading-none shrink-0">{TIPO_EMOJI[ev.tipo]}</span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-200 leading-snug">{ev.titulo}</p>
                                            <p className="label-tactical mt-0.5">{dateStr}</p>
                                        </div>
                                    </div>
                                    <span className={`badge ${style.badge} shrink-0`}>
                                        {ev.nivel.toUpperCase()}
                                    </span>
                                </div>

                                {/* Dados rápidos sempre visíveis */}
                                <div className="flex gap-3 mt-2">
                                    {ev.precipitacaoMm !== undefined && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-blue-400 text-[10px]">💧</span>
                                            <span className="font-mono text-[10px] font-bold text-slate-300">{ev.precipitacaoMm} mm</span>
                                        </div>
                                    )}
                                    {ev.ventoKmh !== undefined && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-amber-400 text-[10px]">🌪️</span>
                                            <span className="font-mono text-[10px] font-bold text-slate-300">{ev.ventoKmh} km/h</span>
                                        </div>
                                    )}
                                    {ev.bairrosAfetados.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-rose-400 text-[10px]">📍</span>
                                            <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                                {ev.bairrosAfetados.slice(0, 2).join(", ")}
                                                {ev.bairrosAfetados.length > 2 ? ` +${ev.bairrosAfetados.length - 2}` : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Expandido */}
                                {isOpen && (
                                    <div className="mt-3 pt-3 border-t border-white/[0.06] animate-fade-up">
                                        <p className="text-xs text-slate-400 leading-relaxed mb-3">{ev.descricao}</p>

                                        {ev.bairrosAfetados.length > 0 && (
                                            <div className="mb-2">
                                                <div className="label-tactical mb-1.5">Bairros afetados</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {ev.bairrosAfetados.map((b) => (
                                                        <span key={b} className="badge badge-blue text-[9px]">{b}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="text-[10px] text-slate-600 font-mono mt-2">
                                            📋 {ev.fonte}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DisasterTimeline;
