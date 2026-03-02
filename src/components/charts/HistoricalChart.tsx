/**
 * HistoricalChart.tsx – Gráfico D3 de Precipitação Histórica (10 anos)
 *
 * Barras anuais coloridas por classificação + linha de anomalia + linha de média.
 * Hover mostra tooltip tático com todos os dados do ano.
 */

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { AnnualSummary, PluvioAnomaly } from "../../types";

interface Props {
    data: AnnualSummary[];
    anomaly: PluvioAnomaly | null;
}

const CLASSIFICATION_COLOR: Record<AnnualSummary["classificacao"], string> = {
    seco: "#f59e0b",
    normal: "#3b82f6",
    umido: "#34d399",
    muito_umido: "#f43f5e",
};

const LABEL: Record<AnnualSummary["classificacao"], string> = {
    seco: "🌵 Seco",
    normal: "☁️ Normal",
    umido: "🌧️ Úmido",
    muito_umido: "🌊 Muito Úmido",
};

const HistoricalChart: React.FC<Props> = ({ data, anomaly }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hovered, setHovered] = useState<AnnualSummary | null>(null);

    useEffect(() => {
        if (!data.length || !svgRef.current) return;

        const W = svgRef.current.clientWidth || 760;
        const H = 280;
        const M = { top: 24, right: 24, bottom: 36, left: 56 };
        const iW = W - M.left - M.right;
        const iH = H - M.top - M.bottom;

        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("viewBox", `0 0 ${W} ${H}`)
            .attr("width", "100%")
            .attr("height", H);

        const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

        // Defs
        const defs = svg.append("defs");
        const glowF = defs.append("filter").attr("id", "hist-glow");
        glowF.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "b");
        const gm = glowF.append("feMerge");
        gm.append("feMergeNode").attr("in", "b");
        gm.append("feMergeNode").attr("in", "SourceGraphic");

        // Escalas
        const xScale = d3.scaleBand()
            .domain(data.map((d) => String(d.ano)))
            .range([0, iW])
            .padding(0.28);

        const yMax = Math.max(...data.map((d) => d.precipitacaoTotal)) * 1.12;
        const yScale = d3.scaleLinear().domain([0, yMax]).range([iH, 0]).nice();

        const media = data.reduce((s, d) => s + d.precipitacaoTotal, 0) / data.length;

        // Grid horizontal
        g.append("g")
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-iW).tickFormat(() => ""))
            .selectAll("line")
            .attr("stroke", "rgba(148,163,184,0.06)")
            .attr("stroke-dasharray", "4 4");
        g.select(".domain").remove();

        // Eixo X
        g.append("g")
            .attr("transform", `translate(0,${iH})`)
            .call(d3.axisBottom(xScale).tickSize(0))
            .call((axis) => axis.select(".domain").remove())
            .selectAll("text")
            .attr("fill", "#64748b")
            .attr("font-size", "11px")
            .attr("font-family", "'JetBrains Mono', monospace")
            .attr("font-weight", "700");

        // Eixo Y
        g.append("g")
            .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d} mm`))
            .call((axis) => axis.select(".domain").remove())
            .selectAll("text")
            .attr("fill", "#64748b")
            .attr("font-size", "10px")
            .attr("font-family", "'JetBrains Mono', monospace");

        // Linha da média
        g.append("line")
            .attr("x1", 0).attr("x2", iW)
            .attr("y1", yScale(media)).attr("y2", yScale(media))
            .attr("stroke", "rgba(148,163,184,0.25)")
            .attr("stroke-dasharray", "6 4")
            .attr("stroke-width", 1.5);

        g.append("text")
            .attr("x", iW + 4).attr("y", yScale(media) + 4)
            .attr("fill", "#64748b").attr("font-size", "9px")
            .attr("font-family", "'JetBrains Mono', monospace")
            .text(`μ ${media.toFixed(0)}`);

        // Barras
        const barGs = g.selectAll(".bar-g")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "bar-g")
            .style("cursor", "pointer");

        barGs.append("rect")
            .attr("x", (d) => xScale(String(d.ano))!)
            .attr("y", (d) => yScale(d.precipitacaoTotal))
            .attr("width", xScale.bandwidth())
            .attr("height", (d) => iH - yScale(d.precipitacaoTotal))
            .attr("fill", (d) => CLASSIFICATION_COLOR[d.classificacao])
            .attr("opacity", 0.75)
            .attr("rx", 3)
            .on("mouseenter", (_ev, d) => {
                d3.select(_ev.currentTarget as SVGRectElement).attr("opacity", 1).attr("filter", "url(#hist-glow)");
                setHovered(d);
            })
            .on("mouseleave", (_ev) => {
                d3.select(_ev.currentTarget as SVGRectElement).attr("opacity", 0.75).attr("filter", null);
                setHovered(null);
            });

        // Valor nas barras (anos com anomalia > 15%)
        barGs.filter((d) => Math.abs(d.anomaliaPct) > 15)
            .append("text")
            .attr("x", (d) => xScale(String(d.ano))! + xScale.bandwidth() / 2)
            .attr("y", (d) => yScale(d.precipitacaoTotal) - 5)
            .attr("text-anchor", "middle")
            .attr("fill", (d) => CLASSIFICATION_COLOR[d.classificacao])
            .attr("font-size", "9px")
            .attr("font-family", "'JetBrains Mono', monospace")
            .attr("font-weight", "700")
            .text((d) => `${d.anomaliaPct > 0 ? "+" : ""}${d.anomaliaPct.toFixed(0)}%`);

        // Linha de anomalia suavizada
        const lineScale = d3.scaleLinear()
            .domain([d3.min(data, (d) => d.anomaliaPct)! - 5, d3.max(data, (d) => d.anomaliaPct)! + 5])
            .range([iH - 10, 10]);

        const line = d3.line<AnnualSummary>()
            .x((d) => xScale(String(d.ano))! + xScale.bandwidth() / 2)
            .y((d) => lineScale(d.anomaliaPct))
            .curve(d3.curveMonotoneX);

        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "rgba(251,191,36,0.5)")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "3 3")
            .attr("d", line);

    }, [data]);

    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Legenda */}
            <div className="flex items-center gap-5 flex-wrap">
                {Object.entries(LABEL).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: CLASSIFICATION_COLOR[key as AnnualSummary["classificacao"]] }} />
                        <span className="text-[10px] font-mono text-slate-500">{label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-1.5 ml-auto">
                    <div className="w-6 h-px border-t border-dashed border-amber-400/50" />
                    <span className="text-[10px] font-mono text-slate-500">Anomalia</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-px border-t border-dashed border-slate-400/25" />
                    <span className="text-[10px] font-mono text-slate-500">Média</span>
                </div>
            </div>

            {/* Gráfico D3 */}
            <div className="relative flex-1 min-h-0">
                <svg ref={svgRef} className="w-full overflow-visible" />

                {/* Tooltip hover */}
                {hovered && (
                    <div className="absolute top-6 right-4 card px-4 py-3 text-right min-w-[170px] pointer-events-none animate-fade-up z-10">
                        <div className="label-tactical-hi mb-2" style={{ color: CLASSIFICATION_COLOR[hovered.classificacao] }}>
                            {hovered.ano} · {LABEL[hovered.classificacao]}
                        </div>
                        <div className="space-y-1 text-xs">
                            {[
                                ["Chuva Total", `${hovered.precipitacaoTotal.toFixed(0)} mm`],
                                ["Pico Diário", `${hovered.picoDiario.toFixed(0)} mm`],
                                ["Dias c/ Chuva", `${hovered.diasComChuva} dias`],
                                ["Vento Máx", `${hovered.ventoPico.toFixed(0)} km/h`],
                                ["Temp Máx Méd", `${hovered.tempMaxMedia.toFixed(1)} °C`],
                                ["Anomalia", `${hovered.anomaliaPct > 0 ? "+" : ""}${hovered.anomaliaPct.toFixed(1)}%`],
                            ].map(([label, value]) => (
                                <div key={label} className="flex justify-between gap-4">
                                    <span className="text-slate-500">{label}</span>
                                    <span className="font-bold font-mono text-slate-200">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Anomalia do mês atual */}
            {anomaly && (
                <div className={`rounded-xl p-3 flex items-center gap-4 border ${anomaly.tendencia === "critico" ? "bg-rose-500/10 border-rose-500/20" :
                        anomaly.tendencia === "acima" ? "bg-amber-500/10 border-amber-500/20" :
                            "bg-blue-500/10 border-blue-500/20"
                    }`}>
                    <div>
                        <div className="label-tactical mb-0.5">
                            Anomalia de {months[anomaly.mes - 1]}/{anomaly.ano}
                        </div>
                        <div className={`text-xl font-black font-mono ${anomaly.tendencia === "critico" ? "text-rose-400" :
                                anomaly.tendencia === "acima" ? "text-amber-400" : "text-blue-400"
                            }`}>
                            {anomaly.anomaliaPct > 0 ? "+" : ""}{anomaly.anomaliaPct.toFixed(0)}%
                            <span className="text-xs text-slate-500 font-normal ml-2">vs. média histórica</span>
                        </div>
                    </div>
                    <div className="ml-auto text-right">
                        <div className="text-xs text-slate-400">Acumulado: <strong className="text-slate-200 font-mono">{anomaly.acumuladoAtual.toFixed(0)} mm</strong></div>
                        <div className="text-xs text-slate-500 mt-0.5">Média hist.: <strong className="text-slate-400 font-mono">{anomaly.mediaHistorica.toFixed(0)} mm</strong></div>
                        <div className="text-[10px] text-slate-600 mt-0.5">{anomaly.diasRestantes} dias restantes no mês</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoricalChart;
