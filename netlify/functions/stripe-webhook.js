const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  // Processar eventos
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      const session = stripeEvent.data.object;
      console.log('✅ Pagamento concluído!', session.id);
      
      // Salvar assinatura no Supabase
      await supabase
        .from('assinaturas')
        .upsert({
          user_id: parseInt(session.metadata.userId),
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: 'active',
          plano: session.metadata.plano || 'Pro',
          data_inicio: new Date(),
          data_expiracao: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      break;

    case 'customer.subscription.updated':
      const subscription = stripeEvent.data.object;
      console.log('🔄 Assinatura atualizada!', subscription.id);
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = stripeEvent.data.object;
      console.log('❌ Assinatura cancelada!', deletedSubscription.id);
      
      await supabase
        .from('assinaturas')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', deletedSubscription.id);
      break;

    case 'invoice.payment_failed':
      const invoice = stripeEvent.data.object;
      console.log('⚠️ Pagamento falhou!', invoice.id);
      break;

    default:
      console.log(`📌 Evento não tratado: ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true })
  };
};