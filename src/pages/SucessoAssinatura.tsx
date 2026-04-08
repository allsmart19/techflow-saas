// src/pages/SucessoAssinatura.tsx
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, ArrowLeft } from "lucide-react"

export default function SucessoAssinatura() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/assinatura")
    }, 5000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Assinatura Confirmada!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sua assinatura foi ativada com sucesso. Você já tem acesso a todos os recursos.
        </p>
        <button
          onClick={() => navigate("/assinatura")}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      </div>
    </div>
  )
}