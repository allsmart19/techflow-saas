import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })

// Headers CORS obrigatórios
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // 1. Responder preflight OPTIONS imediatamente
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  // 2. GET para teste
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', message: 'Function is running' }), {
      status: 200,
      headers: corsHeaders,
    })
  }

  // 3. Apenas POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    const { priceId, userId, userEmail, successUrl, cancelUrl } = await req.json()

    // Validação
    if (!priceId || !userId || !userEmail) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Cliente Stripe
    let customer
    const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 })
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId: userId.toString() }
      })
    }

    // Sessão de checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: userId.toString() },
      subscription_data: { trial_period_days: 7 }
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: corsHeaders,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})