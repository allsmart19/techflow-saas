// api/create-checkout.js
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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { priceId, userId, userEmail } = req.body;

    if (!priceId || !userId || !userEmail) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    // Verificar se já existe assinatura ativa
    const { data: assinaturaAtiva } = await supabase
      .from('assinaturas')
      .select('id, stripe_customer_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (assinaturaAtiva) {
      // Buscar customer_id
      const { data: userData } = await supabase
        .from('usuarios')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (userData?.stripe_customer_id) {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: userData.stripe_customer_id,
          return_url: 'https://techflow-saas-livid.vercel.app/assinatura',
        });
        return res.status(400).json({
          error: 'Você já possui uma assinatura ativa. Gerencie no portal.',
          portalUrl: portalSession.url
        });
      }
    }

    // Buscar ou criar cliente
    let customer;
    const existing = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId: userId.toString() }
      });
    }

    // Salvar customer_id
    await supabase
      .from('usuarios')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    // Criar checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://techflow-saas-livid.vercel.app/assinatura/sucesso',
      cancel_url: 'https://techflow-saas-livid.vercel.app/assinatura',
      metadata: { userId: userId.toString() },
      subscription_data: { trial_period_days: 7 }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ error: error.message });
  }
}