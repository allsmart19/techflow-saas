// src/pages/Assinatura.tsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Zap, Shield, Loader2, Calendar, CreditCard, AlertCircle, Clock } from "lucide-react"
import { getAssinaturaAtiva, criarPortalSession, criarCheckoutSession } from "../services/stripeService"

const PLANOS = {
  monthly: {
    id: "pro_monthly",
    nome: "Plano Pro",
    preco: 29.90,
    periodo: "month",
    priceId: "price_1TJkMhGhIX9bHHYRz3yMVprr", // Seu price_id do Stripe
    descricao: [
      'Gestão ilimitada de pedidos',
      'Relatórios avançados',
      'Suporte prioritário',
      'Até 3 usuários'
    ]
  },
  yearly: {
    id: "pro_yearly",
    nome: "Plano Pro Anual",
    preco: 299.90,
    periodo: "year",
    priceId: "price_1TJkNzGhIX9bHHYRQVnOIx3S", // Seu price_id do Stripe
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
  const [user, setUser] = useState<any>(null)
  const [assinaturaAtiva, setAssinaturaAtiva] = useState<any>(null)
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    const userStr = sessionStorage.getItem("user")
    if (!userStr) {
      navigate("/login")
      return
    }
    const userData = JSON.parse(userStr)
    setUser(userData)
    carregarAssinatura(userData.id)
  }, [])

  async function carregarAssinatura(userId: number) {
    const assinatura = await getAssinaturaAtiva(userId)
    setAssinaturaAtiva(assinatura)
    setLoading(false)
  }

  const handleAssinar = async (plano: typeof PLANOS.monthly) => {
    if (!user) {
      navigate("/login")
      return
    }

    setProcessando(true)
    try {
      // Criar sessão de checkout dinâmica (igual ao Manus.ai)
      const session = await criarCheckoutSession(
        plano.priceId,
        user.id,
        user.email || `${user.username}@tecnicotech.com`
      )
      
      if (session.url) {
        window.location.href = session.url
      } else {
        alert("Erro ao iniciar checkout. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao criar sessão:", error)
      alert("Erro ao processar assinatura. Tente novamente.")
    } finally {
      setProcessando(false)
    }
  }

  const handleGerenciarAssinatura = async () => {
    if (!assinaturaAtiva?.stripe_customer_id) {
      alert("Nenhuma assinatura ativa encontrada.")
      return
    }

    setProcessando(true)
    try {
      const session = await criarPortalSession(assinaturaAtiva.stripe_customer_id)
      if (session.url) {
        window.location.href = session.url
      } else {
        alert("Erro ao acessar o portal de gerenciamento.")
      }
    } catch (error) {
      console.error("Erro ao criar portal session:", error)
      alert("Erro ao acessar o portal. Tente novamente.")
    } finally {
      setProcessando(false)
    }
  }

  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR')

  const getTrialDaysLeft = (trialEnd: string) => {
    const end = new Date(trialEnd)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  // Caso o usuário já tenha uma assinatura ativa (ou em trial)
  if (assinaturaAtiva && (assinaturaAtiva.status === 'active' || assinaturaAtiva.status === 'trialing')) {
    const expiracao = new Date(assinaturaAtiva.data_expiracao)
    const hoje = new Date()
    const diasRestantes = Math.ceil((expiracao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    const canceladoNoFim = assinaturaAtiva.cancel_at_period_end === true
    const isTrial = assinaturaAtiva.status === 'trialing' && assinaturaAtiva.trial_end
    const trialDaysLeft = isTrial ? getTrialDaysLeft(assinaturaAtiva.trial_end) : 0

    return (
      <div className="p-6 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Assinatura</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gerencie sua assinatura</p>
        </div>

        {isTrial && trialDaysLeft > 0 && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 mb-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">
                  🎉 Você está no período de <strong>teste grátis</strong>! Faltam <strong>{trialDaysLeft} dia(s)</strong> para o fim.
                </span>
              </div>
              <button
                onClick={() => handleAssinar(PLANOS.monthly)}
                disabled={processando}
                className="bg-white text-purple-600 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 transition"
              >
                {processando ? "Processando..." : "Fazer Upgrade Agora"}
              </button>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6" />
            <h2 className="text-xl font-bold">{isTrial ? "Período de Teste Ativo" : "Assinatura Ativa"}</h2>
          </div>
          <p className="text-3xl font-bold mb-1">{assinaturaAtiva.plano || "Plano Pro"}</p>
          
          {canceladoNoFim ? (
            <div className="bg-yellow-500/20 border border-yellow-400 rounded-lg p-3 mt-3">
              <p className="text-sm font-semibold">⚠️ Cancelamento programado</p>
              <p className="text-sm">
                Sua assinatura permanecerá ativa até <strong>{expiracao.toLocaleDateString('pt-BR')}</strong>.
                Após essa data, seu acesso será desativado.
              </p>
              <p className="text-xs mt-2 opacity-90">
                Você pode reativar a qualquer momento acessando o portal de gerenciamento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <p className="text-xs opacity-75">Data de início</p>
                <p className="font-semibold">{formatarData(assinaturaAtiva.data_inicio)}</p>
              </div>
              <div>
                <p className="text-xs opacity-75">{isTrial ? "Término do teste" : "Próxima cobrança"}</p>
                <p className="font-semibold">
                  {isTrial ? formatarData(assinaturaAtiva.trial_end) : formatarData(assinaturaAtiva.data_expiracao)}
                </p>
              </div>
            </div>
          )}
          
          {diasRestantes > 0 && !canceladoNoFim && !isTrial && (
            <p className="mt-3 text-sm opacity-90">
              ⏰ {diasRestantes} dias restantes até a próxima cobrança.
            </p>
          )}

          <button
            onClick={handleGerenciarAssinatura}
            disabled={processando}
            className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {processando ? "Processando..." : "Gerenciar Assinatura"}
          </button>
          <p className="text-xs opacity-75 mt-3">
            🔒 Ao clicar em "Gerenciar Assinatura" você será redirecionado para o portal seguro do Stripe.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {canceladoNoFim
                ? "Você cancelou sua assinatura, mas continuará tendo acesso até o fim do período já pago."
                : isTrial
                ? "Seu período de teste termina em breve. Após o fim, seu acesso será bloqueado caso não assine um plano."
                : "Se você cancelar sua assinatura, ela continuará ativa até o fim do período já pago."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Se não tem assinatura ativa: mostra os planos disponíveis
  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Planos e Assinatura</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Escolha o plano ideal para o seu negócio</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Teste grátis de 7 dias disponível para novos clientes. Cancele quando quiser.
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
          <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">🎁 7 dias grátis</span>
          </div>
          <button
            onClick={() => handleAssinar(PLANOS.monthly)}
            disabled={processando}
            className="w-full border border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-500 py-2 rounded-lg text-xs font-medium hover:bg-purple-50 dark:hover:bg-purple-900/30 transition disabled:opacity-50"
          >
            {processando ? "Processando..." : "Assinar Mensal"}
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
          <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">🎁 7 dias grátis</span>
          </div>
          <button
            onClick={() => handleAssinar(PLANOS.yearly)}
            disabled={processando}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg text-xs font-medium hover:shadow-lg transition disabled:opacity-50"
          >
            {processando ? "Processando..." : "Assinar Anual"}
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              Teste grátis de 7 dias
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Você será cobrado somente após o fim do período de teste, a menos que cancele antes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}