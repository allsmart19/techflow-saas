import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CreditCard, Check, Zap, Shield, AlertCircle, Loader2, Calendar, DollarSign, Settings } from "lucide-react"
import { Elements } from "@stripe/react-stripe-js"
import { stripePromise, planos, criarCheckoutSession, getAssinaturaAtiva, criarPortalSession } from "../services/stripeService"

interface AssinaturaAtiva {
  id: number
  status: string
  plano: string
  data_inicio: string
  data_expiracao: string
  stripe_customer_id: string
}

export default function Assinatura() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [, setUserName] = useState("")
  const [userId, setUserId] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState("")
  const [assinaturaAtiva, setAssinaturaAtiva] = useState<AssinaturaAtiva | null>(null)
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) {
      navigate("/login")
      return
    }
    
    const user = JSON.parse(userStr)
    setUserName(user.username || "Usuário")
    setUserId(user.id)
    setUserEmail(user.email || `${user.username}@techflow.com`)
    
    if (user.role === "admin") {
      setIsAdmin(true)
      carregarAssinaturaAtiva(user.id)
    } else {
      navigate("/dashboard")
    }
  }, [navigate])

  async function carregarAssinaturaAtiva(userId: number) {
    const data = await getAssinaturaAtiva(userId)
    if (data && data.status === 'active') {
      setAssinaturaAtiva(data)
    }
    setLoading(false)
  }

  async function handleAssinar(plano: typeof planos[0]) {
    if (!userId || !userEmail) {
      alert("Usuário não identificado. Faça login novamente.")
      return
    }

    setProcessando(true)
    try {
      const session = await criarCheckoutSession(plano.priceId, userId, userEmail)
      if (session.url) {
        window.location.href = session.url
      } else {
        alert("Erro ao iniciar checkout. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao processar assinatura. Tente novamente.")
    } finally {
      setProcessando(false)
    }
  }

  async function handleGerenciarAssinatura() {
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
        alert("Erro ao acessar o portal. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao acessar o portal de gerenciamento.")
    } finally {
      setProcessando(false)
    }
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="p-6 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Assinatura</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gerencie seu plano de assinatura</p>
        </div>

        {/* Aviso de acesso restrito */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Área restrita para administradores. Apenas você pode gerenciar a assinatura do sistema.
            </p>
          </div>
        </div>

        {/* Assinatura Ativa */}
        {assinaturaAtiva ? (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6" />
              <h2 className="text-xl font-bold">Assinatura Ativa</h2>
            </div>
            <p className="text-3xl font-bold mb-1">{assinaturaAtiva.plano}</p>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <p className="text-xs opacity-75">Data de início</p>
                <p className="font-semibold">{formatarData(assinaturaAtiva.data_inicio)}</p>
              </div>
              <div>
                <p className="text-xs opacity-75">Próxima cobrança</p>
                <p className="font-semibold">{formatarData(assinaturaAtiva.data_expiracao)}</p>
              </div>
            </div>
            <button
              onClick={handleGerenciarAssinatura}
              disabled={processando}
              className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {processando ? "Processando..." : "Gerenciar Assinatura"}
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Você ainda não possui uma assinatura ativa. Escolha um plano abaixo para começar.
              </p>
            </div>
          </div>
        )}

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {planos.map((plano) => (
            <div
              key={plano.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border ${
                plano.periodo === 'year' 
                  ? 'border-2 border-purple-200 dark:border-purple-900 relative' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {plano.periodo === 'year' && (
                <div className="absolute -top-3 left-4">
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                    RECOMENDADO
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-3 mt-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{plano.nome}</h3>
                {plano.periodo === 'year' && (
                  <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full">
                    Economize 15%
                  </span>
                )}
              </div>
              
              <div className="mb-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {plano.preco.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {plano.periodo === 'month' ? 'por mês' : 'por ano'}
                  {plano.periodo === 'year' && ' (R$ 24,99/mês)'}
                </p>
              </div>
              
              <ul className="space-y-2 mb-5">
                {plano.descricao.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleAssinar(plano)}
                disabled={processando || !!assinaturaAtiva}
                className={`w-full py-2 rounded-lg text-xs font-medium transition ${
                  assinaturaAtiva
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : plano.periodo === 'year'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg'
                      : 'border border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                }`}
              >
                {processando ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processando...
                  </div>
                ) : assinaturaAtiva ? (
                  "Plano já ativo"
                ) : (
                  `Assinar ${plano.periodo === 'month' ? 'Mensal' : 'Anual'}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">
                Formas de Pagamento
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                Cartão de crédito, boleto bancário ou PIX. A primeira assinatura tem 7 dias de garantia incondicional.
                Após a confirmação do pagamento, todos os recursos serão liberados automaticamente.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ simplificada */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Ciclo de cobrança</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              As assinaturas são renovadas automaticamente. Você pode cancelar a qualquer momento pelo portal do cliente.
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Reembolso</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Garantia de 7 dias para reembolso total em caso de insatisfação. Após esse período, não há reembolso.
            </p>
          </div>
        </div>
      </div>
    </Elements>
  )
}