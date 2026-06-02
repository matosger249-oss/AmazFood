import React, { useState } from "react";
import { 
  Truck, MapPin, Navigation, DollarSign, Clock, Activity, 
  BarChart3, Globe, Settings, Bike, Search, CheckCircle, 
  AlertCircle, ChevronRight, User, PlusCircle, Filter
} from "lucide-react";

interface LogisticPanelProps {
  currentRole: string;
}

export default function LogisticPanel({ currentRole }: LogisticPanelProps) {
  const [activeTab, setActiveTab] = useState<"entregadores" | "rotas" | "cobertura" | "taxas" | "rastreamento">("entregadores");

  // Mock data for Logistic view
  const couriers = [
    { id: "1", nome: "João Silva", veiculo: "Moto", status: "online", pedidos: 12, rating: 4.8 },
    { id: "2", nome: "Maria Oliveira", veiculo: "Bicicleta", status: "online", pedidos: 8, rating: 4.9 },
    { id: "3", nome: "Pedro Santos", veiculo: "Moto", status: "ocupado", pedidos: 15, rating: 4.7 },
    { id: "4", nome: "Ana Costa", veiculo: "Moto", status: "offline", pedidos: 0, rating: 5.0 },
  ];

  if (currentRole !== "super_admin") {
    return (
      <div className="flex-1 p-8 bg-[#F0F2F5] flex flex-col items-center justify-center h-full">
        <div className="bg-white rounded-[32px] border p-12 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="mx-auto w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Acesso Negado</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Você não possui autorização para acessar esta área de Logística Estratégica.
            </p>
          </div>
          <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-600 leading-normal font-medium text-left">
            <p>A seção de logística é exclusiva para o <strong>SUPER_ADMIN</strong> do portal AmazFood.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full bg-[#F0F2F5]">
      {/* Logistics Header */}
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Truck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Logística <span className="text-manaus-orange">Estratégica</span>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 font-black rounded-lg border border-indigo-100 uppercase tracking-tight">Privado</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium tracking-tight">Gestão de Courier, Rotas e Cobertura Geográfica de Manaus</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">35 Entregadores Online</span>
          </div>
          <button className="bg-slate-900 text-white font-bold text-xs py-2.5 px-5 rounded-2xl flex items-center gap-2 shadow-lg shadow-slate-200 active:scale-95 transition-all">
             <PlusCircle size={14} className="text-manaus-orange" />
             Novo Entregador
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-8 flex overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: "entregadores", icon: User, label: "Entregadores" },
          { id: "rotas", icon: Navigation, label: "Rotas & Tráfego" },
          { id: "cobertura", icon: Globe, label: "Áreas Cobertas" },
          { id: "taxas", icon: DollarSign, label: "Config. de Frete" },
          { id: "rastreamento", icon: MapPin, label: "Rastreamento Live" },
        ].map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap font-bold text-[11px] uppercase tracking-widest ${
              activeTab === tab.id 
                ? "border-manaus-orange text-slate-900" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <tab.icon size={14} className={activeTab === tab.id ? "text-manaus-orange" : ""} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto no-scrollbar">
        {activeTab === "entregadores" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Couriers</span>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-900">142</span>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">+12 este mês</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregas Hoje</span>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-900">845</span>
                  <span className="text-[10px] font-bold text-manaus-orange bg-orange-50 px-2 py-0.5 rounded-lg">Pico as 20h</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Médio</span>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-900">22<span className="text-lg">min</span></span>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">-3min vs ontem</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa de Sucesso</span>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-900">99.2%</span>
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-black text-slate-900 tracking-tight">Tabela de Gerenciamento de Frotas</h3>
                  <div className="flex gap-2">
                     <div className="relative">
                        <input type="text" placeholder="Buscar por nome..." className="pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                     </div>
                     <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500"><Filter size={16}/></button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                       <th className="px-6 py-4">Courier</th>
                       <th className="px-6 py-4">Veículo</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4">Entregas (DIA)</th>
                       <th className="px-6 py-4">Avaliação</th>
                       <th className="px-6 py-4">Ações</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {couriers.map((courier) => (
                       <tr key={courier.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm">
                               {courier.nome.charAt(0)}
                             </div>
                             <div>
                               <p className="text-sm font-bold text-slate-900">{courier.nome}</p>
                               <p className="text-[10px] text-slate-500">ID: #{courier.id}MNA</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                             {courier.veiculo === "Moto" ? <Bike size={14} className="text-indigo-400" /> : <Globe size={14} className="text-emerald-400" />}
                             {courier.veiculo}
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tight ${
                             courier.status === "online" ? "bg-emerald-50 text-emerald-600" : 
                             courier.status === "ocupado" ? "bg-amber-50 text-amber-600" : 
                             "bg-slate-100 text-slate-500"
                           }`}>
                             {courier.status}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-sm font-bold text-slate-900">{courier.pedidos}</td>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-1">
                             <BarChart3 size={12} className="text-amber-500" />
                             <span className="text-xs font-bold text-slate-900">{courier.rating}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                            <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1"><ChevronRight size={18}/></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               <div className="p-4 bg-slate-50/50 text-center border-t">
                  <button className="text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Ver Todos 142 Entregadores</button>
               </div>
            </div>
          </div>
        )}

        {activeTab !== "entregadores" && (
           <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                 <Settings size={32} className="animate-spin-slow" />
              </div>
              <div className="text-center">
                 <h4 className="font-bold text-slate-900">Dashboard em Construção</h4>
                 <p className="text-xs text-slate-500 max-w-xs mx-auto">Esta seção estratégica está sendo sincronizada com o motor geoespacial do AmazFood em tempo real.</p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
