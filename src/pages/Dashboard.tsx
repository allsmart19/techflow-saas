import { useState, useEffect } from "react"
import { 
  Package, TrendingUp, Wrench, 
  Truck, Store, Trash2, RefreshCw, 
  DollarSign, AlertCircle, CheckCircle,
  BarChart3, PieChart, Loader2
} from "lucide-react"
import { supabase } from "../lib/supabase"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart as RePieChart, 
  Pie, Cell, Legend, LineChart, Line
} from "recharts"
import { getAssinaturaAtiva } from "../services/stripeService"
import { TrialBanner } from "../components/TrialBanner"

interface Pedido {
  id: number
  modelo: string
  marca: string
  valor: number
  frete: number
  data: string
  data_vencimento: string
  condicao: string
  fornecedor: string
}

interface Stats {
  CONSERTO: { qtd: number; valor: number }
  GARANTIA: { qtd: number; valor: number }
  DEVOLUÇÃO: { qtd: number; valor: number }
  DEVOLUÇÃO_PAGA: { qtd: number; valor: number }
  FRETE: { qtd: number; valor: number }
  LOJA: { qtd: number; valor: number }
  QUEBRADA: { qtd: number; valor: number }
  totalGeral: number
  totalPedidos: number
  ticketMedio: number
}

const CORES = {
  CONSERTO: "#8b5cf6",
  GARANTIA: "#10b981",
  DEVOLUÇÃO: "#ef4444",
  DEVOLUÇÃO_PAGA: "#f59e0b",
  FRETE: "#06b6d4",
  LOJA: "#ec4899",
  QUEBRADA: "#6b7280"
}

