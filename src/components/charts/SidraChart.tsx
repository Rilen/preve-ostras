/**
 * SidraChart.tsx – Gráfico de Crescimento Populacional
 *
 * Visualiza a série histórica de população de Rio das Ostras
 * usando D3.js com linha, área com gradiente e efeito glow.
 */

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { SidraData } from "../../types";

interface Props {
    data: SidraData[];
}

const SidraChart: React.FC<Props> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (!data || data.length === 0 || !svgRef.current) return;

        const WIDTH = 600;
        const HEIGHT = 300;
        const MARGIN = { top: 20, right: 30, bottom: 40, left: 60 };
        const iW = WIDTH - MARGIN.left - MARGIN.right;
        const iH = HEIGHT - MARGIN.top - MARGIN.bottom;

        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3
            .select(svgRef.current)
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
            .append("g")
            .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

        // ── Escalas ────────────────────────────────────────────────────────────
        const xExtent = d3.extent(data, (d) => d.ano) as [number, number];
        if (xExtent[0] === xExtent[1]) { xExtent[0] -= 1; xExtent[1] += 1; }

        const xScale = d3.scaleLinear().domain(xExtent).range([0, iW]);
        const yMax = d3.max(data, (d) => d.populacao) ?? 100_000;
        const yScale = d3.scaleLinear().domain([0, yMax * 1.1]).range([iH, 0]).nice();

        // ── Eixos ──────────────────────────────────────────────────────────────
        svg
            .append("g")
            .attr("transform", `translate(0,${iH})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(Math.min(data.length, 10)))
            .attr("color", "#475569")
            .selectAll("text")
            .attr("font-weight", "600");

        svg
            .append("g")
            .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) =>
                d3.format(".2s")(d as number).replace("G", "B")
            ))
            .attr("color", "#475569")
            .selectAll("text")
            .attr("font-weight", "600");

        // ── Defs: gradiente e glow ─────────────────────────────────────────────
        const defs = svg.append("defs");

        const filter = defs.append("filter").attr("id", "glow")
            .attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
        filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        const areaGrad = defs.append("linearGradient").attr("id", "area-gradient")
            .attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
        areaGrad.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.4);
        areaGrad.append("stop").attr("offset", "100%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0);

        // ── Grid ───────────────────────────────────────────────────────────────
        svg.append("g").attr("opacity", 0.05)
            .call(d3.axisLeft(yScale).tickSize(-iW).tickFormat(() => ""));

        // ── Área e Linha ───────────────────────────────────────────────────────
        if (data.length > 1) {
            svg.append("path")
                .datum(data)
                .attr("fill", "url(#area-gradient)")
                .attr("d", d3.area<SidraData>()
                    .x((d) => xScale(d.ano))
                    .y0(iH)
                    .y1((d) => yScale(d.populacao))
                    .curve(d3.curveMonotoneX));

            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "#60a5fa")
                .attr("stroke-width", 3)
                .attr("filter", "url(#glow)")
                .attr("d", d3.line<SidraData>()
                    .x((d) => xScale(d.ano))
                    .y((d) => yScale(d.populacao))
                    .curve(d3.curveMonotoneX));
        }

        // ── Pontos ─────────────────────────────────────────────────────────────
        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", (d) => xScale(d.ano))
            .attr("cy", (d) => yScale(d.populacao))
            .attr("r", 5)
            .attr("fill", "#0f172a")
            .attr("stroke", "#60a5fa")
            .attr("stroke-width", 2)
            .attr("filter", "url(#glow)")
            .attr("class", "cursor-pointer");
    }, [data]);

    return (
        <div className="w-full h-full p-4 bg-slate-950/40 rounded-2xl">
            <svg ref={svgRef} className="overflow-visible" />
        </div>
    );
};

export default SidraChart;
