import React, { useState } from "react";
import { Sparkles, Building2, Smartphone, TrendingUp, HelpCircle, MapPin } from "lucide-react";
import OnboardingAgent from "./OnboardingAgent.tsx";

interface RegistrationPanelProps {
  onAddRestaurant: (newRest: any) => void;
  onAddAuditLog: (acao: string, nivel?: "sucesso" | "alerta" | "perigo") => void;
}

export default function RegistrationPanel({ onAddRestaurant, onAddAuditLog }: RegistrationPanelProps) {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [newRestName, setNewRestName] = useState("");
  const [newRestCat, setNewRestCat] = useState<string>("Restaurante");
  const [newRestDesc, setNewRestDesc] = useState("");
  const [newRestWhatsapp, setNewRestWhatsapp] = useState("");
  const [newRestAddress, setNewRestAddress] = useState("");
  const [newRestBairro, setNewRestBairro] = useState("Adrianópolis");

  const neighborhoods = [
    "Adrianópolis", "Aleixo", "Centro", "Cidade Nova", "Compensa", 
    "Coroado", "Japiim", "Jorge Teixeira", "Parque 10", "Ponta Negra", "São José", "Vieiralves"
  ];

  const categories = ["Restaurante", "Lanchonete", "Pizzaria", "Açaíteria", "Cafeteria", "Marmitaria", "Doceria"];

  const handleCreateRest = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRestName || !newRestWhatsapp) {
      alert("Por favor, preencha o nome e o whatsapp.");
      return;
    }

    const payload = {
      nome: newRestName,
      categoria: newRestCat,
      descricao: newRestDesc,
      whatsapp: newRestWhatsapp.replace(/\D/g, ""),
      email: `${newRestName.toLowerCase().replace(/\s+/g, "")}@exemplo.com`,
      endereco: newRestAddress,
      bairro: newRestBairro,
      plano: "basico",
      horario_funcionamento: "11:00 às 22:00"
    };

    onAddRestaurant(payload);
    onAddAuditLog(`Auto-cadastro de novo parceiro: ${newRestName} (${newRestBairro})`, "sucesso");
    
    setNewRestName("");
    setNewRestDesc("");
    setNewRestWhatsapp("");
    setNewRestAddress("");
    alert(`Parabéns! Sua solicitação para '${payload.nome}' foi enviada com sucesso. Nossa equipe entrará em contato!`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full bg-[#F0F2F5]">
      <div className="flex-1 p-6 md:p-12 overflow-y-auto no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          {/* Welcoming Header */}
          <div className="bg-slate-900 rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10">
              <Building2 size={300} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-manaus-orange/20 border border-manaus-orange/30 rounded-full">
                <Sparkles size={14} className="text-manaus-orange" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-manaus-orange">Seja um Parceiro AmazFood</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight max-w-2xl">
                Traga seu restaurante para a maior vitrine gastronômica de <span className="text-manaus-orange">Manaus.</span>
              </h2>
              <p className="text-slate-300 text-sm md:text-base max-w-xl leading-relaxed">
                Eu sou a Tainá, sua assistente IA. Estou aqui para te ajudar a cadastrar seu cardápio, atrair clientes e gerenciar suas vendas.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  onClick={() => setIsOnboardingOpen(true)}
                  className="bg-manaus-orange hover:bg-manaus-orange-hover text-white font-black text-sm py-4 px-8 rounded-2xl shadow-xl shadow-orange-500/30 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Sparkles size={18} /> Iniciar Onboarding com Tainá
                </button>
                <button 
                  onClick={() => {
                      const el = document.getElementById('manual-register');
                      el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-sm py-4 px-8 rounded-2xl border border-white/10 transition-all active:scale-95"
                >
                  Cadastro Manual
                </button>
              </div>
            </div>
          </div>

          {/* Benefits Row */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Mais Visibilidade</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Sua marca em destaque nos principais bairros de Manaus.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Smartphone size={20} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">WhatsApp Direto</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Receba pedidos diretamente no seu WhatsApp, sem intermediários.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">IA Gastronômica</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Deixe que a Tainá organize seu cardápio e gere fotos incríveis.</p>
            </div>
          </div>

          {/* Manual Registration Form section */}
          <div id="manual-register" className="bg-white rounded-[32px] border border-slate-200 p-8 md:p-10 shadow-sm space-y-8">
              <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Formulário de Cadastro</h3>
                  <p className="text-xs text-slate-500 font-medium">Preencha os dados básicos para a Tainá começar a te divulgar.</p>
              </div>

              <form onSubmit={handleCreateRest} className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome do Estabelecimento *</label>
                          <input 
                              type="text" 
                              placeholder="Ex: Peixaria do Porto"
                              value={newRestName}
                              onChange={(e) => setNewRestName(e.target.value)}
                              required
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/20 transition-all font-bold text-sm"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoria *</label>
                              <select
                                  value={newRestCat}
                                  onChange={(e) => setNewRestCat(e.target.value)}
                                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/20 transition-all font-bold text-sm appearance-none"
                              >
                                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Bairro *</label>
                              <select
                                  value={newRestBairro}
                                  onChange={(e) => setNewRestBairro(e.target.value)}
                                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/20 transition-all font-bold text-sm appearance-none"
                              >
                                  {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">WhatsApp de Contato *</label>
                          <input 
                              type="text" 
                              placeholder="92980000000"
                              value={newRestWhatsapp}
                              onChange={(e) => setNewRestWhatsapp(e.target.value)}
                              required
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/20 transition-all font-bold text-sm"
                          />
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Breve Descrição</label>
                          <textarea 
                              placeholder="Fale um pouco sobre sua especialidade..."
                              value={newRestDesc}
                              onChange={(e) => setNewRestDesc(e.target.value)}
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/20 transition-all font-bold text-sm h-[135px] resize-none"
                          />
                      </div>

                      <div className="pt-2">
                          <button 
                              type="submit" 
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-sm py-5 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95 uppercase tracking-widest"
                          >
                              Solicitar Cadastro
                          </button>
                      </div>
                  </div>
              </form>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <HelpCircle size={20} />
              </div>
              <div className="space-y-1">
                  <h5 className="text-sm font-bold text-blue-900">Já possui cadastro?</h5>
                  <p className="text-xs text-blue-700">Utilize o acesso restrito para gerenciar seus produtos e acompanhar seus pedidos.</p>
              </div>
          </div>
        </div>
      </div>

      {isOnboardingOpen && <OnboardingAgent onClose={() => setIsOnboardingOpen(false)} />}
    </div>
  );
}
