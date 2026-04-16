// api/webhook-stripe.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let rawBody = '';
  for await (const chunk of req) {
    rawBody += chunk;
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = await stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log('✅ Evento verificado:', event.type);
  } catch (err) {
    console.error('❌ Erro na verificação:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      // 🔥 APENAS ESTE EVENTO SALVA A ASSINATURA
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        console.log('📦 Dados recebidos:', { userId, subscriptionId, customerId });

        if (subscriptionId && userId) {
          // Atualizar stripe_customer_id na tabela usuarios
          await supabase
            .from('usuarios')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);

          // Aguardar 2 segundos para o Stripe processar completamente
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          const PLAN_NAMES = {
            "price_1TLlGuGhIX9bHHYRIwSV4W4o": "Plano Pro Mensal",
            "price_1TLlJqGhIX9bHHYRPHdBYv09": "Plano Pro Anual"
          };

          const priceId = subscription.items.data[0]?.price?.id;
          const planName = PLAN_NAMES[priceId] || subscription.items.data[0]?.price?.nickname || "Pro";
          
          let dataExpiracao;
          if (subscription.current_period_end) {
            dataExpiracao = new Date(subscription.current_period_end * 1000);
          } else {
            const isMensal = priceId === "price_1TLlGuGhIX9bHHYRIwSV4W4o";
            const dias = isMensal ? 30 : 365;
            dataExpiracao = new Date();
            dataExpiracao.setDate(dataExpiracao.getDate() + dias);
            console.log(`⚠️ Fallback: ${dias} dias para expiração`);
          }

          const { error } = await supabase.from('assinaturas').upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            status: subscription.status,
            plano: planName,
            data_inicio: new Date(),
            data_expiracao: dataExpiracao,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            cancel_at_period_end: subscription.cancel_at_period_end || false,
          }, { onConflict: 'stripe_subscription_id' });

          if (error) {
            console.error('❌ Erro Supabase:', error);
          } else {
            console.log('✅ Assinatura salva! data_expiracao:', dataExpiracao);
          }
        }
        break;
      }

case 'customer.subscription.updated': {
  const updatedSub = event.data.object;
  console.log('🔄 Assinatura atualizada:', updatedSub.id);
  console.log('📅 current_period_end:', updatedSub.current_period_end);
  
  const novaDataExpiracao = updatedSub.current_period_end 
    ? new Date(updatedSub.current_period_end * 1000) 
    : null;
  
  if (novaDataExpiracao) {
    const { error } = await supabase
      .from('assinaturas')
      .update({
        status: updatedSub.status,
        data_expiracao: novaDataExpiracao,
        cancel_at_period_end: updatedSub.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', updatedSub.id);
    
    if (error) {
      console.error('❌ Erro ao atualizar assinatura:', error);
    } else {
      console.log('✅ Assinatura atualizada com data_expiracao:', novaDataExpiracao);
    }
  }
  break;
}

      case 'customer.subscription.deleted': {
        const deletedSub = event.data.object;
        console.log('❌ Assinatura cancelada:', deletedSub.id);
        
        const { error } = await supabase
          .from('assinaturas')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', deletedSub.id);
        
        if (error) {
          console.error('❌ Erro ao marcar como cancelada:', error);
        } else {
          console.log('✅ Assinatura marcada como cancelada no Supabase');
        }
        break;
      }

      default:
        console.log(`📌 Evento não tratado: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('🔥 Erro no processamento:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}