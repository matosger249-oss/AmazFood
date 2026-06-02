import React, { useState, useEffect } from "react";
import { Search, MapPin, MessageCircle, Star, Heart, Clock, Phone, Bookmark, Globe, ChevronRight, CornerDownRight, ThumbsUp, PlusCircle, Instagram, Facebook, Map as MapIcon, X, Building2, Sparkles } from "lucide-react";
import { Restaurant, Product, Promotion, Review, ProductImage } from "../types";

interface CustomerPanelProps {
  restaurants: Restaurant[];
  products: Product[];
  promotions: Promotion[];
  productImages?: ProductImage[];
  selectedRestaurantId: string | null;
  onSelectRestaurant: (id: string | null) => void;
  onRecordLead: (restaurantId: string, origem: 'whatsapp_click' | 'view_menu' | 'restaurant_view') => void;
  onOpenPlans: () => void;
  onOpenMap: () => void;
  onViewChange: (view: "customer" | "map" | "admin" | "security" | "register" | "logistic" | "login") => void;
}

export default function CustomerPanel({
  restaurants,
  products,
  promotions,
  productImages = [],
  selectedRestaurantId,
  onSelectRestaurant,
  onRecordLead,
  onOpenPlans,
  onOpenMap,
  onViewChange
}: CustomerPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tudo");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("Todos Bairros");
  const [restaurantList, setRestaurantList] = useState<Restaurant[]>([]);
  const [activePromoBanner, setActivePromoBanner] = useState<Promotion | null>(null);

  // Reviews and inputs
  const [localReviews, setLocalReviews] = useState<Review[]>([]);
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);

  const categories = ["Tudo", "Restaurante", "Lanchonete", "Pizzaria", "Açaíteria", "Cafeteria", "Marmitaria"];
  
  const neighborhoods = [
    "Todos Bairros", 
    "Adrianópolis", 
    "Vieiralves", 
    "Centro", 
    "Parque 10", 
    "Aleixo", 
    "Japiim",
    "Jorge Teixeira",
    "São José",
    "Coroado",
    "Cidade Nova",
    "Ponta Negra"
  ];

  useEffect(() => {
    // Filter logic
    let temp = [...restaurants];
    if (searchQuery) {
      const sq = searchQuery.toLowerCase();
      temp = temp.filter(r => 
        r.nome.toLowerCase().includes(sq) || 
        r.descricao.toLowerCase().includes(sq) ||
        r.categoria.toLowerCase().includes(sq)
      );
    }
    if (selectedCategory !== "Tudo") {
      temp = temp.filter(r => r.categoria === selectedCategory);
    }
    if (selectedNeighborhood !== "Todos Bairros") {
      temp = temp.filter(r => r.bairro === selectedNeighborhood);
    }
    setRestaurantList(temp);
  }, [restaurants, searchQuery, selectedCategory, selectedNeighborhood]);

  useEffect(() => {
    if (selectedRestaurantId) {
      // Fetch reviews
      fetch(`/api/reviews/${selectedRestaurantId}`)
        .then(res => res.json())
        .then(data => setLocalReviews(data))
        .catch(err => console.error(err));

      // Record a view lead
      onRecordLead(selectedRestaurantId, "restaurant_view");
    }
  }, [selectedRestaurantId]);

  const selectedRest = restaurants.find(r => r.id === selectedRestaurantId);
  const selectedRestProducts = products.filter(p => p.restaurant_id === selectedRestaurantId);

  const handleWhatsappRedirect = (r: Restaurant) => {
    onRecordLead(r.id, "whatsapp_click");
    // Simulate opening whatsapp
    const message = encodeURIComponent(`Olá, vi seu cardápio no AmazFood IA e gostaria de fazer uma pergunta!`);
    const link = `https://wa.me/${r.whatsapp}?text=${message}`;
    window.open(link, "_blank");
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurantId) return;

    const payload = {
      restaurant_id: selectedRestaurantId,
      user_nome: newReviewName || "Curumim Anônimo",
      nota: newReviewRating,
      comentario: newReviewComment || "Excelente comida de Manaus!"
    };

    fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(newRev => {
        setLocalReviews([newRev, ...localReviews]);
        setNewReviewName("");
        setNewReviewComment("");
        setNewReviewRating(5);
        alert("Avaliação publicada com sucesso!");
      })
      .catch(err => alert("Erro ao cadastrar avaliação"));
  };

  const getSeloLabel = (r: Restaurant) => {
    if (r.id === "r1") return { text: "PROMOÇÃO IA", color: "bg-manaus-orange text-white" };
    if (r.id === "r2") return { text: "VERIFICADO HOJE", color: "bg-blue-500 text-white" };
    if (r.id === "r4") return { text: "CARDÁPIO NOVO", color: "bg-green-600 text-white" };
    return null;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full bg-[#F8FAFC]">
      {/* Search and location Header */}
      <header className="md:h-20 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 md:py-0 flex flex-col md:flex-row items-center justify-between z-10 shrink-0 border-b border-slate-200/60 sticky top-0 gap-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-6 w-full md:w-auto">
          <div className="relative group w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Buscar tambaqui, x-caboquinho..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-96 pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-manaus-orange/30 transition-all shadow-sm group-hover:bg-white"
            />
            <Search size={16} className="absolute left-3.5 md:left-4 top-3 md:top-3.5 text-slate-400 group-focus-within:text-manaus-orange transition-colors" />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 md:px-4 py-2 md:py-2.5 rounded-2xl">
            <MapPin size={16} className="text-manaus-orange" />
            <select 
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="bg-transparent border-none text-xs md:text-sm text-slate-700 font-bold focus:outline-none cursor-pointer pr-4 w-full"
            >
              <option value="Todos Bairros">Todos os Bairros</option>
              {neighborhoods.slice(1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-700">{restaurants.length} Ativos</span>
          </div>
          <button
            onClick={onOpenMap}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 md:py-2.5 px-4 md:px-5 rounded-2xl text-[11px] md:text-xs transition-all flex items-center gap-2 shadow-lg shadow-slate-200 active:scale-95 shrink-0"
          >
            <MapIcon size={14} className="text-manaus-orange" />
            Mapa
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col md:flex-row gap-4 md:gap-6 h-full relative">
        
        {/* Left Side: Category filters & Grid of Restaurant Cards */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          
          {/* Pills filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar shrink-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm shrink-0 border duration-200 ${
                  selectedCategory === cat 
                    ? "bg-manaus-orange text-white border-transparent shadow-lg shadow-orange-500/20" 
                    : "bg-white text-slate-500 border-slate-200 hover:border-manaus-orange/30 hover:text-manaus-orange"
                }`}
              >
                {cat === "Tudo" ? "🍽️ Todos os Sabores" : cat}
              </button>
            ))}
          </div>

          {/* Restaurant Cards Grid */}
          <div className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-8">
            {selectedCategory === "Tudo" && selectedNeighborhood === "Todos Bairros" && (
              <div className="mb-6 bg-gradient-to-br from-manaus-orange to-[#FF8C35] rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl shadow-orange-500/20 group">
                <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <Building2 size={180} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-xl font-black tracking-tight flex items-center justify-center md:justify-start gap-2">
                       Ei, você tem um restaurante? <Sparkles size={18} />
                    </h3>
                    <p className="text-xs font-medium text-white/90 max-w-sm">
                      Cadastre seu cardápio grátis agora e comece a receber pedidos pelo WhatsApp direto, sem pagar comissão!
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                        onSelectRestaurant(null); 
                        onViewChange("register");
                    }}
                    className="bg-white text-manaus-orange font-black text-xs py-3.5 px-8 rounded-2xl shadow-lg transition-all active:scale-95 whitespace-nowrap"
                  >
                    🚀 Cadastrar Minha Loja
                  </button>
                </div>
              </div>
            )}
            
            {restaurantList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                  <Search size={32} />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold">Nenhum resultado</h3>
                  <p className="text-sm text-slate-400 mt-1 italic">Tente mudar o bairro ou a categoria.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                
                {restaurantList.map(r => {
                  const selo = getSeloLabel(r);
                  return (
                    <div 
                      key={r.id}
                      onClick={() => onSelectRestaurant(r.id)}
                      className={`bg-white rounded-3xl border p-1 transition-all flex flex-col justify-between cursor-pointer relative group hover:-translate-y-1 ${
                        selectedRestaurantId === r.id 
                          ? "border-manaus-orange shadow-xl shadow-orange-500/10 ring-2 ring-manaus-orange/10" 
                          : "border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          {selo ? (
                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tight ${selo.color}`}>
                              {selo.text}
                            </span>
                          ) : (
                            <span className="text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tight bg-slate-100 text-slate-400">
                              Lojista Local
                            </span>
                          )}
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                            <Star size={12} className="text-amber-500 fill-amber-500" />
                            <span className="text-amber-700 font-black text-[11px] leading-none">
                              {r.id === "r1" ? "4.8" : r.id === "r2" ? "4.9" : r.id === "r3" ? "4.5" : "4.2"}
                            </span>
                          </div>
                        </div>

                        <h4 className="font-bold text-slate-900 text-base leading-snug group-hover:text-manaus-orange transition-colors">
                          {r.nome}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                          {r.descricao}
                        </p>
                      </div>

                      {/* Card meta footer */}
                      <div className="px-4 py-3 bg-slate-50/50 rounded-b-[22px] border-t border-slate-100/50 mt-2 flex items-center justify-between">
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" /> {r.id === "r1" ? "35 min" : "45 min"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" /> {r.bairro}
                          </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-manaus-orange shadow-sm group-hover:bg-manaus-orange group-hover:text-white transition-all">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed pane for selected restaurant */}
        <div className={`
          fixed md:relative inset-y-0 h-screen md:h-full right-0 z-30 transform transition-transform duration-300 ease-in-out
          w-full md:w-[450px] shrink-0 bg-white md:rounded-[32px] border-l md:border border-slate-200 flex flex-col overflow-hidden shadow-2xl
          ${selectedRestaurantId ? "translate-x-0" : "translate-x-full md:translate-x-0"}
        `}>
          {selectedRestaurantId && selectedRest ? (
            <div className="flex flex-col h-full">
              
              {/* Profile Header */}
              <div className="relative h-48 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex flex-col justify-end">
                  <button 
                    onClick={() => onSelectRestaurant(null)}
                    className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-2 rounded-2xl transition-all active:scale-95"
                  >
                    <X size={20} />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-manaus-orange rounded-full text-[10px] font-black text-white uppercase tracking-wider">
                      {selectedRest.categoria}
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">
                      <Star size={12} className="fill-amber-400" /> 4.9
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white leading-tight">{selectedRest.nome}</h3>
                  <p className="text-sm text-slate-300 line-clamp-1 mt-1">{selectedRest.descricao}</p>
                </div>
              </div>

              {/* Scrollable details: Products Menu & Review submission */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                
                {/* Contact & Info */}
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                     <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Localização</span>
                     <p className="text-xs font-bold text-slate-700">{selectedRest.bairro}</p>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                     <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Funcionamento</span>
                     <p className="text-xs font-bold text-slate-700">{selectedRest.horario_funcionamento}</p>
                   </div>
                </div>

                {/* Menu Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-black text-slate-800">Cardápio do Local</h4>
                    <span className="text-[10px] font-bold p-1 px-2 bg-emerald-50 text-emerald-600 rounded-lg">Realtime IA</span>
                  </div>
                  
                  {selectedRestProducts.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400 italic">Cardápio em atualização...</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {selectedRestProducts.map(prod => {
                        const approvedImg = productImages.find(img => img.product_id === prod.id && img.approved);
                        const displayedImgUrl = approvedImg ? approvedImg.image_url : prod.imagem;

                        return (
                          <div key={prod.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4 shadow-sm hover:border-manaus-orange/20 transition-all group">
                            <div className="flex-1 space-y-1">
                              <h5 className="font-bold text-slate-800 text-sm group-hover:text-manaus-orange transition-colors">{prod.nome}</h5>
                              {prod.descricao && (
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{prod.descricao}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-sm font-black text-slate-900">R$ {prod.preco.toFixed(2)}</span>
                                {approvedImg && (
                                  <span className="px-2 py-0.5 bg-orange-50 text-[9px] font-black text-manaus-orange rounded-full border border-orange-100 uppercase">
                                    {approvedImg.source === "restaurant" ? "Foto Real" : "IA Visual"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {displayedImgUrl && (
                              <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 shadow-inner">
                                <img
                                  src={displayedImgUrl}
                                  alt={prod.nome}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Ratings Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2">Feedback da Comunidade</h4>
                  
                  {localReviews.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 text-center">Nenhuma avaliação ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {localReviews.map(rev => (
                        <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-black text-slate-800">{rev.user_nome}</span>
                            <div className="flex gap-0.5">
                              {[...Array(rev.nota)].map((_, i) => (
                                <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed italic">"{rev.comentario}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Redesigned Review Form */}
                  <form onSubmit={handleAddReview} className="p-5 bg-slate-900 rounded-[28px] text-white shadow-xl shadow-slate-900/10 space-y-4">
                    <h5 className="text-xs font-black uppercase tracking-widest text-slate-400">Deixe seu Review</h5>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Seu Nome"
                        value={newReviewName}
                        onChange={(e) => setNewReviewName(e.target.value)}
                        className="w-full text-xs bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-manaus-orange/50"
                        required
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Qualificação</span>
                        <select 
                          value={newReviewRating} 
                          onChange={(e) => setNewReviewRating(Number(e.target.value))}
                          className="bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-manaus-orange"
                        >
                          <option value="5">Excelente (5)</option>
                          <option value="4">Muito Bom (4)</option>
                          <option value="3">Médio (3)</option>
                          <option value="2">Fraco (2)</option>
                          <option value="1">Ruim (1)</option>
                        </select>
                      </div>
                      <textarea 
                        placeholder="Como foi sua experiência?"
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        className="w-full text-xs bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-manaus-orange/50 h-20 resize-none"
                      />
                      <button 
                        type="submit" 
                        className="w-full bg-manaus-orange hover:bg-manaus-orange-hover text-white text-xs font-black py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                      >
                        Publicar Comentário
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Bottom Sticky Action */}
              <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <button
                  onClick={() => handleWhatsappRedirect(selectedRest)}
                  className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-4 rounded-[22px] text-sm font-black transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95"
                >
                  <MessageCircle size={20} />
                  Pedir agora no WhatsApp
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-3 font-bold uppercase tracking-tight">
                  Conexão direta • Sem taxas de marketplace
                </p>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
              <div className="relative">
                 <div className="absolute inset-0 bg-manaus-orange/20 blur-3xl rounded-full"></div>
                 <div className="relative w-32 h-32 bg-white rounded-full border border-slate-100 shadow-2xl flex items-center justify-center text-5xl">
                    🍕
                 </div>
              </div>
              <div className="space-y-2 max-w-xs">
                <h4 className="font-black text-lg text-slate-900">Explore Manaus</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Selecione um dos <span className="text-manaus-orange font-black">+{restaurants.length}</span> locais verificados para ver detalhes, cardápios e pedir via WhatsApp.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[200px]">
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-manaus-orange w-1/3 animate-progress"></div>
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IA Scanning Live</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
