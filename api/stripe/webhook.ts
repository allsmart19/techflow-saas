import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

export const config = {
  api: {
    bodyParser: false
  }
}

// ===============================
// STRIPE (versão estável Vercel)
// ===============================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any
})

// ===============================
// SUPABASE ADMIN
// ===============================
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ===============================
// BUFFER RAW BODY
// ===============================
async function buffer(readable: any) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

// ===============================
// SAFE DATE
// ===============================
function safeDate(timestamp?: number | null) {
  if (!timestamp) return null
  return new Date(timestamp * 1000).toISOString()
}

// ===============================
// WEBHOOK HANDLER
// ===============================
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed")
  }

  const sig = req.headers["stripe-signature"]

  let event: Stripe.Event

  try {
    const rawBody = await buffer(req)

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("❌ Webhook signature error:", err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    console.log("📩 Event:", event.type)

    // ======================================================
    // CHECKOUT COMPLETED (CRIA ASSINATURA)
    // ======================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const subscriptionId = session.subscription as string
      const userId = session.metadata?.userId

      if (!subscriptionId || !userId) {
        console.log("❌ Missing data checkout.session.completed")
        return res.status(400).json({ error: "missing data" })
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)

      const payload = {
        user_id: Number(userId),
        stripe_subscription_id: subscription.id,
        stripe_customer_id: session.customer as string,

        status: subscription.status,
        plano: subscription.items.data[0]?.price?.id || "unknown",

        data_inicio: safeDate((subscription as any).current_period_start),
        data_expiracao: safeDate((subscription as any).current_period_end),

        trial_end: safeDate(subscription.trial_end as any),

        cancel_at_period_end: subscription.cancel_at_period_end
      }

      const { error } = await supabase
        .from("assinaturas")
        .upsert(payload, {
          onConflict: "stripe_subscription_id"
        })

      if (error) {
        console.error("❌ Supabase error:", error)
      } else {
        console.log("✅ Assinatura criada/atualizada")
      }
    }

    // ======================================================
    // SUBSCRIPTION UPDATED (ATUALIZA STATUS)
    // ======================================================
    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription

      const payload = {
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,

        status: sub.status,
        plano: sub.items.data[0]?.price?.id || "unknown",

        data_inicio: safeDate((sub as any).current_period_start),
        data_expiracao: safeDate((sub as any).current_period_end),

        trial_end: safeDate(sub.trial_end as any),

        cancel_at_period_end: sub.cancel_at_period_end
      }

      const { error } = await supabase
        .from("assinaturas")
        .update(payload)
        .eq("stripe_subscription_id", sub.id)

      if (error) {
        console.error("❌ Update error:", error)
      } else {
        console.log("✅ Assinatura atualizada")
      }
    }

    // ======================================================
    // SUBSCRIPTION DELETED
    // ======================================================
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription

      await supabase
        .from("assinaturas")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", sub.id)

      console.log("🗑️ Assinatura cancelada")
    }

    return res.status(200).json({ received: true })
  } catch (error: any) {
    console.error("🔥 Webhook crash:", error)
    return res.status(500).json({ error: error.message })
  }
}