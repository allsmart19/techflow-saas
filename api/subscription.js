// api/subscription.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Permitir apenas GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subscriptionId } = req.query;

  if (!subscriptionId) {
    return res.status(400).json({ error: 'subscriptionId é obrigatório' });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Retornar apenas os campos necessários
    const data = {
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      plan: subscription.items.data[0]?.price?.nickname || 'Pro',
      customer: subscription.customer,
    };
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ error: error.message });
  }
}