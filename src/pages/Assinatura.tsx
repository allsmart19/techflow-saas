// src/pages/Assinatura.tsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Zap, Shield, Loader2 } from "lucide-react"

// Links gerados pelo Stripe (copie do seu dashboard)
const PLANOS = {
  monthly: {
    nome: "Plano Pro",
    preco: 29.90,
    periodo: "month",
    link: "https://buy.stripe.com/6oUeVd0D5a0DbuZaFz6sw00",
    descricao: [
      'Gestão ilimitada de pedidos',
      'Relatórios avançados',
      'Suporte prioritário',
      'Até 3 usuários'
    ]
  },
  yearly: {
    nome: "Plano Pro Anual",
    preco: 299.90,
    periodo: "year",
    link: "https://buy.stripe.com/28E00jgC31u77eJ8xr6sw01",
    descricao: [
      'Todos os recursos do plano mensal',
      '2 meses grátis',
      'Suporte 24/7',
      'Usuários ilimitados'
    ]
  }
}

export default function Assinatura() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) {
      navigate("/login")
      return
    }
    
    const user = JSON.parse(userStr)
    if (user.role === "admin") {
      setIsAdmin(true)
    } else {
      navigate("/dashboard")
    }
    setLoading(false)
  }, [navigate])

  const handleAssinar = (link: string) => {
    // Simplesmente redireciona para o Stripe
    window.location.href = link
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Assinatura</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gerencie seu plano de assinatura</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Área restrita para administradores. Apenas você pode gerenciar a assinatura do sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Plano Mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{PLANOS.monthly.nome}</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">R$ {PLANOS.monthly.preco.toFixed(2)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">por mês</p>
          <ul className="space-y-2 mb-5">
            {PLANOS.monthly.descricao.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleAssinar(PLANOS.monthly.link)}
            className="w-full border border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-500 py-2 rounded-lg text-xs font-medium hover:bg-purple-50 dark:hover:bg-purple-900/30 transition"
          >
            Assinar Mensal
          </button>
        </div>

        {/* Plano Anual */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border-2 border-purple-200 dark:border-purple-900 relative">
          <div className="absolute -top-3 left-4">
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">
              RECOMENDADO
            </span>
          </div>
          <div className="flex justify-between items-start mb-3 mt-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{PLANOS.yearly.nome}</h3>
            <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full">Economize 15%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">R$ {PLANOS.yearly.preco.toFixed(2)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">por ano (R$ 24,99/mês)</p>
          <ul className="space-y-2 mb-5">
            {PLANOS.yearly.descricao.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleAssinar(PLANOS.yearly.link)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg text-xs font-medium hover:shadow-lg transition"
          >
            Assinar Anual
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-600 dark:text-blue-400">
          🔐 Pagamento seguro via Stripe. Você será redirecionado para a página de pagamento.
          Após a confirmação, sua assinatura será ativada automaticamente.
        </p>
      </div>
    </div>
  )
}