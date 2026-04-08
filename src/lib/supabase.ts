import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Logs para debug
console.log('🔧 Inicializando Supabase...')
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ FALTANDO')
console.log('Key:', supabaseAnonKey ? '✅ Configurada' : '❌ FALTANDO')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas!')
  console.error('Verifique o arquivo .env na raiz do projeto')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')