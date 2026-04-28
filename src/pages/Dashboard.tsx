import { useState, useEffect } from "react"
import { 
  Package, TrendingUp, Wrench, 
  Plus, Users, ClipboardList, 
  AlertCircle, ChevronRight, 
  Loader2, Wallet, ShoppingBag,
  ArrowUpRight, Clock
} from "lucide-react"
import { supabase } from "../lib/supabase"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, 
  Pie, Cell, Legend, AreaChart, Area
} from "recharts"
import { useNavigate } from "react-router-dom"

const COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"]

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // Dashboard Stats
  const [stats, setStats] = useState({
    osAtivas: 0,
    consertosHoje: 0,
    estoqueBaixo: 0,
    totalClientes: 0,
    faturamentoMensal: 0
  })

  const [osStatusData, setOsStatusData] = useState<any[]>([])
  const [recentOS, setRecentOS] = useState<any[]>([])

  useEffect(() => {
    const userStr = sessionStorage.getItem("user")
    if (userStr) {
      const u = JSON.parse(userStr)
      setUser(u)
      carregarDadosDashboard(u.loja_id)
    }
  }, [])

  async function carregarDadosDashboard(lojaId: number) {
    if (!lojaId) return
    setLoading(true)

    try {
      // 1. OS Ativas (Não entregues)
      const { count: osCount } = await supabase
        .from("ordens_servico")
        .select("*", { count: 'exact', head: true })
        .eq("loja_id", lojaId)
        .neq("status", "Entregue")
      
      // 2. Consertos Hoje
      const hoje = new Date().toISOString().split('T')[0]
      const { count: consertosCount } = await supabase
        .from("consertos")
        .select("*", { count: 'exact', head: true })
        .eq("loja_id", lojaId)
        .gte("created_at", hoje)

      // 3. Estoque Baixo
      // Precisamos fazer uma query manual ou via RPC se for complexo, mas aqui faremos query simples
      const { data: pecas } = await supabase
        .from("pecas_estoque")
        .select("quantidade, minimo_estoque")
        .eq("loja_id", lojaId)
      
      const estoqueBaixo = pecas?.filter(p => p.quantidade <= p.minimo_estoque).length || 0

      // 4. Clientes
      const { count: clientesCount } = await supabase
        .from("clientes")
        .select("*", { count: 'exact', head: true })
        .eq("loja_id", lojaId)

      // 5. Distribuição de OS por Status
      const { data: osData } = await supabase
        .from("ordens_servico")
        .select("status")
        .eq("loja_id", lojaId)
      
      const counts: any = {}
      osData?.forEach(os => {
        counts[os.status] = (counts[os.status] || 0) + 1
      })
      const pieData = Object.entries(counts).map(([name, value]) => ({ name, value }))

      // 6. OS Recentes
      const { data: recent } = await supabase
        .from("ordens_servico")
        .select("id, cliente_nome, aparelho, status, created_at")
        .eq("loja_id", lojaId)
        .order("created_at", { ascending: false })
        .limit(5)

      setStats({
        osAtivas: osCount || 0,
        consertosHoje: consertosCount || 0,
        estoqueBaixo,
        totalClientes: clientesCount || 0,
        faturamentoMensal: 0 // Seria complexo sem somatório via RPC, mantemos 0 por enquanto ou skip
      })
      setOsStatusData(pieData)
      setRecentOS(recent || [])

    } catch (err) {
      console.error("Erro dashboard:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header Welcome */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Olá, <span className="text-purple-600">{(user?.username || "Técnico").split('@')[0]}</span>! 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Aqui está o que está acontecendo na sua loja hoje.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 text-xs">
          <Clock className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition group cursor-pointer" onClick={() => navigate("/os")}>
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <ClipboardList className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">OS Ativas</p>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.osAtivas}</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition group cursor-pointer" onClick={() => navigate("/consertos")}>
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <Wrench className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Consertos Hoje</p>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.consertosHoje}</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition group cursor-pointer" onClick={() => navigate("/estoque")}>
          <div className="flex justify-between items-start">
            <div className={`w-10 h-10 ${stats.estoqueBaixo > 0 ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600"} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              {stats.estoqueBaixo > 0 ? <AlertCircle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estoque Baixo</p>
          <h3 className={`text-2xl font-black mt-1 ${stats.estoqueBaixo > 0 ? "text-amber-500" : "text-gray-900 dark:text-white"}`}>{stats.estoqueBaixo}</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition group cursor-pointer" onClick={() => navigate("/clientes")}>
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/30 text-pink-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <Users className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-pink-500 transition-colors" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Clientes</p>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.totalClientes}</h3>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Distribuição - Coluna 2/3 */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Situação das Ordens de Serviço
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={osStatusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ações Rápidas - Coluna 1/3 */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-3xl shadow-lg text-white">
            <h3 className="font-bold mb-4">Acesso Rápido</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate("/nova-os")}
                className="bg-white/20 hover:bg-white/30 p-4 rounded-2xl flex flex-col items-center gap-2 transition active:scale-95"
              >
                <Plus className="w-6 h-6 text-white" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Nova OS</span>
              </button>
              <button 
                onClick={() => navigate("/novo")}
                className="bg-white/20 hover:bg-white/30 p-4 rounded-2xl flex flex-col items-center gap-2 transition active:scale-95"
              >
                <ShoppingBag className="w-6 h-6 text-white" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Pedido</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Últimas Atividades</h3>
            <div className="space-y-4">
              {recentOS.map((os) => (
                <div key={os.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
                    os.status === 'Entregue' ? 'bg-emerald-500' : 'bg-purple-500'
                  }`}>
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{os.cliente_nome}</p>
                    <p className="text-[10px] text-gray-500 truncate">{os.aparelho} • {os.status}</p>
                  </div>
                  <div className="text-[9px] text-gray-400 whitespace-nowrap">
                    {new Date(os.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {recentOS.length === 0 && <p className="text-xs text-center text-gray-400 py-4">Nenhuma atividade recente.</p>}
            </div>
            <button 
              onClick={() => navigate("/os")}
              className="w-full mt-4 py-2 text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 rounded-xl hover:bg-purple-100 transition"
            >
              Ver todas as Ordens
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section - Pie Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 self-start">Mix de Status</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={osStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {osStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 w-full">
              {osStatusData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-[10px] text-gray-500 font-medium">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
        </div>
        
        {/* Placeholder for future module or tips */}
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-xl flex items-center gap-8 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-2">Novo Módulo de Estoque! 📦</h2>
              <p className="text-sm text-gray-400 mb-6 max-w-md">Agora você pode controlar cada peça e insumo da sua loja com alertas automáticos de reposição.</p>
              <button 
                onClick={() => navigate("/estoque")}
                className="bg-white text-gray-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition shadow-lg"
              >
                Conhecer Estoque
              </button>
            </div>
            <Package className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 rotate-12" />
        </div>
      </div>
    </div>
  )
}