/**
 * ResilienceMap.tsx – Mapa Interativo de Resiliência (área central Full HD)
 *
 * Recebe `analysis` como prop do Dashboard (sem chamada própria ao Firestore).
 * D3.js gerencia zoom/pan, efeitos de glow e tooltip tático.
 */

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { ResilienceAnalysis } from "../types";
import RiskBulletin from "./RiskBulletin";

interface Props {
    analysis: ResilienceAnalysis | null;
    loading: boolean;
}

const riskColor = (v: number) =>
    v > 70 ? "#f43f5e" : v > 45 ? "#f59e0b" : v > 20 ? "#3b82f6" : "#10b981";

const ResilienceMap: React.FC<Props> = ({ analysis, loading }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showBulletin, setShowBulletin] = useState(false);
    const [hoveredSector, setHoveredSector] = useState<string | null>(null);

    // ─── D3: Renderização do mapa ─────────────────────────────────────────────
    useEffect(() => {
        if (!analysis || !svgRef.current || !containerRef.current) return;

        const el = containerRef.current;
        const W = el.clientWidth || 860;
        const H = el.clientHeight || 600;

        // Limpar
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("width", W)
            .attr("height", H)
            .attr("viewBox", `0 0 ${W} ${H}`)
            .style("background", "transparent");

        // ── Defs (filtros e gradientes) ──────────────────────────────────────────
        const defs = svg.append("defs");

        // Glow filter
        const glow = defs.append("filter").attr("id", "glow-sector").attr("x", "-30%").attr("y", "-30%").attr("width", "160%").attr("height", "160%");
        glow.append("feGaussianBlur").attr("stdDeviation", "8").attr("result", "blur");
        const glowMerge = glow.append("feMerge");
        glowMerge.append("feMergeNode").attr("in", "blur");
        glowMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Grid glow filter (sutil)
        const gridGlow = defs.append("filter").attr("id", "grid-glow");
        gridGlow.append("feGaussianBlur").attr("stdDeviation", "1").attr("result", "b");
        const gm2 = gridGlow.append("feMerge");
        gm2.append("feMergeNode").attr("in", "b");
        gm2.append("feMergeNode").attr("in", "SourceGraphic");

        // ── Grupo com suporte a zoom e pan ──────────────────────────────────────
        const g = svg.append("g").attr("class", "map-root");

        // ── Grade tática de fundo ────────────────────────────────────────────────
        const gridSize = 48;
        for (let x = 0; x <= W; x += gridSize) {
            g.append("line")
                .attr("x1", x).attr("y1", 0).attr("x2", x).attr("y2", H)
                .attr("stroke", "rgba(59,130,246,0.04)").attr("stroke-width", 0.5);
        }
        for (let y = 0; y <= H; y += gridSize) {
            g.append("line")
                .attr("x1", 0).attr("y1", y).attr("x2", W).attr("y2", y)
                .attr("stroke", "rgba(59,130,246,0.04)").attr("stroke-width", 0.5);
        }

        // Linha de varredura tática
        const scanG = svg.append("g").style("pointer-events", "none");
        scanG.append("line")
            .attr("x1", 0).attr("x2", W).attr("stroke", "rgba(59,130,246,0.15)").attr("stroke-width", 1)
            .attr("class", "scan-line-el");

        const animateScan = () => {
            scanG.select(".scan-line-el")
                .attr("y1", 0).attr("y2", 0)
                .transition().duration(4000).ease(d3.easeLinear)
                .attr("y1", H).attr("y2", H)
                .on("end", animateScan);
        };
        animateScan();

        // ── Círculo de referência central (cidade) ───────────────────────────────
        const cx = W * 0.52;
        const cy = H * 0.52;

        g.append("circle")
            .attr("cx", cx).attr("cy", cy).attr("r", Math.min(W, H) * 0.38)
            .attr("fill", "none")
            .attr("stroke", "rgba(59,130,246,0.06)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "6 6");

        g.append("circle")
            .attr("cx", cx).attr("cy", cy).attr("r", Math.min(W, H) * 0.22)
            .attr("fill", "none")
            .attr("stroke", "rgba(59,130,246,0.04)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4 8");

        // ── Label central ────────────────────────────────────────────────────────
        g.append("text")
            .attr("x", cx).attr("y", cy + 4)
            .attr("text-anchor", "middle")
            .attr("fill", "rgba(59,130,246,0.3)")
            .attr("font-size", "11px")
            .attr("font-family", "'JetBrains Mono', monospace")
            .attr("font-weight", "700")
            .attr("letter-spacing", "0.2em")
            .text("RIO DAS OSTRAS");

        g.append("text")
            .attr("x", cx).attr("y", cy + 20)
            .attr("text-anchor", "middle")
            .attr("fill", "rgba(148,163,184,0.2)")
            .attr("font-size", "8px")
            .attr("font-family", "'JetBrains Mono', monospace")
            .attr("letter-spacing", "0.1em")
            .text("RJ · 22°31'S  41°56'O");

        // ── Setores ──────────────────────────────────────────────────────────────
        analysis.bairrosAfetados.forEach((setor) => {
            const px = (setor.x / 100) * W;
            const py = (setor.y / 100) * H;
            const baseR = 20 + setor.risco * 0.18;
            const color = riskColor(setor.risco);

            const sectorG = g.append("g")
                .attr("class", "sector-group")
                .attr("transform", `translate(${px},${py})`)
                .style("cursor", "pointer");

            // Halo externo (pulso de risco)
            sectorG.append("circle")
                .attr("r", baseR * 1.9)
                .attr("fill", color)
                .attr("opacity", 0.04 + setor.risco * 0.0006);

            // Anel médio animado
            if (setor.risco > 40) {
                sectorG.append("circle")
                    .attr("r", baseR * 1.4)
                    .attr("fill", "none")
                    .attr("stroke", color)
                    .attr("stroke-width", 1)
                    .attr("opacity", 0.2)
                    .attr("stroke-dasharray", "3 6")
                    .attr("class", "spin-cw");
            }

            // Círculo principal
            sectorG.append("circle")
                .attr("r", baseR)
                .attr("fill", color)
                .attr("opacity", 0.15 + setor.risco * 0.004)
                .attr("filter", setor.risco > 50 ? "url(#glow-sector)" : null)
                .transition().duration(600).delay(analysis.bairrosAfetados.indexOf(setor) * 40)
                .attr("opacity", 0.18 + setor.risco * 0.005);

            // Borda
            sectorG.append("circle")
                .attr("r", baseR)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 1.5)
                .attr("opacity", 0.5);

            // Cruz tática central
            const arm = 5;
            sectorG.append("line").attr("x1", -arm).attr("y1", 0).attr("x2", arm).attr("y2", 0)
                .attr("stroke", color).attr("stroke-width", 1).attr("opacity", 0.7);
            sectorG.append("line").attr("x1", 0).attr("y1", -arm).attr("x2", 0).attr("y2", arm)
                .attr("stroke", color).attr("stroke-width", 1).attr("opacity", 0.7);

            // Label do setor
            sectorG.append("text")
                .attr("y", -baseR - 8)
                .attr("text-anchor", "middle")
                .attr("fill", color)
                .attr("font-size", "8px")
                .attr("font-family", "'JetBrains Mono', monospace")
                .attr("font-weight", "700")
                .attr("letter-spacing", "0.12em")
                .attr("opacity", 0.85)
                .text(setor.nome);

            // Valor de risco
            sectorG.append("text")
                .attr("y", 4)
                .attr("text-anchor", "middle")
                .attr("fill", color)
                .attr("font-size", "9px")
                .attr("font-family", "'JetBrains Mono', monospace")
                .attr("font-weight", "700")
                .attr("opacity", 0.9)
                .text(`${setor.risco.toFixed(0)}%`);

            // Área de interação (invisível, maior que o círculo)
            sectorG.append("circle")
                .attr("r", baseR + 10)
                .attr("fill", "transparent")
                .on("mouseenter", () => setHoveredSector(setor.nome))
                .on("mouseleave", () => setHoveredSector(null));
        });

        // ── Zoom e Pan ───────────────────────────────────────────────────────────
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform.toString());
            });

        d3.select(svgRef.current).call(zoom);

        // Duplo clique para resetar
        d3.select(svgRef.current).on("dblclick.zoom", () => {
            d3.select(svgRef.current!)
                .transition().duration(600)
                .call(zoom.transform, d3.zoomIdentity);
        });

    }, [analysis]);

    // ─── Setor em hover ───────────────────────────────────────────────────────
    const hoveredData = analysis?.bairrosAfetados.find((b) => b.nome === hoveredSector);

    return (
        <div className="flex flex-col h-full relative">

            {/* ── Barra de controles do mapa ─────────────────────────────────────── */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <span className="label-tactical">Mapa de Risco · Rio das Ostras</span>
                    <div className="flex items-center gap-3">
                        {[
                            { color: "#10b981", label: "Baixo" },
                            { color: "#3b82f6", label: "Moderado" },
                            { color: "#f59e0b", label: "Alto" },
                            { color: "#f43f5e", label: "Crítico" },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                <span className="text-[10px] font-mono text-slate-500">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="label-tactical">Scroll = Zoom · Drag = Pan · 2× = Reset</div>
                    <div className="w-px h-4 bg-white/10" />
                    <button
                        onClick={() => setShowBulletin(true)}
                        disabled={!analysis}
                        className="btn-ghost"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Boletim Formal
                    </button>
                </div>
            </div>

            {/* ── Área do Mapa ───────────────────────────────────────────────────── */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="spinner w-10 h-10" />
                        <span className="label-tactical">Calculando análise de resiliência...</span>
                    </div>
                ) : !analysis ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-8">
                        <div className="text-4xl opacity-30">🗺️</div>
                        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                            Sem dados suficientes para análise. Use o botão{" "}
                            <strong className="text-blue-400">⚡ Sincronizar Dados</strong> na barra superior para buscar dados das APIs.
                        </p>
                    </div>
                ) : (
                    <svg ref={svgRef} className="w-full h-full" />
                )}

                {/* Crosshair de hover */}
                {hoveredData && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none animate-fade-up z-20">
                        <div className="card px-4 py-2.5 flex items-center gap-4 border border-white/10">
                            <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: riskColor(hoveredData.risco), boxShadow: `0 0 8px ${riskColor(hoveredData.risco)}` }}
                            />
                            <div>
                                <div className="text-sm font-bold text-slate-100">{hoveredData.nome}</div>
                                <div className="text-xs text-slate-400">{hoveredData.info} · {hoveredData.fator}</div>
                            </div>
                            <div className="text-xl font-black font-mono" style={{ color: riskColor(hoveredData.risco) }}>
                                {hoveredData.risco.toFixed(0)}%
                            </div>
                        </div>
                    </div>
                )}

                {/* Índice de Risco Global (overlay no mapa) */}
                {analysis && (
                    <div className="absolute bottom-5 right-5 card px-5 py-3 text-right">
                        <div className="label-tactical mb-1">Índice de Risco Global</div>
                        <div
                            className="text-4xl font-black font-mono"
                            style={{ color: riskColor(analysis.indiceRisco), textShadow: `0 0 20px ${riskColor(analysis.indiceRisco)}` }}
                        >
                            {analysis.indiceRisco.toFixed(1)}
                            <span className="text-base text-slate-500 ml-1">/ 100</span>
                        </div>
                    </div>
                )}

                {/* Coordenadas (ornamental) */}
                <div className="absolute bottom-5 left-5 label-tactical opacity-40 leading-6">
                    LAT 22°31′S<br />LON 41°56′O
                </div>
            </div>

            {/* ── Modal Boletim ──────────────────────────────────────────────────── */}
            {showBulletin && analysis && (
                <RiskBulletin analysis={analysis} onClose={() => setShowBulletin(false)} />
            )}
        </div>
    );
};

export default ResilienceMap;
