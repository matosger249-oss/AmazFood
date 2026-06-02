import React, { useState } from "react";
import { PlusCircle, Search, Sparkles, Send, Check, AlertTriangle, FileText, UploadCloud, RefreshCw, BarChart2, TrendingUp, Compass, Smartphone, Lock, Trash2, Eye, Camera, CheckSquare, Building2, MapPin, HelpCircle } from "lucide-react";
import OnboardingAgent from "./OnboardingAgent.tsx";
import { Restaurant, Product, DiscoveryCandidate, VerificationLog, ProductImage } from "../types";

interface AdminPanelProps {
  restaurants: Restaurant[];
  products: Product[];
  candidates: DiscoveryCandidate[];
  logs: VerificationLog[];
  productImages: ProductImage[];
  onRefreshImages?: () => void;
  onAddRestaurant: (newRest: any) => void;
  onConfirmCandidate: (id: string) => void;
  onInviteCandidate: (id: string) => void;
  onResolveLog: (id: string, approve: boolean) => void;
  onAddProduct: (prod: any) => void;
  onConvertCardapio: (payload: { textData?: string, fileBase64?: string, mimeType?: string, restaurant_id: string }) => Promise<any>;
  currentRole: "visitante" | "restaurante" | "moderador" | "suporte" | "admin" | "super_admin";
  activeRestaurantId: string;
  onTriggerMasterKey: (onSuccess: () => void, targetActionDescription: string) => void;
  onAddAuditLog: (acao: string, nivel?: "sucesso" | "alerta" | "perigo") => void;
  onDeleteRestaurant?: (id: string) => void;
  onUpdatePlan?: (id: string, newPlan: 'basico' | 'destaque' | 'premium') => void;
}

