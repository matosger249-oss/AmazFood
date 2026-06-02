import React from 'react';
import { X, ChefHat, MapPin, Smartphone } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-slate-800">Conheça o AmazFood</h3>
          <p className="text-xs text-slate-500">Conectando Manaus através da Gastronomia Local</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-xl bg-slate-50">
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><ChefHat size={16} className="text-manaus-orange"/> Para Proprietários</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transforme seu restaurante em um player digital local. Obtenha leads diretos via WhatsApp (o método favorito do manauara), sem taxas abusivas de entrega. Aumente sua visibilidade em bairros estratégicos e gerencie seu negócio de forma ágil.
              </p>
            </div>
            <div className="p-4 border rounded-xl bg-slate-50">
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><MapPin size={16} className="text-emerald-600"/> Para Clientes</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Encontre o melhor da comida local sem complicações. Explore cardápios, compare preços e faça pedidos rápidos e direto no WhatsApp dos seus lugares favoritos, economizando tempo e evitando erros.
              </p>
            </div>
          </div>
          
          <div className="p-4 border rounded-xl bg-amber-50 border-amber-100">
            <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><Smartphone size={16}/> A Nossa Proposta</h4>
            <p className="text-xs text-amber-900 leading-relaxed">
              O AmazFood nasceu para centralizar a gastronomia de Manaus com tecnologia prática e direta. Nossa missão é democratizar a presença digital para negócios locais, conectando a fome dos clientes à agilidade dos melhores restaurantes da cidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
