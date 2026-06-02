import React from 'react';
import { Check, X } from 'lucide-react';

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlansModal({ isOpen, onClose }: PlansModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative">
        <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-slate-800">Escolha o plano do seu estabelecimento</h3>
          <p className="text-xs text-slate-400">Lance o portal de graça e escale o faturamento com destaque localizado</p>
        </div>

        <div className="p-6 grid grid-cols-3 gap-4">
          {/* Plano Básico */}
          <div className="border rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-800">Básico</h4>
            <div className="my-2">
              <span className="text-2xl font-bold">Grátis</span>
            </div>
            <ul className="space-y-2 text-[10px] text-slate-600">
              <li className="flex items-center gap-1"><Check size={12} className="text-emerald-500" /> Cadastro Simples</li>
              <li className="flex items-center gap-1"><Check size={12} className="text-emerald-500" /> Link Direto WhatsApp</li>
            </ul>
          </div>

          {/* Plano Destaque */}
          <div className="border rounded-xl p-4 space-y-3 bg-indigo-50 border-indigo-200">
            <h4 className="font-bold text-indigo-700">Destaque</h4>
            <div className="my-2">
              <span className="text-2xl font-bold">Disponível</span>
            </div>
            <ul className="space-y-2 text-[10px] text-indigo-600">
              <li className="flex items-center gap-1"><Check size={12} className="text-emerald-500" /> Destaque em Bairros</li>
              <li className="flex items-center gap-1"><Check size={12} className="text-emerald-500" /> Selo "Recomendado"</li>
            </ul>
          </div>

          {/* Plano Premium */}
          <div className="border rounded-xl p-4 space-y-3 bg-amber-50 border-amber-200">
            <h4 className="font-bold text-amber-700">Premium</h4>
            <div className="my-2">
              <span className="text-2xl font-bold">Disponível</span>
            </div>
            <ul className="space-y-2 text-[10px] text-amber-600">
              <li className="flex items-center gap-1"><Check size={12} className="text-amber-500" /> Página Personalizada</li>
              <li className="flex items-center gap-1"><Check size={12} className="text-amber-500" /> IA de Promoção Social</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end">
            <a 
              href="https://wa.me/5592993894216"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
            >
              Falar com Consultor
            </a>
        </div>
      </div>
    </div>
  );
}
