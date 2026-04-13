import { CreditCard } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function BloqueioAssinatura() {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md text-center shadow-xl">

        <CreditCard className="w-10 h-10 mx-auto text-purple-600 mb-3" />

        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Assinatura necessária
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Seu plano expirou ou você ainda não possui uma assinatura ativa.
        </p>

        <button
          onClick={() => navigate("/assinatura")}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg text-sm font-semibold"
        >
          Ver Planos
        </button>

      </div>
    </div>
  )
}