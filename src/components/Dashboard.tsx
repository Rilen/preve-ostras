/**
 * Dashboard.tsx – Painel Principal Full HD (1920×1080)
 *
 * Layout: Topbar fixa + 3 colunas (Sidebar | Mapa | Painel)
 * Tudo em viewport height — sem scroll de página.
 */

import React, { useState, useEffect, useCallback } from "react";
import CentralPanel from "./CentralPanel";
import SidebarLeft from "./SidebarLeft";
import SidebarRight from "./SidebarRight";
import { syncSidraData, syncWeatherData, getWeeklyImpactAnalysis } from "../services/dataService";
import type { ResilienceAnalysis } from "../types";

type SyncState = "idle" | "syncing" | "success" | "error";

const Dashboard: React.FC = () => {
    const [analysis, setAnalysis] = useState<ResilienceAnalysis | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(true);
    const [syncState, setSyncState] = useState<SyncState>("idle");
    const [syncMsg, setSyncMsg] = useState("");
    const [lastSyncKey, setLastSyncKey] = useState(0);

    // ─── Carregamento de Análise ──────────────────────────────────────────────
    const loadAnalysis = useCallback(async () => {
        try {
            setLoadingAnalysis(true);
            const result = await getWeeklyImpactAnalysis();
            setAnalysis(result);
        } catch (err) {
            console.error("[Dashboard] Erro ao carregar análise:", err);
        } finally {
            setLoadingAnalysis(false);
        }
    }, []);

    useEffect(() => { loadAnalysis(); }, [loadAnalysis]);

    // ─── Sincronização ────────────────────────────────────────────────────────
    const handleSync = async () => {
        setSyncState("syncing");
        setSyncMsg("Buscando dados das APIs...");
        try {
            const [sidra, weather] = await Promise.all([syncSidraData(), syncWeatherData()]);
            setSyncMsg(`${sidra.count} pop. + ${weather.count} clima salvos`);
            setSyncState("success");
            await loadAnalysis();
            setLastSyncKey(Date.now());
            setTimeout(() => setSyncState("idle"), 4000);
        } catch (err: any) {
            setSyncMsg(err.message ?? "Erro desconhecido");
            setSyncState("error");
            setTimeout(() => setSyncState("idle"), 5000);
        }
    };

    const now = new Date();
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dateStr = now.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

    return (
        <div className="app-shell">

            {/* ══ TOPBAR ══════════════════════════════════════════════════════════ */}
            <header className="topbar">
                {/* Identidade */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                            <span className="text-base">🌊</span>
                        </div>
                        <span className="pulse-dot pulse-dot-blue absolute -top-0.5 -right-0.5 w-2 h-2" />
                    </div>
                    <div className="min-w-0 flex-shrink">
                        <div className="font-black text-slate-100 text-sm md:text-base tracking-tight leading-none whitespace-nowrap">PREVE-OSTRAS</div>
                        <div className="label-tactical mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis opacity-60">SISTEMA DE INTELIGÊNCIA</div>
                    </div>
                </div>

                <div className="w-px h-8 bg-white/10 mx-1 hidden md:block" />
                <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                    <span className="text-blue-400">RESILIÊNCIA</span>
                    <span className="text-white/10">»</span>
                    <span>MAPA ATIVO</span>
                </div>

                {/* Espaçador */}
                <div className="flex-1" />

                {/* Status do sistema */}
                <div className="flex items-center gap-4">
                    {/* Estado da análise */}
                    {!loadingAnalysis && analysis ? (
                        <div className="flex items-center">
                            <span className={`badge ${analysis.indiceRisco > 60 ? "badge-rose" : "badge-green"} text-[9px] whitespace-nowrap`}>
                                <span className={`pulse-dot ${analysis.indiceRisco > 60 ? "pulse-dot-rose" : "pulse-dot-green"} w-1.5 h-1.5`} />
                                <span className="hidden sm:inline">{analysis.indiceRisco > 60 ? "ALERTA" : "OPERANDO"}</span>
                                <span className="sm:inline ml-1">{analysis.indiceRisco.toFixed(0)}%</span>
                            </span>
                        </div>
                    ) : null}

                    {/* Relógio */}
                    <div className="text-right hidden sm:block">
                        <div className="font-mono text-xs font-bold text-slate-300 tracking-wider leading-none">{timeStr}</div>
                        <div className="label-tactical text-[8px] mt-0.5">{dateStr}</div>
                    </div>

                    {/* Botão sync */}
                    <button
                        id="btn-sync"
                        onClick={handleSync}
                        disabled={syncState === "syncing"}
                        className="btn-primary px-3 py-1.5 h-8"
                    >
                        {syncState === "syncing" ? (
                            <div className="spinner w-3 h-3" />
                        ) : (
                            <span className="text-base">⚡</span>
                        )}
                        <span className="hidden md:inline ml-1">
                            {syncState === "syncing" ? "Sincronizando" : "Sincronizar"}
                        </span>
                    </button>
                </div>

            </header>

            {/* ══ WORKSPACE ═══════════════════════════════════════════════════════ */}
            <div className="workspace">

                {/* Coluna Esquerda */}
                <SidebarLeft analysis={analysis} loading={loadingAnalysis} />

                {/* Mapa Central com Abas */}
                <div className="map-area">
                    <CentralPanel analysis={analysis} loading={loadingAnalysis} key={lastSyncKey} />
                </div>

                {/* Coluna Direita */}
                <SidebarRight analysis={analysis} loading={loadingAnalysis} />
            </div>
            {/* Feedback de sync (Toast) */}
            {syncMsg && syncState !== "idle" && (
                <div className={`
                    fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]
                    px-5 py-2.5 rounded-2xl text-[11px] font-mono font-bold
                    shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl border animate-fade-up
                    ${syncState === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        syncState === "error" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                            "bg-blue-600/20 text-blue-300 border-blue-500/30"}
                  `}>
                    <div className="flex items-center gap-3">
                        {syncState === "syncing" && <div className="spinner w-3.5 h-3.5" />}
                        {syncState === "success" && <span className="text-emerald-400">✓</span>}
                        {syncState === "error" && <span className="text-rose-400">✕</span>}
                        <span className="tracking-wide uppercase italic">{syncMsg}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
