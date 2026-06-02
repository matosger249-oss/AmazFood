/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Restaurant {
  id: string;
  nome: string;
  categoria: 'Restaurante' | 'Lanchonete' | 'Pizzaria' | 'Açaíteria' | 'Cafeteria' | 'Marmitaria' | 'Doceria';
  descricao: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  bairro: string;
  cidade: string;
  latitude: number;
  longitude: number;
  horario_funcionamento: string;
  status: 'ativo' | 'pendente' | 'suspenso';
  plano: 'basico' | 'destaque' | 'premium';
  data_criacao: string;
  imagemUrl?: string;
  views?: number;
  clicks?: number;
  instagram?: string;
  facebook?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  source: 'restaurant' | 'internet' | 'ai_generated';
  confidence: number; // 100% para original, 80% para internet, 60% para IA
  approved: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  restaurant_id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  ativo: boolean;
  // Dynamic fields parsed by Food Vision IA agent
  vision_images?: ProductImage[];
}

export interface Promotion {
  id: string;
  restaurant_id: string;
  restaurant_nome: string;
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  ativa: boolean;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: 'cliente' | 'restaurante' | 'administrador';
}

export interface Review {
  id: string;
  restaurant_id: string;
  user_nome: string;
  nota: number;
  comentario: string;
  data_criacao: string;
}

export interface Lead {
  id: string;
  restaurant_id: string;
  restaurant_nome: string;
  origem: 'whatsapp_click' | 'view_menu' | 'restaurant_view';
  data: string;
}

export interface DiscoveryCandidate {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  bairro: string;
  categoria: Restaurant['categoria'];
  origem: 'Google Maps' | 'Instagram' | 'Facebook';
  status: 'novo' | 'convidado' | 'confirmado';
}

export interface VerificationLog {
  id: string;
  restaurant_id: string;
  restaurant_nome: string;
  data: string;
  campo: string;
  valor_antigo: string;
  valor_novo: string;
  status: 'correto' | 'pendente' | 'resolvido';
}
