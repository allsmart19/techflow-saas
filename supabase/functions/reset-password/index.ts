// supabase/functions/reset-password/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { userId, newPassword } = await req.json()

    if (!userId || !newPassword) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
    }

    // Buscar o email do usuário
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('email')
      .eq('id', userId)
      .single()

    if (userError || !userData?.email) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
    }

    // Atualizar senha usando Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId.toString(),
      { password: newPassword }
    )

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})