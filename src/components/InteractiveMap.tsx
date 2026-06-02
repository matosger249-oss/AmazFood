import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Restaurant, Product } from "../types";
import { 
  MapPin, 
  Navigation, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  MessageCircle, 
  Eye, 
  HelpCircle,
  Compass,
  ArrowRight,
  ListFilter,
  Check,
  ChevronRight
} from "lucide-react";

interface InteractiveMapProps {
  restaurants: Restaurant[];
  products: Product[];
  onSelectRestaurant: (id: string | null) => void;
  onViewChange: (view: "customer" | "admin" | "security") => void;
  onRecordLead: (restaurantId: string, origem: 'whatsapp_click' | 'view_menu' | 'restaurant_view') => void;
}

// Manaus centroid
const MANAUS_CENTROID: [number, number] = [-3.1090, -60.0125];

export default function InteractiveMap({
  restaurants,
  products,
  onSelectRestaurant,
  onViewChange,
  onRecordLead
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Geo IA & Pin Selection States
  const [selectedMapRest, setSelectedMapRest] = useState<Restaurant | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>(MANAUS_CENTROID);
  const [userLocationLabel, setUserLocationLabel] = useState<string>("Centro de Manaus (Centróide)");
  const [routeResult, setRouteResult] = useState<{
    distance: string;
    duration: string;
    steps: string[];
  } | null>(null);

  // Smart Query Filter
  const [smartQuery, setSmartQuery] = useState("");
  const [aiSpeech, setAiSpeech] = useState("Opa! Eu sou a Tainá, sua assistente do AmazFood. 😄 Pra começar, me diz o que tu tá com vontade de comer hoje ou ajusta tua localização aí no mapa pra eu te mostrar o que tem de bom por perto!");
  
  // Address Validator Sandbox
  const [addressInput, setAddressInput] = useState("");
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    street: string;
    bairro: string;
    coordenadas: [number, number];
    explanation: string;
  } | null>(null);

  // Inconsistency Scanner
  const [inconsistencies, setInconsistencies] = useState<Array<{
    id: string;
    nome: string;
    bairroReivindicado: string;
    coordenadaDetectada: string;
    gravidade: "alta" | "media";
    corrigido: boolean;
    coordSugerida: [number, number];
  }>>([
    {
      id: "r3",
      nome: "Marmitaria Sabor Regional",
      bairroReivindicado: "Parque 10",
      coordenadaDetectada: "Aproximação de Adrianópolis (Limites cruzados)",
      gravidade: "media",
      coordSugerida: [-3.0885, -60.0112],
      corrigido: false
    },
    {
      id: "r4",
      nome: "Super Burguer Manaus",
      bairroReivindicado: "Japiim",
      coordenadaDetectada: "Ponto flutuando no Rio Negro (Coordenada -3.235, -59.852 externa ao perímetro municipal)",
      gravidade: "alta",
      coordSugerida: [-3.1255, -59.9821],
      corrigido: false
    }
  ]);

  // Inject Leaflet Stylesheets on Mount
  useEffect(() => {
    if (!document.getElementById("leaflet-cdn-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-cdn-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // Set default center based on filtered locations
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Pizzaria": return "#ef4444"; // red
      case "Lanchonete": return "#f97316"; // orange
      case "Açaíteria": return "#a855f7"; // purple
      case "Restaurante": return "#0d9488"; // teal
      case "Cafeteria": return "#d97706"; // amber
      case "Marmitaria": return "#10b981"; // emerald
      default: return "#f25635"; // manaus original orange
    }
  };

  // Harversine formula to compute great-circle distance
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset previous instance if existed
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      fadeAnimation: true
    }).setView(MANAUS_CENTROID, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    mapInstanceRef.current = map;
    markersGroupRef.current = L.featureGroup().addTo(map);

    // Plot markers representing restaurants
    rebuildMarkers();

    // Trigger map resize on window resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current.parentElement) {
      resizeObserver.observe(mapContainerRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [restaurants]);

  // Redraw state markers when list or user position updates
  const rebuildMarkers = (filteredRests: Restaurant[] = restaurants) => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // User Location Marker (custom pulsating blue beacon)
    const userIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-6 h-6 bg-blue-400 rounded-full animate-ping opacity-60"></div>
          <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      className: "user-gps-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker(userLocation, { icon: userIcon })
      .addTo(markersGroup)
      .bindPopup(`<div class="p-1 font-sans text-xs"><strong>Minha Localização:</strong><br/>${userLocationLabel}</div>`);

    // Add restaurants
    filteredRests.forEach((r) => {
      const color = getCategoryColor(r.categoria);
      const isPremium = "LOJA";

      const rIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group" style="transform: translate(0, 0)">
            <div class="absolute -top-3 scale-75 opacity-0 group-hover:opacity-100 bg-slate-900 text-white font-bold text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap z-50 transition-all">
              ${r.nome}
            </div>
            <div class="w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center hover:scale-110 transition-all" style="background-color: ${color}">
              <span class="text-white text-[12px] font-bold">
                ${r.categoria === "Pizzaria" ? "🍕" : r.categoria === "Lanchonete" ? "🍔" : r.categoria === "Açaíteria" ? "🍧" : r.categoria === "Cafeteria" ? "☕" : r.categoria === "Marmitaria" ? "🍱" : "🍲"}
              </span>
            </div>
          </div>
        `,
        className: `rest-marker-${r.id}`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const dist = calculateDistanceKm(userLocation[0], userLocation[1], r.latitude, r.longitude);

      // Custom Leaflet Popup inside markup
      const popupHtml = document.createElement("div");
      popupHtml.className = "p-2 font-sans text-slate-800 space-y-2 text-left min-w-[200px]";
      popupHtml.innerHTML = `
        <div class="flex justify-between items-start border-b pb-1">
          <div>
            <span class="text-[8px] font-extrabold text-white px-1.5 py-0.5 rounded uppercase bg-slate-700">${isPremium}</span>
            <h4 class="font-bold text-slate-900 text-sm mt-0.5">${r.nome}</h4>
          </div>
          <span class="text-yellow-500 font-bold font-mono text-xs">★ ${r.id === "r1" ? "4.8" : r.id === "r2" ? "4.9" : r.id === "r3" ? "4.5" : "4.2"}</span>
        </div>
        <p class="text-[10px] text-slate-500 line-clamp-2">${r.descricao}</p>
        <div class="text-[9px] text-slate-600 font-mono space-y-0.5 bg-slate-50 p-1.5 rounded border border-slate-100">
          <div>📍 ${r.endereco} (${r.bairro})</div>
          <div>🕒 Horário: ${r.horario_funcionamento}</div>
          <div class="text-blue-600 font-extrabold">🛣️ Distância: ${dist} km</div>
        </div>
        <div class="grid grid-cols-2 gap-1.5 pt-1">
          <button id="pop-wa-${r.id}" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2 rounded text-[10px] flex items-center justify-center gap-0.5 cursor-pointer">
            WhatsApp
          </button>
          <button id="pop-menu-${r.id}" class="bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-1 px-2 rounded text-[10px] flex items-center justify-center gap-0.5 cursor-pointer">
            Cardápio
          </button>
        </div>
        <button id="pop-route-${r.id}" class="w-full bg-manaus-orange hover:bg-orange-600 text-white font-black py-1 px-2 rounded text-[10px] mt-1 flex items-center justify-center gap-1 cursor-pointer">
          🗺️ Ver Caminho com a Tainá
        </button>
      `;

      // Set events on popup elements dynamically
      const marker = L.marker([r.latitude, r.longitude], { icon: rIcon })
        .addTo(markersGroup)
        .bindPopup(popupHtml);

      marker.on("popupopen", () => {
        // WhatsApp trigger hook
        document.getElementById(`pop-wa-${r.id}`)?.addEventListener("click", () => {
          onRecordLead(r.id, "whatsapp_click");
          const message = encodeURIComponent(`Olá, vi seu cardápio no mapa do AmazFood IA!`);
          window.open(`https://wa.me/${r.whatsapp}?text=${message}`, "_blank");
        });

        // Search redirection hook
        document.getElementById(`pop-menu-${r.id}`)?.addEventListener("click", () => {
          onSelectRestaurant(r.id);
          onViewChange("customer");
        });

        // Draw dynamic routing overlay
        document.getElementById(`pop-route-${r.id}`)?.addEventListener("click", () => {
          setSelectedMapRest(r);
          drawRoutingResult(r);
        });
      });
    });

    if (filteredRests.length > 0 && mapInstanceRef.current) {
      // Fit to bounds securely
      const bounds = markersGroup.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  };

  // Traçar Rota simulating polyline path on leaflet map
  const drawRoutingResult = (rest: Restaurant) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean previous polyline route
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    // Generate a simulated route with a couple of intermediary turning coordinates to resemble a real road route
    const start = userLocation;
    const end: [number, number] = [rest.latitude, rest.longitude];
    
    // Middle points
    const mid1: [number, number] = [start[0] + (end[0] - start[0]) * 0.4, start[1] + (end[1] - start[1]) * 0.1];
    const mid2: [number, number] = [start[0] + (end[0] - start[0]) * 0.7, start[1] + (end[1] - start[1]) * 0.95];

    const routeCoords = [start, mid1, mid2, end];
    
    // Draw thick styling line
    const polyline = L.polyline(routeCoords, {
      color: "#FF6B35",
      weight: 5,
      opacity: 0.85,
      dashArray: "10, 5",
      lineCap: "round"
    }).addTo(map);

    routePolylineRef.current = polyline;

    // Pan map to fit route
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    // Generate step instructions from Agent 8
    const distance = calculateDistanceKm(start[0], start[1], end[0], end[1]);
    const durationMin = Math.ceil(distance * 2.8); // avg speed/minutes

    let zoneInfo = start[1] > -60.00 ? "Saindo da Zona Leste de Manaus" : "Saindo da sua localização centralizado";

    const steps = [
      `Inicie sua jornada em direção ao sul em direção à Avenida Principal mais próxima.`,
      `Siga cerca de ${Math.max(1, Math.round(distance / 3))} km e pegue o acesso para a Avenida Grande Circular ou Av. Cosme Ferreira.`,
      `Mantenha-se à direita em direção à entrada do bairro ${rest.bairro} de Manaus.`,
      `Vire na rua de acesso a ${rest.endereco}. O estabelecimento ${rest.nome} estará à direita.`
    ];

    setRouteResult({
      distance: `${distance} km`,
      duration: `${durationMin} minutos`,
      steps
    });

    setAiSpeech(`Tá na mão! 🗺️ O ${rest.nome} fica a uns ${distance} km de ti. De carro ou moto, tu chega lá em mais ou menos ${durationMin} minutinhos. Bora pedir?`);
  };

  // Run Smart Query NLP Simulator ("Pizza aberta agora", "Açaí até R$20")
  const executeSmartQuery = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = smartQuery.toLowerCase().trim();
    if (!query) return;

    let filtered = [...restaurants];
    let spoken = "";

    if (query.includes("pizza") || query.includes("pizzaria")) {
      filtered = restaurants.filter(r => r.categoria === "Pizzaria");
      spoken = `Opa! Encontrei umas pizzarias massa por aqui perto de ti. 🍕 Dá uma olhada e vê qual combina mais com a tua fome de hoje!`;
    } else if (query.includes("açaí") || query.includes("acai")) {
      filtered = restaurants.filter(r => r.categoria === "Açaíteria");
      spoken = `Tem sim, meu amigo! 🥤 Achei umas açaíterias funcionando agora. Quer ver as mais próximas ou as mais bem avaliadas?`;
    } else if (query.includes("leste") || query.includes("jorge") || query.includes("teixeira") || query.includes("são josé")) {
      filtered = restaurants.filter(r => ["Jorge Teixeira", "São José", "Coroado"].includes(r.bairro));
      spoken = `Bora lá pra Zona Leste! 😄 Já encontrei os melhores locais por ali pra ti.`;
    } else if (query.includes("barato") || query.includes("barata") || query.includes("marmita") || query.includes("r$20")) {
      filtered = restaurants.filter(r => r.categoria === "Marmitaria" || r.categoria === "Lanchonete");
      spoken = `Bora economizar! 😄 Separei umas opções com ótimo custo-benefício aqui perto.`;
    } else {
      filtered = restaurants.filter(r => 
        r.nome.toLowerCase().includes(query) || 
        r.descricao.toLowerCase().includes(query) || 
        r.bairro.toLowerCase().includes(query)
      );
      spoken = `Já encontrei! Achei ${filtered.length} lugares que combinam com o que tu buscou. 🍲 Olha só:`;
    }

    setAiSpeech(spoken);
    rebuildMarkers(filtered);
  };

  // Change user coordinate references (e.g. Centro, Jorge Teixeira ZL, Ponta Negra)
  const handleLocationPresetChange = (preset: string) => {
    let latLng: [number, number] = MANAUS_CENTROID;
    let label = "Manaus Central";

    if (preset === "jorge_teixeira") {
      latLng = [-3.0784, -59.9388];
      label = "Avenida Itaúba - Bairro Jorge Teixeira (ZONA LESTE)";
    } else if (preset === "ponta_negra") {
      latLng = [-3.0905, -60.1012];
      label = "Calçadão da Ponta Negra (Zona Oeste)";
    } else if (preset === "parque_10") {
      latLng = [-3.0844, -60.0051];
      label = "Parque 10 de Novembro";
    } else if (preset === "vieiralves") {
      latLng = [-3.1115, -60.0210];
      label = "Vieiralves Shopping / Adrianópolis";
    }

    setUserLocation(latLng);
    setUserLocationLabel(label);
    
    // update leaflet map view
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(latLng, 13);
    }
    
    setAiSpeech(`Pronto, meu amigo! Já calibrei o mapa pra tua localização lá no ${label}. Agora as distâncias tão batendo certinho.`);
  };

  // Run triggers based on userLocation
  useEffect(() => {
    rebuildMarkers();
    if (selectedMapRest) {
      drawRoutingResult(selectedMapRest);
    }
  }, [userLocation]);

  // Address Validator Sandbox
  const handleValidateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput) return;

    const inputLower = addressInput.toLowerCase();
    
    // Simulate smart parsing engine checks
    let valid = true;
    let street = addressInput;
    let bairro = "Não Identificado";
    let coords: [number, number] = [-3.1090, -60.0125]; // default Manaus
    let explanation = "O log de análise indica que o formato é compatível com os eixos rodoviários de Manaus.";

    if (inputLower.includes("djalma batista")) {
      street = "Avenida Djalma Batista";
      bairro = "Chapada / Nossa Senhora das Graças";
      coords = [-3.1030, -60.0225];
      explanation = "Endereço verificado com êxito! Cruzamentos e numeração de alta densidade comercial em Manaus.";
    } else if (inputLower.includes("itaúba") || inputLower.includes("itauba") || inputLower.includes("jorge teixeira")) {
      street = "Avenida Itaúba";
      bairro = "Jorge Teixeira";
      coords = [-3.0784, -59.9388];
      explanation = "Endereço verificado! Eixo principal da Zona Leste de Manaus com estabelecimentos mapeados.";
    } else if (inputLower.includes("grande circular") || inputLower.includes("autaz mirim")) {
      street = "Avenida Autaz Mirim (Grande Circular)";
      bairro = "São José / Tancredo Neves";
      coords = [-3.0821, -59.9512];
      explanation = "Endereço ativo detectado. Bulevar de alta fluxo no círculo leste.";
    } else if (inputLower.includes("ponta negra")) {
      street = "Avenida Coronel Teixeira";
      bairro = "Ponta Negra";
      coords = [-3.0905, -60.1012];
      explanation = "Localização orla validada com sucesso.";
    } else {
      // General fallbacks - check if "Amazonas" or "Manaus" mentioned
      if (!inputLower.includes("manaus") && !inputLower.includes("am")) {
        explanation = "Alerta: Verifique se o endereço pertence à cidade de Manaus/AM. Faltam delimitadores geográficos.";
        valid = false;
      } else {
        bairro = "Centro / Expansão";
        explanation = "Detectado formato municipal geral de Manaus. Plotando no centróide padrão.";
      }
    }

    setValidationResult({
      valid,
      street,
      bairro,
      coordenadas: coords,
      explanation
    });

    if (valid && mapInstanceRef.current) {
      mapInstanceRef.current.setView(coords, 14);
    }
  };

  // Core 1-click inconsistency corrector
  const resolveInconsistency = (id: string, suggestedCoords: [number, number]) => {
    // update state locally
    setInconsistencies(prev => prev.map(inc => inc.id === id ? { ...inc, corrigido: true } : inc));
    
    // also update restaurants coords on the map if they are in standard list
    const updated = restaurants.map(r => r.id === id ? { ...r, latitude: suggestedCoords[0], longitude: suggestedCoords[1] } : r);
    rebuildMarkers(updated);

    setAiSpeech(`Beleza! Já ajeitei a localização do ${id} aqui no meu sistema. Agora tá no bairro certo.`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full bg-[#F8FAFC]" id="map-layout-container">
      {/* Horizontal Map Header Panel */}
      <header className="md:h-20 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 md:py-0 flex flex-col md:flex-row items-center justify-between shrink-0 z-10 border-b border-slate-200/60 sticky top-0 shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-2 md:p-3 bg-manaus-orange/10 rounded-2xl text-manaus-orange shadow-inner">
            <Compass size={20} className="animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2">
              AmazGo <span className="text-manaus-orange">Mapa</span>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 font-black rounded-lg border border-emerald-100 uppercase tracking-tight">Tainá Ativa</span>
            </h2>
            <p className="text-[10px] md:text-[11px] text-slate-500 font-medium">Guia Regional de Manaus • Tainá</p>
          </div>
        </div>

        {/* Parting references selector */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
          <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider shrink-0">
            <MapPin size={12} className="text-manaus-orange" /> Localização:
          </label>
          <div className="bg-slate-50 border border-slate-200 px-3 py-2 md:py-2.5 rounded-2xl flex items-center group hover:bg-white transition-all focus-within:ring-2 focus-within:ring-manaus-orange/30 shrink-0">
            <select
              onChange={(e) => handleLocationPresetChange(e.target.value)}
              className="text-sm bg-transparent border-none font-bold text-slate-700 focus:outline-none cursor-pointer pr-4"
            >
              <option value="manaus_center">Manaus (Centro)</option>
              <option value="jorge_teixeira">Zona Leste (Itaúba)</option>
              <option value="ponta_negra">Ponta Negra (Orla)</option>
              <option value="parque_10">Parque 10</option>
              <option value="vieiralves">Vieiralves / Adrianópolis</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main split dashboard view */}
      <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col md:flex-row gap-4 md:gap-6 h-full">
        
        {/* Left pane: The Leaflet Map itself */}
        <div className="flex-1 bg-white rounded-3xl md:rounded-[32px] border border-slate-200 p-1 md:p-2 shadow-2xl shadow-slate-200/50 flex flex-col overflow-hidden h-full relative min-h-[300px] md:min-h-0">
          <div className="absolute top-4 left-4 md:top-6 md:left-6 z-[1000] w-[calc(100%-32px)] md:max-w-sm">
            {/* Search Box on screen overlay */}
            <form onSubmit={executeSmartQuery} className="flex gap-2 bg-white/90 backdrop-blur-xl p-1.5 md:p-2 rounded-2xl md:rounded-[22px] border border-white shadow-2xl shadow-slate-900/10">
              <div className="relative flex-1">
                <input
                  type="text" 
                  placeholder="Pizza aberta..."
                  value={smartQuery}
                  onChange={(e) => setSmartQuery(e.target.value)}
                  className="w-full md:w-64 pl-8 md:pl-9 pr-2 py-2 md:py-2.5 text-[11px] md:text-xs focus:outline-none font-bold placeholder-slate-400 bg-slate-50/50 rounded-xl"
                />
                <Search size={14} className="absolute left-2.5 md:left-3 top-2.5 md:top-3 text-slate-400" />
              </div>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white text-[9px] md:text-[10px] py-2 px-3 md:px-5 rounded-xl font-black flex items-center gap-1.5 md:gap-2 whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-lg shadow-slate-900/20"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Actual Leaflet Div Anchor */}
          <div ref={mapContainerRef} className="flex-1 rounded-[26px] overflow-hidden shadow-inner border border-slate-50 min-h-[300px] z-0"></div>

          {/* Mini overlay list bar inside map for legend categories */}
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            <span className="flex items-center gap-2 shrink-0 bg-white px-4 py-2 rounded-2xl border border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider shadow-sm">
              Legend:
            </span>
            {[
              { color: "bg-red-500", text: "Pizzarias" },
              { color: "bg-orange-500", text: "Hamburguerias" },
              { color: "bg-purple-500", text: "Açaíterias" },
              { color: "bg-teal-500", text: "Restaurantes" },
              { color: "bg-amber-500", text: "Cafeterias" },
              { color: "bg-emerald-500", text: "Marmitarias" }
            ].map(legend => (
              <span key={legend.text} className="flex items-center gap-2 shrink-0 bg-white px-4 py-2 rounded-2xl border border-slate-100 text-[10px] font-bold text-slate-600 shadow-sm hover:border-manaus-orange/30 transition-all cursor-default">
                <span className={`w-2 h-2 rounded-full ${legend.color} shadow-sm`}></span> {legend.text}
              </span>
            ))}
          </div>
        </div>

        {/* Right pane: Agente Geo IA control terminal (Audit, distance calculations & validating addresses) */}
        <div className="w-full md:w-[420px] shrink-0 flex flex-col gap-4 md:gap-6 overflow-y-auto no-scrollbar h-full pb-8">
          
          {/* Agent 8 Identity Box */}
          <div className="bg-slate-900 rounded-3xl md:rounded-[32px] p-5 md:p-6 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Compass size={120} className="md:size-[180px]" />
            </div>
            <div className="flex gap-3 md:gap-4 items-center mb-4">
              <div className="p-3 md:p-4 bg-manaus-orange rounded-2xl text-white shadow-xl shadow-orange-500/30 animate-float">
                <Sparkles size={20} className="md:size-[24px]" />
              </div>
              <div>
                <span className="text-[8px] md:text-[10px] tracking-[0.2em] font-black uppercase text-manaus-orange/80">AmazGO ASSISTENTE</span>
                <h3 className="text-lg md:text-xl font-black tracking-tight">Tainá</h3>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl md:rounded-[22px] p-3 md:p-4 border border-white/10 text-[11px] md:text-xs leading-relaxed text-slate-300 shadow-inner">
              <p className="font-medium italic leading-relaxed">"{aiSpeech}"</p>
            </div>
          </div>

          {/* Custom Action: Route Instructions Panel */}
          {routeResult && selectedMapRest && (
            <div className="bg-white rounded-[32px] p-6 border border-orange-100 shadow-xl shadow-orange-500/5 space-y-5 animate-slide-in">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <h4 className="text-[11px] uppercase tracking-[0.1em] font-black text-slate-800 flex items-center gap-2">
                  🛣️ Rota Otimizada Geo-IA
                </h4>
                <button 
                  onClick={() => {
                    setRouteResult(null);
                    setSelectedMapRest(null);
                    if (routePolylineRef.current) {
                      routePolylineRef.current.remove();
                      routePolylineRef.current = null;
                    }
                  }}
                  className="text-[10px] font-black text-slate-400 hover:text-manaus-orange transition-colors uppercase"
                >
                  Limpar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl text-center">
                  <div className="text-[9px] uppercase font-black text-orange-400 tracking-wider mb-1">Distância</div>
                  <div className="text-lg font-black text-manaus-orange font-mono">{routeResult.distance}</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
                  <div className="text-[9px] uppercase font-black text-slate-400 tracking-wider mb-1">Tempo Est.</div>
                  <div className="text-lg font-black text-slate-900 font-mono">{routeResult.duration}</div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Passo a Passo:</p>
                <div className="space-y-3">
                  {routeResult.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <span className="w-6 h-6 rounded-lg bg-orange-50 text-manaus-orange font-black text-[10px] flex items-center justify-center shrink-0 border border-orange-100 shadow-sm group-hover:bg-manaus-orange group-hover:text-white transition-all">
                          {idx + 1}
                        </span>
                        {idx < routeResult.steps.length - 1 && <div className="w-[2px] flex-1 bg-slate-100 my-1"></div>}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tool 1: Address Checker Engine */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
            <h4 className="text-[11px] uppercase tracking-[0.1em] font-black text-slate-800 flex items-center gap-2">
              🔍 Validar Endereço IA
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Analise coordenadas e polígonos municipais em tempo real:
            </p>

            <form onSubmit={handleValidateAddress} className="space-y-3">
              <input
                type="text"
                placeholder="Ex: Av. Itaúba, Jorge Teixeira"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="w-full text-sm font-bold p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/20 transition-all"
              />
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3.5 rounded-2xl cursor-pointer transition-all shadow-lg shadow-slate-900/20 active:scale-95"
              >
                Auditar Localidade
              </button>
            </form>

            {validationResult && (
              <div className={`p-4 rounded-[22px] border text-xs leading-relaxed space-y-3 animate-slide-up ${
                validationResult.valid 
                  ? "bg-emerald-50/50 border-emerald-100 text-emerald-900" 
                  : "bg-amber-50/50 border-amber-100 text-amber-900"
              }`}>
                <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-tight">
                  {validationResult.valid ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
                  <span>{validationResult.valid ? "Coerência Geográfica Confirmada" : "Divergência de Polígono"}</span>
                </div>
                <div className="font-bold space-y-1 bg-white/50 p-3 rounded-xl border border-white/50">
                  <div className="flex justify-between"><span>Eixo:</span> <span className="text-slate-900 font-black">{validationResult.street}</span></div>
                  <div className="flex justify-between"><span>Setor:</span> <span className="text-slate-900 font-black">{validationResult.bairro}</span></div>
                  <div className="flex justify-between"><span>GPS:</span> <span className="text-slate-900 font-black font-mono">{validationResult.coordenadas.join(", ")}</span></div>
                </div>
                <p className="text-[11px] italic font-medium opacity-80 leading-relaxed border-t border-white/30 pt-2">{validationResult.explanation}</p>
              </div>
            )}
          </div>

          {/* Tool 2: Geolocation Perimetral Inconsistency Scan */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-5">
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.1em] font-black text-slate-800 flex items-center gap-2">
                ⚠️ Auditoria de Geodados
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1 font-medium">
                Divergências detectadas pelo Agente 8 Scanner:
              </p>
            </div>

            <div className="space-y-4">
              {inconsistencies.map((inc) => (
                <div key={inc.id} className="p-4 rounded-2xl border border-slate-50 bg-[#FBFBFF] space-y-3 hover:border-slate-200 transition-all group">
                  <div className="flex justify-between items-start">
                    <span className="font-black text-slate-900 text-xs block group-hover:text-manaus-orange transition-colors">{inc.nome}</span>
                    <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter shadow-sm border ${
                      inc.gravidade === "alta" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}>
                      {inc.gravidade}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold space-y-1 bg-white/50 p-2 rounded-xl border border-white">
                    <div className="flex justify-between"><span>Bairro:</span> <span>{inc.bairroReivindicado}</span></div>
                    <div className="text-rose-600 font-black text-[9px] line-clamp-1">{inc.coordenadaDetectada}</div>
                  </div>

                  {inc.corrigido ? (
                    <div className="text-[10px] text-emerald-600 font-black flex items-center justify-center gap-2 mt-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 shadow-inner">
                      <Check size={14} /> Corrigido via IA!
                    </div>
                  ) : (
                    <button
                      onClick={() => resolveInconsistency(inc.id, inc.coordSugerida)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
                    >
                      💡 Auto-Corrigir
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tool 3: Smart Radius Filters presets */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
            <h4 className="text-[11px] uppercase tracking-[0.1em] font-black text-slate-800 flex items-center gap-2">
              🍕 3. Filtros Rápidos
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Busca com filtros otimizados:
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  setSmartQuery("Pizza aberta agora");
                  const filtered = restaurants.filter(r => r.categoria === "Pizzaria");
                  setAiSpeech("Opa! Já encontrei umas pizzarias aqui perto pra ti. 😄 Dá uma olhada no mapa!");
                  rebuildMarkers(filtered);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs p-3 rounded-xl flex items-center justify-between cursor-pointer border border-slate-100 hover:-translate-y-px transition-all"
              >
                <span>🍕 Pizzarias Próximas</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
              
              <button
                onClick={() => {
                  setSmartQuery("Açaí até R$20");
                  const filtered = restaurants.filter(r => r.categoria === "Açaíteria" || r.categoria === "Marmitaria");
                  setAiSpeech("Bora de açaí? Separei umas opções baratas e show de bola pra ti. 🥤");
                  rebuildMarkers(filtered);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs p-3 rounded-xl flex items-center justify-between cursor-pointer border border-slate-100 hover:-translate-y-px transition-all"
              >
                <span>🍧 Açaí e Marmitas Baratos</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => {
                  setSmartQuery("Churrascaria Zona Leste");
                  const filtered = restaurants.filter(r => ["Jorge Teixeira", "São José"].includes(r.bairro));
                  setAiSpeech("Bora lá pra Zona Leste! Já encontrei os melhores locais por ali pra ti.");
                  rebuildMarkers(filtered);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs p-3 rounded-xl flex items-center justify-between cursor-pointer border border-slate-100 hover:-translate-y-px transition-all"
              >
                <span>🔥 Sabores da Zona Leste</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
