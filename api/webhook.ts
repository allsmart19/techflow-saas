import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event

  try {
    const buf = await buffer(req)

    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err: any) {
    console.error('❌ Erro no webhook:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    // 🔥 EVENTO PRINCIPAL
    if (event.type === 'checkout.session.completed') {
      const session: any = event.data.object

      const userId = session.metadata?.userId
      const customerId = session.customer
      const subscriptionId = session.subscription

      if (!userId) {
        console.error('❌ userId não encontrado no metadata')
        return res.status(400).send('userId missing')
      }

      // 🔎 Buscar dados da assinatura no Stripe
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)

      // 💾 SALVAR NO SUPABASE
      const { error } = await supabase.from('assinaturas').insert({
        user_id: Number(userId),
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: subscription.status,
        plano: 'pro',
        data_inicio: new Date(subscription.current_period_start * 1000).toISOString(),
        data_expiracao: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end
      })

      if (error) {
        console.error('❌ Erro ao salvar no Supabase:', error)
      } else {
        console.log('✅ Assinatura salva com sucesso!')
      }
    }

    return res.status(200).json({ received: true })

  } catch (error) {
    console.error('❌ Erro geral webhook:', error)
    return res.status(500).send('Erro interno')
  }
}

// 🔥 FUNÇÃO NECESSÁRIA
import { buffer } from 'micro'