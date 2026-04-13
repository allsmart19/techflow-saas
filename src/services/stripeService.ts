// src/services/stripeService.ts
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
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

// ============================================================
// FUNÇÃO PARA CRIAR SESSÃO DE CHECKOUT (NOVA)
// ============================================================
export async function criarCheckoutSession(priceId: string, userId: number, userEmail: string) {
  try {
    const response = await fetch('https://cduouekisanwxmmpgufz.supabase.co/functions/v1/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        successUrl: `${window.location.origin}/assinatura/sucesso`,
        cancelUrl: `${window.location.origin}/assinatura`,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('❌ Erro ao criar sessão:', error);
    throw error;
  }
}

// ============================================================
// FUNÇÃO PARA CRIAR PORTAL DO CLIENTE (GERENCIAR ASSINATURA)
// ============================================================
export async function criarPortalSession(customerId: string) {
  try {
    const response = await fetch('/api/create-portal-session', {
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

// ============================================================
// FUNÇÃO PARA BUSCAR ASSINATURA ATIVA DO USUÁRIO
// ============================================================
export async function getAssinaturaAtiva(userId: string) {
  try {
    const { data, error } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('user_id', String(userId))
      .eq('status', 'active')
      .maybeSingle();
    
    if (error || !data) {
      // Tentar buscar também em trialing
      const { data: trialData, error: trialError } = await supabase
        .from('assinaturas')
        .select('*')
        .eq('user_id', String(userId))
        .eq('status', 'trialing')
        .maybeSingle();
      
      if (trialError || !trialData) return null;
      return trialData;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar assinatura ativa:', error);
    return null;
  }
}

export { stripePromise };