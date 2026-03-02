import React from 'react';
import type { ResilienceAnalysis } from '../services/dataService';

interface Props {
    analysis: ResilienceAnalysis;
    onClose: () => void;
}

const RiskBulletin: React.FC<Props> = ({ analysis, onClose }) => {
    const today = new Date().toLocaleDateString('pt-BR');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white text-slate-900 w-full max-w-2xl rounded-none shadow-2xl overflow-hidden flex flex-col border-[12px] border-slate-900 h-[90vh]">
                {/* Formal Header */}
                <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
                    <div>
                        <div className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 mb-2 font-mono">Governo de Rio das Ostras</div>
                        <h1 className="text-3xl font-black uppercase tracking-tight leading-none">Boletim de Risco <span className="text-emerald-400">Urbano</span></h1>
                        <div className="mt-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                            <span>ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                            <span>Data: {today}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-white">
                    {/* Status Signal */}
                    <div className="flex items-center gap-6 border-b-2 border-slate-100 pb-10">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-inner ${analysis.indiceRisco > 60 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                            {analysis.indiceRisco > 60 ? '⚠️' : '✅'}
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status Global</div>
                            <h2 className={`text-4xl font-black uppercase tracking-tight ${analysis.indiceRisco > 60 ? 'text-rose-600' : 'text-emerald-600'
                                }`}>
                                {analysis.indiceRisco > 60 ? 'Alerta Crítico' : 'Operação Normal'}
                            </h2>
                        </div>
                    </div>

                    {/* Technical Data Grid */}
                    <div className="grid grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-l-4 border-slate-900 pl-3 mb-6">Métricas de Solo & Mobilidade</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                    <span className="text-xs font-medium text-slate-500 uppercase">Saturação Acumulada</span>
                                    <span className="text-lg font-black">{analysis.indiceRisco.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                    <span className="text-xs font-medium text-slate-500 uppercase">Status Viário</span>
                                    <span className="text-sm font-black uppercase text-rose-600">{analysis.mobilidade.status}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                    <span className="text-xs font-medium text-slate-500 uppercase">Pico de Precipitação</span>
                                    <span className="text-lg font-black">{analysis.picoChuva.toFixed(1)} mm</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-l-4 border-slate-900 pl-3 mb-6">Saúde & Infraestrutura</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                    <span className="text-xs font-medium text-slate-500 uppercase">Risco Epidemiológico</span>
                                    <span className="text-lg font-black">{analysis.saude.riscoEpidemiologico.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                    <span className="text-xs font-medium text-slate-500 uppercase">Estabilidade Elétrica</span>
                                    <span className="text-lg font-black">{analysis.infraestrutura.estabilidadeEletrica.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                    <span className="text-xs font-medium text-slate-500 uppercase">Altura da Maré</span>
                                    <span className="text-lg font-black">{analysis.mareAtual.altura.toFixed(2)}m</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Neighborhood List */}
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-l-4 border-slate-900 pl-3 mb-8">Zonas de Monitoramento Ativo</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {analysis.bairrosAfetados.map(b => (
                                <div key={b.nome} className="flex items-center justify-between p-6 bg-slate-50 border-r-8 border-slate-200">
                                    <div>
                                        <div className="text-lg font-black uppercase text-slate-900">{b.nome}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{b.fator}</div>
                                    </div>
                                    <div className={`text-2xl font-black ${b.risco > 60 ? 'text-rose-600' : 'text-slate-900'}`}>{b.risco.toFixed(0)}%</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Official Recommendations */}
                    <div className="bg-slate-900 p-8 text-white rounded-none">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-50">Diretrizes de Campo</h3>
                        <ul className="text-sm font-medium space-y-4 leading-relaxed">
                            <li className="flex gap-4">
                                <span className="text-emerald-400 font-bold">01.</span>
                                <span>Manter equipes de prontidão no bairro **Ouro Verde** para desobstrução de calhas.</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-emerald-400 font-bold">02.</span>
                                <span>Monitorar cruzamento da **Rod. Amaral Peixoto** com canais em caso de pico de maré.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Footer Signature */}
                    <div className="pt-10 border-t-2 border-slate-100 text-center pb-10">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">Automação via Algoritmo PREVE-OSTRAS</div>
                        <div className="text-[9px] font-medium text-slate-300 mt-2 italic px-20">Este boletim é gerado automaticamente cruzando dados do IBGE, Marinha e Meteorologia. Use para fins de planejamento e suporte à decisão.</div>
                    </div>
                </div>

                {/* Print Action */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                    <button
                        onClick={() => window.print()}
                        className="px-8 py-3 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir / Exportar PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 border-2 border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RiskBulletin;
