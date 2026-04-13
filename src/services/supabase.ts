// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Usar any para bypass do TypeScript (solução temporária)
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!')
  throw new Error('Supabase credentials missing')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
