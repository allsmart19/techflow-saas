// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js'

// ✅ Forma correta no Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ✅ Validação segura
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey)

  throw new Error('supabaseUrl is required.')
}

// ✅ Cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)