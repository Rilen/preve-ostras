import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import { getWeeklyImpactAnalysis, type ResilienceAnalysis } from '../services/dataService';
import RiskBulletin from './RiskBulletin';

const ResilienceMap: React.FC = () => {
    const [analysis, setAnalysis] = useState<ResilienceAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [showBulletin, setShowBulletin] = useState(false);

    useEffect(() => {
        const loadAnalysis = async () => {
            setLoading(true);
            try {
                const result = await getWeeklyImpactAnalysis();
                setAnalysis(result);
            } catch (err) {
                console.error("Erro ao carregar análise:", err);
            } finally {
                setLoading(false);
            }
        };
        loadAnalysis();
    }, []);

    // D3 Integration Logic
    useEffect(() => {
        if (!analysis || loading) return;

        const svg = d3.select("#intelligence-map");
        const g = d3.select("#map-root");

        const zoom: any = d3.zoom()
            .scaleExtent([0.5, 8])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Bind Controls
        d3.select("#zoom-in").on("click", () => svg.transition().duration(400).call(zoom.scaleBy, 1.5));
        d3.select("#zoom-out").on("click", () => svg.transition().duration(400).call(zoom.scaleBy, 0.7));
        d3.select("#zoom-reset").on("click", () => svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity));

    }, [analysis]);

    return (
        <div className="glass-card p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
            {loading && (
                <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="text-blue-400 font-mono text-[10px] tracking-[0.3em] animate-pulse">PROCESSANDO MATRIZ DE RISCO...</div>
                </div>
            )}

            {showBulletin && analysis && (
                <RiskBulletin analysis={analysis} onClose={() => setShowBulletin(false)} />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            🛡️
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100">
                            Índice de Resiliência Urbana
                        </h2>
                    </div>
                    <p className="text-slate-400 text-sm mt-3 ml-13 font-medium">
                        Monitoramento de zonas críticas e capacidade de drenagem pluvial em tempo real.
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => setShowBulletin(true)}
                        className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-bold text-slate-300 uppercase tracking-widest transition-all flex items-center gap-3 backdrop-blur-md group/btn"
                    >
                        <svg className="w-4 h-4 text-emerald-400 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Gerar Boletim de Risco
                    </button>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${analysis && analysis.indiceRisco > 50
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${analysis && analysis.indiceRisco > 50 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                        <span className="text-[10px] font-bold uppercase tracking-tight whitespace-nowrap">
                            {analysis && analysis.indiceRisco > 50 ? 'Risco Elevado' : 'Monitoramento Estável'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Analysis Summary Hub */}
            <div className="mb-8">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-500 rounded-full"></span> Metadados da Unidade: Drenagem x Adensamento Urbano
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pior Chuva (7d)</div>
                        <div className="text-xl font-black text-blue-400">{analysis?.picoChuva.toFixed(1) || '--'} <span className="text-[10px] font-normal text-slate-500">mm</span></div>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mobilidade</div>
                        <div className={`text-sm font-bold ${analysis?.mobilidade.status === 'interrompido' ? 'text-rose-400' :
                            analysis?.mobilidade.status === 'alerta' ? 'text-amber-400' :
                                'text-emerald-400'
                            }`}>
                            {analysis?.mobilidade.status === 'interrompido' ? '🚦 Bloqueado' :
                                analysis?.mobilidade.status === 'alerta' ? '⚠️ Alerta' :
                                    '🚀 Fluido'}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Saúde (IVS)</div>
                        <div className={`text-xl font-black ${analysis && analysis.saude.riscoEpidemiologico > 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {analysis?.saude.riscoEpidemiologico.toFixed(0)}%
                        </div>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Rede Elétrica</div>
                        <div className="text-xl font-black text-amber-400">{analysis?.infraestrutura.estabilidadeEletrica.toFixed(0)}%</div>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Drenagem</div>
                        <div className="text-xl font-black text-blue-400">{analysis?.infraestrutura.cargaDrenagem.toFixed(0)}%</div>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Sobrecarga</div>
                        <div className="text-xl font-black text-emerald-400">{analysis?.indiceRisco.toFixed(0)}%</div>
                    </div>
                </div>
            </div>

            {/* Predictive Alerts & System Impacts */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Alertas Inteligentes (IA)
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis?.alertasPreditivos.map((alert, i) => (
                            <div key={i} className={`p-4 rounded-2xl border flex items-start gap-4 transition-all hover:scale-[1.02] ${alert.nivel === 'crítico' ? 'bg-rose-500/10 border-rose-500/20' :
                                alert.nivel === 'alto' ? 'bg-amber-500/10 border-amber-500/20' :
                                    'bg-blue-500/10 border-blue-500/20'
                                }`}>
                                <div className={`mt-1 text-xl ${alert.nivel === 'crítico' ? 'text-rose-500' :
                                    alert.nivel === 'alto' ? 'text-amber-500' :
                                        'text-blue-500'
                                    }`}>
                                    {alert.nivel === 'crítico' ? '⚠️' : '🔔'}
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">{alert.bairro}</span>
                                        <span className="text-[10px] font-mono text-slate-400">{alert.tempoEstimado}</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-200 leading-snug">
                                        {alert.mensagem}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Systematic Recommendations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Diretriz de Saúde</h4>
                            <ul className="space-y-2">
                                {analysis?.saude.alertaDoencas.map((a, i) => (
                                    <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span> {a}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-slate-500 italic">
                                População em risco: {analysis && (analysis.saude.riscoEpidemiologico * 1500).toFixed(0)} hab.
                            </div>
                        </div>
                        <div className="p-5 bg-amber-500/5 rounded-3xl border border-amber-500/10">
                            <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-3">Integridade da Rede</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Estabilidade Elétrica</span>
                                    <span className="text-slate-200 font-bold">{analysis?.infraestrutura.estabilidadeEletrica.toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Carga de Drenagem</span>
                                    <span className="text-slate-200 font-bold">{analysis?.infraestrutura.cargaDrenagem.toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Monitoramento Costeiro</h3>
                            <div className="flex items-end justify-between mb-4">
                                <div>
                                    <div className="text-3xl font-black text-slate-100">{analysis?.mareAtual.altura.toFixed(2)}m</div>
                                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">Maré {analysis?.mareAtual.status}</div>
                                </div>
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <svg className={`w-full h-full text-blue-500 transition-transform duration-1000 ${analysis?.mareAtual.status === 'enchendo' ? 'rotate-0' : 'rotate-180'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 5v14M5 12l7 7 7-7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-white/5">
                                Preamar: <span className="text-slate-200 font-bold">{analysis?.mareAtual.proximaPreamar}</span>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 opacity-30"></div>
                    </div>

                    <div className="flex-1 bg-slate-950/40 rounded-3xl border border-white/5 p-6 flex flex-col">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Saturação (7d)</h3>
                        <div className="flex-1 flex items-end gap-2 h-32 mb-6">
                            {analysis?.saturacaoAcumulada.map((v, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-500 ${v > 70 ? 'bg-rose-500/50' : v > 40 ? 'bg-amber-400/50' : 'bg-blue-500/50'}`}
                                        style={{ height: `${Math.max(10, v)}%` }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Intelligence Map (D3 powered) */}
            <div className="relative group/map h-[500px] bg-slate-950/80 rounded-3xl border border-white/10 overflow-hidden cursor-move shadow-inner">
                {/* Tactical Legend Overlay */}
                <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 pointer-events-none">
                    <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-white/10 text-[9px] font-mono text-blue-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        RADAR TÁTICO: RDO-MESH-NET
                    </div>
                    <div className="px-3 py-1.5 bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/5 text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                        Scroll: Zoom | Arraste: Pan
                    </div>
                </div>

                {/* Map Controls */}
                <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
                    <button id="zoom-in" title="Zoom In" className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 border border-white/10 rounded-xl text-white flex items-center justify-center transition-all active:scale-95">+</button>
                    <button id="zoom-out" title="Zoom Out" className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 border border-white/10 rounded-xl text-white flex items-center justify-center transition-all active:scale-95">-</button>
                    <button id="zoom-reset" title="Reset Map" className="w-10 h-10 bg-slate-900/90 hover:bg-blue-500/20 border border-white/10 rounded-xl text-blue-400 flex items-center justify-center transition-all active:scale-95">⟲</button>
                </div>

                <svg id="intelligence-map" className="w-full h-full" viewBox="0 0 800 500">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        </pattern>
                        <linearGradient id="coastGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    <g id="map-root">
                        {/* Realistic Coastline Approximation */}
                        <path
                            d="M 800,0 L 780,50 L 820,150 L 760,250 L 790,350 L 740,450 L 700,500 L 800,500 L 800,0 Z"
                            fill="url(#coastGradient)"
                            className="opacity-40"
                        />
                        <path
                            d="M 780,0 C 760,100 820,200 750,300 C 700,400 720,450 680,500"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            strokeDasharray="10 5"
                            className="opacity-30"
                        />

                        {/* Abstract Topographic Elements */}
                        <g className="opacity-5">
                            {analysis?.bairrosAfetados.map((b, i, arr) => (
                                i < arr.length - 1 && (
                                    <line
                                        key={`line-${i}`}
                                        x1={`${b.x}%`}
                                        y1={`${b.y}%`}
                                        x2={`${arr[i + 1].x}%`}
                                        y2={`${arr[i + 1].y}%`}
                                        stroke="white"
                                        strokeWidth="0.5"
                                        strokeDasharray="4 4"
                                    />
                                )
                            ))}
                        </g>

                        {/* Neighborhood Nodes */}
                        {analysis?.bairrosAfetados.map((b) => (
                            <g key={b.nome} transform={`translate(${(b.x / 100) * 800}, ${(b.y / 100) * 500})`}>
                                <circle r="40" fill="transparent" className="cursor-pointer peer" />

                                <circle
                                    r="20"
                                    className={`animate-ping opacity-10 ${b.risco > 60 ? 'fill-rose-500' : 'fill-emerald-500'}`}
                                />

                                <circle
                                    r="8"
                                    className={`stroke-2 stroke-white/20 transition-all duration-300 shadow-2xl ${b.risco > 70 ? 'fill-rose-500' :
                                        b.risco > 40 ? 'fill-amber-400' :
                                            'fill-emerald-400'
                                        }`}
                                />

                                <text
                                    y="-18"
                                    textAnchor="middle"
                                    className="text-[9px] font-black fill-slate-500 uppercase tracking-tighter transition-all pointer-events-none"
                                >
                                    {b.nome}
                                </text>

                                {/* Tooltip */}
                                <foreignObject x="15" y="-40" width="200" height="120" className="opacity-0 peer-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/20 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                        <div className={`text-[8px] font-black mb-1 uppercase tracking-widest ${b.risco > 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            UNIDADE: {b.nome}
                                        </div>
                                        <div className="text-xs font-black text-slate-100 mb-1">{b.info}</div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                                            <div className="h-full bg-blue-500" style={{ width: `${b.risco}%` }}></div>
                                        </div>
                                        <div className="text-[9px] text-slate-400 leading-tight">
                                            Risco: {b.risco.toFixed(1)}% | Fator: {b.fator}
                                        </div>
                                    </div>
                                </foreignObject>
                            </g>
                        ))}
                    </g>
                </svg>
            </div>

            <style>{`
                #intelligence-map {
                    background: radial-gradient(circle at 50% 50%, #020617 0%, #000 100%);
                    user-select: none;
                }
                .cursor-move { cursor: grab; }
                .cursor-move:active { cursor: grabbing; }
            `}</style>
        </div>
    );
};

export default ResilienceMap;
