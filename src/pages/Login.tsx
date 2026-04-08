import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { getConfigLoja } from "../services/configService"

// Função para gerar hash SHA-256
async function gerarHashSimples(senha: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(senha)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      console.log('Tentando login com:', username)
      
      const { data, error: fetchError } = await supabase
        .from("usuarios")
        .select("id, username, senha, role, ativo")
        .eq("username", username.toLowerCase())
        .single()
      
      if (fetchError || !data) {
        console.error('Usuário não encontrado:', fetchError)
        setError("Usuário não encontrado!")
        setLoading(false)
        return
      }
      
      console.log('Usuário encontrado:', data.username, 'Ativo:', data.ativo)
      
      if (data.ativo === false) {
        setError("Usuário desativado! Contate o administrador.")
        setLoading(false)
        return
      }
      
      const hashDigitado = await gerarHashSimples(password)
      console.log('Hash gerado, comparando...')
      
      if (hashDigitado === data.senha) {
        localStorage.setItem("user", JSON.stringify({ 
          id: data.id, 
          username: data.username,
          role: data.role 
        }))
        console.log('Login bem sucedido!')
        navigate("/dashboard")
      } else {
        setError("Senha incorreta!")
      }
    } catch (err) {
      console.error('Erro no login:', err)
      setError("Erro ao fazer login. Tente novamente.")
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={nomeLoja} 
                className="w-20 h-20 object-contain rounded-2xl"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl text-white">🔧</span>
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{nomeLoja}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Gestão de Pedidos e Consertos</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Digite seu usuário"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          © 2025 {nomeLoja} - Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}