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
        
        // Obter a sessão atual do Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("❌ Erro ao obter sessão:", sessionError)
          navigate('/login', { replace: true })
          return
        }

        const user = session?.user

        if (!user) {
          console.error("❌ Nenhum usuário encontrado na sessão")
          navigate('/login', { replace: true })
          return
        }

        console.log("✅ Usuário autenticado:", user.email)

        // 🔥 PRIMEIRO: Tentar buscar usuário existente pelo email
        let { data: existingUser, error: fetchError } = await supabase
          .from('usuarios')
          .select('id, username, role, loja_id, email')
          .eq('email', user.email)
          .maybeSingle()

        if (fetchError) {
          console.error("❌ Erro ao buscar usuário:", fetchError)
          navigate('/login', { replace: true })
          return
        }

        // 🔥 Se o usuário já existe, apenas atualizar o sessionStorage
        if (existingUser) {
          console.log("✅ Usuário existente encontrado:", existingUser)
          
          sessionStorage.setItem('user', JSON.stringify({
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role,
            loja_id: existingUser.loja_id,
            email: existingUser.email
          }))
          
          // Redirecionar para o dashboard
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 100)
          return
        }

        // 🔥 Se não existe, tentar buscar por username para evitar duplicação
        const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'user'
        const usernameLower = username.toLowerCase()
        
        // Verificar se já existe um usuário com este username
        let { data: userByUsername, error: usernameError } = await supabase
          .from('usuarios')
          .select('id, username, role, loja_id, email')
          .eq('username', usernameLower)
          .maybeSingle()

        if (usernameError) {
          console.error("❌ Erro ao buscar por username:", usernameError)
        }

        // Se existe um usuário com este username mas email diferente, criar username único
        let finalUsername = usernameLower
        let counter = 1
        
        while (userByUsername && userByUsername.email !== user.email) {
          finalUsername = `${usernameLower}${counter}`
          console.log(`🔄 Username ${usernameLower} já existe, tentando ${finalUsername}...`)
          
          const { data: checkUser } = await supabase
            .from('usuarios')
            .select('id')
            .eq('username', finalUsername)
            .maybeSingle()
          
          if (!checkUser) {
            userByUsername = null
          } else {
            counter++
          }
        }

        // Se já existe um usuário com este username E o mesmo email, usar ele
        if (userByUsername && userByUsername.email === user.email) {
          console.log("✅ Usuário já existe (encontrado por username):", userByUsername)
          sessionStorage.setItem('user', JSON.stringify({
            id: userByUsername.id,
            username: userByUsername.username,
            role: userByUsername.role,
            loja_id: userByUsername.loja_id,
            email: userByUsername.email
          }))
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 100)
          return
        }

        // 🔥 Criar novo usuário (com username único)
        console.log("📝 Criando novo usuário com username:", finalUsername)
        
        const { data: lojaPadrao } = await supabase
          .from('lojas')
          .select('id')
          .eq('id', 1)
          .single()
        
        const { data: newUser, error: insertError } = await supabase
          .from('usuarios')
          .insert({
            username: finalUsername,
            email: user.email,
            role: 'user',
            ativo: true,
            loja_id: lojaPadrao?.id || 1
          })
          .select()
          .single()

        if (insertError) {
          console.error("❌ Erro ao criar usuário:", insertError)
          navigate('/login', { replace: true })
          return
        }

        console.log("✅ Usuário criado:", newUser)
        
        sessionStorage.setItem('user', JSON.stringify({
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          loja_id: newUser.loja_id,
          email: newUser.email
        }))

        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 100)
        
      } catch (err) {
        console.error("❌ Erro inesperado:", err)
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      <span className="ml-2 text-gray-600 dark:text-gray-400">Autenticando...</span>
    </div>
  )
}