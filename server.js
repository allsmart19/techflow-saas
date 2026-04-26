// server.js
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import 'dotenv/config';

const app = express();

// Inicializar Stripe apenas quando necessário, não no startup
let stripe = null;

function initializeStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

app.post('/api/create-checkout', async (req, res) => {
  try {
    const stripe = initializeStripe();
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe não está configurado' });
    }

    const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body;

    // Buscar ou criar cliente
    let customer;
    const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId: userId.toString() }
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: userId.toString() },
      subscription_data: { trial_period_days: 7 }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar sessão' });
  }
});

app.post('/api/create-portal-session', async (req, res) => {
  try {
    const stripe = initializeStripe();
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe não está configurado' });
    }

    const { customerId, returnUrl } = req.body;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar sessão do portal' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});