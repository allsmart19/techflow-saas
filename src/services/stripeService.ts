// src/services/stripeService.ts
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const API_URL = import.meta.env.VITE_API_URL || '';

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
    
    // Se você voltar a usar funções serverless, descomente o bloco abaixo
    /*
    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
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
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const session = await response.json();
    if (session.url) window.location.href = session.url;
    return session;
    */
    
    // Fallback: redirecionar para Payment Link (não usa API)
    console.warn('Nenhuma função serverless configurada. Redirecione diretamente para o Payment Link.');
    throw new Error('Função serverless não implementada');
  } catch (error) {
    console.error('❌ Erro ao criar sessão de checkout:', error);
    throw error;
  }
}

export async function criarPortalSession(customerId: string) {
  try {
    const response = await fetch(`${API_URL}/api/create-portal-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}/assinatura`,
      }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Erro ao criar sessão do portal:', error);
    throw error;
  }
}

// ============================================================
// FUNÇÃO SIMPLIFICADA: lê diretamente do Supabase
// (o webhook mantém a tabela `assinaturas` atualizada)
// ============================================================
export async function getAssinaturaAtiva(userId: number) {
  const { data, error } = await supabase
    .from('assinaturas')
    .select('*') // já seleciona todos os campos, incluindo trial_end
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export { stripePromise };