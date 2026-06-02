import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar.tsx";
import CustomerPanel from "./components/CustomerPanel.tsx";
import AdminPanel from "./components/AdminPanel.tsx";
import LogisticPanel from "./components/LogisticPanel.tsx";
import InteractiveMap from "./components/InteractiveMap.tsx";
import RegistrationPanel from "./components/RegistrationPanel.tsx";
import ChatbotWidget from "./components/ChatbotWidget.tsx";
import AboutModal from "./components/AboutModal.tsx";
import PlansModal from "./components/PlansModal.tsx";
import SecurityPanel, { SecurityConfig, AuditLog } from "./components/SecurityPanel.tsx";
import LoginPanel from "./components/LoginPanel.tsx";
import PWAInstallPrompt from "./components/PWAInstallPrompt.tsx";
import { Restaurant, Product, Promotion, DiscoveryCandidate, VerificationLog, ProductImage } from "./types.js";
import { Shield, X } from "lucide-react";

export default function App() {
  // Shared States
  const [currentView, setCurrentView] = useState<"customer" | "map" | "admin" | "security" | "register" | "logistic" | "login">("customer");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);

  // Security Platform Configurations States
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    currentRole: "cliente",
    activeRestaurantId: "",
    is2faEnabled: true,
    ipWhitelist: ["201.17.112.5", "192.168.1.10", "127.0.0.1"],
    currentIp: "201.17.112.5",
    isSecretUrlUnlocked: true,
    secretSlug: "painel-master-x7f93k",
    masterKey: "MANAUS_MASTER_2026",
    aiAgentsEnabled: {
      ia_discovery: true,
      ia_verifier: true,
      ia_menuocr: true,
      ia_promo: true,
      ia_chatbot: true
    },
    aiBudgetLimit: 30,
    adminEmail: ""
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: "1",
      timestamp: "2026-06-01 20:10:05",
      usuario: "Sistema IA",
      role: "Sistema",
      ip: "127.0.0.1",
      acao: "Banco de dados inicializado em ambiente sandbox seguro",
      nivel: "sucesso"
    },
    {
      id: "2",
      timestamp: "2026-06-01 20:11:12",
      usuario: "Agente Verificador",
      role: "IA-02",
      ip: "127.0.0.1",
      acao: "Sincronização de 12 estabelecimentos em bairros realizada",
      nivel: "sucesso"
    }
  ]);

  // Master Key overlay prompt state
  const [masterKeyPrompt, setMasterKeyPrompt] = useState<{
    isOpen: boolean;
    targetAction: string;
    onSuccess: () => void;
  }>({ isOpen: false, targetAction: "", onSuccess: () => {} });

  const [masterKeyInput, setMasterKeyInput] = useState("");
  const [masterKeyError, setMasterKeyError] = useState("");

  // Assign merchant default restaurant on loading
  useEffect(() => {
    if (restaurants.length > 0 && !securityConfig.activeRestaurantId) {
      setSecurityConfig(prev => ({
        ...prev,
        activeRestaurantId: restaurants[0].id
      }));
    }
  }, [restaurants]);

  // Fetch all starting items from the custom full-stack server endpoints
  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  const fetchData = async () => {
    try {
      const [resRest, resProd, resPromo, resCand, resLog, resImg] = await Promise.all([
        fetch("/api/restaurants").then(r => r.json()),
        fetch("/api/products").then(r => r.json()),
        fetch("/api/promotions").then(r => r.json()),
        fetch("/api/candidates").then(r => r.json()),
        fetch("/api/verification-logs").then(r => r.json()),
        fetch("/api/product-images").then(r => r.json())
      ]);

      setRestaurants(resRest);
      setProducts(resProd);
      setPromotions(resPromo);
      setCandidates(resCand);
      setVerificationLogs(resLog);
      setProductImages(resImg || []);
    } catch (err) {
      console.error("Failed to load initial server state:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const stats = await fetch("/api/leads/stats").then(r => r.json());
      setTotalLeadsCount(stats.totalLeads || 0);
    } catch (err) {
      console.error(err);
    }
  };

  // Security Config Updates Handler
  const handleUpdateConfig = (newConfig: Partial<SecurityConfig>) => {
    setSecurityConfig(prev => ({
      ...prev,
      ...newConfig
    }));
  };

  // Audit Logs Creation Helper
  const handleAddAuditLog = (acao: string, nivel: "sucesso" | "alerta" | "perigo" = "sucesso", userOver?: string, roleOver?: string) => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    const user = userOver || (securityConfig.currentRole === "super_admin" ? "Dono (Super Admin)" : securityConfig.currentRole === "visitante" ? "Visitante Externo" : securityConfig.currentRole === "restaurante" ? "Dono de Loja" : "Funcionário");
    const role = roleOver || securityConfig.currentRole.toUpperCase().replace("_", " ");
    
    const newLog: AuditLog = {
      id: Math.random().toString(),
      timestamp,
      usuario: user,
      role,
      ip: securityConfig.currentIp,
      acao,
      nivel
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Master Key Authorization Trigger
  const triggerMasterKey = (onSuccess: () => void, targetAction: string) => {
    if (securityConfig.currentRole !== "super_admin" && securityConfig.currentRole !== "admin") {
      alert(`Erro de Permissão: A ação [${targetAction}] exige credenciais administrativas superiores.`);
      handleAddAuditLog(`REJEITADO: Tentativa não autorizada de executar [${targetAction}]`, "perigo");
      return;
    }

    setMasterKeyInput("");
    setMasterKeyError("");
    setMasterKeyPrompt({
      isOpen: true,
      targetAction,
      onSuccess
    });
  };

  const handleVerifyMasterKey = () => {
    if (masterKeyInput === securityConfig.masterKey) {
      handleAddAuditLog(`Sucesso: Autorização por Chave Mestre concedida para [${masterKeyPrompt.targetAction}]`, "sucesso");
      masterKeyPrompt.onSuccess();
      setMasterKeyPrompt({ isOpen: false, targetAction: "", onSuccess: () => {} });
    } else {
      setMasterKeyError("Senha Mestre incorreta! Operação cancelada por motivos de segurança.");
      handleAddAuditLog(`ALERTA: Tentativa frustrada de validar Chave Mestre para [${masterKeyPrompt.targetAction}]`, "perigo");
    }
  };

  // Delete Restaurant via Admin action
  const handleDeleteRestaurant = async (id: string) => {
    try {
      await fetch("/api/restaurants/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      setRestaurants(prev => prev.filter(r => r.id !== id));
      alert("Estabelecimento removido definitivamente com sucesso!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePlan = async (id: string, plano: 'basico' | 'destaque' | 'premium') => {
    try {
      await fetch("/api/restaurants/update-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, plano })
      });
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, plano } : r));
    } catch (err) {
      console.error(err);
    }
  };

  // Add a new Active Restaurant
  const handleAddRestaurant = async (newRestPayload: any) => {
    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRestPayload)
      });
      const data = await res.json();
      setRestaurants(prev => [...prev, data]);
    } catch (err) {
      console.error(err);
    }
  };

  // Confirm / Convert draft to active shop
  const handleConfirmCandidate = async (candidateId: string) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}/confirm`, {
        method: "POST"
      });
      const data = await res.json();

      // update states
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: 'confirmado' } : c));
      setRestaurants(prev => [...prev, data.restaurant]);
      alert(`O candidato '${data.restaurant.nome}' foi confirmado com sucesso e agora está ativo no portal AmazFood!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate whatsapp invite candidate
  const handleInviteCandidate = async (candidateId: string) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}/invite`, {
        method: "POST"
      });
      const data = await res.json();
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: 'convidado' } : c));
      alert("Convite WhatsApp enviado com sucesso ao parceiro em potencial! Logo eles aprovarão e estarão ativos.");
    } catch (err) {
      console.error(err);
    }
  };

  // Approve or Reject verification difference suggestions on restaurants
  const handleResolveLog = async (logId: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/verification-logs/${logId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve })
      });
      const data = await res.json();

      setVerificationLogs(prev => prev.map(l => l.id === logId ? data : l));
      
      // refresh restaurants to show the updated hours or numbers
      const refreshedRests = await fetch("/api/restaurants").then(r => r.json());
      setRestaurants(refreshedRests);
      
      alert(approve ? "Alterações sugeridas pela IA foram integradas ao banco com sucesso!" : "Discrepância ignorada.");
    } catch (err) {
      console.error(err);
    }
  };

  // Add Product manually
  const handleAddProduct = async (newProdPayload: any) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProdPayload)
      });
      const data = await res.json();
      setProducts(prev => [...prev, data]);
    } catch (err) {
      console.error(err);
    }
  };

  // Run Cardápio OCR
  const handleConvertCardapio = async (payload: { textData?: string, fileBase64?: string, mimeType?: string, restaurant_id: string }) => {
    const res = await fetch("/api/convert-cardapio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    
    // refresh internal products
    const refreshedProds = await fetch("/api/products").then(r => r.json());
    setProducts(refreshedProds);
    return data;
  };

  // Record stats and leads clicks
  const handleRecordLead = async (restaurantId: string, origem: 'whatsapp_click' | 'view_menu' | 'restaurant_view') => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: restaurantId, origem })
      });
      const data = await res.json();
      
      // update state
      setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, clicks: data.clicks, views: data.views } : r));
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setSecurityConfig(prev => ({ ...prev, currentRole: "cliente" }));
    setCurrentView("customer");
    handleAddAuditLog("Usuário encerrou sessão (Logout)", "alerta", "Sistema", "Logout");
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row overflow-hidden bg-[#F0F2F5]" id="app_root_layout">
      {/* Mobile Top Header (hidden on md screens) */}
      <div className="md:hidden h-14 bg-[#0F172A] flex items-center justify-between px-4 shrink-0 border-b border-white/5 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-manaus-orange rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-[0_0_8px_rgba(255,107,53,0.3)]">
            M
          </div>
          <h1 className="text-white font-bold text-sm tracking-tight">AmazFood</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-slate-400 p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X size={20} /> : (
            <div className="flex flex-col gap-1 w-5">
              <span className="h-0.5 w-full bg-slate-400 rounded"></span>
              <span className="h-0.5 w-full bg-slate-400 rounded"></span>
              <span className="h-0.5 w-full bg-slate-400 rounded"></span>
            </div>
          )}
        </button>
      </div>

      {/* Sidebar - Logo, Status scan elements, Metrics counts and Pricing calls */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-40 transform 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 shrink-0 h-full
      `}>
        <Sidebar 
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view);
            setSelectedRestaurantId(null);
            setIsSidebarOpen(false); // Auto-close on mobile
          }}
          onOpenPlans={() => setIsPlansOpen(true)}
          onOpenInstallModal={() => setIsInstallOpen(true)}
          candidateCount={candidates.filter(c => c.status !== 'confirmado').length}
          logCount={verificationLogs.filter(l => l.status === 'pendente').length}
          restaurantCount={restaurants.length}
          totalLeads={totalLeadsCount}
          currentRole={securityConfig.currentRole}
          onLogout={handleLogout}
        />
      </div>

      {/* Sidebar Overlay (Mobile only) */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Panel views */}
      <main className="flex-1 flex flex-col overflow-hidden h-full relative">
        {currentView === "customer" && (
          <CustomerPanel 
            restaurants={restaurants}
            products={products}
            promotions={promotions}
            productImages={productImages}
            selectedRestaurantId={selectedRestaurantId}
            onSelectRestaurant={setSelectedRestaurantId}
            onRecordLead={handleRecordLead}
            onOpenPlans={() => setIsPlansOpen(true)}
            onOpenMap={() => setCurrentView("map")}
            onViewChange={setCurrentView}
          />
        )}
        {currentView === "map" && (
          <InteractiveMap 
            restaurants={restaurants}
            products={products}
            onSelectRestaurant={setSelectedRestaurantId}
            onViewChange={setCurrentView}
            onRecordLead={handleRecordLead}
          />
        )}
        {currentView === "register" && (
          <RegistrationPanel 
            onAddRestaurant={handleAddRestaurant}
            onAddAuditLog={handleAddAuditLog}
          />
        )}
        {currentView === "logistic" && (
          <LogisticPanel 
            currentRole={securityConfig.currentRole}
          />
        )}
        {currentView === "admin" && (
          <AdminPanel 
            restaurants={restaurants}
            products={products}
            candidates={candidates}
            logs={verificationLogs}
            productImages={productImages}
            onRefreshImages={fetchData}
            onAddRestaurant={handleAddRestaurant}
            onConfirmCandidate={handleConfirmCandidate}
            onInviteCandidate={handleInviteCandidate}
            onResolveLog={handleResolveLog}
            onAddProduct={handleAddProduct}
            onConvertCardapio={handleConvertCardapio}
            currentRole={securityConfig.currentRole}
            activeRestaurantId={securityConfig.activeRestaurantId}
            onTriggerMasterKey={triggerMasterKey}
            onAddAuditLog={handleAddAuditLog}
            onDeleteRestaurant={handleDeleteRestaurant}
            onUpdatePlan={handleUpdatePlan}
          />
        )}
        {currentView === "security" && (
          <SecurityPanel 
            onAddAuditLog={handleAddAuditLog}
            auditLogs={auditLogs}
            config={securityConfig}
            onUpdateConfig={handleUpdateConfig}
            restaurants={restaurants}
            onTriggerMasterKey={triggerMasterKey}
          />
        )}
        {currentView === "login" && (
          <LoginPanel
            onLogin={(role) => {
              setSecurityConfig(prev => ({ ...prev, currentRole: role }));
              setCurrentView(role === "super_admin" || role === "admin" || role === "restaurante" ? "admin" : "customer");
            }}
            onAddAuditLog={handleAddAuditLog}
          />
        )}
      </main>

      {/* Invisible/Floating Chatbot Widget (Agent 5 - Customer Assistant) */}
      <ChatbotWidget />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt 
        forceShow={isInstallOpen} 
        onClose={() => setIsInstallOpen(false)} 
      />

      {/* Monetization Plans overview modal */}
      <PlansModal 
        isOpen={isPlansOpen}
        onClose={() => setIsPlansOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* MASTER KEY CHALLENGE LAYER FLOATING PIN SCREEN */}
      {masterKeyPrompt.isOpen && (
        <div className="fixed inset-0 z-50 bg-[#0f172acc]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-100 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-2.5 items-center">
                <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                  <Shield size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-850">Ação Protegida pela Tainá</h3>
                  <p className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Acesso Master Mandatório</p>
                </div>
              </div>
              <button 
                onClick={() => setMasterKeyPrompt({ isOpen: false, targetAction: "", onSuccess: () => {} })}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-slate-600 leading-normal border text-left">
              <p className="font-semibold text-slate-800">Ação Requerida:</p>
              <p className="italic">"{masterKeyPrompt.targetAction}"</p>
            </div>

            <div className="space-y-1.5 focus-within:ring-1 focus-within:ring-rose-500 rounded-lg text-left">
              <label className="block text-[10px] font-bold uppercase text-slate-500">Insira a Chave Mestre de Segurança (Master Key):</label>
              <input 
                type="password" 
                placeholder="Ex: MANAUS_MASTER_2026"
                value={masterKeyInput}
                onChange={(e) => {
                  setMasterKeyInput(e.target.value);
                  setMasterKeyError("");
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyMasterKey(); }}
                className="w-full text-xs font-mono p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 px-3 bg-rose-50/10"
              />
              {masterKeyError && (
                <p className="text-[10px] text-rose-600 font-bold">{masterKeyError}</p>
              )}
            </div>

            <div className="text-[10px] text-slate-400 font-medium">
              Dica: A Chave Mestre configurada está na aba <strong>Configurações & Segurança</strong>.
            </div>

            <div className="flex gap-2.5 pt-1.5 font-sans">
              <button 
                onClick={() => setMasterKeyPrompt({ isOpen: false, targetAction: "", onSuccess: () => {} })}
                className="flex-1 bg-slate-50 border hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button 
                onClick={handleVerifyMasterKey}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-lg shadow-md transition-all cursor-pointer text-center"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
