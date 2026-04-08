// src/services/stripeService.ts
import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
// IMPORTANTE: Usar a URL correta para produção
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

export interface PlanoAssinatura {
  id: string;
  nome: string;
  preco: number;
  periodo: 'month' | 'year';
  descricao: string[];
  priceId: string;
}

export const planos: PlanoAssinatura[] = [
  {
    id: 'pro_monthly',
    nome: 'Plano Pro',
    preco: 29.90,
    periodo: 'month',
    descricao: [
      'Gestão ilimitada de pedidos',
      'Relatórios avançados',
      'Suporte prioritário',
      'Até 3 usuários'
    ],
    priceId: 'price_1TJgtLGhIX9bHHYRK2zAXxd2'
  },
  {
    id: 'pro_yearly',
    nome: 'Plano Pro Anual',
    preco: 299.90,
    periodo: 'year',
    descricao: [
      'Todos os recursos do plano mensal',
      '2 meses grátis',
      'Suporte 24/7',
      'Usuários ilimitados'
    ],
    priceId: 'price_1TJgwvGhIX9bHHYR67ugy5vd'
  }
];

export async function criarCheckoutSession(priceId: string, userId: number, userEmail: string) {
  try {
    console.log('🔄 Criando sessão de checkout...', { priceId, userId, userEmail, API_URL });
    
      const response = await fetch(`${API_URL}/.netlify/functions/create-checkout-session`, {  
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        successUrl: `${window.location.origin}/assinatura/sucesso`,
        cancelUrl: `${window.location.origin}/assinatura`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resposta erro:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const session = await response.json();
    console.log('✅ Sessão criada:', session);
    
    if (session.url) {
      window.location.href = session.url;
    } else {
      throw new Error('URL não retornada pela API');
    }
    
    return session;
  } catch (error) {
    console.error('❌ Erro ao criar sessão de checkout:', error);
    throw error;
  }
}

export async function criarPortalSession(customerId: string) {
  try {
    const response = await fetch(`${API_URL}/.netlify/functions/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}/assinatura`,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Erro ao criar sessão do portal:', error);
    throw error;
  }
}

export async function getAssinaturaAtiva(userId: number) {
  try {
    const response = await fetch(`${API_URL}/.netlify/functions/assinatura/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    return null;
  }
}

export { stripePromise };