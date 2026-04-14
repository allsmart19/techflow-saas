// api/test.js
export default async function handler(req, res) {
  console.log('🔔 Função test chamada!');
  
  res.status(200).json({ 
    message: 'Função está funcionando!',
    env: {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
}