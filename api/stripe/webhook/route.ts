import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {

      // ✅ Checkout concluído
      case 'checkout.session.completed': {
        const session: any = event.data.object

        const userId = session.metadata?.userId
        const subscriptionId = session.subscription
        const customerId = session.customer

        if (!userId || !subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        await supabase.from('assinaturas').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          price_id: subscription.items.data[0].price.id,
          data_expiracao: new Date(subscription.current_period_end * 1000),
          trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          cancel_at_period_end: subscription.cancel_at_period_end
        }, {
          onConflict: 'stripe_subscription_id'
        })

        break
      }

      // 🔄 Atualização
      case 'customer.subscription.updated': {
        const sub: any = event.data.object

        await supabase
          .from('assinaturas')
          .update({
            status: sub.status,
            data_expiracao: new Date(sub.current_period_end * 1000),
            cancel_at_period_end: sub.cancel_at_period_end,
            trial_end: sub.trial_end
              ? new Date(sub.trial_end * 1000)
              : null
          })
          .eq('stripe_subscription_id', sub.id)

        break
      }

      // ❌ Cancelamento
      case 'customer.subscription.deleted': {
        const sub: any = event.data.object

        await supabase
          .from('assinaturas')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', sub.id)

        break
      }
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}