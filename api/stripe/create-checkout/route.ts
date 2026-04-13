import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const body = typeof req.body === "string"
  ? JSON.parse(req.body)
  : req.body

const { priceId, userId, userEmail } = body

    if (!priceId || !userId || !userEmail) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' })
    }

    // 🔎 Verifica se já teve assinatura
    const { data: assinaturaExistente } = await supabase
      .from('assinaturas')
      .select('id')
      .eq('user_id', String(userId))
      .limit(1)

    const isNovoUsuario = !assinaturaExistente || assinaturaExistente.length === 0

    // 🔎 Buscar/criar customer
    let customer

    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId }
      })
    }

    // 💾 salvar no banco
    await supabase
      .from('usuarios')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId)

    // 🎁 trial
    const subscriptionData = isNovoUsuario
      ? { trial_period_days: 7 }
      : {}

    // 💳 criar sessão
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],

      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/assinatura/sucesso`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/assinatura`,

      metadata: { userId },
      client_reference_id: userId,

      subscription_data: {
        ...subscriptionData,
        metadata: { userId }
      }
    })

    return res.status(200).json({ url: session.url })

  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }
}