export default function AdminPanel({
  restaurants,
  products,
  candidates,
  logs,
  productImages,
  onRefreshImages,
  onAddRestaurant,
  onConfirmCandidate,
  onInviteCandidate,
  onResolveLog,
  onAddProduct,
  onConvertCardapio,
  currentRole,
  activeRestaurantId,
  onTriggerMasterKey,
  onAddAuditLog,
  onDeleteRestaurant,
  onUpdatePlan
}: AdminPanelProps) {
  // Navigation internal tabs
  const [adminTab, setAdminTab] = useState<"discovery" | "verification" | "add_restaurant" | "ocr_menu" | "leads" | "food_vision" | "central_ia">("central_ia");
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Food Vision IA States
  const [visionMode, setVisionMode] = useState<"catalog" | "dashboard">("catalog");
  const [visionSelectedProductId, setVisionSelectedProductId] = useState<string>("");
  const [visionGeneratingId, setVisionGeneratingId] = useState<string>("");
  const [visionLogs, setVisionLogs] = useState<string[]>([]);
  const [pricingTier, setPricingTier] = useState<number>(99); // R$ 99/mês custom premium plan
  const [prioritizePopular, setPrioritizePopular] = useState<boolean>(true); // Top 100 prioritization
  const [filterLevel, setFilterLevel] = useState<"all" | "restaurant" | "internet" | "ai_generated" | "missing">("all");
  const [imagePromptOutput, setImagePromptOutput] = useState<string>("");
  const [simulatedImageUrl, setSimulatedImageUrl] = useState<string>("");
  const [simulatedSource, setSimulatedSource] = useState<"restaurant" | "internet" | "ai_generated">("ai_generated");
  const [simulatedConfidence, setSimulatedConfidence] = useState<number>(60);

  // Add Restaurant form state
  const [newRestName, setNewRestName] = useState("");
  const [newRestCat, setNewRestCat] = useState<Restaurant['categoria']>("Restaurante");
  const [newRestDesc, setNewRestDesc] = useState("");
  const [newRestPhone, setNewRestPhone] = useState("");
  const [newRestWhatsapp, setNewRestWhatsapp] = useState("");
  const [newRestAddress, setNewRestAddress] = useState("");
  const [newRestBairro, setNewRestBairro] = useState("Adrianópolis");
  const [newRestPlano, setNewRestPlano] = useState<Restaurant['plano']>("basico");
  const [newRestHours, setNewRestHours] = useState("11:00 às 22:00");

  // Cardapio OCR State
  const [selectedRestOcrId, setSelectedRestOcrId] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrFileBase64, setOcrFileBase64] = useState<string | null>(null);
  const [ocrFileMimeType, setOcrFileMimeType] = useState<string | null>(null);
  const [ocrFileName, setOcrFileName] = useState("");
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrCompletedItems, setOcrCompletedItems] = useState<any[]>([]);
  const [isDoneProcessingMessage, setIsDoneProcessingMessage] = useState("");

  // Product Add state for manual entries
  const [selectedManualRestId, setSelectedManualRestId] = useState("");
  const [manualProdName, setManualProdName] = useState("");
  const [manualProdDesc, setManualProdDesc] = useState("");
  const [manualProdPrice, setManualProdPrice] = useState("");
  const [manualProdCat, setManualProdCat] = useState("Especificação");

  const categories: Restaurant['categoria'][] = [
    "Restaurante", "Lanchonete", "Pizzaria", "Açaíteria", "Cafeteria", "Marmitaria", "Doceria"
  ];
  
  const handleCreateRest = (e: React.FormEvent) => {
    e.preventDefault();

    // Privilege check: allow registration if admin or if it's a self-registration from visitor
    const canRegister = currentRole === "super_admin" || currentRole === "admin" || currentRole === "visitante";
    
    if (!canRegister) {
      alert("Erro de Permissão: Apenas administradores ou novos interessados podem indexar estabelecimentos.");
      onAddAuditLog(`Bloqueado: Tentativa não autorizada de cadastrar restaurante por usuário com papel [${currentRole}]`, "perigo");
      return;
    }

    if (!newRestName || !newRestWhatsapp) {
      alert("Por favor, preencha o nome e o whatsapp.");
      return;
    }

    const payload = {
      nome: newRestName,
      categoria: newRestCat,
      descricao: newRestDesc,
      telefone: newRestPhone,
      whatsapp: newRestWhatsapp.replace(/\D/g, ""),
      email: `${newRestName.toLowerCase().replace(/\s+/g, "")}@exemplo.com`,
      endereco: newRestAddress,
      bairro: newRestBairro,
      plano: newRestPlano,
      horario_funcionamento: newRestHours
    };

    onAddRestaurant(payload);
    onAddAuditLog(`Cadastrou novo estabelecimento ativo: ${newRestName} (${newRestBairro})`, "sucesso");
    
    // reset
    setNewRestName("");
    setNewRestDesc("");
    setNewRestPhone("");
    setNewRestWhatsapp("");
    setNewRestAddress("");
    setNewRestHours("11:00 às 22:00");
    alert(`Restaurante '${payload.nome}' cadastrado com sucesso!`);
  };

  const handleManualAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Decreted target id based on role
    const targetRestId = currentRole === "restaurante" ? activeRestaurantId : selectedManualRestId;

    if (!targetRestId) {
      alert("Selecione o restaurante para associar o prato.");
      return;
    }

    if (currentRole === "restaurante" && targetRestId !== activeRestaurantId) {
      alert("Erro de Segurança: Você não tem autorização para adicionar pratos no cardápio de outro lojista!");
      onAddAuditLog(`PREVENIDO: Tentativa de inserção cruzada de menu por Dono de Restaurante no ID ${targetRestId}`, "perigo");
      return;
    }

    if (!manualProdName || !manualProdPrice) {
      alert("Declare nome e preço do produto.");
      return;
    }

    const payload = {
      restaurant_id: targetRestId,
      nome: manualProdName,
      descricao: manualProdDesc,
      preco: Number(manualProdPrice),
      categoria: manualProdCat,
      ativo: true
    };

    onAddProduct(payload);
    onAddAuditLog(`Adicionou item '${manualProdName}' (R$ ${Number(manualProdPrice).toFixed(2)}) de forma manual no cardápio`, "sucesso");

    setManualProdName("");
    setManualProdDesc("");
    setManualProdPrice("");
    alert("Prato adicionado com sucesso!");
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processFileForOcr(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFileForOcr(file);
    }
  };

  const processFileForOcr = (file: File) => {
    setOcrFileName(file.name);
    setOcrFileMimeType(file.type);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extract pure base64
      const pureBase64 = base64String.split(",")[1];
      setOcrFileBase64(pureBase64);
    };
    reader.readAsDataURL(file);
  };

  const handleRunOcr = async () => {
    const targetRestId = currentRole === "restaurante" ? activeRestaurantId : selectedRestOcrId;

    if (!targetRestId) {
      alert("Selecione um restaurante para associar o cardápio extraído.");
      return;
    }

    if (currentRole === "restaurante" && targetRestId !== activeRestaurantId) {
      alert("Erro de Autorização: Você só pode executar extração via IA para o seu próprio estabelecimento!");
      onAddAuditLog(`PREVENIDO: Acesso OCR restrito contornado por usuário [restaurante]`, "perigo");
      return;
    }

    if (!ocrText && !ocrFileBase64) {
      alert("Por favor digite ou arraste um arquivo/foto para que o Agente IA possa extrair.");
      return;
    }

    setIsProcessingOcr(true);
    setOcrCompletedItems([]);
    setIsDoneProcessingMessage("");

    try {
      const response = await onConvertCardapio({
        restaurant_id: targetRestId,
        textData: ocrText,
        fileBase64: ocrFileBase64 || undefined,
        mimeType: ocrFileMimeType || undefined
      });

      if (response && response.products) {
        setOcrCompletedItems(response.products);
        if (response.isMock) {
          setIsDoneProcessingMessage("Simulado: " + (response.msg || "Sucesso"));
        } else {
          setIsDoneProcessingMessage("Sucesso! O Agente IA extraiu em tempo real com o Gemini-3.5-flash e salvou no banco!");
        }
        
        onAddAuditLog(`Executou conversão OCR inteligente de cardápio para o ID ${targetRestId}`, "sucesso");
        // clear fields
        setOcrText("");
        setOcrFileBase64(null);
        setOcrFileName("");
      } else {
        alert("Resposta inesperada do servidor");
      }
    } catch (err: any) {
      alert("Erro ao processar cardápio via IA: " + err.message);
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleRunFoodVision = async (prod: Product) => {
    if (!prod) return;
    setVisionGeneratingId(prod.id);
    setVisionSelectedProductId(prod.id);
    setVisionLogs([
      "⚡ [Agente 7] Inicializando Food Vision Engine...",
      `📦 Analisando produto: [${prod.nome}] | Categoria: [${prod.categoria}]`,
      "🔍 [Fase 1 - Prioridade Máxima] Varrendo arquivos originais do restaurante..."
    ]);

    // Simulate agent-thinking steps sequentially
    setTimeout(() => {
      const hasOriginal = prod.nome.toLowerCase().includes("tambaqui") || prod.nome.toLowerCase().includes("caboquinho");
      if (hasOriginal) {
        setVisionLogs(prev => [
          ...prev,
          "📸 Foto Original Encontrada! [Nível A - Confiança: 100%]"
        ]);
      } else {
        setVisionLogs(prev => [
          ...prev,
          "⚠️ Sem mídias originais enviadas pelo restaurante no cadastro.",
          "🔍 [Fase 2 - Busca Inteligente] Pesquisando imagens gastronômicas catalogadas no banco unificado de Manaus..."
        ]);
      }
    }, 800);

    setTimeout(() => {
      const isCatalogued = prod.nome.toLowerCase().includes("pizza") || prod.nome.toLowerCase().includes("tacacá") || prod.nome.toLowerCase().includes("açaí");
      if (!prod.nome.toLowerCase().includes("tambaqui") && !prod.nome.toLowerCase().includes("caboquinho")) {
        if (isCatalogued) {
          setVisionLogs(prev => [
            ...prev,
            "✨ Imagem compatível e fidedigna identificada! [Nível B - Confiança: 80%]"
          ]);
        } else {
          setVisionLogs(prev => [
            ...prev,
            "❌ Nenhuma imagem compatível pré-aprovada encontrada no catálogo global.",
            "🤖 [Fase 3 - IA Generativa] Ativando motor avançado de difusão de imagens gastronômicas..."
          ]);
        }
      }
    }, 1600);

    setTimeout(async () => {
      try {
        const res = await fetch("/api/product-images/generate-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: prod.id,
            nome: prod.nome,
            descricao: prod.descricao,
            categoria: prod.categoria,
            priority: prioritizePopular
          })
        });

        if (!res.ok) throw new Error("Erro na geração da imagem");
        const data = await res.json();

        setSimulatedImageUrl(data.image.image_url);
        setSimulatedSource(data.image.source);
        setSimulatedConfidence(data.image.confidence);
        setImagePromptOutput(data.prompt);

        setVisionLogs(prev => [
          ...prev,
          `📝 Prompt IA formulado: "${data.prompt}"`,
          `🌟 Imagem gerada com sucesso! Código: [${data.image.id}] - Confiança: ${data.image.confidence}%`,
          "⌛ Aguardando aprovação manual do Super Administrador para vincular ao catálogo live..."
        ]);

        if (onRefreshImages) onRefreshImages();
      } catch (err) {
        console.error(err);
        setVisionLogs(prev => [...prev, "❌ Falha crítica ao contactar o servidor gastronômico."]);
      } finally {
        setVisionGeneratingId("");
      }
    }, 2400);
  };

  const handleApproveImage = async (imgId: string, prodId: string, approved: boolean) => {
    try {
      const res = await fetch("/api/product-images/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: imgId, approved })
      });

      if (!res.ok) throw new Error("Erro ao atualizar aprovação");
      
      const prod = products.find(p => p.id === prodId);
      const prodName = prod ? prod.nome : "Produto";

      if (approved) {
        onAddAuditLog(`Aprovou imagem gastronômica do Food Vision IA para [${prodName}]`, "sucesso");
        alert(`Imagem aprovada e vinculada com sucesso ao item [${prodName}] no site!`);
      } else {
        onAddAuditLog(`Recusou/removeu imagem do Food Vision IA para [${prodName}]`, "alerta");
        alert("Imagem recusada pelo administrador.");
      }

      setVisionSelectedProductId("");
      setSimulatedImageUrl("");
      setVisionLogs([]);
      setImagePromptOutput("");

      if (onRefreshImages) onRefreshImages();
    } catch (err) {
      console.error(err);
      alert("Houve um erro operacional.");
    }
  };

  // If not staff/admin, show a strict lock screen
  const isStaff = ["admin", "super_admin", "moderador", "suporte"].includes(currentRole);
  
  if (!isStaff && currentRole !== "restaurante") {
    return (
      <div className="flex-1 p-8 bg-[#F0F2F5] flex flex-col items-center justify-center h-full">
        <div className="bg-white rounded-[32px] border p-12 max-w-md w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center border-4 border-rose-100 shadow-xl shadow-rose-100/50">
            <Lock size={48} className="animate-pulse" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">403 - Acesso Negado</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium px-4">
              O Painel Administrativo contém informações sensíveis e financeiras do AmazFood. Seu nível de acesso não permite visualizar esta área.
            </p>
          </div>
          
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-[11px] text-slate-600 leading-relaxed font-medium text-left flex gap-4 items-start">
             <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
               <HelpCircle size={18} />
             </div>
             <div>
                <p className="font-black text-slate-900 mb-1">Privacidade Garantida</p>
                <p>Nenhuma informação corporativa ou de lojistas foi exposta durante sua tentativa de acesso.</p>
             </div>
          </div>

          <div className="pt-4">
            <p className="text-[10px] text-slate-400">Somente o <strong>SUPER_ADMIN</strong> possui autorização para gerenciar a plataforma AmazFood.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full bg-[#F0F2F5]">
      
      {/* Sub menu tabs */}
      <div className="md:h-12 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 md:gap-4 whitespace-nowrap">
          <button
            onClick={() => setAdminTab("add_restaurant")}
            className={`text-xs font-bold py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              adminTab === "add_restaurant" 
                ? "border-manaus-orange text-[#0F172A]" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <PlusCircle size={14} />
            Lojistas
          </button>

          <button
            onClick={() => setAdminTab("ocr_menu")}
            className={`text-xs font-bold py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              adminTab === "ocr_menu" 
                ? "border-manaus-orange text-[#0F172A]" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Smartphone size={14} />
            OCR Menu
          </button>

          <button
            onClick={() => setAdminTab("leads")}
            className={`text-xs font-bold py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              adminTab === "leads" 
                ? "border-manaus-orange text-[#0F172A]" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart2 size={14} />
            Relatórios
          </button>

          {currentRole !== "restaurante" && (
            <>
              <button
                onClick={() => setAdminTab("central_ia")}
                className={`text-xs font-bold py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  adminTab === "central_ia" 
                    ? "border-manaus-orange text-[#0F172A]" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles size={14} className="text-manaus-orange" />
                Descoberta IA
              </button>
              <button
                onClick={() => setAdminTab("verification")}
                className={`text-xs font-bold py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  adminTab === "verification" 
                    ? "border-manaus-orange text-[#0F172A]" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <CheckSquare size={14} />
                Auditoria IA
              </button>
            </>
          )}

          <button
            onClick={() => setAdminTab("food_vision")}
            className={`text-xs font-bold py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              adminTab === "food_vision" 
                ? "border-manaus-orange text-[#0F172A]" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera size={14} />
            Food Vision
          </button>
        </div>

        <div className="text-[10px] bg-slate-100 border px-2.5 py-1 rounded text-slate-600 font-mono font-bold flex gap-1.5 items-center">
          <Sparkles size={11} className="text-[#FF6B35]" />
          <span>Portal Gratuito</span>
        </div>
      </div>

      {/* Main Tab Area */}
      <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
        
        {/* TABS: AGENT DISCOVERY */}
        {adminTab === "central_ia" && (
          currentRole === "restaurante" ? (
            <div className="bg-white rounded-xl border p-8 text-center max-w-2xl mx-auto space-y-4 shadow-sm my-6">
              <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                <Lock size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Varreduras de Descoberta Ocultadas</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-normal">
                  Como proprietário de restaurante associado, seu escopo é focado na gestão de seus produtos e leads personalizados. Esta consolidação de varrimento geral de candidatos a parceiros é restrito a Moderadores e Administradores.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Agent Cluster Status - Moved from Sidebar */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <RefreshCw size={20} className="animate-spin-slow" />
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">IA-01 Descoberta</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">Varrendo redes sociais em busca de novos estabelecimentos.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <Search size={20} />
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">IA-02 Verificador</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">Auditando coesão de endereços e telefones via Maps regional.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                      <Smartphone size={20} />
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">IA-03 Cardápio</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">Processamento OCR para extração de menus de fotos/PDFs.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
                      <TrendingUp size={20} />
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">IA-04 Promoções</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">Identificação automática de ofertas relâmpago no Instagram.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    🌐 Tainá – Agente de Descoberta Automatizada
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal mt-1">
                    Como sua assistente oficial, eu vasculho continuamente o Google Maps local e as redes sociais em busca de novos parceiros show de bola em Manaus para te apresentar!
                  </p>
                </div>

                <div className="grid gap-3">
                  {candidates.filter(c => c.status !== "confirmado").length === 0 && (
                    <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400 text-xs italic">
                      Nenhum estabelecimento pendente de aprovação encontrado no momento. Os agentes IA continuam monitorando a web em ritmo contínuo.
                    </div>
                  )}
                  {candidates.filter(c => c.status !== "confirmado").map(cand => (
                    <div key={cand.id} className="bg-white rounded-2xl border p-4 flex justify-between items-center shadow-sm transition-all hover:border-manaus-orange/30">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-slate-800">{cand.nome}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {cand.origem}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            cand.status === "novo" ? "bg-cyan-50 text-cyan-700 border border-cyan-100" : "bg-orange-50 text-orange-700 border border-orange-100"
                          }`}>
                            {cand.status === "novo" ? "Aguardando Convite" : "Convidado (WhatsApp Enviado)"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex gap-4 items-center">
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {cand.endereco} ({cand.bairro})</span>
                          <span className="flex items-center gap-1"><Smartphone size={12} className="text-slate-400" /> {cand.telefone}</span>
                          <span className="flex items-center gap-1"><Building2 size={12} className="text-slate-400" /> {cand.categoria}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {cand.status === "novo" ? (
                          <button
                            onClick={() => onInviteCandidate(cand.id)}
                            className="bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
                          >
                            <Send size={12} /> Enviar Convite
                          </button>
                        ) : (
                          <button
                            disabled
                            className="bg-orange-100 text-orange-600 border border-orange-200 text-[10px] font-bold px-4 py-2 rounded-xl flex items-center gap-2"
                          >
                            <Check size={12} /> Convidado
                          </button>
                        )}
                        
                        <button
                          onClick={() => onConfirmCandidate(cand.id)}
                          className="bg-manaus-orange hover:bg-manaus-orange-hover text-white text-[10px] font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 shadow-orange-500/20"
                        >
                          <CheckSquare size={12} /> Publicar Agora
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        {/* TABS: VERIFICATION LOGS */}
        {adminTab === "verification" && (
          currentRole === "restaurante" ? (
            <div className="bg-white rounded-xl border p-8 text-center max-w-2xl mx-auto space-y-4 shadow-sm my-6">
              <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                <Lock size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Coesão de Dados Restrita</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-normal">
                  Divergências de telefones e endereços gerais captadas pelo <strong>Agente Verificador IA</strong> são gerenciadas pela moderação do portal. Lojistas acompanham alertas automatizados por notificações privadas de WhatsApp.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl">
              <div className="bg-white rounded-xl border p-4 space-y-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  🔎 Tainá – Auditoria de Coesão de Dados
                </h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Eu fico de olho se os telefones ou endereços de Manaus mudaram na internet. Se eu achar algo diferente, te aviso na hora pra gente deixar tudo certinho pro cliente!
                </p>
              </div>

              <div className="grid gap-2.5">
                {logs.filter(l => l.status === "pendente").map(log => (
                  <div key={log.id} className="bg-white rounded-xl border p-3 flex justify-between items-center shadow-sm border-l-4 border-l-amber-500">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">{log.restaurant_nome}</span>
                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                          CAMPO: {log.campo}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 flex flex-col gap-0.5">
                        <span>Anterior: <strong className="text-slate-400 font-mono italic">{log.valor_antigo}</strong></span>
                        <span>Encontrado na Web hoje: <strong className="text-emerald-600 font-mono font-bold align-middle">{log.valor_novo}</strong></span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onResolveLog(log.id, false)}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Rejeitar (Manter Anterior)
                      </button>
                      <button
                        onClick={() => onResolveLog(log.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Check size={11} /> Aprovar Atualização IA
                      </button>
                    </div>
                  </div>
                ))}

                {logs.filter(l => l.status === "pendente").length === 0 && (
                  <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-xs italic">
                    Excelente! Nenhum log de discrepância pendente. Todos os estabelecimentos de Manaus estão com dados verificados.
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* TABS: ADD / REGISTER NEW RESTAURANT AND PRODUCT */}
        {adminTab === "add_restaurant" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {isOnboardingOpen && <OnboardingAgent onClose={() => setIsOnboardingOpen(false)} />}
            
            {currentRole !== "restaurante" && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <h3 className="font-bold text-amber-900 flex items-center gap-2">
                    <Sparkles size={18} />
                    Agilizar Onboarding de Parceiros
                  </h3>
                  <p className="text-xs text-amber-700">Use o nosso Agente 9 IA para cadastrar um restaurante automaticamente conversando via Chatbot do sistema.</p>
                </div>
                <button 
                  onClick={() => setIsOnboardingOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-200 transition-all active:scale-95"
                >
                  <Sparkles size={14} /> Iniciar Onboarding IA
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form adding restaurant - Hidden for regular restaurants */}
              {currentRole !== "restaurante" ? (
                <div className="bg-white rounded-[24px] border border-slate-200 p-6 space-y-6 shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-800 flex items-center gap-2">
                    <PlusCircle size={18} className="text-manaus-orange" />
                    Novo Estabelecimento
                  </h3>
                  <form onSubmit={handleCreateRest} className="space-y-4">
                    
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">Nome Fantasia:</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Peixaria do Japiim"
                        value={newRestName}
                        onChange={(e) => setNewRestName(e.target.value)}
                        required
                        className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/20 transition-all font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">Categoria:</label>
                        <select
                          value={newRestCat}
                          onChange={(e) => setNewRestCat(e.target.value as any)}
                          className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/20 transition-all font-medium appearance-none"
                        >
                          {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">Plano Comercial:</label>
                        <select
                          value={newRestPlano}
                          onChange={(e) => setNewRestPlano(e.target.value as any)}
                          className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/20 transition-all font-medium appearance-none"
                        >
                          <option value="basico">Básico</option>
                          <option value="destaque">Destaque</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">Descrição curta:</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Assado de costela e vinhos locais..."
                        value={newRestDesc}
                        onChange={(e) => setNewRestDesc(e.target.value)}
                        className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/20 transition-all font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">WhatsApp:</label>
                        <input 
                          type="text" 
                          placeholder="92980000000"
                          value={newRestWhatsapp}
                          onChange={(e) => setNewRestWhatsapp(e.target.value)}
                          required
                          className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/20 transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">Bairro:</label>
                        <select
                          value={newRestBairro}
                          onChange={(e) => setNewRestBairro(e.target.value)}
                          className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/20 transition-all font-medium appearance-none"
                        >
                          <option value="Adrianópolis">Adrianópolis</option>
                          <option value="Vieiralves">Vieiralves</option>
                          <option value="Centro">Centro</option>
                          <option value="Parque 10">Parque 10</option>
                          <option value="Aleixo">Aleixo</option>
                          <option value="Japiim">Japiim</option>
                          <option value="Ponta Negra">Ponta Negra</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-4 rounded-[20px] transition-all shadow-xl shadow-slate-200 active:scale-95 uppercase tracking-widest"
                    >
                      Publicar Lojista Ativo
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-[24px] border border-slate-200 p-8 space-y-6 shadow-sm flex flex-col items-center text-center justify-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-2">
                    <Building2 size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-800">
                      Painel do Lojista Parceiro
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm leading-relaxed font-medium">
                      Opa! Tudo bom, <strong>{restaurants.find(r => r.id === activeRestaurantId)?.nome}</strong>? 😄 Eu sou a Tainá e tô aqui pra te ajudar com o teu cardápio e teus clientes!
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Status</span>
                      <span className="text-xs font-bold text-emerald-600">Loja Verificada</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Plano</span>
                      <span className="text-xs font-bold text-[#FF6B35] capitalize">
                        {restaurants.find(r => r.id === activeRestaurantId)?.plano || "Básico"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form manual add product */}
              <div className="bg-white rounded-[24px] border border-slate-200 p-6 space-y-6 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-800 flex items-center gap-2">
                  <PlusCircle size={18} className="text-[#FF6B35]" />
                  Novo Item no Cardápio
                </h3>
                <form onSubmit={handleManualAddProduct} className="space-y-4">
                  
                  {currentRole !== "restaurante" && (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">Restaurante Alvo:</label>
                      <select
                        value={selectedManualRestId}
                        onChange={(e) => setSelectedManualRestId(e.target.value)}
                        required
                        className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none appearance-none font-medium"
                      >
                        <option value="">-- Selecione o Parceiro --</option>
                        {restaurants.map(r => (
                          <option key={r.id} value={r.id}>{r.nome} ({r.bairro})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">Nome do Item:</label>
                    <input 
                      type="text" 
                      placeholder="Ex: X-Caboquinho Tradicional"
                      value={manualProdName}
                      onChange={(e) => setManualProdName(e.target.value)}
                      required
                      className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">Preço (R$):</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="18.50"
                        value={manualProdPrice}
                        onChange={(e) => setManualProdPrice(e.target.value)}
                        required
                        className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">Seção:</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Lanches"
                        value={manualProdCat}
                        onChange={(e) => setManualProdCat(e.target.value)}
                        className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">Descrição:</label>
                    <textarea 
                      placeholder="Pão francês, tucumã, banana frita e queijo coalho..."
                      value={manualProdDesc}
                      onChange={(e) => setManualProdDesc(e.target.value)}
                      className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none h-20 resize-none font-medium"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-[#FF6B35] hover:bg-[#e05a2b] text-white font-black text-xs py-4 rounded-[20px] transition-all shadow-xl shadow-orange-100 active:scale-95 uppercase tracking-widest"
                  >
                    Confirmar e Publicar Prato
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TABS: AGENT 3 CARDÁPIO EXTRACTOR */}
        {adminTab === "ocr_menu" && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-white rounded-xl border p-4 space-y-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                📸 Agente 03 – Cardápio Facilitado / Extrator de Menu IA
              </h3>
              <p className="text-xs text-slate-500 leading-normal">
                Nosso Agente Inteligente lê fotos corporativas de lousas, folhetos de papel, PDFs de cardápios ou texto copiado, extrai todas as informações de pratos, preços e descrições, estruturando os dados de forma instantânea em listas do banco de dados!
              </p>
            </div>

            <div className="grid grid-cols-5 gap-6">
              {/* Actions left fields */}
              <div className="col-span-3 space-y-4">
                <div className="bg-white rounded-xl border p-4 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Selecione o Restaurante de Destino:</label>
                    <select
                      value={selectedRestOcrId}
                      onChange={(e) => setSelectedRestOcrId(e.target.value)}
                      required
                      className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:outline-none"
                    >
                      <option value="">-- Escolha o estabelecimento --</option>
                      {restaurants.map(r => (
                        <option key={r.id} value={r.id}>{r.nome} ({r.bairro})</option>
                      ))}
                    </select>
                  </div>

                  {/* Drag and drop block */}
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative"
                  >
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadCloud size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Arraste ou Clique para enviar Foto ou PDF do Cardápio</p>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG ou PDF de até 5MB</p>
                    {ocrFileName && (
                      <div className="mt-3 p-1.5 bg-orange-50 border border-orange-100 rounded text-[10px] text-manaus-orange font-mono font-bold inline-block">
                        Arquivo carregado: {ocrFileName}
                      </div>
                    )}
                  </div>

                  {/* Text Alternative area */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Alternativa: Digite ou cole o texto desestruturado</label>
                    <textarea 
                      placeholder="Ex: Pastel de queijo R$ 10, X-Salada 15 reais, Tambaqui frito na hora preço cinquentões"
                      value={ocrText}
                      onChange={(e) => setOcrText(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:outline-none h-24 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleRunOcr}
                    disabled={isProcessingOcr}
                    className="w-full bg-manaus-orange hover:bg-manaus-orange-hover text-white text-xs font-bold py-2.5 rounded-lg transition-transform flex items-center justify-center gap-2"
                  >
                    {isProcessingOcr ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Processando OCR Inteligente via Gemini...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Converter Cardápio usando IA
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status and extracted items preview */}
              <div className="col-span-2 space-y-4">
                <div className="bg-[#0F172A] text-slate-300 rounded-xl p-4 space-y-3 shadow-md min-h-[300px]">
                  <h4 className="text-xs font-bold text-white border-b border-slate-800 pb-1 flex items-center gap-1.5">
                    📺 Logs da Execução (Agente 03)
                  </h4>
                  
                  {isProcessingOcr && (
                    <div className="space-y-2 py-4 animate-pulse">
                      <div className="h-2 bg-slate-800 rounded w-3/4"></div>
                      <div className="h-2 bg-slate-800 rounded w-1/2"></div>
                      <div className="h-2 bg-slate-800 rounded w-5/6"></div>
                      <p className="text-[10px] text-slate-500 font-mono">Extraindo textos com Gemini 3.5-flash...</p>
                    </div>
                  )}

                  {!isProcessingOcr && ocrCompletedItems.length === 0 && !isDoneProcessingMessage && (
                    <p className="text-[10px] text-slate-500 italic pt-6">Nenhum log de varredura ou extração ativo agora. Envie um arquivo ou insira dados livres à esquerda para iniciar a transcrição.</p>
                  )}

                  {isDoneProcessingMessage && (
                    <div className="p-2.5 bg-slate-800 rounded border border-slate-700 space-y-2">
                      <p className="text-[10px] text-emerald-400 font-bold font-mono">✔ {isDoneProcessingMessage}</p>
                      <div className="space-y-1">
                        <span className="text-[8.5px] font-semibold text-slate-400">ITENS ESTRUTURADOS E SALVOS NO MENU:</span>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                          {ocrCompletedItems.map((it, idx) => (
                            <div key={idx} className="p-1.5 bg-slate-900 rounded border border-slate-800 text-[10px] flex justify-between font-mono">
                              <span>{it.nome}</span>
                              <span className="text-[#FF6B35]">R$ {Number(it.preco).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS: LEADS STATISTICS TABLE & CHARTS */}
        {adminTab === "leads" && (
          currentRole === "moderador" || currentRole === "suporte" ? (
            <div className="bg-white rounded-xl border p-8 text-center max-w-2xl mx-auto space-y-4 shadow-sm my-6">
              <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                <Lock size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Acesso Financeiro Restrito</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-normal">
                  Como Moderador, seu perfil possui privilégios operacionais de aprovação e curadoria de dados. Demonstrativos de faturamento de assinaturas e métricas do conglomerado AmazFood exigem credenciais administradas pelo <strong>Super Administrador</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl">
              {/* Cards stats header */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Geral Views</span>
                    <p className="text-2xl font-bold font-mono text-slate-800">
                      {restaurants
                        .filter(r => currentRole !== "restaurante" || r.id === activeRestaurantId)
                        .reduce((acc, curr) => acc + (curr.views || 0), 0)}
                    </p>
                  </div>
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <TrendingUp size={20} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliques no WhatsApp</span>
                    <p className="text-2xl font-bold font-mono text-slate-800">
                      {restaurants
                        .filter(r => currentRole !== "restaurante" || r.id === activeRestaurantId)
                        .reduce((acc, curr) => acc + (curr.clicks || 0), 0)}
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Smartphone size={18} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contatos Destaque</span>
                    <p className="text-2xl font-bold font-mono text-[#FF6B35]">
                      {restaurants
                        .filter(r => currentRole !== "restaurante" || r.id === activeRestaurantId)
                        .filter(r => r.plano !== 'basico')
                        .reduce((acc, curr) => acc + (curr.clicks || 0), 0)}
                    </p>
                  </div>
                  <div className="p-2.5 bg-orange-50 text-[#FF6B35] rounded-lg">
                    <Sparkles size={18} />
                  </div>
                </div>

                {/* New Admin Billing Metric */}
                <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between border-l-4 border-l-amber-500">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faturamento Est.</span>
                    <p className="text-xl font-bold font-mono text-slate-850">
                      {currentRole === "restaurante" ? (
                        <span>
                          R$ {
                            restaurants.find(r => r.id === activeRestaurantId)?.plano === "premium" ? "99,00" :
                            restaurants.find(r => r.id === activeRestaurantId)?.plano === "destaque" ? "49,00" : "0,00"
                          }/mês
                        </span>
                      ) : (
                        <span>
                          R$ {
                            restaurants.reduce((acc, curr) => {
                              const value = curr.plano === "premium" ? 99 : curr.plano === "destaque" ? 49 : 0;
                              return acc + value;
                            }, 0)
                          },00
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold uppercase font-mono">
                    ASSINAT
                  </div>
                </div>
              </div>

              {/* List lead rankings */}
              <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    {currentRole === "restaurante" ? "Seu Desempenho no AmazFood" : "Desempenho por Estabelecimento (Fase MVP Destaques)"}
                  </h4>
                  {currentRole === "super_admin" && (
                    <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 font-bold px-2 py-0.5 rounded font-mono uppercase">
                      Chave Mestre Necessária p/ Exclusões
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-100">
                  {restaurants
                    .filter(rest => currentRole !== "restaurante" || rest.id === activeRestaurantId)
                    .map(rest => (
                      <div key={rest.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs text-slate-800">{rest.nome}</span>
                            <span className="text-[9.5px] text-slate-400 font-mono">ID: {rest.id}</span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            📍 Bairro: {rest.bairro} | Menu ativo com <strong>{products.filter(p => p.restaurant_id === rest.id).length}</strong> produtos
                          </p>
                          
                          {/* ADMINISTRATIVE ACTIONS CRITICAL CONTROLS FOR SUPER ADMIN */}
                          {currentRole === "super_admin" && (
                            <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-dashed border-slate-100">
                              <button 
                                onClick={() => {
                                  onTriggerMasterKey(() => {
                                    if (onDeleteRestaurant) {
                                      onDeleteRestaurant(rest.id);
                                      onAddAuditLog(`REMOVIDO: Restaurante [${rest.nome}] excluído definitivamente via Chave Mestre`, "perigo");
                                    }
                                  }, `Deletar definitivamente o estabelecimento [${rest.nome}] e todo o seu catálogo do banco de dados`);
                                }}
                                className="text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 px-2.5 py-1 rounded text-[9.5px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={11} /> Excluir Conta
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-4 text-xs font-mono shrink-0 md:self-center">
                          <div className="text-right">
                            <div className="text-slate-500 text-[9px] uppercase tracking-wider">Views</div>
                            <div className="font-bold text-slate-700">{rest.views || 0}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[#FF6B35] text-[9px] uppercase tracking-wider font-semibold">Leads (Zap)</div>
                            <div className="font-bold text-[#FF6B35]">{rest.clicks || 0}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )
        )}

        {/* TABS: FOOD VISION GENERAL WORKSPACE */}
        {adminTab === "food_vision" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            
            {/* Header / Brand Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Camera size={140} className="text-white" />
              </div>
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-manaus-orange/20 text-manaus-orange border border-manaus-orange/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Sua Assistente Tainá
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    🟢 Food Vision IA Ativo
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">Tainá: Visão Gastronômica</h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Eu cuido pra que o teu cardápio seja o mais bonito de Manaus! Com o meu sistema de visão, eu ajudo a gerar fotos atraentes que deixam qualquer um com água na boca, sempre respeitando a verdade do teu prato.
                </p>
              </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cobertura do Cardápio</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <p className="text-2xl font-bold font-mono text-slate-800">
                      {Math.round(
                        (products.filter(p => p.imagem || productImages.some(img => img.product_id === p.id && img.approved)).length /
                          (products.length || 1)) *
                          100
                      )}%
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">100% meta</span>
                  </div>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckSquare size={20} />
                </div>
              </div>

              <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Nível A (Fidelidade Máxima)</span>
                  <p className="text-2xl font-bold font-mono text-slate-800 mt-1">
                    {productImages.filter(img => img.source === "restaurant" && img.approved).length} fotos
                  </p>
                </div>
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg font-bold text-xs font-mono">
                  100%
                </div>
              </div>

              <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Economia Estimada</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="text-2xl font-bold font-mono text-orange-600">
                      R$ {(products.filter(p => productImages.some(img => img.product_id === p.id && img.approved)).length * 150).toFixed(0)}
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono">vs estúdio</span>
                  </div>
                </div>
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
                  <TrendingUp size={20} />
                </div>
              </div>

              <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selo da Credibilidade IA</span>
                  <div className="flex gap-1 mt-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">Nível A</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">Nível B</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[9px] font-bold">Nível C</span>
                  </div>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Eye size={20} />
                </div>
              </div>
            </div>

            {/* Split layout: Selector vs Details/Configs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left column (7 cols): List of products */}
              <div className="lg:col-span-7 bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Catálogo Gourmet de Produtos</h3>
                    <p className="text-xs text-slate-500">Selecione para simular o Food Vision ou alterar imagens</p>
                  </div>
                  
                  {/* Filter tabs */}
                  <div className="flex gap-1 self-start sm:self-center">
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value as any)}
                      className="bg-white border border-slate-200 text-xs rounded px-2 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-manaus-orange"
                    >
                      <option value="all">Filtrar Todos</option>
                      <option value="restaurant">Nível A: Restaurante</option>
                      <option value="internet">Nível B: Busca IA</option>
                      <option value="ai_generated">Nível C: Gerado por IA</option>
                      <option value="missing">Sem Imagem</option>
                    </select>
                  </div>
                </div>

                <div className="divide-y max-h-[500px] overflow-y-auto no-scrollbar">
                  {products
                    .filter(prod => {
                      if (currentRole === "restaurante" && prod.restaurant_id !== activeRestaurantId) {
                        return false;
                      }
                      
                      const imgs = productImages.filter(img => img.product_id === prod.id);
                      const hasActiveImg = imgs.find(img => img.approved);
                      
                      if (filterLevel === "all") return true;
                      if (filterLevel === "missing") return !prod.imagem && !hasActiveImg;
                      if (filterLevel === "restaurant") return hasActiveImg?.source === "restaurant";
                      if (filterLevel === "internet") return hasActiveImg?.source === "internet";
                      if (filterLevel === "ai_generated") return hasActiveImg?.source === "ai_generated";
                      return true;
                    })
                    .map((prod) => {
                      const imgs = productImages.filter(img => img.product_id === prod.id);
                      const activeImg = imgs.find(img => img.approved);
                      const rest = restaurants.find(r => r.id === prod.restaurant_id);

                      return (
                        <div 
                          key={prod.id}
                          className={`p-3.5 flex items-center justify-between gap-4 transition-all hover:bg-slate-50 ${
                            visionSelectedProductId === prod.id ? "bg-orange-50/50 border-l-4 border-l-manaus-orange pl-2.5" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border overflow-hidden flex-shrink-0 relative">
                              {activeImg?.image_url || prod.imagem ? (
                                <img
                                  src={activeImg?.image_url || prod.imagem}
                                  alt={prod.nome}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold bg-slate-50">
                                  N/A
                                </div>
                              )}
                            </div>

                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-slate-700">{prod.nome}</h4>
                              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                                {rest?.nome || "Carregando..."} • {prod.categoria}
                              </p>
                              
                              <div className="flex items-center gap-1.5 mt-1">
                                {activeImg ? (
                                  activeImg.source === "restaurant" ? (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200/80 text-[8px] font-bold text-emerald-700 flex items-center gap-1">
                                      🛡️ Nível A (100% Original)
                                    </span>
                                  ) : activeImg.source === "internet" ? (
                                    <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200/80 text-[8px] font-bold text-sky-700 flex items-center gap-1">
                                      🔍 Nível B (80% Busca IA)
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200/80 text-[8px] font-bold text-purple-700 flex items-center gap-1">
                                      🤖 Nível C (60% IA Gerada)
                                    </span>
                                  )
                                ) : prod.imagem ? (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200/80 text-[8px] font-mono text-slate-600">
                                    ✓ Legado
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-100 text-[8.5px] font-bold text-rose-500 font-mono">
                                    ⚠️ Sem Foto
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => {
                                setVisionSelectedProductId(prod.id);
                                const currentActive = productImages.find(img => img.product_id === prod.id && img.approved);
                                if (currentActive) {
                                  setSimulatedImageUrl(currentActive.image_url);
                                  setSimulatedSource(currentActive.source);
                                  setSimulatedConfidence(currentActive.confidence);
                                  setImagePromptOutput(`Foto ativa do banco de dados ID: ${currentActive.id} com nível de confiabilidade de ${currentActive.confidence}%`);
                                  setVisionLogs([`🟢 Exibindo imagem ativa cadastrada no banco unificado de dados para o produto [${prod.nome}]`]);
                                } else {
                                  setSimulatedImageUrl("");
                                  setVisionLogs([]);
                                  setImagePromptOutput("");
                                }
                              }}
                              className="text-[10px] text-slate-500 font-bold bg-slate-100 border px-2 py-1 rounded hover:bg-slate-200"
                            >
                              Ver
                            </button>
                            <button
                              disabled={visionGeneratingId === prod.id}
                              onClick={() => handleRunFoodVision(prod)}
                              className={`text-[10px] text-white font-bold bg-[#FF6B35] px-2.5 py-1 rounded shadow-sm hover:bg-[#e05a2b] flex items-center gap-1.5 ${
                                visionGeneratingId === prod.id ? "opacity-60 cursor-not-allowed" : ""
                              }`}
                            >
                              {visionGeneratingId === prod.id ? (
                                <>
                                  <RefreshCw size={10} className="animate-spin" />
                                  Rodando...
                                </>
                              ) : (
                                <>
                                  <Sparkles size={10} />
                                  Rodar IA
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right column: Interactive Console + Business Strategy Rules */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* INTERACTIVE WORKSPACE */}
                <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                  <div className="border-b pb-2 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-manaus-orange" />
                      Área Operacional Agente 7
                    </h4>
                    {visionSelectedProductId && (
                      <button 
                        onClick={() => {
                          setVisionSelectedProductId("");
                          setSimulatedImageUrl("");
                          setImagePromptOutput("");
                          setVisionLogs([]);
                        }}
                        className="text-[10px] text-slate-400 font-bold hover:text-slate-600"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {visionSelectedProductId ? (
                    <div className="space-y-4">
                      {/* Terminal logs block */}
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-[10.5px] text-[#A5B4FC] space-y-1.5 select-none h-44 overflow-y-auto no-scrollbar shadow-inner">
                        <div className="text-slate-500 border-b border-slate-800 pb-1 flex justify-between">
                          <span>$ food-vision-agent --verbose</span>
                          <span className="text-[9px] bg-slate-800 px-1.5 rounded text-[#818CF8]">LIVE LOG</span>
                        </div>
                        {visionLogs.length > 0 ? (
                          visionLogs.map((log, idx) => (
                            <div key={idx} className="leading-snug">
                              {log}
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 italic py-8 text-center font-sans">
                            Clique em "Rodar IA" no catálogo para iniciar a simulação operacional do Agente 7.
                          </div>
                        )}
                        {visionGeneratingId && (
                          <div className="flex items-center gap-1.5 text-manaus-orange text-[10px] font-bold animate-pulse mt-1">
                            <span>●</span> Processando camadas profundas de credibilidade do prato...
                          </div>
                        )}
                      </div>

                      {/* Simulated Result Box */}
                      {simulatedImageUrl && (
                        <div className="border rounded-xl overflow-hidden p-3 bg-slate-50 space-y-3 shadow-inner">
                          <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 font-sans">Resultado da Análise</label>
                          
                          {/* Image preview frame with label indicator */}
                          <div className="aspect-[4/3] rounded-lg border bg-white overflow-hidden relative shadow-sm max-w-sm mx-auto">
                            <img
                              src={simulatedImageUrl}
                              alt="Generated Preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            
                            <div className="absolute top-2 right-2 bg-slate-900/95 text-white text-[9px] font-bold px-2 py-1 rounded shadow-md border border-slate-700 flex flex-col items-end gap-0.5">
                              <span>Selo de Validade</span>
                              <span className={`text-[10px] uppercase ${
                                simulatedSource === "restaurant" ? "text-emerald-400" : simulatedSource === "internet" ? "text-sky-400" : "text-purple-400"
                              }`}>
                                {simulatedSource === "restaurant" ? "Nível A (100%)" : simulatedSource === "internet" ? "Nível B (80%)" : "Nível C (60%)"}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white p-2.5 rounded border text-[10px] text-slate-600 leading-normal italic font-serif">
                            "{imagePromptOutput}"
                          </div>

                          {/* Approval Controls */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const existingImg = productImages.find(img => img.image_url === simulatedImageUrl && img.product_id === visionSelectedProductId);
                                if (existingImg) {
                                  handleApproveImage(existingImg.id, visionSelectedProductId, true);
                                } else {
                                  fetch("/api/product-images", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      product_id: visionSelectedProductId,
                                      image_url: simulatedImageUrl,
                                      source: simulatedSource,
                                      confidence: simulatedConfidence,
                                      approved: true
                                    })
                                  }).then(async (res) => {
                                    if (onRefreshImages) onRefreshImages();
                                    const p = products.find(prodItem => prodItem.id === visionSelectedProductId);
                                    onAddAuditLog(`Vinculou imagem gastronômica aprovada do Food Vision para [${p?.nome}]`, "sucesso");
                                    alert("Sucesso! Imagem vinculada e salva no banco de dados.");
                                    setVisionSelectedProductId("");
                                    setSimulatedImageUrl("");
                                  });
                                }
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-all shadow shadow-emerald-700/20 text-center"
                            >
                              ✓ Aprovar & Publicar
                            </button>
                            <button
                              onClick={() => {
                                alert("Imagem descartada.");
                                setSimulatedImageUrl("");
                                setVisionSelectedProductId("");
                                setImagePromptOutput("");
                              }}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition-all"
                            >
                              Descartar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-2 text-slate-400">
                      <Camera size={32} className="mx-auto text-slate-300 animate-pulse" />
                      <p className="text-xs font-semibold">Nenhum Produto Selecionado na Fila</p>
                      <p className="text-[10px] max-w-[240px] mx-auto text-slate-400">
                        Selecione um prato na lista à esquerda para analisar a integridade visual, gerar mídias automáticas ou auditar fotos existentes.
                      </p>
                    </div>
                  )}
                </div>

                {/* PREMIUM VALUE RULES & MONETIZATION */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-5 text-white space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-manaus-orange flex items-center gap-1.5">
                      <TrendingUp size={14} />
                      Configurações Premium do Sistema
                    </h4>
                  </div>

                  {/* Top 100 prioritization switch */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-slate-200 font-sans">Mitigação de Custos IA</label>
                        <p className="text-[10px] text-slate-400">Gera imagens prioritariamente nos itens mais visualizados.</p>
                      </div>
                      <button
                        onClick={() => setPrioritizePopular(!prioritizePopular)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors relative flex items-center ${
                          prioritizePopular ? "bg-manaus-orange justify-end" : "bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                      </button>
                    </div>
                  </div>

                  {/* Premium subscription slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold font-sans">
                      <span className="text-slate-200">Mensalidade Cobrada:</span>
                      <span className="text-manaus-orange font-mono">R$ {pricingTier} /mês</span>
                    </div>
                    <input
                      type="range"
                      min="49"
                      max="199"
                      value={pricingTier}
                      onChange={(e) => setPricingTier(Number(e.target.value))}
                      className="w-full accent-[#FF6B35] bg-slate-800"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>Plano Básico (R$49)</span>
                      <span>Plano Avançado (R$199)</span>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-3.5 border border-slate-800 text-[11px] leading-relaxed space-y-1 text-slate-300">
                      <div className="font-semibold text-white flex justify-between border-b border-slate-800 pb-1 mb-1">
                        <span>Receita Recorrente Extra:</span>
                        <span className="text-emerald-400 font-mono">
                          R$ {(restaurants.filter(r => r.plano === "premium").length * pricingTier).toFixed(2)} /mês
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        *Estimado com base em <strong className="text-white font-mono">{restaurants.filter(r => r.plano === "premium").length} estabelecimentos</strong> atualmente assinantes do plano Premium no AmazFood.
                      </p>
                    </div>
                  </div>

                  {/* Trust system reminder list */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">Selo de Proteção & Resguardo de Identidade</span>
                    <ul className="text-[10.5px] text-slate-400 space-y-1.5 list-disc list-inside leading-snug">
                      <li>Sempre exibe a foto original real enviada pela loja com prioridade absoluta (100% fidedigno).</li>
                      <li>Imagens criadas pelo Food Vision IA recebem o selo correspondente para não causar falsas expectativas ao consumidor final na cuia.</li>
                      <li>Dona de loja pode requerer auditoria e substituir por fotos reais a qualquer instante.</li>
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
