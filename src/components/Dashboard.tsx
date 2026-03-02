import React, { useState, useEffect } from 'react';
import SidraChart, { type SidraDataPoint } from './charts/SidraChart';
import TourismScore from './TourismScore';
import ResilienceMap from './ResilienceMap';
import { getDemographicData, syncSidraData, syncWeatherData } from '../services/dataService';

const Dashboard: React.FC = () => {
    const [sidraData, setSidraData] = useState<SidraDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(0);

    const loadData = async () => {
        try {
            setLoading(true);
            const demographic = await getDemographicData();
            setSidraData(demographic);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSync = async () => {
        console.log("Iniciando sincronização...");
        setSyncing(true);
        try {
            console.log("Chamando syncSidraData...");
            const sidraRes = await syncSidraData();
            console.log("SIDRA OK:", sidraRes);

            console.log("Chamando syncWeatherData...");
            const weatherRes = await syncWeatherData();
            console.log("Weather OK:", weatherRes);

            console.log("Recarregando dados locais...");
            await loadData();
            setLastSync(Date.now());

            console.log("Sincronização finalizada com sucesso!");
            alert("Dados sincronizados com sucesso!");
        } catch (error: any) {
            console.error("ERRO DETALHADO NA SINCRONIZAÇÃO:", error);
            alert(`Falha ao sincronizar: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <header className="mb-16 flex justify-between items-center relative overflow-hidden p-8 rounded-3xl bg-slate-900/40 border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -z-10"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -z-10"></div>

                <div>
                    <h1 className="text-5xl font-extrabold text-gradient mb-3 tracking-tight">
                        Preve-Ostras
                    </h1>
                    <p className="text-slate-400 text-lg font-medium max-w-lg leading-relaxed">
                        Inteligência preditiva para resiliência urbana e monitoramento turístico em Rio das Ostras.
                    </p>
                </div>

                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className={`group relative px-8 py-4 rounded-2xl font-bold transition-all shadow-2xl flex items-center gap-3 overflow-hidden ${syncing
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-white text-slate-950 hover:scale-[1.02] active:scale-95'
                        }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10 flex items-center gap-2">
                        {syncing ? (
                            <>
                                <span className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin"></span>
                                Sincronizando...
                            </>
                        ) : (
                            <>
                                <span className="text-xl">⚡</span> Sincronizar Dados
                            </>
                        )}
                    </span>
                </button>
            </header>

            <main className="space-y-12">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Demographic Chart */}
                    <section className="glass-card p-8 rounded-3xl flex flex-col h-full min-h-[450px]">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        📈
                                    </div>
                                    Monitoramento Demográfico
                                </h2>
                                <p className="text-slate-400 text-sm mt-2 ml-13">Projeção histórica de crescimento populacional</p>
                            </div>
                            <div className="text-[10px] font-bold tracking-widest text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full uppercase">
                                IBGE SIDRA
                            </div>
                        </div>

                        <div className="flex-1 min-h-[300px] flex items-center justify-center rounded-2xl bg-slate-950/40 border border-white/5 relative overflow-hidden p-4">
                            {loading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                    <div className="text-slate-500 font-medium animate-pulse">Consultando Firestore...</div>
                                </div>
                            ) : sidraData.length > 0 ? (
                                <SidraChart data={sidraData} />
                            ) : (
                                <div className="text-center p-8 max-w-xs">
                                    <div className="text-4xl mb-4 grayscale opacity-50 text-blue-400 animate-bounce">📊</div>
                                    <p className="text-slate-400 font-medium mb-6">Nenhum dado demográfico local disponível.</p>
                                    <button
                                        onClick={handleSync}
                                        className="w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-semibold border border-blue-500/20 transition-all"
                                    >
                                        Baixar Dados do IBGE
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Predictive Tourism Score */}
                    <TourismScore />
                </div>

                {/* Bottom Row: Resilience Map Tracker */}
                <section className="relative">
                    <div className="absolute -top-6 -left-6 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full"></div>
                    <ResilienceMap key={lastSync} />
                </section>
            </main>

            <footer className="mt-20 pb-12 border-t border-white/5 pt-8 text-center">
                <p className="text-slate-500 text-sm">
                    Preve-Ostras &copy; 2024 - Desenvolvido para Gestão de Resiliência Urbana
                </p>
            </footer>
        </div>
    );
};


export default Dashboard;

