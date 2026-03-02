/**
 * TourismScore.tsx – Score Preditivo de Turismo
 *
 * Calcula e exibe um índice de aptidão climática para atividades
 * turísticas em Rio das Ostras, baseado nos dados mais recentes
 * do Open-Meteo salvos no Firestore.
 */

import React, { useEffect, useState } from "react";
import { getWeatherData } from "../services/dataService";
import type { WeatherData } from "../types";

/** Converte dados climáticos do dia em um score de 0–100. */
const calcScore = (w: WeatherData): number => {
    let score = 100;
    if (w.precipitacao > 0) score -= w.precipitacao * 5;
    if (w.temp_max < 20) score -= 10;
    if (w.vento_max > 25) score -= 15;
    return Math.max(0, Math.min(100, score));
};

const TourismScore: React.FC = () => {
    const [latestWeather, setLatestWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        const load = async () => {
            const data = await getWeatherData();
            if (data.length > 0) setLatestWeather(data[data.length - 1]);
        };
        load();
    }, []);

    const score = latestWeather ? calcScore(latestWeather) : 75;

    return (
        <div className="glass-card p-8 rounded-3xl flex flex-col justify-between h-full min-h-[450px] relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-yellow-500/5 blur-[50px] rounded-full group-hover:bg-yellow-500/10 transition-colors" />

            {/* Cabeçalho */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                            ☀️
                        </div>
                        Score de Turismo
                    </h2>
                    <p className="text-slate-400 text-sm mt-2 ml-[52px] font-medium">
                        Condições climáticas para atividades ao ar livre
                    </p>
                </div>
                <div className="text-[10px] font-bold tracking-widest text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full uppercase">
                    Open-Meteo
                </div>
            </div>

            {/* Métrica principal */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between p-6 bg-slate-950/40 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="flex items-center gap-5">
                        <div className="text-5xl drop-shadow-lg">
                            {score > 80 ? "🏖️" : score > 50 ? "⛅" : "🌦️"}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-100 text-lg">Status do Destino</h3>
                            <p className="text-sm text-slate-400 font-medium">
                                {latestWeather ? (
                                    <span className="flex items-center gap-2">
                                        <span className="text-blue-400">{latestWeather.temp_max}°C</span>
                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                        <span>{latestWeather.precipitacao > 0 ? "Risco de Chuva" : "Tempo Excelente"}</span>
                                    </span>
                                ) : (
                                    "Aguardando sincronização..."
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div
                            className={`font-black text-4xl tracking-tighter ${score > 80 ? "text-emerald-400" : score > 50 ? "text-yellow-400" : "text-rose-400"
                                }`}
                        >
                            {score}
                            <span className="text-lg font-bold text-slate-600 ml-1">/100</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Preve-Ostras Index
                        </div>
                    </div>
                </div>

                {/* Indicadores de Atrações */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/20 rounded-2xl border border-white/5 hover:bg-slate-900/40 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🐢</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">P. Tartaruga</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400">ATIVO</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse" style={{ width: "65%" }} />
                        </div>
                    </div>
                    <div className="p-4 bg-slate-950/20 rounded-2xl border border-white/5 hover:bg-slate-900/40 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🐳</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">C. Baleia</span>
                            </div>
                            <span className="text-[10px] font-bold text-blue-400">OBSERV.</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400" style={{ width: "45%" }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourismScore;
