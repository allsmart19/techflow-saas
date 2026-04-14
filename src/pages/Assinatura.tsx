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
      'Até 3 usuários'
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

  useEffect(() => {
    const userStr = sessionStorage.getItem("user")

    if (!userStr) {
      navigate("/login")
      return
    }

    const userData = JSON.parse(userStr)
    setUser(userData)
    carregarAssinatura(userData.id)

    // 🔥 Atualiza ao voltar do Stripe
    window.addEventListener("focus", () => {
      carregarAssinatura(userData.id)
    })
  }, [])

  // 🔥 REVALIDAÇÃO AUTOMÁTICA DA ASSINATURA (IMPORTANTE)
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
      const { data, error } = await supabase
        .from("assinaturas")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .maybeSingle()

      if (error) throw error
      setAssinaturaAtiva(data)

    } catch (error) {
      console.error("Erro ao carregar assinatura:", error)
      setAssinaturaAtiva(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAssinar = async (plano: typeof PLANOS.monthly) => {
    if (!user) {
      navigate("/login")
      return
    }

    setProcessando(true)

    try {
      //const response = await fetch(("https://SEU-PROJETO.vercel.app/api/stripe/create-checkout"), {
        const response = await fetch(("https://techflow-saas-livid.vercel.app/api/create-checkout"), {
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

      let data

try {
  data = await response.json()
} catch {
  throw new Error("Resposta inválida da API")
}

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar checkout")
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
    if (!assinaturaAtiva?.stripe_customer_id) {
      alert("Nenhuma assinatura encontrada")
      return
    }

    setProcessando(true)

    try {
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerId: assinaturaAtiva.stripe_customer_id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao acessar portal")
      }

      window.location.href = data.url

    } catch (error: any) {
      console.error(error)
      alert(error.message || "Erro ao acessar portal")
    } finally {
      setProcessando(false)
    }
  }

  const formatarData = (data: string) =>
    data ? new Date(data).toLocaleDateString("pt-BR") : "N/A"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  // 🔥 TEM ASSINATURA
  if (assinaturaAtiva && ["active", "trialing"].includes(assinaturaAtiva.status)) {
    const isTrial = assinaturaAtiva.status === "trialing"

    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold mb-4">Assinatura</h1>

        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl">
          <h2 className="text-lg font-bold mb-2">
            {isTrial ? "Período de Teste" : "Assinatura Ativa"}
          </h2>

          <p className="text-2xl font-bold mb-2">
            {assinaturaAtiva.plano || "Plano Pro"}
          </p>

          <p className="text-sm">
            Próxima cobrança: {formatarData(assinaturaAtiva.data_expiracao)}
          </p>

          <button
            onClick={handleGerenciarAssinatura}
            className="mt-4 bg-white text-purple-600 px-4 py-2 rounded-lg text-sm"
          >
            Gerenciar Assinatura
          </button>
        </div>
      </div>
    )
  }

  // 🔥 SEM ASSINATURA
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Escolha seu plano</h1>

      <div className="grid md:grid-cols-2 gap-6">

        <div className="border p-5 rounded-xl">
          <h3 className="font-semibold">{PLANOS.monthly.nome}</h3>
          <p className="text-2xl font-bold">R$ {PLANOS.monthly.preco}</p>

          <button
            onClick={() => handleAssinar(PLANOS.monthly)}
            className="mt-4 w-full border py-2 rounded-lg"
          >
            Assinar Mensal
          </button>
        </div>

        <div className="border p-5 rounded-xl">
          <h3 className="font-semibold">{PLANOS.yearly.nome}</h3>
          <p className="text-2xl font-bold">R$ {PLANOS.yearly.preco}</p>

          <button
            onClick={() => handleAssinar(PLANOS.yearly)}
            className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg"
          >
            Assinar Anual
          </button>
        </div>

      </div>
    </div>
  )
}