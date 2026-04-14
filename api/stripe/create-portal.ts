// api/stripe/create-portal.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any
});

export default async function handler(req: any, res: any) {
  // 🔥 PERMITIR APENAS POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' });
    }

    // Criar sessão do portal do cliente
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin}/assinatura`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('❌ Erro ao criar portal session:', error);
    return res.status(500).json({ error: error.message });
  }
}