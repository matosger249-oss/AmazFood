import React, { useState, useEffect } from "react";
import { Radar, RefreshCw, Layers, Sparkles, Building2, BarChart3, HelpCircle, Bot, Megaphone, Smartphone, Lock, Map as MapIcon, PlusCircle, Truck } from "lucide-react";

interface SidebarProps {
  currentView: "customer" | "map" | "admin" | "security" | "register" | "logistic" | "login";
  onViewChange: (view: "customer" | "map" | "admin" | "security" | "register" | "logistic" | "login") => void;
  onOpenPlans: () => void;
  onOpenInstallModal: () => void;
  candidateCount: number;
  logCount: number;
  restaurantCount: number;
  totalLeads: number;
  currentRole: string;
  onLogout: () => void;
}

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  onOpenPlans, 
  onOpenInstallModal,
  candidateCount, 
  logCount, 
  restaurantCount,
  totalLeads,
  currentRole,
  onLogout
}: SidebarProps) {
  // Navigation categories based on role
  const isSuperAdmin = currentRole === "super_admin";
  const isAdmin = currentRole === "admin" || isSuperAdmin;
  const isMerchant = currentRole === "restaurante";
  const isSupport = currentRole === "suporte" || currentRole === "moderador";

  // Simulate active scans inside neighborhoods of Manaus
  const neighborhoods = [
    "Adrianópolis", 
    "Vieiralves", 
    "Centro", 
    "Parque 10", 
    "Aleixo", 
    "Japiim", 
    "Ponta Negra", 
    "Jorge Teixeira", 
    "São José", 
    "Coroado", 
    "Cidade Nova"
  ];
  const [activeScanNeighborhood, setActiveScanNeighborhood] = useState("Adrianópolis");

  useEffect(() => {
    const interval = setInterval(() => {
      const randomNeighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
      setActiveScanNeighborhood(randomNeighborhood);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col shrink-0 h-full border-r border-slate-800" id="sidebar_container">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-manaus-orange rounded-lg flex items-center justify-center text-white font-bold text-base shadow-[0_0_12px_rgba(255,107,53,0.4)] animate-pulse">
            M
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-tight">AmazFood</h1>
            <p className="text-[9px] uppercase tracking-widest text-[#FF6B35] font-semibold">Toda a gastronomia da Amazônia</p>
          </div>
        </div>
      </div>

      {/* Navigation Toggles */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
        <div className="mb-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Principal</h3>
          <div className="space-y-1">
            <button
              onClick={() => onViewChange("customer")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                currentView === "customer" 
                  ? "bg-manaus-orange text-white shadow-lg shadow-orange-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Smartphone size={16} />
              Portal do Cliente
            </button>
            <button
              onClick={() => onViewChange("map")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                currentView === "map" 
                  ? "bg-manaus-orange text-white shadow-lg shadow-orange-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <MapIcon size={16} />
              Geolocalização IA
            </button>
          </div>
        </div>

        <div className="mb-4 pt-4 border-t border-slate-800/50">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Administração</h3>
          <div className="space-y-1">
            {(isAdmin || isMerchant) && (
              <button
                onClick={() => onViewChange("admin")}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                  currentView === "admin" 
                    ? "bg-manaus-orange text-white shadow-lg shadow-orange-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Building2 size={16} />
                  Painel do Lojista
                </span>
                {(candidateCount + logCount) > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full animate-pulse">
                    {candidateCount + logCount}
                  </span>
                )}
              </button>
            )}
            {isSuperAdmin && (
              <button
                onClick={() => onViewChange("security")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                  currentView === "security" 
                    ? "bg-manaus-orange text-white shadow-lg shadow-orange-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Lock size={16} />
                Segurança & Logs
              </button>
            )}
            {!isMerchant && (
              <button
                onClick={() => onViewChange("register")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                  currentView === "register" 
                    ? "bg-manaus-orange text-white shadow-lg shadow-orange-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <PlusCircle size={16} />
                Cadastrar Loja
              </button>
            )}
          </div>
        </div>

        {/* LOGÍSTICA SECTION (Super Admin Exclusive) */}
        {isSuperAdmin && (
          <div className="mb-4 pt-4 border-t border-slate-800/50">
            <h3 className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 underline decoration-manaus-orange underline-offset-4">
               LOGÍSTICA
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => onViewChange("logistic")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                  currentView === "logistic" 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Truck size={16} className={currentView === "logistic" ? "text-white" : "text-indigo-400"} />
                Gestão de Entregas
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Discrete Status Indicator */}
      <div className="p-4 border-t border-slate-800/50 mt-auto">
        <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Status Tainá</span>
            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
              Operacional
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Sparkles size={12} className="text-manaus-orange" />
            <span>Tainá olhando <span className="text-white font-medium">{activeScanNeighborhood}</span></span>
          </div>
        </div>
      </div>

      {/* Plans Action Mini-Banner */}
      <div className="p-4 shrink-0 bg-slate-950/30 flex flex-col gap-2">
        <button 
          onClick={onOpenInstallModal}
          className="w-full bg-manaus-orange hover:bg-orange-600 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 group"
        >
          <Smartphone size={14} className="group-hover:scale-110 transition-transform" />
          Instalar App (PWA)
        </button>
        <button 
          onClick={onOpenPlans}
          className="w-full bg-white/5 hover:bg-white/10 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center justify-center gap-2 group"
        >
          <Bot size={14} className="text-manaus-orange group-hover:scale-110 transition-transform" />
          Planos Profissionais
        </button>
      </div>

      {/* Sticky footer */}
      <div className="p-4 bg-slate-950 border-t border-slate-900 space-y-4">
        {currentRole === "cliente" || currentRole === "visitante" ? (
          <button 
            onClick={() => onViewChange("login")}
            className="w-full flex items-center gap-3 px-3 py-3 text-xs font-black text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all uppercase tracking-widest border border-slate-800 hover:border-slate-700"
          >
            <Lock size={14} />
            Login
          </button>
        ) : (
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-xs font-black text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-xl transition-all uppercase tracking-widest border border-transparent hover:border-rose-500/20"
          >
            <RefreshCw size={14} className="rotate-45" />
            Encerrar Sessão
          </button>
        )}
        
        <div className="text-[9px] text-slate-500 font-medium flex justify-between items-center">
          <span>© 2026 AmazFood IA</span>
          <span className="text-slate-600">v1.1.0</span>
        </div>
      </div>
    </aside>
  );
}
