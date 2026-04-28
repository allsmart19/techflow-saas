import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import {
  Plus, Search, Loader2, Calendar, FileText, X,
  CheckCircle2, Clock, Eye, Zap, Package,
  ArrowRight, Smartphone, Users, Lock, ChevronRight,
  MoreVertical, Filter, AlertTriangle, Printer, Trash2, Edit2,
  RefreshCw
} from "lucide-react"
import OrdemServicoModal from "../components/OrdemServicoModal"
import { getConfigLoja } from "../services/configService"

interface OrdemServico {
  id: number
  cliente_nome: string
  cliente_telefone: string
  marca: string
  modelo: string
  cor: string
  imei: string
  defeito_relatado: string
  valor_orcamento: number
  status: string
  prioridade: string
  data_entrada: string
  data_previsao: string | null
  data_entrega: string | null
  registrado_conserto: boolean
  loja_id: number
  tecnico_id: number | null
  [key: string]: any
}

interface Tecnico {
  id: number
  username: string
  role: string
  comissao_percentual: number
}

const STATUSES = [
  { key: "Entrada", icon: Package, color: "#6b7280", gradient: "from-gray-500 to-gray-600", bg: "bg-gray-100", text: "text-gray-700" },
  { key: "Em Análise", icon: Search, color: "#3b82f1", gradient: "from-blue-500 to-blue-600", bg: "bg-blue-100", text: "text-blue-700" },
  { key: "Aguardando Peça", icon: Clock, color: "#f59e0b", gradient: "from-amber-500 to-amber-600", bg: "bg-amber-100", text: "text-amber-700" },
  { key: "Aprovado", icon: CheckCircle2, color: "#8b5cf6", gradient: "from-purple-500 to-purple-600", bg: "bg-purple-100", text: "text-purple-700" },
  { key: "Pronto", icon: Zap, color: "#10b981", gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-100", text: "text-emerald-700" },
  { key: "Entregue", icon: ArrowRight, color: "#4f46e5", gradient: "from-indigo-500 to-indigo-600", bg: "bg-indigo-100", text: "text-indigo-700" },
]

export default function OrdensServico() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [search, setSearch] = useState("")
  const [lojaConfig, setLojaConfig] = useState<any>({ nome: "Store Tech" })
  const [osSelecionada, setOsSelecionada] = useState<OrdemServico | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null)
  const [userLogado, setUserLogado] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Filtros de Data
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  // Modais
  const [alterarStatusOS, setAlterarStatusOS] = useState<OrdemServico | null>(null)
  const [confirmarEntregaOS, setConfirmarEntregaOS] = useState<OrdemServico | null>(null)
  const [selecionarTecnicoOS, setSelecionarTecnicoOS] = useState<OrdemServico | null>(null)
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])
  const [tecnicoSelecionadoId, setTecnicoSelecionadoId] = useState<number | null>(null)

  useEffect(() => {
    carregarOrdens()
  }, [])

  async function carregarOrdens() {
    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    if (!user) { navigate("/login"); return }

    setLoading(true)

    try {
      // 1. Identificar a Loja
      let lojaIdValue = user.loja_id
      if (!lojaIdValue) {
        const { data: profile } = await supabase.from("usuarios").select("loja_id").eq("id", user.id).single()
        lojaIdValue = profile?.loja_id
      }
      
      if (!lojaIdValue) {
        console.error("Loja não identificada")
        setOrdens([])
        setLoading(false)
        return
      }

      // 2. Buscar Perfil para garantir ID numérico (usado em registros de conserto)
      const { data: userProfile } = await supabase.from("usuarios").select("id, role").eq("email", user.email).single()
      if (userProfile) {
        setUserLogado({ ...user, id: userProfile.id, role: userProfile.role })
        const adminStatus = userProfile.role === "admin_loja" || userProfile.role === "master"
        setIsAdmin(adminStatus)
        
        if (adminStatus) {
          const { data: tecData } = await supabase
            .from("usuarios")
            .select("id, username, role, comissao_percentual")
            .eq("loja_id", lojaIdValue)
            .eq("ativo", true)
          if (tecData) setTecnicos(tecData)
        }
      } else {
        const adminStatus = user.role === "admin_loja" || user.role === "master"
        setUserLogado(user)
        setIsAdmin(adminStatus)
      }

      // 3. Carregar Ordens
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("*")
        .eq("loja_id", lojaIdValue)
        .order("id", { ascending: false })

      if (error) {
        console.error("Erro ao carregar OS:", error)
        setOrdens([])
      } else {
        setOrdens(data || [])
      }

      const config = await getConfigLoja()
      if (config) {
        setLojaConfig({
          nome: config.nome_loja,
          logoUrl: config.logo_url,
          endereco: config.endereco,
          telefone: config.telefone,
          cnpj: config.cnpj,
          cidade: config.cidade
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus(os: OrdemServico, novoStatus: string) {
    if (os.status === novoStatus) return
    
    // Se for para Entregue, abre o modal específico de entrega
    if (novoStatus === "Entregue") {
      setConfirmarEntregaOS(os)
      setAlterarStatusOS(null)
      return
    }

    setOrdens(ordens.map(o => (o.id === os.id ? { ...o, status: novoStatus } : o)))
    const { error } = await supabase.from("ordens_servico").update({ status: novoStatus }).eq("id", os.id)
    if (error) {
      console.error("Erro ao atualizar status:", error)
      carregarOrdens()
    }
    setAlterarStatusOS(null)
  }

  async function confirmarEntrega() {
    if (!confirmarEntregaOS) return

    const id = confirmarEntregaOS.id
    const now = new Date().toISOString()
    const jaRegistrou = confirmarEntregaOS.registrado_conserto
    
    // Atualizar no banco
    const { error } = await supabase
      .from("ordens_servico")
      .update({ status: "Entregue", data_entrega: now })
      .eq("id", id)

    if (error) {
      console.error("Erro ao finalizar OS:", error)
      carregarOrdens()
      setConfirmarEntregaOS(null)
      return
    }

    // Se for Admin e NÃO foi registrado como conserto ainda, redireciona para registrar
    // (Pois Admin quer controle total de tudo que é entregue)
    if (isAdmin && !jaRegistrou) {
      setConfirmarEntregaOS(null)
      irParaConsertos(confirmarEntregaOS, userLogado?.id)
      return
    }

    // Se já tinha registrado ou é técnico (que geralmente registra antes), apenas atualiza local
    setOrdens(ordens.map(o => (o.id === id ? { ...o, status: "Entregue", data_entrega: now } : o)))
    setConfirmarEntregaOS(null)
  }

  function handleRegistrarConserto(os: OrdemServico) {
    if (isAdmin) {
      // Admin: abrir modal para selecionar técnico
      setSelecionarTecnicoOS(os)
      // Se a OS já tem um técnico, pré-seleciona. Se não, sugere o admin logado por padrão.
      setTecnicoSelecionadoId(os.tecnico_id || userLogado?.id)
    } else {
      irParaConsertos(os)
    }
  }

  async function irParaConsertos(os: OrdemServico, tecnicoIdOverride?: number) {
    await supabase.from("ordens_servico").update({ registrado_conserto: true }).eq("id", os.id)
    setOrdens(prev => prev.map(o => o.id === os.id ? { ...o, registrado_conserto: true } : o))
    const tecId = tecnicoIdOverride || userLogado?.id
    navigate("/consertos", {
      state: {
        fromOS: {
          modelo: `${os.marca} ${os.modelo}`,
          servico: os.defeito_relatado,
          valor_orcamento: os.valor_orcamento,
          tecnico_id: tecId,
        },
      },
    })
  }

  function confirmarTecnicoConserto() {
    if (!selecionarTecnicoOS || !tecnicoSelecionadoId) return
    irParaConsertos(selecionarTecnicoOS, tecnicoSelecionadoId)
    setSelecionarTecnicoOS(null)
  }

  const filteredOrdens = ordens.filter(os => {
    const matchSearch =
      os.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      os.modelo?.toLowerCase().includes(search.toLowerCase()) ||
      os.id.toString().includes(search)
    
    const matchStatus = !filtroStatus || os.status === filtroStatus
    
    // Filtro de Data
    let matchData = true
    if (dataInicio && os.data_entrada) {
      matchData = matchData && new Date(os.data_entrada) >= new Date(dataInicio)
    }
    if (dataFim && os.data_entrada) {
      // Ajustar data fim para o final do dia
      const dFim = new Date(dataFim)
      dFim.setHours(23, 59, 59, 999)
      matchData = matchData && new Date(os.data_entrada) <= dFim
    }
    
    return matchSearch && matchStatus && matchData
  })

  const totalEntregueValor = ordens
    .filter(o => o.status === "Entregue")
    .reduce((sum, o) => sum + (o.valor_orcamento || 0), 0)

  const totalAbertoValor = ordens
    .filter(o => o.status !== "Entregue")
    .reduce((sum, o) => sum + (o.valor_orcamento || 0), 0)

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getStatusBadge = (status: string) => {
    const s = STATUSES.find(st => st.key === status)
    if (!s) return null
    return (
      <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${s.bg} ${s.text}`}>
        <s.icon className="w-3 h-3" />
        {s.key}
      </span>
    )
  }

  if (loading && ordens.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-none">
              <FileText className="w-5 h-5 text-white" />
            </div>
            Minhas O.S.
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gerenciamento centralizado de ordens de serviço</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* KPIs de Faturamento */}
          <div className="flex gap-2">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl px-4 py-2 shadow-sm">
              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-black tracking-widest mb-0.5">Entregue</p>
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(totalEntregueValor)}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl px-4 py-2 shadow-sm">
              <p className="text-[9px] text-amber-600 dark:text-amber-400 uppercase font-black tracking-widest mb-0.5">Em Aberto</p>
              <p className="text-sm font-black text-amber-700 dark:text-amber-300">{formatCurrency(totalAbertoValor)}</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/nova-os")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-purple-200 dark:shadow-none active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nova OS
          </button>
        </div>
      </div>

        {/* Search + Filtros de Data */}
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, modelo ou ID..."
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 shadow-sm">
                <Calendar className="w-4 h-4 text-purple-600" />
                <div className="flex items-center gap-1.5">
                  <input 
                    type="date" 
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="text-xs bg-transparent border-none outline-none text-gray-600 dark:text-gray-300"
                  />
                  <span className="text-gray-300">até</span>
                  <input 
                    type="date" 
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="text-xs bg-transparent border-none outline-none text-gray-600 dark:text-gray-300"
                  />
                </div>
                {(dataInicio || dataFim) && (
                  <button onClick={() => { setDataInicio(""); setDataFim("") }} className="ml-2 text-gray-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* Abas de Status */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setFiltroStatus(null)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${!filtroStatus ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
        >
          Todas ({ordens.length})
        </button>
        {STATUSES.map(s => {
          const count = ordens.filter(o => o.status === s.key).length
          return (
            <button
              key={s.key}
              onClick={() => setFiltroStatus(s.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${filtroStatus === s.key ? `bg-purple-600 text-white shadow-md` : "bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.key}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filtroStatus === s.key ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main OS List (Vertical) */}
      <div className="space-y-3">
        {filteredOrdens.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-dashed border-gray-200 dark:border-gray-700">
             <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-300" />
             </div>
             <p className="text-gray-500 font-medium">Nenhuma ordem de serviço encontrada.</p>
          </div>
        ) : (
          filteredOrdens.map(os => {
            const dias = Math.floor((Date.now() - new Date(os.data_entrada).getTime()) / 86400000)
            const isEntregue = os.status === "Entregue"
            
            return (
              <div 
                key={os.id}
                className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${STATUSES.find(s => s.key === os.status)?.bg.replace('bg-', 'bg-').split(' ')[0] || 'bg-gray-200'}`} 
                     style={{ backgroundColor: STATUSES.find(s => s.key === os.status)?.color }}></div>

                {/* Left Side: Basic Info */}
                <div className="flex items-center gap-4 min-w-[300px]">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-xl flex flex-col items-center justify-center text-gray-400">
                    <span className="text-[10px] font-bold uppercase">Nº</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white leading-none">{os.id}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white transition-colors group-hover:text-purple-600">{os.cliente_nome}</h3>
                      <button 
                        onClick={() => !isEntregue && setAlterarStatusOS(os)}
                        className={`transition hover:bg-white/50 dark:hover:bg-black/20 rounded-full p-0.5 ${isEntregue ? 'cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                        title={isEntregue ? "Finalizado" : "Clique para alterar o status"}
                      >
                        {getStatusBadge(os.status)}
                      </button>
                      {os.prioridade === "Urgente" && (
                        <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter animate-pulse">Urgente</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> {os.marca} {os.modelo}</span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Entrada: {new Date(os.data_entrada).toLocaleDateString()}</span>
                      {dias > 3 && !isEntregue && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${dias > 7 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          {dias} dias aberta
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Defect & Info */}
                <div className="flex-1 max-w-md hidden lg:block">
                   <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Defeito Relatado</p>
                   <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 italic">"{os.defeito_relatado || 'Não informado'}"</p>
                </div>

                {/* Right Side: Actions & Value */}
                <div className="flex items-center gap-4 justify-between md:justify-end">
                   <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Orçamento</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white leading-none">
                        {os.valor_orcamento ? formatCurrency(os.valor_orcamento) : 'A avaliar'}
                      </p>
                   </div>
                   
                   <div className="flex items-center gap-2">
                       {!isEntregue && (
                         <button 
                           onClick={() => setAlterarStatusOS(os)}
                           className="p-2.5 bg-gray-50 dark:bg-gray-900 text-purple-600 hover:bg-purple-600 hover:text-white rounded-xl transition shadow-sm border border-purple-100 dark:border-purple-900/30"
                           title="Alterar Status"
                         >
                           <RefreshCw className="w-4 h-4" />
                         </button>
                       )}
                       
                       {os.status === "Pronto" && !os.registrado_conserto && (
                         <button 
                           onClick={() => handleRegistrarConserto(os)}
                           className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-100 transition shadow-sm"
                           title="Registrar Conserto"
                         >
                           <Zap className="w-4 h-4" />
                         </button>
                       )}
                       
                       <button 
                         onClick={() => setOsSelecionada(os)}
                         className="p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition shadow-sm border border-gray-100 dark:border-gray-700"
                         title="Visualizar Detalhes"
                       >
                         <Eye className="w-4 h-4" />
                       </button>

                       {!isEntregue && (
                         <button 
                           onClick={() => navigate("/nova-os", { state: { editOSId: os.id } })}
                           className="p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition shadow-sm border border-gray-100 dark:border-gray-700"
                           title="Editar Ordem"
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                       )}

                       {os.status === "Pronto" && (
                         <button 
                           onClick={() => setConfirmarEntregaOS(os)}
                           className="bg-purple-600 text-white p-2 px-3 rounded-xl hover:bg-purple-700 transition flex items-center gap-2 text-xs font-bold shadow-md shadow-purple-100"
                         >
                           Entregar
                           <ChevronRight className="w-3.5 h-3.5" />
                         </button>
                       )}
                   </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modais Antigos Reaproveitados */}
      {/* =========== MODAL: Alterar Status =========== */}
      {alterarStatusOS && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Alterar Status</h3>
              <button onClick={() => setAlterarStatusOS(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Selecione o novo estágio para a OS <b>#{alterarStatusOS.id}</b>:</p>
            <div className="grid grid-cols-1 gap-2">
              {STATUSES.map(s => {
                const isCurrent = s.key === alterarStatusOS.status
                return (
                  <button
                    key={s.key}
                    onClick={() => handleUpdateStatus(alterarStatusOS, s.key)}
                    className={`w-full p-3 rounded-2xl border text-sm font-bold flex items-center gap-3 transition ${
                      isCurrent 
                      ? 'border-purple-600 bg-purple-50 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400' 
                      : 'border-gray-100 dark:border-gray-700 hover:border-purple-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.bg}`}>
                      <s.icon className={`w-4 h-4 ${s.text}`} />
                    </div>
                    {s.key}
                    {isCurrent && <div className="ml-auto w-2 h-2 rounded-full bg-purple-600"></div>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========== MODAL: Confirmar Entrega/Finalização =========== */}
      {confirmarEntregaOS && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Concluir Entrega?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Deseja marcar a OS #{confirmarEntregaOS.id} como <b>Entregue</b> ao cliente?
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Cliente</span>
                  <span className="font-bold">{confirmarEntregaOS.cliente_nome}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Valor Total</span>
                  <span className="font-black text-emerald-600">{formatCurrency(confirmarEntregaOS.valor_orcamento)}</span>
                </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmarEntregaOS(null)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition">Cancelar</button>
              <button onClick={confirmarEntrega} className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-2xl text-sm font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-100">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* =========== MODAL: Selecionar Técnico =========== */}
      {selecionarTecnicoOS && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                   <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                   <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">Responsável</h3>
                   <p className="text-xs text-gray-400">Atribua um técnico para este conserto</p>
                </div>
             </div>
             
             <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Responsável pelo Conserto *</label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {/* Opção do Próprio Admin */}
                {isAdmin && (
                  <button
                    key={userLogado?.id}
                    type="button"
                    onClick={() => setTecnicoSelecionadoId(userLogado?.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition ${tecnicoSelecionadoId === userLogado?.id
                      ? "bg-purple-50 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300"
                      : "bg-white border-gray-100 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${tecnicoSelecionadoId === userLogado?.id ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                       <span className="font-bold">{userLogado?.username} (Admin)</span>
                    </div>
                  </button>
                )}

                {/* Divisor */}
                {tecnicos.filter(t => t.role === "user").length > 0 && (
                   <div className="py-1 flex items-center gap-2">
                      <div className="h-[1px] bg-gray-100 flex-1"></div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Técnicos</span>
                      <div className="h-[1px] bg-gray-100 flex-1"></div>
                   </div>
                )}

                {tecnicos.filter(t => t.id !== userLogado?.id && t.role === "user").map(tec => (
                  <button
                    key={tec.id}
                    type="button"
                    onClick={() => setTecnicoSelecionadoId(tec.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition ${tecnicoSelecionadoId === tec.id
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300"
                      : "bg-white border-gray-100 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="font-medium">{tec.username}</span>
                    <span className="text-xs text-gray-400">{tec.comissao_percentual}% comissão</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelecionarTecnicoOS(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarTecnicoConserto}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition active:scale-95"
                >
                  Registrar Conserto
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =========== MODAL: Detalhes Detalhados =========== */}
      {osSelecionada && (
        <OrdemServicoModal
          os={osSelecionada}
          onClose={() => setOsSelecionada(null)}
          lojaConfig={lojaConfig}
          onEdit={(id) => {
            setOsSelecionada(null)
            navigate("/nova-os", { state: { editOSId: id } })
          }}
        />
      )}
    </div>
  )
}
