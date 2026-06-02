import React, { useState } from "react";
import { Sparkles, Loader2, CheckCircle, MapPin, Upload, Briefcase, Phone, MessageSquare } from "lucide-react";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  { id: 1, title: "Dados Básicos", description: "Nome, WhatsApp e Categoria" },
  { id: 2, title: "Endereço", description: "Localização no Mapa" },
  { id: 3, title: "Cardápio", description: "Upload/Link do Menu" },
  { id: 4, title: "Validação IA", description: "Revisão Final" }
];

export default function OnboardingAgent({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    whatsapp: "",
    categoria: "Restaurante",
    endereco: "",
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setCurrentStep((prev) => prev + 1);
      }, 1500); // Simula processamento IA
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-manaus-orange rounded-lg">
              <Sparkles size={20} className="text-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-black text-lg">Tainá — Assistente de Parceiros</h2>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest">AmazGo Automação Manauara</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">Fechar</button>
        </div>

        {/* Steps Progress */}
        <div className="flex border-b bg-slate-50">
          {steps.map((step) => (
            <div key={step.id} className={`flex-1 p-4 text-center ${currentStep === step.id ? 'bg-white border-b-2 border-manaus-orange' : ''}`}>
              <div className={`text-[10px] font-bold ${currentStep === step.id ? 'text-manaus-orange' : 'text-slate-400'}`}>Etapa {step.id}</div>
              <div className="text-xs font-bold text-slate-800">{step.title}</div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Opa, tudo bom? Bora começar! 😄</h3>
              <p className="text-sm text-slate-500">Eu sou a Tainá e vou te ajudar a cadastrar teu negócio rapidinho. Me fala os dados básicos:</p>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Nome do Estabelecimento" className="w-full p-3 border rounded-lg" onChange={(e) => setFormData({...formData, nome: e.target.value})} />
                <input type="text" placeholder="WhatsApp (9298...)" className="w-full p-3 border rounded-lg" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
              </div>
              <select className="w-full p-3 border rounded-lg" onChange={(e) => setFormData({...formData, categoria: e.target.value})}>
                <option>Restaurante</option>
                <option>Pizzaria</option>
                <option>Lanchonete</option>
                <option>Açaíteria</option>
              </select>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
              <Loader2 size={48} className="animate-spin text-manaus-orange mb-4" />
              <p className="font-bold">Só um minutinho que eu tô processando aqui... 😄</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={() => setCurrentStep(1)} className="px-6 py-2 text-slate-500 font-bold">Cancelar</button>
          <button onClick={handleNext} disabled={loading} className="px-6 py-2 bg-manaus-orange text-white rounded-lg font-bold flex items-center gap-2">
            {currentStep === 4 ? "Finalizar Cadastro" : "Próxima Etapa"}
          </button>
        </div>
      </div>
    </div>
  );
}
