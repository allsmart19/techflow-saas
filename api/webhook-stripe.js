// api/webhook-stripe.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = await stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('✅ Evento recebido:', event.type);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      console.log('💰 Checkout completed:', { userId, subscriptionId, customerId });

      if (subscriptionId && userId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const planName = subscription.items.data[0]?.price?.nickname || 'Pro';
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

        const { error } = await supabase.from('assinaturas').upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          status: subscription.status,
          plano: planName,
          data_inicio: new Date(),
          data_expiracao: currentPeriodEnd,
          trial_end: trialEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, { onConflict: 'stripe_subscription_id' });

        if (error) {
          console.error('❌ Erro ao salvar:', error);
        } else {
          console.log('✅ Assinatura salva com sucesso!');
        }
      }
      break;
  }

  res.status(200).json({ received: true });
}