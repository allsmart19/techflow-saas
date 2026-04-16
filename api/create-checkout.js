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

    // 🔎 Verificar se o usuário já possui uma assinatura ativa
    const { data: assinaturaAtiva } = await supabase
      .from('assinaturas')
      .select('id, stripe_customer_id, status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    // Se já existe assinatura ativa, redirecionar para o portal de gerenciamento
    if (assinaturaAtiva) {
      // Buscar o customer_id do usuário
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
          error: 'Você já possui uma assinatura ativa. Gerencie-a no portal para trocar de plano.',
          portalUrl: portalSession.url
        });
      }
    }

    // 🔎 Buscar ou criar cliente no Stripe
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId: userId.toString() }
      });
    }

    // 💾 Salvar stripe_customer_id na tabela usuarios
    await supabase
      .from('usuarios')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    // 🔎 Verificar se o usuário NUNCA teve nenhuma assinatura (histórico vazio)
    // Isso inclui: cliente novo, cliente que nunca assinou, cliente que assinou mas expirou
    const { data: historicoAssinaturas } = await supabase
      .from('assinaturas')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const isNovoUsuario = !historicoAssinaturas || historicoAssinaturas.length === 0;

    // 🔥 Só oferece trial se o usuário NUNCA teve assinatura (cliente novo)
    // Se já teve assinatura (mesmo que expirada ou em trial e assinando), NÃO oferece trial
    const ofertarTrial = isNovoUsuario ? 7 : undefined;

    // 🚀 Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://techflow-saas-livid.vercel.app/assinatura/sucesso',
      cancel_url: 'https://techflow-saas-livid.vercel.app/assinatura',
      metadata: { userId: userId.toString() },
      client_reference_id: userId.toString(),
      subscription_data: {
        trial_period_days: ofertarTrial,
        metadata: { userId: userId.toString() }
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('🔥 ERRO ao criar checkout:', error);
    return res.status(500).json({
      error: error.message || 'Erro interno ao criar sessão de checkout'
    });
  }
}