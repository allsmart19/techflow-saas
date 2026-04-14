import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { getConfigLoja } from "../services/configService"
import { signInWithGoogle, signUpWithEmail } from "../services/authService"

// Hash legado SHA-256
async function gerarHashSimples(senha: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(senha)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

export default function Login() {
  const navigate = useNavigate()

  const [isLogin, setIsLogin] = useState(true)
  const [identifier, setIdentifier] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [nomeLoja, setNomeLoja] = useState("TechFlow")

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  async function carregarConfiguracoes() {
    const config = await getConfigLoja()
    if (config) {
      setNomeLoja(config.nome_loja)
      setLogoUrl(config.logo_url)
    }
  }

  // =========================
  // LOGIN (CONSULTA SIMPLES E DIRETA)
  // =========================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const identifierLower = identifier.toLowerCase().trim()
      console.log("🔍 Buscando usuário:", identifierLower)

      // 🔥 Consulta mais simples - tentar primeiro por username
      let userData = null

      // Tentar por username
      const { data: byUsername, error: errUsername } = await supabase
        .from("usuarios")
        .select("*")
        .eq("username", identifierLower)
        .maybeSingle()

      console.log("🔍 Busca por username:", byUsername)
      console.log("❌ Erro username:", errUsername)

      if (byUsername) {
        userData = byUsername
      } else {
        // Tentar por email
        const { data: byEmail, error: errEmail } = await supabase
          .from("usuarios")
          .select("*")
          .eq("email", identifierLower)
          .maybeSingle()
        
        console.log("🔍 Busca por email:", byEmail)
        console.log("❌ Erro email:", errEmail)

        if (byEmail) {
          userData = byEmail
        }
      }

      console.log("📦 Dados finais:", userData)

      if (!userData) {
        setError("Usuário não encontrado! Verifique se o cadastro foi concluído.")
        setLoading(false)
        return
      }

      // Verificação do campo ativo
      const isAtivo = userData.ativo === true || 
                      userData.ativo === "true" || 
                      userData.ativo === 1 ||
                      userData.ativo === "1"

      console.log("✅ Ativo:", isAtivo, "Valor bruto:", userData.ativo)

      if (!isAtivo) {
        setError("Usuário desativado! Contate o administrador.")
        setLoading(false)
        return
      }

      // Verificar loja_id
      if (!userData.loja_id) {
        setError("Conta sem loja vinculada. Contate o suporte.")
        setLoading(false)
        return
      }

      // =========================
      // LOGIN SUPABASE AUTH (para usuários sem senha hash)
      // =========================
      if (!userData.senha) {
        console.log("🔐 Tentando login via Supabase Auth")
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password
        })

        if (signInError) {
          console.error("❌ Erro no Auth:", signInError)
          setError("Senha incorreta!")
          setLoading(false)
          return
        }

        sessionStorage.setItem("user", JSON.stringify({
          id: userData.id,
          username: userData.username,
          role: userData.role,
          loja_id: userData.loja_id
        }))

        navigate("/dashboard")
        return
      }

      // =========================
      // LOGIN LEGADO (SHA256)
      // =========================
      console.log("🔐 Verificando hash SHA256")
      const hashDigitado = await gerarHashSimples(password)

      if (hashDigitado !== userData.senha) {
        setError("Senha incorreta!")
        setLoading(false)
        return
      }

      sessionStorage.setItem("user", JSON.stringify({
        id: userData.id,
        username: userData.username,
        role: userData.role,
        loja_id: userData.loja_id
      }))

      navigate("/dashboard")

    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      setError("Erro interno ao fazer login")
    }

    setLoading(false)
  }

  // =========================
  // CADASTRO
  // =========================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setLoading(false)
      return
    }

    const result = await signUpWithEmail(email, password, username)

    if (result.success) {
      alert("Cadastro realizado! Faça login para continuar.")
      setIsLogin(true)
      setEmail("")
      setUsername("")
      setPassword("")
      setConfirmPassword("")
      setIdentifier("")
    } else {
      setError(result.error || "Erro ao cadastrar")
    }

    setLoading(false)
  }

// GOOGLE LOGIN (CORRIGIDO)
const handleGoogleLogin = async () => {
  setLoading(true)
  setError("")

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (error) {
      console.error("❌ Erro Google:", error)
      setError("Erro ao entrar com Google: " + error.message)
      setLoading(false)
      return
    }

    if (data?.url) {
      window.location.href = data.url
    } else {
      throw new Error("URL não retornada")
    }
  } catch (err: any) {
    console.error("❌ Erro Google:", err)
    setError(err.message || "Erro ao entrar com Google")
    setLoading(false)
  }
}

  // =========================
  // ESQUECI SENHA
  // =========================
  const handleForgotPassword = async () => {
    const emailInput = identifier.includes("@") ? identifier : email

    if (!emailInput || !emailInput.includes("@")) {
      setError("Digite um e-mail válido para recuperar senha")
      return
    }

    setLoading(true)
    setError("")

    const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      console.error("❌ Erro ao enviar e-mail:", error)
      setError("Erro ao enviar e-mail de recuperação")
    } else {
      alert("E-mail de recuperação enviado! Verifique sua caixa de entrada.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          {logoUrl ? (
            <img src={logoUrl} className="w-20 h-20 mx-auto object-contain" alt="Logo" />
          ) : (
            <div className="text-4xl">🔧</div>
          )}
          <h1 className="font-bold text-2xl mt-2 text-gray-900 dark:text-white">{nomeLoja}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestão de Pedidos e Consertos</p>
        </div>

        <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              isLogin ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              !isLogin ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Criar Conta
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center mb-4">
            {error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuário
              </label>
              <input
                type="text"
                placeholder="Digite seu nome de usuário"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Digite apenas o nome de usuário (não o e-mail)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Esqueci minha senha
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome de Usuário
              </label>
              <input
                type="text"
                placeholder="Como você será conhecido"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? "Cadastrando..." : "Criar Conta"}
            </button>
          </form>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">ou</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Entrar com Google
        </button>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          © 2025 {nomeLoja} - Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}