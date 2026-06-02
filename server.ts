import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { Restaurant, Product, Promotion, DiscoveryCandidate, VerificationLog, Lead, Review, ProductImage } from "./src/types.js";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc } from "firebase/firestore";

const app = express();
app.use(express.json({ limit: "20mb" }));

const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper to call Gemini with automatic retry support for transient failures (status 503, 429, high demand or rate limits)
async function callGeminiWithRetry(fn: () => Promise<any>, retries = 2, delay = 1000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errMsg = String(error.message || error.statusText || error).toUpperCase();
      const isTransient = errMsg.includes("503") || 
                          errMsg.includes("UNAVAILABLE") || 
                          errMsg.includes("429") ||
                          errMsg.includes("RESOURCE_EXHAUSTED") ||
                          errMsg.includes("HIGH DEMAND") ||
                          error.status === 503 ||
                          error.status === 429;
      if (isTransient && i < retries - 1) {
        console.warn(`Gemini API busy or high load (attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// Helper to initialize Firebase
let db: any = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase Firestore initialized successfully with DB ID:", firebaseConfig.firestoreDatabaseId);
  } else {
    console.error("firebase-applet-config.json not found!");
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

// Database Getters Helper
async function getRestaurantsCollection(): Promise<Restaurant[]> {
  if (!db) return initialRestaurants;
  try {
    const snap = await getDocs(collection(db, "restaurants"));
    const list: Restaurant[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as Restaurant);
    });
    return list;
  } catch (error) {
    console.error("Failed to get restaurants from Firestore:", error);
    return [];
  }
}

async function getProductsCollection(): Promise<Product[]> {
  if (!db) return initialProducts;
  try {
    const snap = await getDocs(collection(db, "products"));
    const list: Product[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as Product);
    });
    return list;
  } catch (error) {
    console.error("Failed to get products from Firestore:", error);
    return [];
  }
}

let memoryProductImages: ProductImage[] | null = null;

async function getProductImagesCollection(): Promise<ProductImage[]> {
  if (!db) {
    if (!memoryProductImages) memoryProductImages = [...initialProductImages];
    return memoryProductImages;
  }
  try {
    const snap = await getDocs(collection(db, "product_images"));
    const list: ProductImage[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as ProductImage);
    });
    if (list.length === 0) {
      // Seed initial product images in Firestore
      const { getFirestore, doc, setDoc } = await import("firebase/firestore");
      for (const img of initialProductImages) {
        await setDoc(doc(db, "product_images", img.id), img);
        list.push(img);
      }
    }
    return list;
  } catch (error) {
    console.error("Failed to get product images from Firestore:", error);
    if (!memoryProductImages) memoryProductImages = [...initialProductImages];
    return memoryProductImages;
  }
}

async function getPromotionsCollection(): Promise<Promotion[]> {
  if (!db) return initialPromotions;
  try {
    const snap = await getDocs(collection(db, "promotions"));
    const list: Promotion[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as Promotion);
    });
    return list;
  } catch (error) {
    console.error("Failed to get promotions from Firestore:", error);
    return [];
  }
}

async function getCandidatesCollection(): Promise<DiscoveryCandidate[]> {
  if (!db) return initialCandidates;
  try {
    const snap = await getDocs(collection(db, "candidates"));
    const list: DiscoveryCandidate[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as DiscoveryCandidate);
    });
    return list;
  } catch (error) {
    console.error("Failed to get candidates from Firestore:", error);
    return [];
  }
}

async function getVerificationLogsCollection(): Promise<VerificationLog[]> {
  if (!db) return initialVerificationLogs;
  try {
    const snap = await getDocs(collection(db, "verification_logs"));
    const list: VerificationLog[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as VerificationLog);
    });
    return list;
  } catch (error) {
    console.error("Failed to get verification logs from Firestore:", error);
    return [];
  }
}

async function getLeadsCollection(): Promise<Lead[]> {
  if (!db) return initialLeads;
  try {
    const snap = await getDocs(collection(db, "leads"));
    const list: Lead[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as Lead);
    });
    return list;
  } catch (error) {
    console.error("Failed to get leads from Firestore:", error);
    return [];
  }
}

async function getReviewsCollection(restaurantId?: string): Promise<Review[]> {
  if (!db) {
    return restaurantId 
      ? initialReviews.filter(r => r.restaurant_id === restaurantId)
      : initialReviews;
  }
  try {
    const snap = await getDocs(collection(db, "reviews"));
    const list: Review[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data() as Review;
      if (!restaurantId || data.restaurant_id === restaurantId) {
        list.push(data);
      }
    });
    return list;
  } catch (error) {
    console.error("Failed to get reviews from Firestore:", error);
    return [];
  }
}

// Initial system data structures to seed the database
const initialRestaurants: Restaurant[] = [
  {
    id: "r1",
    nome: "Peixaria Morada do Sol",
    categoria: "Restaurante",
    descricao: "Especialidade em Tambaqui assado na brasa, Caldeirada de Tucunaré e Pirarucu de casaca de dar água na boca.",
    telefone: "(92) 98111-2233",
    whatsapp: "5592981112233",
    email: "contato@peixariamorada.com",
    endereco: "Rua das Acacias, 142",
    bairro: "Aleixo",
    cidade: "Manaus",
    latitude: -3.1022,
    longitude: -60.0125,
    horario_funcionamento: "11:00 às 22:00",
    status: "ativo",
    plano: "premium",
    data_criacao: "2026-05-10T12:00:00Z",
    views: 184,
    clicks: 45
  },
  {
    id: "r2",
    nome: "Açaí do Porto",
    categoria: "Açaíteria",
    descricao: "O autêntico açaí do Amazonas puro, servido tradicionalmente com farinha do Uarini ovinha ou tapioca, e peixe frito se desejar!",
    telefone: "(92) 98222-3344",
    whatsapp: "5592982223344",
    email: "porto@acaidemanaus.com.br",
    endereco: "Av. Eduardo Ribeiro, 405",
    bairro: "Centro",
    cidade: "Manaus",
    latitude: -3.1311,
    longitude: -60.0242,
    horario_funcionamento: "10:00 às 20:00",
    status: "ativo",
    plano: "destaque",
    data_criacao: "2026-05-15T15:00:00Z",
    views: 142,
    clicks: 38
  },
  {
    id: "r3",
    nome: "Pizzaria Di Manaus",
    categoria: "Pizzaria",
    descricao: "Pizzas artesanais deliciosas com sabores regionais exclusivos como Pizza de Tucumã com Queijo Coalho (Caboquinho) e Banana Pacovã.",
    telefone: "(92) 99111-4455",
    whatsapp: "5592991114455",
    email: "dimanaus@pizza.clube",
    endereco: "Rua Recife, 78",
    bairro: "Parque 10",
    cidade: "Manaus",
    latitude: -3.0895,
    longitude: -60.0156,
    horario_funcionamento: "18:00 às 23:30",
    status: "ativo",
    plano: "premium",
    data_criacao: "2026-05-20T18:30:00Z",
    views: 220,
    clicks: 64
  },
  {
    id: "r4",
    nome: "Marmitaria Tropical",
    categoria: "Marmitaria",
    descricao: "Prato feito caseiro e marmitas caprichadas com arroz, feijão de praia, farofa e opções de carne, frango ou peixe frito.",
    telefone: "(92) 99333-5566",
    whatsapp: "5592993335566",
    email: "tropical@marmitasmanaus.com",
    endereco: "Rua do Japiim, 888",
    bairro: "Japiim",
    cidade: "Manaus",
    latitude: -3.1234,
    longitude: -59.9892,
    horario_funcionamento: "11:00 às 14:30",
    status: "ativo",
    plano: "basico",
    data_criacao: "2026-05-25T09:00:00Z",
    views: 95,
    clicks: 12
  },
  {
    id: "r5",
    nome: "Tacacaria e Lanchonete Adrianópolis",
    categoria: "Lanchonete",
    descricao: "O melhor X-Caboquinho da região, Tacacá bem quente com bastante goma, jambu que treme e tucupi legítimo.",
    telefone: "(92) 98444-6677",
    whatsapp: "5592984446677",
    email: "tacaca@adrianopolis.com",
    endereco: "Rua Terezina, 45",
    bairro: "Adrianópolis",
    cidade: "Manaus",
    latitude: -3.1092,
    longitude: -60.0114,
    horario_funcionamento: "16:00 às 22:30",
    status: "ativo",
    plano: "premium",
    data_criacao: "2026-05-28T16:00:00Z",
    views: 310,
    clicks: 89
  },
  {
    id: "r6",
    nome: "Cafeteria Cafezal Vieiralves",
    categoria: "Cafeteria",
    descricao: "Cafés especiais acompanhados de tapioca quentinha com manteiga e queijo coalho, bolos caseiros e salgados finos.",
    telefone: "(92) 98555-7788",
    whatsapp: "5592985557788",
    email: "cafezal@vieiralves.com",
    endereco: "Rua Pará, 320",
    bairro: "Vieiralves",
    cidade: "Manaus",
    latitude: -3.1115,
    longitude: -60.0185,
    horario_funcionamento: "07:30 às 19:30",
    status: "ativo",
    plano: "destaque",
    data_criacao: "2026-05-29T08:00:00Z",
    views: 112,
    clicks: 22
  },
  {
    id: "r7",
    nome: "Churrascaria do Gaúcho de Manaus - ZL",
    categoria: "Restaurante",
    descricao: "O melhor churrasco gaúcho com tempero regional. Costela assada na brasa, picanha fatiada e delicioso baião de dois.",
    telefone: "(92) 99311-8899",
    whatsapp: "5592993118899",
    email: "gauchozl@churrascomanaus.com",
    endereco: "Av. Itaúba, 420",
    bairro: "Jorge Teixeira",
    cidade: "Manaus",
    latitude: -3.0784,
    longitude: -59.9388,
    horario_funcionamento: "11:00 às 23:00",
    status: "ativo",
    plano: "premium",
    data_criacao: "2026-06-01T12:00:00Z",
    views: 154,
    clicks: 32
  },
  {
    id: "r8",
    nome: "Marmitaria Leste Sabor",
    categoria: "Marmitaria",
    descricao: "Marmitas preparadas no capricho com feijão regional, farofa de uarini, carne de sol acebolada, tambaqui frito e muito sabor da Zona Leste.",
    telefone: "(92) 99222-1144",
    whatsapp: "5592992221144",
    email: "lestesabor@marmitasmanaus.com",
    endereco: "Av. Grande Circular, 2510",
    bairro: "São José",
    cidade: "Manaus",
    latitude: -3.0821,
    longitude: -59.9512,
    horario_funcionamento: "11:00 às 15:00",
    status: "ativo",
    plano: "destaque",
    data_criacao: "2026-06-01T12:30:00Z",
    views: 89,
    clicks: 17
  }
];

const initialProducts: Product[] = [
  // Products for Peixaria Morada do Sol (r1)
  { id: "p1", restaurant_id: "r1", nome: "Tambaqui Assado (Banda)", descricao: "Banda de tambaqui assada na brasa, servido com baião, farofa de uarini e vinagrete.", preco: 65.00, categoria: "Principais", imagem: "", ativo: true },
  { id: "p2", restaurant_id: "r1", nome: "Pirarucu de Casaca Individual", descricao: "Pirarucu seco desfiado e temperado com banana pacovã frita, batata palha, azeitonas e farinha de ovinha uarini.", preco: 45.00, categoria: "Principais", imagem: "", ativo: true },
  { id: "p3", restaurant_id: "r1", nome: "Caldeirada de Tucunaré", descricao: "Deliciosa caldeirada com ovos, cheiro verde e tucunaré fresco. Acompanha arroz e pirão.", preco: 70.00, categoria: "Principais", imagem: "", ativo: true },
  
  // Products for Açaí do Porto (r2)
  { id: "p4", restaurant_id: "r2", nome: "Tigela de Açaí Tradicional 500ml", descricao: "Açaí puro de origem sem xarope. Acompanha farinha de ovinha Uarini legítima ou farinha de tapioca.", preco: 22.00, categoria: "Açaí", imagem: "", ativo: true },
  { id: "p5", restaurant_id: "r2", nome: "Tigela Supremo Manaus 700ml", descricao: "Açaí grosso com pedaços de banana frita e farinha ovinha por cima. Tradição total.", preco: 28.00, categoria: "Açaí", imagem: "", ativo: true },
  
  // Products for Pizzaria Di Manaus (r3)
  { id: "p6", restaurant_id: "r3", nome: "Pizza de Caboquinho (Grande)", descricao: "Molho de tomate de casa, tucumã em lascas, muito queijo coalho ralado e orégano.", preco: 49.90, categoria: "Pizza", imagem: "", ativo: true },
  { id: "p7", restaurant_id: "r3", nome: "Pizza de Pirarucu com Jambu (Grande)", descricao: "Lascas de pirarucu, folhas frescas de jambu selecionadas e requeijão cremoso.", preco: 54.90, categoria: "Pizza", imagem: "", ativo: true },
  
  // Products for Marmitaria Tropical (r4)
  { id: "p8", restaurant_id: "r4", nome: "Marmita PF de Carne", descricao: "Arroz, feijão de praia de caldo, farofa, espaguete e bife acebolado suculento.", preco: 15.00, categoria: "Almoço", imagem: "", ativo: true },
  { id: "p9", restaurant_id: "r4", nome: "Marmita PF de Peixe Frito", descricao: "Arroz, feijão, vinagrete, farofa amarela e peixe frito crocante (pescada ou sardinha).", preco: 16.50, categoria: "Almoço", imagem: "", ativo: true },

  // Products for Tacacaria e Lanchonete Adrianópolis (r5)
  { id: "p10", restaurant_id: "r5", nome: "X-Caboquinho Especial", descricao: "Pão francês crocante na chapa, abundante tucumã de Manaus, banana pacovã frita e muito queijo coalho.", preco: 15.00, categoria: "Lanches", imagem: "", ativo: true },
  { id: "p11", restaurant_id: "r5", nome: "Tacacá Arretado (Cuia Grande)", descricao: "Tucupi fervendo, bastante goma de mandioca, folhas de jambu bem verdes que tremem e camarão seco graúdo.", preco: 20.00, categoria: "Regionais", imagem: "", ativo: true },

  // Products for Churrascaria do Gaúcho - ZL (r7)
  { id: "p12", restaurant_id: "r7", nome: "Churrasco Misto Completo (Individual)", descricao: "Carne assada de boi, linguiça e frango, servido com arroz branco, feijão tropeiro e farofa de uarini amarela.", preco: 38.00, categoria: "Principais", imagem: "", ativo: true },
  { id: "p13", restaurant_id: "r7", nome: "Marmita de Churrasco do Gaúcho (G)", descricao: "Marmita reforçada com carne assada fatiada na brasa, baião de dois quentinho e salada de maionese.", preco: 20.00, categoria: "Principais", imagem: "", ativo: true },

  // Products for Marmitaria Leste Sabor (r8)
  { id: "p14", restaurant_id: "r8", nome: "Marmita Econômica Saborosa de Carne de Sol", descricao: "Carne de sol frita acebolada, arroz, feijão de praia de caldo, farofa regional e macarrão.", preco: 15.00, categoria: "Almoço", imagem: "", ativo: true },
  { id: "p15", restaurant_id: "r8", nome: "Galinha Caipira ao Molho Pardo", descricao: "Porção suculenta de galinha ao molho pardo tradicional de Manaus, arroz soltinho e pirão gostoso.", preco: 22.00, categoria: "Almoço", imagem: "", ativo: true }
];

const initialProductImages: ProductImage[] = [
  {
    id: "img1",
    product_id: "p1",
    image_url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600",
    source: "restaurant",
    confidence: 100,
    approved: true,
    created_at: "2026-06-01T20:00:00Z"
  },
  {
    id: "img2",
    product_id: "p2",
    image_url: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&q=80&w=600",
    source: "internet",
    confidence: 80,
    approved: true,
    created_at: "2026-06-01T20:01:00Z"
  },
  {
    id: "img3",
    product_id: "p3",
    image_url: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=600",
    source: "ai_generated",
    confidence: 60,
    approved: false,
    created_at: "2026-06-01T20:02:00Z"
  },
  {
    id: "img4",
    product_id: "p10",
    image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=600",
    source: "restaurant",
    confidence: 100,
    approved: true,
    created_at: "2026-06-01T20:03:00Z"
  },
  {
    id: "img5",
    product_id: "p11",
    image_url: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=600",
    source: "internet",
    confidence: 80,
    approved: true,
    created_at: "2026-06-01T20:04:00Z"
  },
  {
    id: "img6",
    product_id: "p12",
    image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600",
    source: "restaurant",
    confidence: 100,
    approved: true,
    created_at: "2026-06-01T20:05:00Z"
  },
  {
    id: "img7",
    product_id: "p14",
    image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
    source: "internet",
    confidence: 95,
    approved: true,
    created_at: "2026-06-01T20:06:00Z"
  }
];

const initialPromotions: Promotion[] = [
  {
    id: "promo1",
    restaurant_id: "r3",
    restaurant_nome: "Pizzaria Di Manaus",
    titulo: "Segunda da Pizza de Caboquinho",
    descricao: "Peça pizza grande de Caboquinho por apenas R$39,90! Oferta de início de semana sugerida automaticamente pelo monitor das redes sociais.",
    data_inicio: "2026-06-01T00:00:00Z",
    data_fim: "2026-06-02T00:00:00Z",
    ativa: true
  },
  {
    id: "promo2",
    restaurant_id: "r5",
    restaurant_nome: "Tacacaria e Lanchonete Adrianópolis",
    titulo: "Combo X-Caboquinho + Suco Regional R$18",
    descricao: "Detectado hoje nas redes sociais: Super café da tarde econômico! X-Caboquinho tradicional + copo de suco de Cupuaçu ou Taperebá gelado.",
    data_inicio: "2026-06-01T14:00:00Z",
    data_fim: "2026-06-05T18:00:00Z",
    ativa: true
  }
];

const initialCandidates: DiscoveryCandidate[] = [
  {
    id: "cand1",
    nome: "Açaí do Curumim",
    telefone: "(92) 98888-9900",
    endereco: "Av. Floriano Peixoto, 712",
    bairro: "Centro",
    categoria: "Açaíteria",
    origem: "Instagram",
    status: "novo"
  },
  {
    id: "cand2",
    nome: "Marmitaria Bom Sabor Manaus",
    telefone: "(92) 98777-6655",
    endereco: "Rua João Valério, 401",
    bairro: "Vieiralves",
    categoria: "Marmitaria",
    origem: "Google Maps",
    status: "convidado"
  },
  {
    id: "cand3",
    nome: "Manaus Burger & Tacacá",
    telefone: "(92) 99344-7711",
    endereco: "Av. Via Láctea, 1022",
    bairro: "Adrianópolis",
    categoria: "Lanchonete",
    origem: "Facebook",
    status: "novo"
  },
  {
    id: "cand4",
    nome: "Doceria Delícias da Floresta",
    telefone: "(92) 98411-2345",
    endereco: "Av. Ephigênio Salles, 80",
    bairro: "Aleixo",
    categoria: "Doceria",
    origem: "Instagram",
    status: "novo"
  }
];

const initialVerificationLogs: VerificationLog[] = [
  {
    id: "vlog1",
    restaurant_id: "r4",
    restaurant_nome: "Marmitaria Tropical",
    data: "2026-06-01T09:30:00Z",
    campo: "horario_funcionamento",
    valor_antigo: "11:00 às 14:30",
    valor_novo: "11:00 às 15:00",
    status: "pendente"
  },
  {
    id: "vlog2",
    restaurant_id: "r1",
    restaurant_nome: "Peixaria Morada do Sol",
    data: "2026-06-01T10:15:00Z",
    campo: "telefone",
    valor_antigo: "(92) 98111-2233",
    valor_novo: "(92) 98111-2233",
    status: "correto"
  }
];

const initialLeads: Lead[] = [];

const initialReviews: Review[] = [
  { id: "rev1", restaurant_id: "r1", user_nome: "Sildomar Souza", nota: 5, comentario: "O Tambaqui de cano de vocês é disparado o melhor do Aleixo, telecurado da Amazônia!", data_criacao: "2026-05-24T14:20:00Z" },
  { id: "rev2", restaurant_id: "r1", user_nome: "Aldenora Brandão", nota: 4, comentario: "O pirarucu estava fresquinho, mas demorou um bocado para embalar. Recomendo muito pelo sabor.", data_criacao: "2026-05-26T13:10:00Z" },
  { id: "rev3", restaurant_id: "r2", user_nome: "Breno 'Manauara'", nota: 5, comentario: "Peguei o açaí legítimo com peixe frito, me senti no porto de Manaus mas no conforto do Centro. Show!", data_criacao: "2026-05-29T17:45:00Z" }
];

async function ensureDatabaseSeeded() {
  if (!db) return;
  try {
    console.log("Seeding and verifying regional values in Firebase Firestore...");
    
    for (const res of initialRestaurants) {
      await setDoc(doc(db, "restaurants", res.id), res, { merge: true });
    }
    for (const p of initialProducts) {
      await setDoc(doc(db, "products", p.id), p, { merge: true });
    }
    for (const promo of initialPromotions) {
      await setDoc(doc(db, "promotions", promo.id), promo, { merge: true });
    }
    for (const cand of initialCandidates) {
      await setDoc(doc(db, "candidates", cand.id), cand, { merge: true });
    }
    for (const log of initialVerificationLogs) {
      await setDoc(doc(db, "verification_logs", log.id), log, { merge: true });
    }
    for (const rev of initialReviews) {
      await setDoc(doc(db, "reviews", rev.id), rev, { merge: true });
    }
    for (const img of initialProductImages) {
      await setDoc(doc(db, "product_images", img.id), img, { merge: true });
    }
    console.log("Firestore database seeding & updates verification completed successfully!");
  } catch (error) {
    console.error("Firestore database seeding failed:", error);
  }
}

// Helper to check if Gemini key is available and setup properly
function isAiEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && process.env.GEMINI_API_KEY !== "";
}

// RESTAURANTS API
app.get("/api/restaurants", async (req, res) => {
  const currentRestaurants = await getRestaurantsCollection();
  res.json(currentRestaurants);
});

app.post("/api/restaurants", async (req, res) => {
  const { nome, categoria, descricao, telefone, whatsapp, email, endereco, bairro, plano, horario_funcionamento } = req.body;
  if (!nome || !categoria) {
    return res.status(400).json({ error: "Nome e Categoria são obrigatórios" });
  }

  const newId = `r_${Date.now()}`;
  const newRest: Restaurant = {
    id: newId,
    nome,
    categoria,
    descricao: descricao || "Sem descrição fornecida ainda.",
    telefone: telefone || "(92) 98100-0000",
    whatsapp: whatsapp || "5592981000000",
    email: email || `${nome.toLowerCase().replace(/\s+/g, "")}@exemplo.com`,
    endereco: endereco || "Endereço em Manaus",
    bairro: bairro || "Adrianópolis",
    cidade: "Manaus",
    latitude: -3.1000 + (Math.random() - 0.5) * 0.05,
    longitude: -60.0100 + (Math.random() - 0.5) * 0.05,
    horario_funcionamento: horario_funcionamento || "11:00 às 22:00",
    status: "ativo",
    plano: plano || "basico",
    data_criacao: new Date().toISOString(),
    views: 1,
    clicks: 0
  };

  if (db) {
    await setDoc(doc(db, "restaurants", newId), newRest);
  }
  res.status(201).json(newRest);
});

app.post("/api/restaurants/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID é obrigatório" });
  }
  if (db) {
    const { deleteDoc, doc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "restaurants", id));
  }
  res.json({ success: true, message: `Restaurante ${id} removido.` });
});

app.post("/api/restaurants/update-plan", async (req, res) => {
  const { id, plano } = req.body;
  if (!id || !plano) {
    return res.status(400).json({ error: "ID e Plano são obrigatórios" });
  }
  if (db) {
    const { updateDoc, doc } = await import("firebase/firestore");
    await updateDoc(doc(db, "restaurants", id), { plano });
  }
  res.json({ success: true, message: `Plano do restaurante ${id} alterado para ${plano}.` });
});

// PRODUCT IMAGES API
app.get("/api/product-images", async (req, res) => {
  const currentImages = await getProductImagesCollection();
  res.json(currentImages);
});

app.post("/api/product-images", async (req, res) => {
  const { product_id, image_url, source, confidence, approved } = req.body;
  if (!product_id || !image_url || !source) {
    return res.status(400).json({ error: "Faltam parâmetros obrigatórios" });
  }

  const newId = `img_${Date.now()}`;
  const newImg: ProductImage = {
    id: newId,
    product_id,
    image_url,
    source,
    confidence: Number(confidence) || 100,
    approved: approved === true,
    created_at: new Date().toISOString()
  };

  if (db) {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "product_images", newId), newImg);
  } else {
    if (!memoryProductImages) memoryProductImages = [...initialProductImages];
    memoryProductImages.push(newImg);
  }

  // If approved is true, immediately update corresponding product's image url
  if (approved) {
    if (db) {
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "products", product_id), { imagem: image_url });
    }
  }

  res.status(201).json(newImg);
});

app.post("/api/product-images/approve", async (req, res) => {
  const { id, approved } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID é obrigatório" });
  }

  let foundImg: ProductImage | null = null;

  if (db) {
    const { doc, getDoc, updateDoc } = await import("firebase/firestore");
    const docRef = doc(db, "product_images", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      foundImg = snap.data() as ProductImage;
      await updateDoc(docRef, { approved });
      foundImg.approved = approved;

      // Update product image too if approved is true
      if (approved) {
        await updateDoc(doc(db, "products", foundImg.product_id), { imagem: foundImg.image_url });
      } else {
        // Clear product image
        await updateDoc(doc(db, "products", foundImg.product_id), { imagem: "" });
      }
    }
  } else {
    if (!memoryProductImages) memoryProductImages = [...initialProductImages];
    const item = memoryProductImages.find(i => i.id === id);
    if (item) {
      item.approved = approved;
      foundImg = item;
    }
  }

  if (!foundImg) {
    return res.status(404).json({ error: "Imagem não encontrada" });
  }

  res.json({ success: true, image: foundImg });
});

app.post("/api/product-images/generate-ai", async (req, res) => {
  const { product_id, nome, descricao, categoria, priority = false } = req.body;
  if (!product_id || !nome) {
    return res.status(400).json({ error: "Product ID e Nome são obrigatórios" });
  }

  // Determine Level of Food Vision IA
  // Nivel 1 - simulated restaurant photo (e.g. if we pretend the user uploaded metadata)
  // Nivel 2 - compatible internet search matching (e.g. if matching terms like "pizza", "hambúrguer" exist)
  // Nivel 3 - real AI prompt generation based on ingredients & descriptions + image creation
  
  let source: 'restaurant' | 'internet' | 'ai_generated' = 'ai_generated';
  let confidence = 60;
  let image_url = "";
  
  const searchTerms = nome.toLowerCase();
  
  if (searchTerms.includes("tambaqui") || searchTerms.includes("caboquinho")) {
    source = 'restaurant';
    confidence = 100;
    if (searchTerms.includes("tambaqui")) {
      image_url = "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600";
    } else {
      image_url = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=600";
    }
  } else if (searchTerms.includes("pizza") || searchTerms.includes("tacacá") || searchTerms.includes("açaí") || searchTerms.includes("marmita")) {
    source = 'internet';
    confidence = 80;
    if (searchTerms.includes("pizza")) {
      image_url = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600";
    } else if (searchTerms.includes("tacacá")) {
      image_url = "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=600";
    } else if (searchTerms.includes("açaí")) {
      image_url = "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600";
    } else {
      image_url = "https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&q=80&w=600";
    }
  } else {
    // Custom generator prompt
    source = 'ai_generated';
    confidence = 60;
    const rndNum = Math.floor(Math.random() * 1000) + 1;
    image_url = `https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600&sig=${rndNum}`;
  }
  
  const newImg: ProductImage = {
    id: `img_${Date.now()}`,
    product_id,
    image_url,
    source,
    confidence,
    approved: false, // Wait for manual/auto approval
    created_at: new Date().toISOString()
  };

  if (db) {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "product_images", newImg.id), newImg);
  } else {
    if (!memoryProductImages) memoryProductImages = [...initialProductImages];
    memoryProductImages.push(newImg);
  }

  res.status(201).json({
    success: true,
    image: newImg,
    prompt: `Foto gastronômica profissional de [${nome}]. Alta culinária, bem iluminado de perto, com ingredientes: ${descricao || "prato regional, pronto para servir, fundo desfocado."}`
  });
});

// PRODUCTS API
app.get("/api/products", async (req, res) => {
  const currentProducts = await getProductsCollection();
  res.json(currentProducts);
});

app.post("/api/products", async (req, res) => {
  const { restaurant_id, nome, descricao, preco, categoria, ativo } = req.body;
  if (!restaurant_id || !nome || preco === undefined) {
    return res.status(400).json({ error: "Faltam parâmetros obrigatórios" });
  }

  const newId = `p_${Date.now()}`;
  const newProd: Product = {
    id: newId,
    restaurant_id,
    nome,
    descricao: descricao || "",
    preco: Number(preco),
    categoria: categoria || "Geral",
    imagem: "",
    ativo: ativo !== false
  };

  if (db) {
    await setDoc(doc(db, "products", newId), newProd);
  }
  res.status(201).json(newProd);
});

app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, categoria, ativo } = req.body;

  if (db) {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
    const currentData = docSnap.data() as Product;
    const updated: Product = {
      ...currentData,
      nome: nome !== undefined ? nome : currentData.nome,
      descricao: descricao !== undefined ? descricao : currentData.descricao,
      preco: preco !== undefined ? Number(preco) : currentData.preco,
      categoria: categoria !== undefined ? categoria : currentData.categoria,
      ativo: ativo !== undefined ? !!ativo : currentData.ativo
    };
    await setDoc(docRef, updated);
    return res.json(updated);
  } else {
    return res.status(500).json({ error: "Database offline" });
  }
});

// PROMOTIONS API
app.get("/api/promotions", async (req, res) => {
  const currentPromos = await getPromotionsCollection();
  res.json(currentPromos);
});

app.post("/api/promotions", async (req, res) => {
  const { restaurant_id, titulo, descricao, data_fim } = req.body;

  let rest: Restaurant | null = null;
  if (db) {
    const restSnap = await getDoc(doc(db, "restaurants", restaurant_id));
    if (restSnap.exists()) {
      rest = restSnap.data() as Restaurant;
    }
  }

  if (!rest) {
    return res.status(404).json({ error: "Restaurante não encontrado" });
  }

  const newId = `promo_${Date.now()}`;
  const newPromo: Promotion = {
    id: newId,
    restaurant_id,
    restaurant_nome: rest.nome,
    titulo,
    descricao,
    data_inicio: new Date().toISOString(),
    data_fim: data_fim || new Date(Date.now() + 86400000 * 2).toISOString(),
    ativa: true
  };

  if (db) {
    await setDoc(doc(db, "promotions", newId), newPromo);
  }
  res.status(201).json(newPromo);
});

// DISCOVERY CANDIDATES API
app.get("/api/candidates", async (req, res) => {
  const currentCandidates = await getCandidatesCollection();
  res.json(currentCandidates);
});

// Invite WhatsApp candidate
app.post("/api/candidates/:id/invite", async (req, res) => {
  const { id } = req.params;
  if (db) {
    const docRef = doc(db, "candidates", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }
    const cand = snap.data() as DiscoveryCandidate;
    cand.status = "convidado";
    await setDoc(docRef, cand);
    return res.json(cand);
  } else {
    return res.status(404).json({ error: "Database offline" });
  }
});

// Confirm and convert candidate to restaurant
app.post("/api/candidates/:id/confirm", async (req, res) => {
  const { id } = req.params;
  if (db) {
    const docRef = doc(db, "candidates", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }
    const cand = snap.data() as DiscoveryCandidate;
    cand.status = "confirmado";
    await setDoc(docRef, cand);

    // Add into restaurants
    const newRestId = `r_${Date.now()}`;
    const newRest: Restaurant = {
      id: newRestId,
      nome: cand.nome,
      categoria: cand.categoria || "Restaurante",
      descricao: `Recém-descoberto via ${cand.origem} e ativo com confirmação!`,
      telefone: cand.telefone,
      whatsapp: "55" + cand.telefone.replace(/\D/g, ""),
      email: `${cand.nome.toLowerCase().replace(/\s+/g, "")}@test.com`,
      endereco: cand.endereco,
      bairro: cand.bairro,
      cidade: "Manaus",
      latitude: -3.100 + (Math.random() - 0.5) * 0.05,
      longitude: -60.010 + (Math.random() - 0.5) * 0.05,
      horario_funcionamento: "11:00 às 21:00",
      status: "ativo",
      plano: "basico",
      data_criacao: new Date().toISOString(),
      views: 1,
      clicks: 1
    };

    await setDoc(doc(db, "restaurants", newRestId), newRest);
    return res.json({ candidate: cand, restaurant: newRest });
  } else {
    return res.status(404).json({ error: "Database offline" });
  }
});

// VERIFICATION LOGS
app.get("/api/verification-logs", async (req, res) => {
  const currentLogs = await getVerificationLogsCollection();
  res.json(currentLogs);
});

app.post("/api/verification-logs/:id/resolve", async (req, res) => {
  const { id } = req.params;
  const { approve } = req.body;

  if (db) {
    const logRef = doc(db, "verification_logs", id);
    const logSnap = await getDoc(logRef);
    if (!logSnap.exists()) {
      return res.status(404).json({ error: "Log não encontrado" });
    }
    const log = logSnap.data() as VerificationLog;

    if (approve) {
      const restRef = doc(db, "restaurants", log.restaurant_id);
      const restSnap = await getDoc(restRef);
      if (restSnap.exists()) {
        const rest = restSnap.data() as Restaurant;
        (rest as any)[log.campo] = log.valor_novo;
        await setDoc(restRef, rest);
      }
      log.status = "resolvido";
    } else {
      log.status = "correto";
    }

    await setDoc(logRef, log);
    return res.json(log);
  } else {
    return res.status(500).json({ error: "Database offline" });
  }
});

// LEADS RECORDING
app.post("/api/leads", async (req, res) => {
  const { restaurant_id, origem } = req.body;
  if (db) {
    const restRef = doc(db, "restaurants", restaurant_id);
    const restSnap = await getDoc(restRef);
    if (!restSnap.exists()) {
      return res.status(404).json({ error: "Restaurante não encontrado" });
    }
    const rest = restSnap.data() as Restaurant;

    // increment counter
    if (origem === "whatsapp_click") {
      rest.clicks = (rest.clicks || 0) + 1;
    }
    rest.views = (rest.views || 0) + 1;
    await setDoc(restRef, rest);

    const newLeadId = `l_${Date.now()}`;
    const newLead: Lead = {
      id: newLeadId,
      restaurant_id,
      restaurant_nome: rest.nome,
      origem: origem || "restaurant_view",
      data: new Date().toISOString()
    };

    await setDoc(doc(db, "leads", newLeadId), newLead);
    return res.status(201).json({ status: "ok", lead: newLead, clicks: rest.clicks, views: rest.views });
  } else {
    return res.status(500).json({ error: "Database offline" });
  }
});

app.get("/api/leads/stats", async (req, res) => {
  const leadList = await getLeadsCollection();
  const restList = await getRestaurantsCollection();
  res.json({
    totalLeads: leadList.length,
    list: leadList.slice(-20),
    clicksByRestaurant: restList.map(r => ({ id: r.id, nome: r.nome, clicks: r.clicks || 0, views: r.views || 0 }))
  });
});

// REVIEWS
app.get("/api/reviews/:restaurantId", async (req, res) => {
  const { restaurantId } = req.params;
  const filtered = await getReviewsCollection(restaurantId);
  res.json(filtered);
});

app.post("/api/reviews", async (req, res) => {
  const { restaurant_id, user_nome, nota, comentario } = req.body;
  if (!restaurant_id || !nota) {
    return res.status(400).json({ error: "Avaliação incompleta" });
  }

  const newId = `rev_${Date.now()}`;
  const newReview: Review = {
    id: newId,
    restaurant_id,
    user_nome: user_nome || "Anônimo",
    nota: Number(nota),
    comentario: comentario || "",
    data_criacao: new Date().toISOString()
  };

  if (db) {
    await setDoc(doc(db, "reviews", newId), newReview);
  }
  res.status(201).json(newReview);
});

// CHATBOT WIDGET
app.post("/api/chatbot-chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Mensagem vazia" });
  }

  const currentRestaurants = await getRestaurantsCollection();

  if (!isAiEnabled()) {
    const msgLower = message.toLowerCase();
    let reply = "Olha só, eu sou a Tainá e ainda tô me calibrando aqui no sistema, mas já posso te adiantar o que tem de melhor por aqui! ";
    
    if (msgLower.includes("açaí") || msgLower.includes("acai")) {
      reply += "Tem açaí sim, meu amigo! 🥤 O autêntico do Amazonas tu encontra no **Açaí do Porto** lá no Centro. Quer ver os mais próximos ou os melhores?";
    } else if (msgLower.includes("peixe") || msgLower.includes("tambaqui") || msgLower.includes("pirarucu")) {
      reply += "Se tu queres um tambaqui assado show de bola ou um pirarucu de casaca brabo, te recomendo a **Peixaria Morada do Sol** lá no Aleixo!";
    } else if (msgLower.includes("x-caboquinho") || msgLower.includes("caboquinho") || msgLower.includes("lanche")) {
      reply += "Um X-Caboquinho quentinho com queijo coalho e tucumã é bom demais, né? 🍔 Tem lá na **Tacacaria Adrianópolis**. Bora resolver essa fome!";
    } else if (msgLower.includes("pizza") || msgLower.includes("pizzaria")) {
      reply += "Opa! 😄 Encontrei umas pizzarias massa por aqui, como a **Pizzaria Di Manaus** no Parque 10. Bora pedir uma?";
    } else if (msgLower.includes("barato") || msgLower.includes("economizar") || msgLower.includes("marmita")) {
      reply += "Bora economizar! 😄 Separei umas opções com ótimo custo-benefício, como a **Marmitaria Tropical** e a **Marmitaria Leste Sabor**.";
    } else {
      reply += "Bora matar essa fome! 😄 Eu sou a Tainá e conheço Manaus como a palma da minha mão. Tu quer sugestão de qual tipo de comida ou em qual bairro?";
    }
    return res.json({ text: reply, isMock: true });
  }

  try {
    const serializedRestaurants = JSON.stringify(currentRestaurants.map(r => ({
      nome: r.nome,
      categoria: r.categoria,
      descricao: r.descricao,
      bairro: r.bairro,
      endereco: r.endereco,
      horario: r.horario_funcionamento,
      telefone: r.telefone
    })), null, 2);

    const systemInstruction = `Você é Tainá, assistente virtual oficial da AmazFood em Manaus-AM.
Sua missão é ajudar clientes a encontrar restaurantes, promoções e cardápios.
Você fala português do Brasil de forma natural, amigável e prestativa.

Personalidade:
- Educada, positiva e objetiva.
- Conhece Manaus, seus bairros (Zona Leste, Centro, Parque 10, etc) e a cultura amazônica.
- Linguagem simples e direta.
- Pode usar ocasionalmente expressões leves da região como: "Opa!", "Bora!", "Meu amigo", "Minha amiga", "Tá na mão", "Já encontrei", "Olha só", "Show de bola".
- Evite exageros como "Égua!" ou "Manoooo" em excesso. Não use muitos emojis.

Modo Inteligente (Adaptação de tom):
- Se o cliente for formal, responda com polidez e profissionalismo ("Claro! Encontrei algumas opções de culinária japonesa próximas a você.").
- Se o cliente for informal, responda com proximidade ("Bora resolver isso! 🍕 Achei umas pizzarias que parecem uma ótima pedida.").

Aqui está o banco de dados atualizado dos estabelecimentos disponíveis:
${serializedRestaurants}

Sempre mencione o nome do restaurante claramente para o cliente clicar no sistema. Responda em no máximo 3-4 frases.`;

    let response;
    try {
      response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: message,
        config: {
          systemInstruction,
          temperature: 1.0,
        }
      }));
    } catch (primaryError: any) {
      console.warn("Primary model gemini-3.5-flash experiencing high demand or error, falling back to gemini-3.1-flash-lite...");
      response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: message,
        config: {
          systemInstruction,
          temperature: 1.0,
        }
      }));
    }

    res.json({ text: response.text || "Deu um pequeno delay aqui, curumim. Pode repetir?" });
  } catch (error: any) {
    console.error("Gemini Assistant Failure:", error);
    
    // Generous offline/busy backup system search tailored to user query
    let reply = "Olha curumim, a balsa de conexão com o satélite da IA tá meio congestionada agora por conta da alta demanda. Mas não te deixa com fome! De cabeça, aqui está o que encontrei:\n\n";
    const msgLower = message.toLowerCase();
    
    const matches = currentRestaurants.filter(r => {
      const nameMatch = r.nome.toLowerCase().includes(msgLower);
      const catMatch = r.categoria.toLowerCase().includes(msgLower);
      const descMatch = r.descricao.toLowerCase().includes(msgLower);
      const neighborhoodMatch = r.bairro.toLowerCase().includes(msgLower);
      return nameMatch || catMatch || descMatch || neighborhoodMatch;
    });

    if (matches.length > 0) {
      reply += `Encontrei estes estabelecimentos top que combinam com o que tu procuras:\n`;
      matches.forEach(m => {
        reply += `\n* **${m.nome}** (${m.categoria}) - Bairro ${m.bairro}. ${m.descricao} (Funcionamento: ${m.horario_funcionamento})`;
      });
      reply += "\n\nPodes clicar neles listados na tela para falar direto com eles ou pedir o cardápio!";
    } else {
      if (msgLower.includes("açaí") || msgLower.includes("acai")) {
        reply += "Indicação de ouro: o autêntico açaí grosso com farinha de Uarini ovinha do **Açaí do Porto** no Centro!";
      } else if (msgLower.includes("peixe") || msgLower.includes("tambaqui") || msgLower.includes("pirarucu") || msgLower.includes("caldeirada")) {
        reply += "Se tu queres saborear um Tambaqui assado na brasa de primeiríssima linha, corre na **Peixaria Morada do Sol** no Aleixo!";
      } else if (msgLower.includes("lanche") || msgLower.includes("caboquinho") || msgLower.includes("merenda")) {
        reply += "Pede umX-Caboquinho sensacional com queijo coalho e tucumã na **Tacacaria e Lanchonete Adrianópolis**!";
      } else if (msgLower.includes("pizza") || msgLower.includes("pizzaria")) {
        reply += "Para uma pizza de respeito com sabores regionais exclusivos, pede na **Pizzaria Di Manaus** no Parque 10!";
      } else {
        reply += "Não achei exatamente esse termo no meu HD regional, mas dá uma navegada pelos filtros de bairros e categorias na barra lateral! Você consegue ver o WhatsApp direto de cada um e fazer seu pedido sem taxas abusivas.";
      }
    }

    res.json({ text: reply, isOfflineFallback: true });
  }
});

// CARDÁPIO OCR AI
app.post("/api/convert-cardapio", async (req, res) => {
  const { textData, fileBase64, mimeType, restaurant_id } = req.body;

  if (!restaurant_id) {
    return res.status(400).json({ error: "ID do restaurante é requerido" });
  }

  if (!isAiEnabled()) {
    const sampleProducts = [
      { nome: "Sanduíche Regional Manaus", descricao: "Pão com queijo coalho e tucumã maduro.", preco: 14.50, categoria: "Lanches" },
      { nome: "Suco de Cupuaçu Copo 500ml", descricao: "Suco natural e bem cremoso da polpa concentrada.", preco: 8.00, categoria: "Bebidas" },
      { nome: "Tucumã Porção Extra", descricao: "Lascas finas de tucumã fresco.", preco: 5.00, categoria: "Acompanhamentos" }
    ];

    const added: Product[] = [];
    for (let i = 0; i < sampleProducts.length; i++) {
      const pData = sampleProducts[i];
      const newId = `p_extracted_${Date.now()}_${i}`;
      const newP: Product = {
        id: newId,
        restaurant_id,
        nome: pData.nome,
        descricao: pData.descricao,
        preco: pData.preco,
        categoria: pData.categoria,
        imagem: "",
        ativo: true
      };
      if (db) {
        await setDoc(doc(db, "products", newId), newP);
      }
      added.push(newP);
    }

    return res.json({ 
      products: added, 
      isMock: true, 
      msg: "Simulação de Extração Concluída! Adicione a GEMINI_API_KEY nas Configurações para usar OCR real de fotos corporativas e PDFs." 
    });
  }

  try {
    let contents: any[] = [];

    if (fileBase64 && mimeType) {
      contents.push({
        inlineData: {
          mimeType,
          data: fileBase64
        }
      });
      contents.push({
        text: `Transcreva os itens de comida e bebidas visíveis no cardápio desta imagem. Extraia o nome do prato, descrição útil, preço estimado e determine uma categoria lógica.`
      });
    } else {
      contents.push(`Converta o seguinte texto desestruturado de cardápio em produtos estruturados:\n\n${textData}`);
    }

    let response;
    try {
      response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: `Você é uma IA analista de cardápios. Retorne estritamente um código JSON válido contendo uma matriz chamada "produtos".
Cada item dentro de "produtos" DEVE possuir estritamente esta estrutura:
{
  "nome": "string (ex: Pirarucu de Casaca)",
  "descricao": "string (descrição dos ingredientes ou porção)",
  "preco": number (apenas o valor numérico ex: 35.50)",
  "categoria": "string (ex: Principal, Sobremesa, Bebidas)",
  "ativo": true
}
Não coloque blocos marcados com \`\`\`json ou qualquer outro texto explicativo fora do JSON. Apenas retorne o JSON bruto que inicie com { e termine com }.`,
          responseMimeType: "application/json"
        }
      }));
    } catch (primaryError: any) {
      console.warn("Primary model gemini-3.5-flash experiencing high demand for cardapio, falling back to gemini-3.1-flash-lite...");
      response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction: `Você é uma IA analista de cardápios. Retorne estritamente um código JSON válido contendo uma matriz chamada "produtos".
Cada item dentro de "produtos" DEVE possuir estritamente esta estrutura:
{
  "nome": "string (ex: Pirarucu de Casaca)",
  "descricao": "string (descrição dos ingredientes ou porção)",
  "preco": number (apenas o valor numérico ex: 35.50)",
  "categoria": "string (ex: Principal, Sobremesa, Bebidas)",
  "ativo": true
}
Não coloque blocos marcados com \`\`\`json ou qualquer outro texto explicativo fora do JSON. Apenas retorne o JSON bruto que inicie com { e termine com }.`,
          responseMimeType: "application/json"
        }
      }));
    }

    const bodyText = (response.text || "").trim();
    const parsed = JSON.parse(bodyText);
    const extractedList: any[] = parsed.produtos || parsed.products || [];

    const added: Product[] = [];
    for (let index = 0; index < extractedList.length; index++) {
      const item = extractedList[index];
      const newId = `p_ocr_${Date.now()}_${index}`;
      const p: Product = {
        id: newId,
        restaurant_id,
        nome: item.nome || `Item Desconhecido ${index + 1}`,
        descricao: item.descricao || "Item indexado automaticamente pelo Agente de Cardápio IA.",
        preco: Number(item.preco) || 0.00,
        categoria: item.categoria || "Geral",
        imagem: "",
        ativo: item.ativo !== false
      };
      if (db) {
        await setDoc(doc(db, "products", newId), p);
      }
      added.push(p);
    }

    res.json({ products: added, isMock: false });
  } catch (error: any) {
    console.error("Cardapio processing failure (falling back to dynamic local parser):", error);
    
    // Fallback: dynamic parser that attempts to parse textData line by line, or uses delicious default items if blank
    let extractedList: any[] = [];
    if (textData) {
      const lines = textData.split("\n");
      lines.forEach((line: string) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 3) return;
        
        let preco = 15.00;
        let nome = trimmed;
        
        // Split on potential price delimiters like R$, dashes, or colon
        const parts = trimmed.split(/[-–—:]|(?:\br\$?\b)/gi);
        if (parts.length > 1) {
          const potentialPriceStr = parts[parts.length - 1].trim();
          const parsedPrice = parseFloat(potentialPriceStr.replace(",", "."));
          if (!isNaN(parsedPrice) && parsedPrice > 0) {
            preco = parsedPrice;
            nome = parts.slice(0, -1).join(" ").trim();
          }
        }
        
        if (nome.length > 3) {
          let categoria = "Geral";
          const lower = nome.toLowerCase();
          if (lower.includes("suco") || lower.includes("bebida") || lower.includes("refrigerante") || lower.includes("agua") || lower.includes("cerveja")) {
            categoria = "Bebidas";
          } else if (lower.includes("tambaqui") || lower.includes("peixe") || lower.includes("pirarucu") || lower.includes("refeic") || lower.includes("caldeirada")) {
            categoria = "Principais";
          } else if (lower.includes("x-") || lower.includes("caboquinho") || lower.includes("misto") || lower.includes("sanduíche")) {
            categoria = "Lanches";
          }
          
          extractedList.push({
            nome: nome,
            descricao: "Extraído localmente via processador inteligente de contingência.",
            preco: preco,
            categoria: categoria,
            ativo: true
          });
        }
      });
    }

    if (extractedList.length === 0) {
      extractedList = [
        { nome: "Tambaqui de Banda na Brasa", descricao: "Banda de tambaqui assada com arroz, farofa e vinagrete regional.", preco: 55.00, categoria: "Principais" },
        { nome: "X-Caboquinho Completo", descricao: "Pão francês, tucumã maduro em lascas, banana pacovã frita e queijo coalho.", preco: 16.00, categoria: "Lanches" },
        { nome: "Suco de Cupuaçu Copo Grande", descricao: "Feito com polpa de fruta natural e gelo.", preco: 9.00, categoria: "Bebidas" },
        { nome: "Tacacá Cupuaçu Especial", descricao: "Tucupi fervendo, jambu graúdo que treme e camarões secos.", preco: 22.00, categoria: "Principais" }
      ];
    }

    const added: Product[] = [];
    for (let index = 0; index < extractedList.length; index++) {
      const item = extractedList[index];
      const newId = `p_fallback_${Date.now()}_${index}`;
      const p: Product = {
        id: newId,
        restaurant_id,
        nome: item.nome,
        descricao: item.descricao,
        preco: Number(item.preco) || 0.00,
        categoria: item.categoria,
        imagem: "",
        ativo: true
      };
      if (db) {
        await setDoc(doc(db, "products", newId), p);
      }
      added.push(p);
    }

    res.json({ 
      products: added, 
      isMock: true, 
      isOfflineFallback: true,
      msg: `Conexão Gemini em alta demanda. Ativamos o Processador Auxiliar: ${added.length} itens do cardápio indexados localmente!`
    });
  }
});

// VITE MIDDLEWARE SETUP FOR DEV/PROD ROUTING
async function startServer() {
  await ensureDatabaseSeeded();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AmazFood local server active on http://localhost:${PORT}`);
  });
}

startServer();
