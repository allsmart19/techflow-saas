// src/pages/ResetPassword.tsx
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: "success" | "error" | "warning"; texto: string } | null>(null)
  const [verificando, setVerificando] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Erro ao verificar sessão:", error)
          setMensagem({ tipo: "error", texto: "Link inválido ou expirado. Solicite um novo link de redefinição." })
        } else if (!session) {
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (!retrySession) {
              setMensagem({ tipo: "error", texto: "Link inválido ou expirado. Solicite um novo link de redefinição." })
            }
            setVerificando(false)
          }, 1000)
        } else {
          setVerificando(false)
        }
      } catch (err) {
        console.error("Erro:", err)
        setMensagem({ tipo: "error", texto: "Erro ao verificar link. Tente novamente." })
        setVerificando(false)
      }
    }

    checkSession()
  }, [location])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limpar mensagem anterior
    setMensagem(null)

    // Validação: campos vazios
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setMensagem({ tipo: "error", texto: "Por favor, preencha ambos os campos de senha." })
      setTimeout(() => setMensagem(null), 4000)
      return
    }

    // Validação: senhas não coincidem
    if (newPassword !== confirmPassword) {
      setMensagem({ tipo: "error", texto: "As senhas não coincidem. Verifique e tente novamente." })
      setTimeout(() => setMensagem(null), 4000)
      return
    }

    // Validação: tamanho mínimo
    if (newPassword.length < 6) {
      setMensagem({ tipo: "error", texto: "A senha deve ter pelo menos 6 caracteres." })
      setTimeout(() => setMensagem(null), 4000)
      return
    }

    setLoading(true)

    try {
      // Tentar atualizar a senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        // Tratamento específico para erro de mesma senha
        if (error.message?.includes("same as the old password") || 
            error.message?.includes("新密码与旧密码相同") ||
            error.message?.toLowerCase().includes("same")) {
          setMensagem({ 
            tipo: "warning", 
            texto: "A nova senha é igual à senha atual. Por favor, escolha uma senha diferente." 
          })
          setLoading(false)
          setTimeout(() => setMensagem(null), 5000)
          return
        }
        
        // Outros erros
        throw error
      }

      // Sucesso
      setMensagem({ 
        tipo: "success", 
        texto: "Senha alterada com sucesso! Redirecionando para o login..." 
      })
      
      // Fazer logout para forçar o usuário a fazer login com a nova senha
      await supabase.auth.signOut()
      
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error)
      
      // Tratamento de diferentes tipos de erro
      if (error.message?.includes("Password should be different")) {
        setMensagem({ 
          tipo: "warning", 
          texto: "A nova senha não pode ser igual à senha atual. Por favor, escolha uma senha diferente." 
        })
      } else if (error.message?.includes("weak")) {
        setMensagem({ 
          tipo: "error", 
          texto: "Senha muito fraca. Use uma combinação de letras, números e caracteres especiais." 
        })
      } else if (error.message?.includes("timeout") || error.message?.includes("network")) {
        setMensagem({ 
          tipo: "error", 
          texto: "Erro de conexão. Verifique sua internet e tente novamente." 
        })
      } else {
        setMensagem({ 
          tipo: "error", 
          texto: error.message || "Erro ao redefinir senha. Tente novamente mais tarde." 
        })
      }
      setTimeout(() => setMensagem(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900">
        <div className="bg-white dark:bg-gray-800 w-full max-w-md p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Verificando link...</p>
          </div>
        </div>
      </div>
    )
  }

  // Se houver mensagem de erro (link inválido)
  if (mensagem && mensagem.tipo === "error" && !newPassword && !confirmPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900">
        <div className="bg-white dark:bg-gray-800 w-full max-w-md p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">{mensagem.texto}</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition"
            >
              Voltar para o login
            </button>
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

        {/* Mensagem de sucesso */}
        {mensagem && mensagem.tipo === "success" && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-4 h-4" />
            {mensagem.texto}
          </div>
        )}

        {/* Mensagem de aviso (senha igual) */}
        {mensagem && mensagem.tipo === "warning" && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-4 h-4" />
            {mensagem.texto}
          </div>
        )}

        {/* Mensagem de erro (outros erros) */}
        {mensagem && mensagem.tipo === "error" && !mensagem.texto.includes("Link") && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4" />
            {mensagem.texto}
          </div>
        )}

        {(!mensagem || (mensagem.tipo !== "success" && !mensagem.texto.includes("Link"))) && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Campo Nova Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-amber-500 mt-1">⚠️ A senha deve ter pelo menos 6 caracteres</p>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Digite a senha novamente"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">❌ As senhas não coincidem</p>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                <p className="text-xs text-green-500 mt-1">✅ Senhas coincidem</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Alterando senha...
                </span>
              ) : (
                "Alterar Senha"
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 mt-2"
            >
              Voltar para o login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}