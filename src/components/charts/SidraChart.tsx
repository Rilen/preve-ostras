import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface SidraDataPoint {
    ano: number;
    populacao: number;
}

interface Props {
    data: SidraDataPoint[];
}

const SidraChart: React.FC<Props> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (!data || data.length === 0 || !svgRef.current) return;

        // Dimensões do gráfico
        const width = 600;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Limpar SVG para re-renderização
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Escalas
        const xExtent = d3.extent(data, d => d.ano) as [number, number];
        // Se houver apenas um ponto, cria um intervalo artificial para não quebrar a escala
        if (xExtent[0] === xExtent[1]) {
            xExtent[0] -= 1;
            xExtent[1] += 1;
        }

        const xScale = d3.scaleLinear()
            .domain(xExtent)
            .range([0, innerWidth]);

        const yMax = d3.max(data, d => d.populacao) || 100000;
        const yScale = d3.scaleLinear()
            .domain([0, yMax * 1.1]) // 10% de folga no topo
            .range([innerHeight, 0])
            .nice();

        // Eixos
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.format("d"))
            .ticks(Math.min(data.length, 10));

        const yAxis = d3.axisLeft(yScale)
            .ticks(5)
            .tickFormat(d => d3.format(".2s")(d as number).replace('G', 'B'));

        // Adicionar os eixos ao SVG
        svg.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .attr('color', '#475569')
            .selectAll("text")
            .attr('font-weight', '600');

        svg.append('g')
            .call(yAxis)
            .attr('color', '#475569')
            .selectAll("text")
            .attr('font-weight', '600');

        // Definição de Gradiente e Filtros (Glow)
        const defs = svg.append('defs');

        // Glow Filter
        const filter = defs.append('filter')
            .attr('id', 'glow')
            .attr('x', '-20%')
            .attr('y', '-20%')
            .attr('width', '140%')
            .attr('height', '140%');
        filter.append('feGaussianBlur')
            .attr('stdDeviation', '3')
            .attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        const areaGradient = defs.append('linearGradient')
            .attr('id', 'area-gradient')
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '0%').attr('y2', '100%');

        areaGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#3b82f6')
            .attr('stop-opacity', 0.4);

        areaGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#3b82f6')
            .attr('stop-opacity', 0);

        // Grid Lines
        svg.append('g')
            .attr('class', 'grid')
            .attr('opacity', 0.05)
            .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ""));

        // Área sob a linha
        const areaGenerator = d3.area<SidraDataPoint>()
            .x(d => xScale(d.ano))
            .y0(innerHeight)
            .y1(d => yScale(d.populacao))
            .curve(d3.curveMonotoneX);

        if (data.length > 1) {
            svg.append('path')
                .datum(data)
                .attr('fill', 'url(#area-gradient)')
                .attr('d', areaGenerator);
        }

        // Linha com gradiente e glow
        const lineGenerator = d3.line<SidraDataPoint>()
            .x(d => xScale(d.ano))
            .y(d => yScale(d.populacao))
            .curve(d3.curveMonotoneX);

        if (data.length > 1) {
            svg.append('path')
                .datum(data)
                .attr('fill', 'none')
                .attr('stroke', '#60a5fa')
                .attr('stroke-width', 3)
                .attr('filter', 'url(#glow)')
                .attr('d', lineGenerator);
        }

        // Pontos (Círculos) em destaque
        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.ano))
            .attr('cy', d => yScale(d.populacao))
            .attr('r', 5)
            .attr('fill', '#0f172a')
            .attr('stroke', '#60a5fa')
            .attr('stroke-width', 2)
            .attr('filter', 'url(#glow)')
            .attr('class', 'cursor-pointer transition-all hover:r-7 hover:fill-blue-400');

    }, [data]);

    return (
        <div className="w-full h-full p-4 bg-slate-950/40 rounded-2xl">
            <svg ref={svgRef} className="overflow-visible"></svg>
        </div>
    );
};


export default SidraChart;
