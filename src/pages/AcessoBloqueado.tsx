// src/pages/AcessoBloqueado.tsx
import { useNavigate } from "react-router-dom"
import { Shield, CreditCard } from "lucide-react"

export default function AcessoBloqueado() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Acesso Bloqueado
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Seu período de teste gratuito expirou.
          <br />
          Assine um plano para continuar usando o sistema.
        </p>
        <button
          onClick={() => navigate("/assinatura")}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center gap-2 mx-auto hover:shadow-lg transition"
        >
          <CreditCard className="w-4 h-4" />
          Ver Planos
        </button>
      </div>
    </div>
  )
}