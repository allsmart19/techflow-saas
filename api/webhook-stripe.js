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
    console.error(`❌ Erro: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      if (subscriptionId && userId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const planName = subscription.items.data[0]?.price?.nickname || 'Pro';
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

        await supabase.from('assinaturas').upsert({
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

        console.log('✅ Assinatura salva:', subscriptionId);
      }
      break;

    case 'customer.subscription.updated':
      const updatedSub = event.data.object;
      await supabase
        .from('assinaturas')
        .update({
          status: updatedSub.status,
          data_expiracao: new Date(updatedSub.current_period_end * 1000),
          trial_end: updatedSub.trial_end ? new Date(updatedSub.trial_end * 1000) : null,
          cancel_at_period_end: updatedSub.cancel_at_period_end,
          updated_at: new Date(),
        })
        .eq('stripe_subscription_id', updatedSub.id);
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      await supabase
        .from('assinaturas')
        .update({ status: 'canceled', updated_at: new Date() })
        .eq('stripe_subscription_id', deletedSub.id);
      break;

    default:
      console.log(`Evento não tratado: ${event.type}`);
  }

  res.status(200).json({ received: true });
}