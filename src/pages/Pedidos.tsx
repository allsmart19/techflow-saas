import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Package, Search, Plus, Edit, Trash2, Loader2, Calendar } from "lucide-react"
import { supabase } from "../lib/supabase"

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
      setPedidos(data || [])
      
      // Extrair meses únicos dos pedidos
      const meses = new Set<string>()
      data?.forEach((pedido: Pedido) => {
        if (pedido.data) {
          const mes = pedido.data.substring(3)
          meses.add(mes)
        }
      })
      setMesesDisponiveis(Array.from(meses).sort().reverse())
      
      const hoje = new Date()
      const mesAtual = `${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${hoje.getFullYear()}`
      const existeMesAtual = mesesDisponiveis.includes(mesAtual)
      setMesSelecionado(existeMesAtual ? mesAtual : (mesesDisponiveis[0] || ""))
    }
    setLoading(false)
  }

  async function excluirPedido(id: number) {
    // Obter usuário logado
    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    if (!user) return

    if (confirm("Tem certeza que deseja excluir este pedido?")) {
      const { error } = await supabase
        .from("pedidos")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)  // 🔥 GARANTE QUE SÓ EXCLUI SE FOR DO USUÁRIO
      
      if (error) {
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

  const pedidosFiltradosPorMes = mesSelecionado
    ? pedidos.filter(pedido => pedido.data?.substring(3) === mesSelecionado)
    : pedidos

  const pedidosFiltrados = pedidosFiltradosPorMes.filter(pedido =>
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

      <div className="flex justify-end mb-4">
        <button 
          onClick={() => navigate("/novo")}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:shadow-lg transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Pedido
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por modelo, marca, código ou fornecedor..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-gray-50 focus:bg-white transition"
          >
            {mesesDisponiveis.length === 0 && (
              <option value="">Nenhum mês disponível</option>
            )}
            {mesesDisponiveis.map((mes) => (
              <option key={mes} value={mes}>{mes}</option>
            ))}
          </select>
        </div>
      </div>

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