const formatCurrency = (value: number) => {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100 text-xs">
        <p className="font-semibold text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [assinaturaAtiva, setAssinaturaAtiva] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({
    CONSERTO: { qtd: 0, valor: 0 },
    GARANTIA: { qtd: 0, valor: 0 },
    DEVOLUÇÃO: { qtd: 0, valor: 0 },
    DEVOLUÇÃO_PAGA: { qtd: 0, valor: 0 },
    FRETE: { qtd: 0, valor: 0 },
    LOJA: { qtd: 0, valor: 0 },
    QUEBRADA: { qtd: 0, valor: 0 },
    totalGeral: 0,
    totalPedidos: 0,
    ticketMedio: 0
  })
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([])
  const [dadosEvolucao, setDadosEvolucao] = useState<any[]>([])
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([])
  const [anoSelecionado, setAnoSelecionado] = useState<string>("")
  const [mesSelecionado, setMesSelecionado] = useState<string>("")
  const [anosDisponiveis, setAnosDisponiveis] = useState<string[]>([])
  const [tipoVisualizacao, setTipoVisualizacao] = useState<"mes" | "ano">("mes")

  useEffect(() => {
    carregarDados()
    carregarAssinatura()
  }, [])

  async function carregarAssinatura() {
    const userStr = sessionStorage.getItem("user")
    if (!userStr) return
    const user = JSON.parse(userStr)
    const assinatura = await getAssinaturaAtiva(user.id)
    setAssinaturaAtiva(assinatura)
  }

  async function carregarDados() {
    setLoading(true)
    //const { data, error } = await supabase.from("pedidos").select("*")
    // Obter usuário logado
const userStr = sessionStorage.getItem("user")
const user = userStr ? JSON.parse(userStr) : null
if (!user) return

// Buscar apenas pedidos do usuário
const { data, error } = await supabase
  .from("pedidos")
  .select("*")
  .eq("user_id", user.id)

    if (error) {
      console.error("Erro ao carregar dados:", error)
    } else {
      const pedidosData = data as Pedido[]
      setPedidos(pedidosData)
      
      const anos = new Set<string>()
      const meses = new Set<string>()
      pedidosData.forEach(p => {
        if (p.data) {
          const ano = p.data.substring(6)
          const mes = p.data.substring(3)
          anos.add(ano)
          meses.add(mes)
        }
      })
      const anosLista = Array.from(anos).sort().reverse()
      const mesesLista = Array.from(meses).sort().reverse()
      setAnosDisponiveis(anosLista)
      setMesesDisponiveis(mesesLista)
      
      const hoje = new Date()
      const anoAtual = hoje.getFullYear().toString()
      const mesAtual = `${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${anoAtual}`
      
      setAnoSelecionado(anoAtual)
      setMesSelecionado(mesesLista.includes(mesAtual) ? mesAtual : (mesesLista[0] || ""))
      
      filtrarDados(pedidosData, anoAtual, "mes", mesesLista.includes(mesAtual) ? mesAtual : (mesesLista[0] || ""))
    }
    setLoading(false)
  }

  function filtrarDados(dados: Pedido[], ano: string, tipo: string, mes?: string) {
    let dadosFiltrados = [...dados]
    
    if (tipo === "mes" && mes) {
      dadosFiltrados = dadosFiltrados.filter(p => p.data?.substring(3) === mes)
    } else if (tipo === "ano") {
      dadosFiltrados = dadosFiltrados.filter(p => p.data?.substring(6) === ano)
    }
    
    calcularEstatisticas(dadosFiltrados)
    
    if (tipo === "ano") {
      const meses: { [key: string]: { conserto: number, garantia: number, loja: number, total: number } } = {}
      dadosFiltrados.forEach(pedido => {
        const mes = pedido.data.substring(3)
        if (!meses[mes]) {
          meses[mes] = { conserto: 0, garantia: 0, loja: 0, total: 0 }
        }
        const valor = pedido.valor || 0
        if (pedido.condicao === "CONSERTO") meses[mes].conserto += valor
        else if (pedido.condicao === "GARANTIA") meses[mes].garantia += valor
        else if (pedido.condicao === "LOJA") meses[mes].loja += valor
        meses[mes].total += valor
      })
      
      const evolucao = Object.entries(meses)
        .sort((a, b) => {
          const [mesA, anoA] = a[0].split('/')
          const [mesB, anoB] = b[0].split('/')
          return new Date(parseInt(anoA), parseInt(mesA) - 1).getTime() - 
                 new Date(parseInt(anoB), parseInt(mesB) - 1).getTime()
        })
        .map(([mes, dados]) => ({ mes, conserto: dados.conserto, garantia: dados.garantia, loja: dados.loja, total: dados.total }))
      setDadosEvolucao(evolucao)
    } else {
      setDadosEvolucao([])
    }
  }

  function calcularEstatisticas(dadosFiltrados: Pedido[]) {
    let conserto = { qtd: 0, valor: 0 }
    let garantia = { qtd: 0, valor: 0 }
    let devolucao = { qtd: 0, valor: 0 }
    let devolucaoPaga = { qtd: 0, valor: 0 }
    let frete = { qtd: 0, valor: 0 }
    let loja = { qtd: 0, valor: 0 }
    let quebrada = { qtd: 0, valor: 0 }
    
    dadosFiltrados.forEach(pedido => {
      const valor = pedido.valor || 0
      const valorFrete = pedido.frete || 0
      
      if (valorFrete > 0) {
        frete.qtd++
        frete.valor += valorFrete
      }
      
      switch (pedido.condicao) {
        case "CONSERTO":
          conserto.qtd++
          conserto.valor += valor
          break
        case "GARANTIA":
          garantia.qtd++
          garantia.valor += valor
          break
        case "DEVOLUÇÃO":
          devolucao.qtd++
          devolucao.valor += valor
          break
        case "DEVOLUÇÃO PAGA":
          devolucaoPaga.qtd++
          devolucaoPaga.valor += valor
          break
        case "LOJA":
          loja.qtd++
          loja.valor += valor
          break
        case "QUEBRADA":
          quebrada.qtd++
          quebrada.valor += valor
          break
      }
    })
    
    const totalGeral = conserto.valor + garantia.valor + loja.valor
    const totalPedidos = dadosFiltrados.length
    const ticketMedio = totalPedidos > 0 ? totalGeral / totalPedidos : 0
    
    setStats({
      CONSERTO: conserto,
      GARANTIA: garantia,
      DEVOLUÇÃO: devolucao,
      DEVOLUÇÃO_PAGA: devolucaoPaga,
      FRETE: frete,
      LOJA: loja,
      QUEBRADA: quebrada,
      totalGeral,
      totalPedidos,
      ticketMedio
    })
    
    const dadosBarras = [
      { name: "CONSERTO", valor: conserto.valor, cor: CORES.CONSERTO, qtd: conserto.qtd },
      { name: "GARANTIA", valor: garantia.valor, cor: CORES.GARANTIA, qtd: garantia.qtd },
      { name: "LOJA", valor: loja.valor, cor: CORES.LOJA, qtd: loja.qtd },
      { name: "DEVOLUÇÃO", valor: devolucao.valor, cor: CORES.DEVOLUÇÃO, qtd: devolucao.qtd },
      { name: "DEVOLUÇÃO PAGA", valor: devolucaoPaga.valor, cor: CORES.DEVOLUÇÃO_PAGA, qtd: devolucaoPaga.qtd },
      { name: "QUEBRADA", valor: quebrada.valor, cor: CORES.QUEBRADA, qtd: quebrada.qtd }
    ]
    setDadosGrafico(dadosBarras.filter(d => d.valor > 0))
  }

  const handleMesChange = (mes: string) => {
    setMesSelecionado(mes)
    setTipoVisualizacao("mes")
    filtrarDados(pedidos, anoSelecionado, "mes", mes)
  }

  const handleAnoChange = (ano: string) => {
    setAnoSelecionado(ano)
    setTipoVisualizacao("ano")
    filtrarDados(pedidos, ano, "ano")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-xs text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const isTrial = assinaturaAtiva?.status === "trialing" && assinaturaAtiva?.trial_end

  return (
    <div className="p-5 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Cabeçalho */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Visão geral da sua loja</p>
      </div>

      {/* Banner de Período de Teste (apenas se estiver em trial) */}
      {isTrial && <TrialBanner trialEnd={assinaturaAtiva.trial_end} />}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Tipo</label>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setTipoVisualizacao("mes")
                  if (mesSelecionado) filtrarDados(pedidos, anoSelecionado, "mes", mesSelecionado)
                }}
                className={`flex-1 px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                  tipoVisualizacao === "mes" ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => {
                  setTipoVisualizacao("ano")
                  filtrarDados(pedidos, anoSelecionado, "ano")
                }}
                className={`flex-1 px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                  tipoVisualizacao === "ano" ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Ano
              </button>
            </div>
          </div>
          
          {tipoVisualizacao === "mes" && (
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Mês/Ano</label>
              <select
                value={mesSelecionado}
                onChange={(e) => handleMesChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
              >
                {mesesDisponiveis.map(mes => (
                  <option key={mes} value={mes}>{mes}</option>
                ))}
              </select>
            </div>
          )}
          
          {tipoVisualizacao === "ano" && (
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Ano</label>
              <select
                value={anoSelecionado}
                onChange={(e) => handleAnoChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
              >
                {anosDisponiveis.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Cards de métricas - COM QUANTIDADE NO NOME */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 mb-5">
        {/* CONSERTO */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Wrench className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.CONSERTO.qtd} CONSERTO{stats.CONSERTO.qtd !== 1 ? 'S' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.CONSERTO.valor)}</p>
        </div>

        {/* GARANTIA */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <CheckCircle className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.GARANTIA.qtd} GARANTIA{stats.GARANTIA.qtd !== 1 ? 'S' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.GARANTIA.valor)}</p>
        </div>

        {/* DEVOLUÇÃO */}
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <AlertCircle className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.DEVOLUÇÃO.qtd} DEVOLUÇÃO{stats.DEVOLUÇÃO.qtd !== 1 ? 'ES' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.DEVOLUÇÃO.valor)}</p>
        </div>

        {/* DEVOLUÇÃO PAGA */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <RefreshCw className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.DEVOLUÇÃO_PAGA.qtd} DEV.PAGA{stats.DEVOLUÇÃO_PAGA.qtd !== 1 ? 'S' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.DEVOLUÇÃO_PAGA.valor)}</p>
        </div>

        {/* FRETE */}
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Truck className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.FRETE.qtd} FRETE{stats.FRETE.qtd !== 1 ? 'S' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.FRETE.valor)}</p>
        </div>

        {/* LOJA */}
        <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Store className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.LOJA.qtd} LOJA{stats.LOJA.qtd !== 1 ? 'S' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.LOJA.valor)}</p>
        </div>

        {/* QUEBRADA */}
        <div className="bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Trash2 className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.QUEBRADA.qtd} QUEBRADA{stats.QUEBRADA.qtd !== 1 ? 'S' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.QUEBRADA.valor)}</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Pedidos</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.totalPedidos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Faturamento</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalGeral)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ticket Médio</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(stats.ticketMedio)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Gráfico de Barras */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Distribuição por Condição</h3>
          </div>
          {dadosGrafico.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dadosGrafico} layout="vertical" margin={{ left: 70, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                  {dadosGrafico.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-xs text-gray-400">Sem dados para exibir</div>
          )}
        </div>

        {/* Gráfico de Pizza */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1.5 mb-3">
            <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Participação por Condição</h3>
          </div>
          {dadosGrafico.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RePieChart>
                <Pie
                  data={dadosGrafico}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="valor"
                  label={({ name, percent }: any) => {
                    const percentValue = percent * 100
                    return percentValue > 5 ? `${name}: ${percentValue.toFixed(0)}%` : null
                  }}
                  labelLine={false}
                  isAnimationActive={true}
                >
                  {dadosGrafico.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-xs text-gray-400">Sem dados para exibir</div>
          )}
        </div>
      </div>

      {/* Evolução Mensal */}
      {tipoVisualizacao === "ano" && dadosEvolucao.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Evolução Mensal - {anoSelecionado}</h3>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dadosEvolucao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="conserto" stroke={CORES.CONSERTO} name="CONSERTO" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="garantia" stroke={CORES.GARANTIA} name="GARANTIA" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="loja" stroke={CORES.LOJA} name="LOJA" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="total" stroke="#8b5cf6" name="TOTAL" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
