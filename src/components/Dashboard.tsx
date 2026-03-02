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
                    <div>
                        <div className="font-black text-slate-100 text-base tracking-tight leading-none">PREVE-OSTRAS</div>
                        <div className="label-tactical mt-0.5">Sistema de Inteligência Territorial</div>
                    </div>
                </div>

                <div className="w-px h-8 bg-white/10 mx-1" />

                {/* Breadcrumb tático */}
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <span>RDO</span>
                    <span className="text-white/20">/</span>
                    <span className="text-blue-400">RESILIÊNCIA</span>
                    <span className="text-white/20">/</span>
                    <span>MAPA ATIVO</span>
                </div>

                {/* Espaçador */}
                <div className="flex-1" />

                {/* Status do sistema */}
                <div className="flex items-center gap-6">
                    {/* Estado da análise */}
                    {loadingAnalysis ? (
                        <div className="flex items-center gap-2">
                            <div className="spinner w-3 h-3" />
                            <span className="label-tactical">Calculando...</span>
                        </div>
                    ) : analysis ? (
                        <div className="flex items-center gap-2">
                            <span className={`badge ${analysis.indiceRisco > 60 ? "badge-rose" : "badge-green"}`}>
                                <span className={`pulse-dot ${analysis.indiceRisco > 60 ? "pulse-dot-rose" : "pulse-dot-green"} w-1.5 h-1.5`} />
                                {analysis.indiceRisco > 60 ? "ALERTA ATIVO" : "OPERAÇÃO NORMAL"}
                            </span>
                        </div>
                    ) : (
                        <span className="badge badge-amber">SEM DADOS</span>
                    )}

                    {/* Relógio */}
                    <div className="text-right hidden xl:block">
                        <div className="font-mono text-sm font-bold text-slate-200 tracking-widest">{timeStr}</div>
                        <div className="label-tactical capitalize">{dateStr}</div>
                    </div>

                    {/* Botão sync */}
                    <button
                        id="btn-sync"
                        onClick={handleSync}
                        disabled={syncState === "syncing"}
                        className="btn-primary"
                    >
                        {syncState === "syncing" ? (
                            <><div className="spinner w-3.5 h-3.5" /> Sincronizando...</>
                        ) : syncState === "success" ? (
                            <><span>✓</span> Atualizado</>
                        ) : syncState === "error" ? (
                            <><span>✕</span> Erro</>
                        ) : (
                            <><span>⚡</span> Sincronizar Dados</>
                        )}
                    </button>
                </div>

                {/* Feedback de sync */}
                {syncMsg && syncState !== "idle" && (
                    <div className={`
            absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full
            px-4 py-1.5 rounded-b-lg text-xs font-mono font-medium
            ${syncState === "success" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" :
                            syncState === "error" ? "bg-rose-500/20 text-rose-400 border border-rose-500/20" :
                                "bg-blue-500/20 text-blue-400 border border-blue-500/20"}
          `}>
                        {syncMsg}
                    </div>
                )}
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
        </div>
    );
};

export default Dashboard;
