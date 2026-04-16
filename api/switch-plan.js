// api/switch-plan.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, newPriceId, oldSubscriptionId } = req.body;

    if (!userId || !newPriceId || !oldSubscriptionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Buscar a assinatura atual no Stripe
    const subscription = await stripe.subscriptions.retrieve(oldSubscriptionId);
    const customerId = subscription.customer;
    const currentPriceId = subscription.items.data[0].price.id;

    // Se já está no plano desejado, não fazer nada
    if (currentPriceId === newPriceId) {
      return res.status(400).json({ error: 'Você já está neste plano' });
    }

    // 2. ATUALIZAR a assinatura existente (NÃO criar uma nova)
    const updatedSubscription = await stripe.subscriptions.update(oldSubscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice', // Cobrança proporcional automática
      cancel_at_period_end: false, // Remove qualquer cancelamento pendente
    });

    // 3. Atualizar o Supabase (apenas UMA assinatura)
    const planName = newPriceId === "price_1TLlGuGhIX9bHHYRIwSV4W4o" 
      ? "Plano Pro Mensal" 
      : "Plano Pro Anual";

    const { error } = await supabase
      .from('assinaturas')
      .update({
        status: updatedSubscription.status,
        plano: planName,
        data_expiracao: new Date(updatedSubscription.current_period_end * 1000),
        cancel_at_period_end: false,
      })
      .eq('stripe_subscription_id', oldSubscriptionId);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Plano alterado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao trocar plano:', error);
    
    // Tratamento específico para erro de índice duplicado
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Já existe uma assinatura ativa. Aguarde o processamento.' });
    }
    
    return res.status(500).json({ error: error.message });
  }
}