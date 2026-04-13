import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  // 🔥 CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    // 🔥 CRIAR INSTÂNCIAS DENTRO DO TRY (CRUCIAL)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body

    const { priceId, userId, userEmail } = body || {}

    if (!priceId || !userId || !userEmail) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' })
    }

    // 🔎 Verificar assinatura
    const { data: assinaturaExistente } = await supabase
      .from('assinaturas')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    const isNovoUsuario = !assinaturaExistente || assinaturaExistente.length === 0

    // 🔎 Customer
    let customer
    const existing = await stripe.customers.list({
      email: userEmail,
      limit: 1
    })

    if (existing.data.length > 0) {
      customer = existing.data[0]
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId }
      })
    }

    // 💾 Salvar
    await supabase
      .from('usuarios')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/assinatura/sucesso`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/assinatura`,
      metadata: { userId },
      client_reference_id: userId,
      subscription_data: {
        trial_period_days: isNovoUsuario ? 7 : undefined,
        metadata: { userId }
      }
    })

    return res.status(200).json({ url: session.url })

  } catch (error: any) {
    console.error('🔥 ERRO:', error)

    return res.status(500).json({
      error: error.message || 'Erro interno'
    })
  }
}