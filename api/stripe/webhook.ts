import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: {
    bodyParser: false, // 🔥 necessário pro Stripe
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 🔥 função para ler o raw body (obrigatório)
async function buffer(readable: any) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  const sig = req.headers['stripe-signature']

  let event: Stripe.Event

  try {
    const buf = await buffer(req)

    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('❌ Erro webhook:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    // 🎯 EVENTOS PRINCIPAIS
    switch (event.type) {

      // ✅ NOVA ASSINATURA / TRIAL
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string
          const userId = session.metadata?.userId

          const subscription = await stripe.subscriptions.retrieve(subscriptionId)

          await supabase.from('assinaturas').upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            status: subscription.status,
            plano: subscription.items.data[0].price.id,
            data_inicio: new Date(subscription.current_period_start * 1000),
            data_expiracao: new Date(subscription.current_period_end * 1000),
            trial_end: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end
          })
        }

        break
      }

      // 🔄 ATUALIZAÇÃO DE ASSINATURA
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        await supabase.from('assinaturas').upsert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          status: subscription.status,
          plano: subscription.items.data[0].price.id,
          data_inicio: new Date(subscription.current_period_start * 1000),
          data_expiracao: new Date(subscription.current_period_end * 1000),
          trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          cancel_at_period_end: subscription.cancel_at_period_end
        })

        break
      }

      // ❌ CANCELAMENTO
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('assinaturas')
          .update({
            status: 'canceled'
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    return res.status(200).json({ received: true })

  } catch (error: any) {
    console.error('❌ Erro processamento webhook:', error)
    return res.status(500).json({ error: error.message })
  }
}