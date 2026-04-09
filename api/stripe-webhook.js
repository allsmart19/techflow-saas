// api/stripe-webhook.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = await stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
        const planName = subscription.items.data[0]?.price?.nickname || 'Pro';

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
      }
      break;

    case 'customer.subscription.updated':
      const updatedSub = event.data.object;
      const updatedPeriodEnd = new Date(updatedSub.current_period_end * 1000);
      const updatedTrialEnd = updatedSub.trial_end ? new Date(updatedSub.trial_end * 1000) : null;

      await supabase.from('assinaturas').update({
        status: updatedSub.status,
        data_expiracao: updatedPeriodEnd,
        trial_end: updatedTrialEnd,
        cancel_at_period_end: updatedSub.cancel_at_period_end,
        updated_at: new Date(),
      }).eq('stripe_subscription_id', updatedSub.id);
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      await supabase.from('assinaturas').update({
        status: 'canceled',
        updated_at: new Date(),
      }).eq('stripe_subscription_id', deletedSub.id);
      break;

    case 'invoice.payment_failed':
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (subId) {
        await supabase.from('assinaturas').update({
          status: 'past_due',
          updated_at: new Date(),
        }).eq('stripe_subscription_id', subId);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
}