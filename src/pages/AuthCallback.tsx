// src/pages/AuthCallback.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("🔍 Processando callback do Google...")
        
        // 🔥 IMPORTANTE: Aguardar a sessão ser estabelecida
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("❌ Erro ao obter sessão:", sessionError)
          window.location.href = '/login'
          return
        }

        const user = session?.user

        if (!user) {
          console.error("❌ Nenhum usuário encontrado na sessão")
          window.location.href = '/login'
          return
        }

        console.log("✅ Usuário autenticado:", user.email)

        // Buscar ou criar usuário na tabela usuarios
        let { data: existingUser, error: fetchError } = await supabase
          .from('usuarios')
          .select('id, username, role, loja_id, email')
          .eq('email', user.email)
          .maybeSingle()

        if (fetchError) {
          console.error("❌ Erro ao buscar usuário:", fetchError)
          window.location.href = '/login'
          return
        }

        let userData

        if (!existingUser) {
          console.log("📝 Criando novo usuário...")
          const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'user'
          
          const { data: lojaPadrao } = await supabase
            .from('lojas')
            .select('id')
            .eq('id', 1)
            .single()
          
          const { data: newUser, error: insertError } = await supabase
            .from('usuarios')
            .insert({
              username: username.toLowerCase(),
              email: user.email,
              role: 'user',
              ativo: true,
              loja_id: lojaPadrao?.id || 1
            })
            .select()
            .single()

          if (insertError) {
            console.error("❌ Erro ao criar usuário:", insertError)
            window.location.href = '/login'
            return
          }

          userData = {
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
            loja_id: newUser.loja_id,
            email: newUser.email
          }
        } else {
          userData = {
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role,
            loja_id: existingUser.loja_id,
            email: existingUser.email
          }
        }

        // Salvar no sessionStorage
        sessionStorage.setItem('user', JSON.stringify(userData))
        
        console.log("🚀 Redirecionando para dashboard...", userData)
        
        // 🔥 FORÇAR REDIRECIONAMENTO ABSOLUTO
        window.location.href = '/dashboard'
        
      } catch (err) {
        console.error("❌ Erro inesperado:", err)
        window.location.href = '/login'
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      <span className="ml-2 text-gray-600 dark:text-gray-400">Autenticando...</span>
    </div>
  )
}