// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  let event
  try {
    const body = await req.text()
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error(`❌ Assinatura inválida: ${err.message}`)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object
      const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : null
      const subscriptionId = session.subscription
      const customerId = session.customer

      if (!subscriptionId) break

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
      const planName = subscription.items.data[0]?.price?.nickname || 'Pro'
      
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
      }, { onConflict: 'stripe_subscription_id' })
      break

    case 'customer.subscription.updated':
      const updatedSub = event.data.object
      const updatedPeriodEnd = new Date(updatedSub.current_period_end * 1000)
      const trialEnd = updatedSub.trial_end ? new Date(updatedSub.trial_end * 1000) : null;

      await supabase.from('assinaturas').update({
        status: updatedSub.status,
        data_expiracao: updatedPeriodEnd,
        trial_end: trialEnd,
        cancel_at_period_end: updatedSub.cancel_at_period_end,
        updated_at: new Date(),
      }).eq('stripe_subscription_id', updatedSub.id)
      break

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object
      await supabase.from('assinaturas').update({
        status: 'canceled',
        updated_at: new Date(),
      }).eq('stripe_subscription_id', deletedSub.id)
      break

    case 'invoice.payment_failed':
      const invoice = event.data.object
      const subId = invoice.subscription
      if (subId) {
        await supabase.from('assinaturas').update({
          status: 'past_due',
          updated_at: new Date(),
        }).eq('stripe_subscription_id', subId)
      }
      break
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})