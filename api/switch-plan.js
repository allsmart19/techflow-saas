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
    const oldSubscription = await stripe.subscriptions.retrieve(oldSubscriptionId);
    const customerId = oldSubscription.customer;

    // 2. Buscar método de pagamento
    let paymentMethodId = oldSubscription.default_payment_method;
    
    if (!paymentMethodId) {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
        limit: 1
      });
      if (paymentMethods.data.length > 0) {
        paymentMethodId = paymentMethods.data[0].id;
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId }
        });
      }
    }

    if (!paymentMethodId) {
      return res.status(400).json({ 
        error: 'Método de pagamento não encontrado.' 
      });
    }

    // 3. Cancelar assinatura antiga
    await stripe.subscriptions.cancel(oldSubscriptionId, {
      cancellation_details: { comment: 'Troca de plano' }
    });

    // 4. Criar nova assinatura
    const newSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: newPriceId }],
      default_payment_method: paymentMethodId,
      proration_behavior: 'always_invoice',
      trial_from_plan: false,
      metadata: { userId: userId.toString() }
    });

    // 5. Calcular data de expiração (MESMO MÉTODO DA PRIMEIRA ASSINATURA)
    const dataInicio = new Date();
    let dataExpiracao;
    
    const isMensal = newPriceId === "price_1TLlGuGhIX9bHHYRIwSV4W4o";
    const dias = isMensal ? 30 : 365;
    
    dataExpiracao = new Date(dataInicio);
    dataExpiracao.setDate(dataInicio.getDate() + dias);
    
    console.log('📅 Data de início:', dataInicio);
    console.log('📅 Data de expiração calculada:', dataExpiracao);
    console.log('📅 Plano:', isMensal ? 'Mensal (30 dias)' : 'Anual (365 dias)');

    // 6. Atualizar Supabase
    const planName = isMensal ? "Plano Pro Mensal" : "Plano Pro Anual";

    await supabase
      .from('assinaturas')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', oldSubscriptionId);

    const { error } = await supabase.from('assinaturas').insert({
      user_id: userId,
      stripe_subscription_id: newSubscription.id,
      stripe_customer_id: customerId,
      status: newSubscription.status,
      plano: planName,
      data_inicio: dataInicio,
      data_expiracao: dataExpiracao,
      cancel_at_period_end: false
    });

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao trocar plano:', error);
    return res.status(500).json({ error: error.message });
  }
}