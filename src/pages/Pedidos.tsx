import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Package, Search, Plus, Edit, Trash2, Loader2, Calendar, Wrench, CheckCircle, AlertCircle, RefreshCw, Truck, Store, DollarSign, TrendingUp, BarChart3, PieChart } from "lucide-react"
import { supabase } from "../lib/supabase"

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

interface Pedido {
  id: number
  codigo: string
  modelo: string
  marca: string
  valor: number
  frete: number
  data: string
  data_vencimento: string
  condicao: string
  fornecedor: string
  observacoes: string
}

export default function Pedidos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [mesSelecionado, setMesSelecionado] = useState("")
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([])
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
  const [anoSelecionado, setAnoSelecionado] = useState<string>("")
  const [anosDisponiveis, setAnosDisponiveis] = useState<string[]>([])
  const [tipoVisualizacao, setTipoVisualizacao] = useState<"mes" | "ano">("mes")

  useEffect(() => {
    carregarPedidos()
  }, [])

    async function carregarPedidos() {
  const userStr = sessionStorage.getItem("user")
  const user = userStr ? JSON.parse(userStr) : null
  if (!user) return

  // 🔥 IMPORTANTE: Buscar o loja_id do usuário
  let lojaId = user.loja_id
  
  if (!lojaId) {
    const { data } = await supabase
      .from("usuarios")
      .select("loja_id")
      .eq("id", user.id)
      .single()
    lojaId = data?.loja_id
  }

  if (!lojaId) {
    console.error("Usuário sem loja_id")
    return
  }

  setLoading(true)
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .eq("loja_id", lojaId)  // 🔥 FILTRO OBRIGATÓRIO POR LOJA
    .order("data", { ascending: false })
  
    if (error) {
      console.error("Erro ao carregar pedidos:", error)
    } else {
      const anos = new Set<string>()
      const meses = new Set<string>()
      data?.forEach((p: Pedido) => {
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
      
      const finalAno = anosLista.includes(anoAtual) ? anoAtual : (anosLista[0] || "")
      const finalMes = mesesLista.includes(mesAtual) ? mesAtual : (mesesLista[0] || "")
      
      setAnoSelecionado(finalAno)
      setMesSelecionado(finalMes)
      setPedidos(data || [])
      
      filtrarPorPeriodo(data || [], finalAno, "mes", finalMes)
    }
    setLoading(false)
  }

  function filtrarPorPeriodo(dados: Pedido[], ano: string, tipo: string, mes?: string) {
    let dadosFiltrados = [...dados]
    
    if (tipo === "mes" && mes) {
      dadosFiltrados = dadosFiltrados.filter(p => p.data?.substring(3) === mes)
    } else if (tipo === "ano") {
      dadosFiltrados = dadosFiltrados.filter(p => p.data?.substring(6) === ano)
    }
    
    calcularEstatisticas(dadosFiltrados)
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
        case "DEVOLUCAO":
          devolucao.qtd++
          devolucao.valor += valor
          break
        case "DEVOLUÇÃO PAGA":
        case "DEVOLUÇÃO_PAGA":
        case "DEVOLUCAO PAGA":
        case "DEVOLUCAO_PAGA":
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
    
    const totalGeral = conserto.valor + devolucao.valor + frete.valor + loja.valor + quebrada.valor
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
  }

  const handleMesChange = (mes: string) => {
    setMesSelecionado(mes)
    setTipoVisualizacao("mes")
    filtrarPorPeriodo(pedidos, anoSelecionado, "mes", mes)
  }

  const handleAnoChange = (ano: string) => {
    setAnoSelecionado(ano)
    setTipoVisualizacao("ano")
    filtrarPorPeriodo(pedidos, ano, "ano")
  }

async function excluirPedido(id: number) {
  // Obter usuário logado
  const userStr = sessionStorage.getItem("user")
  const user = userStr ? JSON.parse(userStr) : null
  if (!user) return

  if (confirm("Tem certeza que deseja excluir este pedido?")) {
    let query = supabase.from("pedidos").delete().eq("id", id)

    // 🔥 Se NÃO for admin_loja nem master, só pode excluir seus próprios pedidos
    if (user.role !== 'admin_loja' && user.role !== 'master') {
      query = query.eq("user_id", user.id)
    }

    const { error } = await query
    
    if (error) {
      console.error("Erro ao excluir pedido:", error)
      alert("Erro ao excluir pedido")
    } else {
      alert("Pedido excluído com sucesso!")
      carregarPedidos()
    }
  }
}

  function editarPedido(pedido: Pedido) {
    navigate("/novo", { state: { pedido, isEditing: true } })
  }

  const pedidosFiltradosPorPeriodo = tipoVisualizacao === "mes"
    ? pedidos.filter(pedido => pedido.data?.substring(3) === mesSelecionado)
    : pedidos.filter(pedido => pedido.data?.substring(6) === anoSelecionado)

  const pedidosFiltrados = pedidosFiltradosPorPeriodo.filter(pedido =>
    pedido.modelo?.toLowerCase().includes(search.toLowerCase()) ||
    pedido.marca?.toLowerCase().includes(search.toLowerCase()) ||
    pedido.codigo?.toLowerCase().includes(search.toLowerCase()) ||
    pedido.fornecedor?.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getCondicaoStyle = (condicao: string) => {
    const styles: Record<string, { bg: string, color: string }> = {
      "CONSERTO": { bg: "#8b5cf620", color: "#8b5cf6" },
      "GARANTIA": { bg: "#10b98120", color: "#10b981" },
      "LOJA": { bg: "#ec489920", color: "#ec4899" },
      "DEVOLUÇÃO": { bg: "#ef444420", color: "#ef4444" },
      "DEVOLUÇÃO PAGA": { bg: "#f59e0b20", color: "#f59e0b" },
      "QUEBRADA": { bg: "#6b728020", color: "#6b7280" }
    }
    return styles[condicao] || { bg: "#6b728020", color: "#6b7280" }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pedidos</h1>
        <p className="text-xs text-gray-500 mt-0.5">Gerencie todos os seus pedidos</p>
      </div>

      {/* Filtros de Período (Estilo Dashboard) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Tipo</label>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setTipoVisualizacao("mes")
                  if (mesSelecionado) filtrarPorPeriodo(pedidos, anoSelecionado, "mes", mesSelecionado)
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
                  filtrarPorPeriodo(pedidos, anoSelecionado, "ano")
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
                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition"
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
                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition"
              >
                {anosDisponiveis.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Cards de métricas (Estilo Dashboard) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 mb-5">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Wrench className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.CONSERTO.qtd} CONSERTO{stats.CONSERTO.qtd !== 1 ? 'S' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.CONSERTO.valor)}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <CheckCircle className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.GARANTIA.qtd} GARANTIA{stats.GARANTIA.qtd !== 1 ? 'S' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.GARANTIA.valor)}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <AlertCircle className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.DEVOLUÇÃO.qtd} DEVOLUÇÃO{stats.DEVOLUÇÃO.qtd !== 1 ? 'ES' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.DEVOLUÇÃO.valor)}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <RefreshCw className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.DEVOLUÇÃO_PAGA.qtd} DEV.PAGA{stats.DEVOLUÇÃO_PAGA.qtd !== 1 ? 'S' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.DEVOLUÇÃO_PAGA.valor)}</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Truck className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.FRETE.qtd} FRETE{stats.FRETE.qtd !== 1 ? 'S' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.FRETE.valor)}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Store className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.LOJA.qtd} LOJA{stats.LOJA.qtd !== 1 ? 'S' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.LOJA.valor)}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl p-2 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Trash2 className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[9px] opacity-80">{stats.QUEBRADA.qtd} QUEBRADA{stats.QUEBRADA.qtd !== 1 ? 'S' : ''}</span>
          </div>
          <p className="text-sm font-bold">{formatCurrency(stats.QUEBRADA.valor)}</p>
        </div>
      </div>

      {/* Cards de Resumo Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-bold">Total Pedidos</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalPedidos}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-bold">Faturamento no Período</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalGeral)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-bold">Ticket Médio</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.ticketMedio)}</p>
          </div>
        </div>
      </div>

      {/* Busca e Botão Novo */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por modelo, marca, código ou fornecedor..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <button 
          onClick={() => navigate("/novo")}
          className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Novo Pedido
        </button>
      </div>

      <div className="flex justify-end mb-4">
      </div>

      {/* Espaçador */}
      <div className="h-4"></div>
      {/* Resumo */}
      <div className="bg-gray-100 rounded-lg px-3 py-1.5 mb-4">
        <p className="text-xs text-gray-600">
          📊 {pedidosFiltrados.length} pedido(s) 
          {mesSelecionado && ` • ${mesSelecionado}`}
          {search && ` • Busca: "${search}"`}
        </p>
      </div>

      {/* Lista de pedidos */}
      <div className="space-y-2">
        {pedidosFiltrados.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Nenhum pedido encontrado</p>
            <button 
              onClick={() => navigate("/novo")}
              className="mt-2 text-purple-600 hover:text-purple-700 text-xs font-medium"
            >
              + Criar primeiro pedido
            </button>
          </div>
        ) : (
          pedidosFiltrados.map((pedido) => {
            const condStyle = getCondicaoStyle(pedido.condicao)
            return (
              <div key={pedido.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <Package className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-xs font-semibold text-gray-900">{pedido.modelo}</span>
                      <span className="text-[10px] text-gray-500">{pedido.marca}</span>
                      {pedido.codigo && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                          {pedido.codigo}
                        </span>
                      )}
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: condStyle.bg,
                          color: condStyle.color
                        }}
                      >
                        {pedido.condicao}
                      </span>
                    </div>
                    
                    <div className="text-[11px] text-gray-500 mb-1.5">
                      {formatCurrency(pedido.valor)} • {pedido.data} • Vence: {pedido.data_vencimento} • {pedido.fornecedor}
                      {pedido.frete > 0 && ` • Frete: ${formatCurrency(pedido.frete)}`}
                    </div>
                    
                    {pedido.observacoes && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{pedido.observacoes}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-1 ml-3">
                    <button 
                      onClick={() => editarPedido(pedido)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Editar pedido"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => excluirPedido(pedido.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                      title="Excluir pedido"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
