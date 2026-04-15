// api/webhook-stripe.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Log para debug
  console.log('🔔 Webhook chamado! Método:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    console.error('❌ Nenhuma assinatura Stripe encontrada');
    return res.status(400).json({ error: 'No signature' });
  }

  let event;
  try {
    event = await stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('✅ Evento verificado:', event.type);
  } catch (err) {
    console.error('❌ Erro na verificação:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
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
            console.error('❌ Erro ao salvar assinatura:', error);
          } else {
            console.log('✅ Assinatura salva com sucesso!');
          }
        }
        break;

      case 'customer.subscription.created':
        const newSub = event.data.object;
        const newUserId = newSub.metadata?.userId ? parseInt(newSub.metadata.userId) : null;
        const newSubscriptionId = newSub.id;
        const newCustomerId = newSub.customer;

        console.log('🆕 Assinatura criada:', { newUserId, newSubscriptionId, newCustomerId });

        if (newSubscriptionId && newUserId) {
          const planName = newSub.items.data[0]?.price?.nickname || 'Pro';
          const currentPeriodEnd = new Date(newSub.current_period_end * 1000);
          const trialEnd = newSub.trial_end ? new Date(newSub.trial_end * 1000) : null;

          const { error } = await supabase.from('assinaturas').upsert({
            user_id: newUserId,
            stripe_subscription_id: newSubscriptionId,
            stripe_customer_id: newCustomerId,
            status: newSub.status,
            plano: planName,
            data_inicio: new Date(),
            data_expiracao: currentPeriodEnd,
            trial_end: trialEnd,
            cancel_at_period_end: newSub.cancel_at_period_end,
          }, { onConflict: 'stripe_subscription_id' });

          if (error) {
            console.error('❌ Erro ao salvar assinatura:', error);
          } else {
            console.log('✅ Assinatura salva com sucesso!');
          }
        }
        break;

      case 'customer.subscription.updated':
        const updatedSub = event.data.object;
        console.log('🔄 Assinatura atualizada:', updatedSub.id);
        
        await supabase
          .from('assinaturas')
          .update({
            status: updatedSub.status,
            data_expiracao: new Date(updatedSub.current_period_end * 1000),
            trial_end: updatedSub.trial_end ? new Date(updatedSub.trial_end * 1000) : null,
            cancel_at_period_end: updatedSub.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', updatedSub.id);
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        console.log('❌ Assinatura cancelada:', deletedSub.id);
        
        await supabase
          .from('assinaturas')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', deletedSub.id);
        break;

      default:
        console.log(`📌 Evento não tratado: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('🔥 Erro no processamento:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}