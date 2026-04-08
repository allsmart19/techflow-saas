// api/assinaturas.js (para Vercel/Netlify) ou server.js (para backend próprio)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Criar sessão de checkout
  if (req.method === 'POST' && req.url === '/api/create-checkout-session') {
    try {
      const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body;

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card', 'boleto', 'pix'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: userEmail,
        metadata: {
          userId: userId.toString(),
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      });

      return res.status(200).json({ id: session.id, url: session.url });
    } catch (error) {
      console.error('Erro:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Criar portal de gerenciamento
  if (req.method === 'POST' && req.url === '/api/create-portal-session') {
    try {
      const { customerId, returnUrl } = req.body;

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return res.status(200).json({ url: session.url });
    } catch (error) {
      console.error('Erro:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Webhook para eventos do Stripe
  if (req.method === 'POST' && req.url === '/api/stripe-webhook') {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Erro no webhook:', err);
      return res.status(400).json({ error: 'Webhook Error' });
    }

    // Processar eventos
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        // Aqui você salva a assinatura no seu banco de dados
        await salvarAssinatura(session);
        break;
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await atualizarAssinatura(subscription);
        break;
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await cancelarAssinatura(deletedSubscription);
        break;
      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  }

  return res.status(404).json({ error: 'Rota não encontrada' });
}

async function salvarAssinatura(session) {
  // Implementar lógica para salvar no Supabase
  const { data, error } = await supabase
    .from('assinaturas')
    .upsert({
      user_id: parseInt(session.metadata.userId),
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      status: 'active',
      plano: session.line_items?.data[0]?.price?.nickname || 'Pro',
      data_inicio: new Date(),
      data_expiracao: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

  if (error) {
    console.error('Erro ao salvar assinatura:', error);
  }
}