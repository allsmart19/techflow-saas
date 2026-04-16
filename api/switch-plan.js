// api/switch-plan.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
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

    // 1. Buscar a assinatura atual
    const subscription = await stripe.subscriptions.retrieve(oldSubscriptionId);
    const customerId = subscription.customer;
    const currentPriceId = subscription.items.data[0].price.id;

    if (currentPriceId === newPriceId) {
      return res.status(400).json({ error: 'Você já está neste plano' });
    }

    // 2. Criar NOVA assinatura com o novo plano
    const newSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: newPriceId }],
      proration_behavior: 'always_invoice',
      trial_from_plan: false,
      metadata: { userId: userId.toString() }
    });

    // 3. CANCELAR IMEDIATAMENTE a assinatura antiga (NÃO no fim do período)
    await stripe.subscriptions.cancel(oldSubscriptionId, {
      cancellation_details: { comment: 'Troca de plano' }
    });

    // 4. Atualizar Supabase: marcar antiga como canceled
    await supabase
      .from('assinaturas')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', oldSubscriptionId);

    // 5. Inserir nova assinatura no Supabase
    const planName = newPriceId === "price_1TLlGuGhIX9bHHYRIwSV4W4o" 
      ? "Plano Pro Mensal" 
      : "Plano Pro Anual";

    const { error } = await supabase.from('assinaturas').insert({
      user_id: userId,
      stripe_subscription_id: newSubscription.id,
      stripe_customer_id: customerId,
      status: newSubscription.status,
      plano: planName,
      data_inicio: new Date(),
      data_expiracao: new Date(newSubscription.current_period_end * 1000),
      cancel_at_period_end: false
    });

    if (error) throw error;

    return res.status(200).json({ success: true, newSubscriptionId: newSubscription.id });
  } catch (error) {
    console.error('❌ Erro ao trocar plano:', error);
    return res.status(500).json({ error: error.message });
  }
}