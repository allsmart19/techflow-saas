// src/pages/ResetPassword.tsx
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: "success" | "error"; texto: string } | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    // Extrair o token da URL (hash fragment)
    const hashParams = new URLSearchParams(location.hash.substring(1))
    const token = hashParams.get("access_token")
    
    if (token) {
      setAccessToken(token)
    } else {
      setMensagem({ tipo: "error", texto: "Link inválido ou expirado. Solicite um novo link de redefinição." })
    }
  }, [location])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setMensagem({ tipo: "error", texto: "As senhas não coincidem" })
      setTimeout(() => setMensagem(null), 3000)
      return
    }

    if (newPassword.length < 6) {
      setMensagem({ tipo: "error", texto: "A senha deve ter pelo menos 6 caracteres" })
      setTimeout(() => setMensagem(null), 3000)
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMensagem({ tipo: "success", texto: "Senha alterada com sucesso! Redirecionando para o login..." })
      
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error)
      setMensagem({ tipo: "error", texto: error.message || "Erro ao redefinir senha. Tente novamente." })
    } finally {
      setLoading(false)
    }
  }

  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900">
        <div className="bg-white dark:bg-gray-800 w-full max-w-md p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            {mensagem?.tipo === "error" ? (
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            ) : (
              <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
            )}
            <p className="text-gray-600 dark:text-gray-400">{mensagem?.texto || "Verificando link..."}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          <h1 className="font-bold text-2xl text-gray-900 dark:text-white">Redefinir Senha</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Digite sua nova senha</p>
        </div>

        {mensagem && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
            mensagem.tipo === "success" 
              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
              : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
          }`}>
            {mensagem.tipo === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Digite a senha novamente"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? "Alterando senha..." : "Alterar Senha"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 mt-2"
          >
            Voltar para o login
          </button>
        </form>
      </div>
    </div>
  )
}