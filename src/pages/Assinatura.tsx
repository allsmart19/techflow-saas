// src/pages/Assinatura.tsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Zap, Shield, Loader2, Calendar, CreditCard, AlertCircle, Clock } from "lucide-react"
import { supabase } from "../lib/supabase"

interface AssinaturaAtiva {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  status: string
  plano: string
  data_inicio: string
  data_expiracao: string
  trial_end: string | null
  cancel_at_period_end: boolean
}

const PLANOS = {
  monthly: {
    nome: "Plano Pro",
    preco: 29.90,
    priceId: "price_1TLlGuGhIX9bHHYRIwSV4W4o",
    descricao: [
      'Gestão ilimitada de pedidos',
      'Relatórios avançados',
      'Suporte prioritário',
      'Até 3 usuarios'
    ]
  },
  yearly: {
    nome: "Plano Pro Anual",
    preco: 299.90,
    priceId: "price_1TLlJqGhIX9bHHYRPHdBYv09",
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
  const [assinaturaAtiva, setAssinaturaAtiva] = useState<AssinaturaAtiva | null>(null)
  const [processando, setProcessando] = useState(false)
  const [trialInfo, setTrialInfo] = useState<{ daysLeft: number; isTrial: boolean; endDate: Date | null }>({
    daysLeft: 0,
    isTrial: false,
    endDate: null
  })

  useEffect(() => {
    const userStr = sessionStorage.getItem("user")

    if (!userStr) {
      navigate("/login")
      return
    }

    const userData = JSON.parse(userStr)
    setUser(userData)

    // Primeiro carrega assinatura, depois (se não houver) carrega trialInfo
    carregarAssinatura(userData.id).finally(() => {
      carregarTrialInfo()
    })

    // 🔥 Atualiza ao voltar do Stripe
    window.addEventListener("focus", () => {
      carregarAssinatura(userData.id)
    })
  }, [])

  // 🔥 REVALIDAÇÃO AUTOMÁTICA DA ASSINATURA
  useEffect(() => {
    const interval = setInterval(() => {
      const user = sessionStorage.getItem("user")
      if (!user) return

      const u = JSON.parse(user)
      carregarAssinatura(u.id)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

async function carregarAssinatura(userId: string) {
  try {
    console.log("🔍 Buscando assinatura para usuário:", userId);
    
    const { data, error } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (error) {
      console.error("❌ Erro na consulta:", error);
      setAssinaturaAtiva(null);
    } else {
      console.log("✅ Assinatura encontrada:", data);
      setAssinaturaAtiva(data);
    }
  } catch (error) {
    console.error("❌ Erro inesperado:", error);
    setAssinaturaAtiva(null);
  } finally {
    setLoading(false);
  }
}

  // 🔥 Só carrega trial se NÃO houver assinatura ativa
  async function carregarTrialInfo() {
    // Se já tem assinatura ativa, não precisa carregar trial da loja
    if (assinaturaAtiva && ["active", "trialing"].includes(assinaturaAtiva.status)) {
      return
    }

    const userStr = sessionStorage.getItem("user")
    if (!userStr) return
    const user = JSON.parse(userStr)

    // Buscar loja_id do usuário
    const { data: userData } = await supabase
      .from("usuarios")
      .select("loja_id")
      .eq("id", user.id)
      .single()

    if (userData?.loja_id) {
      const { data: loja } = await supabase
        .from("lojas")
        .select("created_at")
        .eq("id", userData.loja_id)
        .single()

      if (loja?.created_at) {
        const createdAt = new Date(loja.created_at)
        const now = new Date()
        const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        const daysLeft = Math.max(0, 7 - diffDays)
        const isTrial = diffDays <= 7

        setTrialInfo({
          daysLeft: Math.ceil(daysLeft),
          isTrial,
          endDate: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
        })
      }
    }
  }

  const handleAssinar = async (plano: typeof PLANOS.monthly) => {
    if (!user) {
      navigate("/login")
      return
    }

    setProcessando(true)

    try {
      const response = await fetch("https://techflow-saas-livid.vercel.app/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          priceId: plano.priceId,
          userId: user.id,
          userEmail: user.email || `${user.username}@app.com`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.portalUrl) {
          alert(data.error)
          window.location.href = data.portalUrl
        } else {
          throw new Error(data.error || "Erro ao criar checkout")
        }
      }

      window.location.href = data.url
    } catch (error: any) {
      console.error(error)
      alert(error.message || "Erro ao processar assinatura")
    } finally {
      setProcessando(false)
    }
  }

const handleGerenciarAssinatura = async () => {
  const customerId = assinaturaAtiva?.stripe_customer_id;
  
  if (!customerId) {
    alert("Nenhum customer ID encontrado.");
    return;
  }

  setProcessando(true);

  try {
    const response = await fetch('/api/create-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao acessar portal');
    }

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('URL não retornada');
    }
  } catch (error: any) {
    console.error(error);
    alert(error.message || "Erro ao acessar o portal");
  } finally {
    setProcessando(false);
  }
};

  const formatarData = (data: string) =>
    data ? new Date(data).toLocaleDateString("pt-BR") : "N/A"

  const getDiasRestantes = (dataExpiracao: string) => {
    const expiracao = new Date(dataExpiracao)
    const hoje = new Date()
    const diff = Math.ceil((expiracao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  // =====================================================
  // 1. TEM ASSINATURA ATIVA (active ou trialing)
  // =====================================================
    // 🔥 TEM ASSINATURA ATIVA
if (assinaturaAtiva && ["active", "trialing"].includes(assinaturaAtiva.status)) {
  const isTrial = assinaturaAtiva.status === "trialing";
  const diasRestantes = getDiasRestantes(assinaturaAtiva.data_expiracao);
  const canceladoNoFim = assinaturaAtiva.cancel_at_period_end;
  
    console.log("📅 Assinatura ativa:", {
    plano: assinaturaAtiva.plano,
    data_inicio: assinaturaAtiva.data_inicio,
    data_expiracao: assinaturaAtiva.data_expiracao
  });

  // Identificar qual plano o cliente tem atualmente
  const planoAtual = assinaturaAtiva.plano || "";
  const isPlanoMensal = planoAtual.includes("Mensal") || planoAtual === "Plano Pro Mensal";
  const isPlanoAnual = planoAtual.includes("Anual") || planoAtual === "Plano Pro Anual";

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Assinatura</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gerencie sua assinatura</p>
      </div>

      {/* Banner da assinatura ativa */}
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
              Sua assinatura permanecerá ativa até <strong>{formatarData(assinaturaAtiva.data_expiracao)}</strong>.
              Após essa data, seu acesso será desativado.
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
                {isTrial && assinaturaAtiva.trial_end 
                  ? formatarData(assinaturaAtiva.trial_end) 
                  : formatarData(assinaturaAtiva.data_expiracao)}
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

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
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

      {/* 🔥 MOSTRAR OUTROS PLANOS DISPONÍVEIS PARA UPGRADE/DOWNGRADE */}
      <div className="mt-8">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Mudar de plano</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Você pode trocar de plano a qualquer momento. O valor será ajustado proporcionalmente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Plano Mensal - só mostra se NÃO for o plano atual */}
          {!isPlanoMensal && (
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
                onClick={() => handleGerenciarAssinatura()}
                disabled={processando}
                className="w-full border border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-500 py-2 rounded-lg text-xs font-medium hover:bg-purple-50 dark:hover:bg-purple-900/30 transition disabled:opacity-50"
              >
                {processando ? "Processando..." : "Trocar para Mensal"}
              </button>
            </div>
          )}

          {/* Plano Anual - só mostra se NÃO for o plano atual */}
          {!isPlanoAnual && (
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
                onClick={() => handleGerenciarAssinatura()}
                disabled={processando}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg text-xs font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {processando ? "Processando..." : "Trocar para Anual"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
  // =====================================================
  // 2. SEM ASSINATURA ATIVA, MAS EM TRIAL (7 DIAS DA LOJA)
  // =====================================================
  if (!assinaturaAtiva && trialInfo.isTrial && trialInfo.daysLeft > 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Planos e Assinatura</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Escolha o plano ideal para o seu negócio</p>
        </div>

        {/* 🔥 BANNER DE PERÍODO DE TESTE (TRIAL DA LOJA) */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">
                🎉 Você está no período de <strong>teste grátis</strong>! Faltam <strong>{trialInfo.daysLeft} dia(s)</strong> para o fim.
              </span>
            </div>
          </div>
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

  // =====================================================
  // 3. SEM ASSINATURA E SEM TRIAL (OU TRIAL EXPIRADO)
  // =====================================================
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