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
    const currentSubscription = await stripe.subscriptions.retrieve(oldSubscriptionId);
    const customerId = currentSubscription.customer;

    // 2. Obter o método de pagamento padrão da assinatura atual
    const paymentMethodId = currentSubscription.default_payment_method;
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Método de pagamento não encontrado. O cliente precisa ter um cartão associado.' });
    }

    // 3. (Opcional) Definir este método como padrão no cliente (evita problemas futuros)
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // 4. Criar nova assinatura com o novo plano, usando o mesmo método de pagamento
    const newSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: newPriceId }],
      default_payment_method: paymentMethodId, // 🔥 ESSA É A CORREÇÃO PRINCIPAL
      proration_behavior: 'always_invoice',     // cobrança proporcional
      trial_from_plan: false,
      metadata: { userId: userId.toString() }
    });

    // 5. Cancelar a assinatura antiga (ao final do período atual)
    await stripe.subscriptions.update(oldSubscriptionId, {
      cancel_at_period_end: true
    });

    // 6. Atualizar o Supabase: marcar a antiga como cancelada
    await supabase
      .from('assinaturas')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', oldSubscriptionId);

    // 7. Inserir a nova assinatura no Supabase
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