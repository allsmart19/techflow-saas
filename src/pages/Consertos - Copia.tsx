// src/pages/Consertos.tsx
import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { 
  Wrench, Calendar, TrendingUp, DollarSign, 
  Percent, Plus, Edit, Trash2, Search,
  Loader2, X, FileText, Users
} from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface Conserto {
  id: number
  data: string
  modelo: string
  servico: string
  valor_cobrado: number
  valor_custo: number
  frete: string
  lucro: number
  comissao: number
  tecnico_id: number
  usuario_nome?: string
}

interface Usuario {
  id: number
  username: string
  role: string
  comissao_percentual: number
  ativo: boolean
}

export default function Consertos() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [consertos, setConsertos] = useState<Conserto[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [search, setSearch] = useState("")
  const [mesSelecionado, setMesSelecionado] = useState("")
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([])
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>("")
  const [userLogado, setUserLogado] = useState<any>(null)
  const [comissaoPercentualUsuario, setComissaoPercentualUsuario] = useState<number>(10)
  
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    modelo: "",
    servico: "",
    valor_cobrado: "",
    valor_custo: "",
    frete: "NÃO",
    lucro: "0",
    comissao: "0"
  })

  // Carregar dados do usuário logado
  useEffect(() => {
    const userStr = sessionStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserLogado(user)
      // Se for admin, carregar lista de usuários
      if (user.role === 'admin') {
        carregarUsuarios()
      }
    } else {
      navigate("/login")
    }
  }, [])

  useEffect(() => {
    if (userLogado?.id) {
      carregarComissaoUsuario()
    }
  }, [userLogado])
  
  async function carregarComissaoUsuario() {
    const percentual = await getComissaoPercentual(userLogado?.id)
    setComissaoPercentualUsuario(percentual)
  }

  // Carregar lista de usuários (apenas para admin)
  // Agora carrega todos os usuários, mas vamos filtrar na exibição
  async function carregarUsuarios() {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, username, role, comissao_percentual, ativo")
      .order("username")
    
    if (!error && data) {
      setUsuarios(data)
    }
  }

  // Função para buscar a comissão percentual do usuário
  async function getComissaoPercentual(tecnicoId: number): Promise<number> {
    const { data, error } = await supabase
      .from("usuarios")
      .select("comissao_percentual")
      .eq("id", tecnicoId)
      .single()
    
    if (error || !data) {
      return 10.00 // Valor padrão
    }
    return data.comissao_percentual
  }

  // Carregar consertos baseado no perfil
  useEffect(() => {
    if (userLogado) {
      carregarConsertos()
    }
  }, [userLogado, usuarioSelecionado, mesSelecionado])

  async function carregarConsertos() {
    setLoading(true)
    
    let query = supabase.from("consertos").select("*")
    
    // Se não for admin, mostra apenas os próprios consertos
    if (userLogado?.role !== 'admin') {
      query = query.eq("tecnico_id", userLogado?.id)
    } 
    // Se for admin e selecionou um usuário específico
    else if (usuarioSelecionado && usuarioSelecionado !== "") {
      query = query.eq("tecnico_id", parseInt(usuarioSelecionado))
    }
    // Se for admin e NÃO selecionou nenhum usuário, mostra todos
    // (sem filtro)
    
    const { data, error } = await query.order("data", { ascending: false })
    
    if (error) {
      console.error("Erro ao carregar consertos:", error)
      setConsertos([])
    } else {
      // Se for admin e não tiver filtro, buscar nomes dos usuários
      let consertosComNomes = data || []
      
      if (userLogado?.role === 'admin' && !usuarioSelecionado && consertosComNomes.length > 0) {
        // Buscar informações dos usuários
        const userIds = [...new Set(consertosComNomes.map(c => c.tecnico_id))]
        const { data: usuariosData } = await supabase
          .from("usuarios")
          .select("id, username, ativo")
          .in("id", userIds)
        
        if (usuariosData) {
          consertosComNomes = consertosComNomes.map(c => ({
            ...c,
            usuario_nome: usuariosData.find(u => u.id === c.tecnico_id)?.username || "Usuário não encontrado",
            usuario_ativo: usuariosData.find(u => u.id === c.tecnico_id)?.ativo || false
          }))
        }
      }
      
      setConsertos(consertosComNomes)
      
      // Gerar meses disponíveis
      const meses = new Set<string>()
      consertosComNomes?.forEach((c: Conserto) => {
        if (c.data) {
          const mes = c.data.substring(3)
          meses.add(mes)
        }
      })
      const mesesLista = Array.from(meses).sort().reverse()
      setMesesDisponiveis(mesesLista)
      
      const hoje = new Date()
      const mesAtual = `${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${hoje.getFullYear()}`
      setMesSelecionado(mesSelecionado || (mesesLista.includes(mesAtual) ? mesAtual : (mesesLista[0] || "")))
    }
    setLoading(false)
  }

  // Filtrar consertos
  const consertosFiltrados = useMemo(() => {
    return consertos.filter(c => {
      let match = true
      if (mesSelecionado) {
        match = match && c.data?.substring(3) === mesSelecionado
      }
      if (search) {
        match = match && (
          c.modelo.toLowerCase().includes(search.toLowerCase()) ||
          c.servico.toLowerCase().includes(search.toLowerCase())
        )
      }
      return match
    })
  }, [consertos, mesSelecionado, search])

  // Calcular totais
  const totais = useMemo(() => {
    const totalVendas = consertosFiltrados.reduce((acc, c) => acc + c.valor_cobrado, 0)
    const totalLucro = consertosFiltrados.reduce((acc, c) => acc + c.lucro, 0)
    const totalFrete = consertosFiltrados.filter(c => c.frete !== "NÃO").reduce((acc, c) => {
      const freteNum = parseFloat(c.frete.replace('R$ ', '').replace(/\./g, '').replace(',', '.'))
      return acc + (isNaN(freteNum) ? 0 : freteNum)
    }, 0)
    const comissaoTotal = consertosFiltrados.reduce((acc, c) => acc + c.comissao, 0)
    const quantidade = consertosFiltrados.length
    
    return { totalVendas, totalLucro, totalFrete, comissaoTotal, quantidade }
  }, [consertosFiltrados])

  // Lista de usuários para o select (apenas quem tem consertos no período selecionado)
const usuariosComConsertosNoPeriodo = useMemo(() => {
  if (userLogado?.role !== 'admin') return []
  
  // Se não tem mês selecionado, mostrar todos os usuários que têm consertos
  if (!mesSelecionado) {
    const usuariosComConsertos = new Set(consertos.map(c => c.tecnico_id))
    return usuarios.filter(u => usuariosComConsertos.has(u.id))
  }
  
  // Filtrar consertos pelo mês selecionado
  const consertosNoMes = consertos.filter(c => c.data?.substring(3) === mesSelecionado)
  const usuariosIdsNoMes = new Set(consertosNoMes.map(c => c.tecnico_id))
  
  // Retornar usuários que têm consertos no mês selecionado
  return usuarios.filter(u => usuariosIdsNoMes.has(u.id))
}, [consertos, usuarios, mesSelecionado, userLogado])

const handleValorCobradoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value.replace(/\D/g, '')
  const valorCobrado = value ? parseFloat(value) / 100 : 0
  const valorCusto = parseFloat(formData.valor_custo) || 0
  const lucro = valorCobrado - valorCusto
  const comissao = lucro * (comissaoPercentualUsuario / 100)
  
  setFormData({
    ...formData,
    valor_cobrado: valorCobrado.toFixed(2),
    lucro: lucro.toFixed(2),
    comissao: comissao.toFixed(2)
  })
}

const handleValorCustoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value.replace(/\D/g, '')
  const valorCusto = value ? parseFloat(value) / 100 : 0
  const valorCobrado = parseFloat(formData.valor_cobrado) || 0
  const lucro = valorCobrado - valorCusto
  const comissao = lucro * (comissaoPercentualUsuario / 100)
  
  setFormData({
    ...formData,
    valor_custo: valorCusto.toFixed(2),
    lucro: lucro.toFixed(2),
    comissao: comissao.toFixed(2)
  })
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const dataFormatada = new Date(formData.data).toLocaleDateString('pt-BR')
    const valorCobrado = parseFloat(formData.valor_cobrado) || 0
    const valorCusto = parseFloat(formData.valor_custo) || 0
    
    // Calcular lucro
    const lucro = valorCobrado - valorCusto
    
    // Determinar o tecnico_id
    let tecnicoId = userLogado?.id // Padrão: usuário logado
    
    // Se for edição e o usuário logado for admin, manter o tecnico_id original
    if (editandoId && userLogado?.role === 'admin') {
      // Buscar o conserto original para pegar o tecnico_id
      const { data: consertoOriginal } = await supabase
        .from("consertos")
        .select("tecnico_id")
        .eq("id", editandoId)
        .single()
      
      if (consertoOriginal) {
        tecnicoId = consertoOriginal.tecnico_id
      }
    }
    
    // Buscar comissão personalizada do TÉCNICO RESPONSÁVEL (não do admin)
    const comissaoPercentual = await getComissaoPercentual(tecnicoId)
    const comissao = lucro * (comissaoPercentual / 100)
    
    // Tratar o frete (pode ser "NÃO" ou um valor como "R$ 50,00")
    let freteValue = formData.frete
    if (freteValue !== "NÃO" && freteValue && freteValue !== "") {
      let cleanValue = freteValue.replace('R$ ', '').replace(/\./g, '').replace(',', '.')
      const numericFrete = parseFloat(cleanValue)
      if (!isNaN(numericFrete)) {
        freteValue = `R$ ${numericFrete.toFixed(2)}`
      }
    } else if (freteValue === "" || freteValue === "NÃO") {
      freteValue = "NÃO"
    }
    
    const consertoData = {
      data: dataFormatada,
      modelo: formData.modelo.toUpperCase(),
      servico: formData.servico,
      valor_cobrado: valorCobrado,
      valor_custo: valorCusto,
      frete: freteValue,
      lucro: lucro,
      comissao: comissao,
      tecnico_id: tecnicoId // Usa o ID correto (original se for admin editando)
    }
    
    let error = null
    
    if (editandoId) {
      const { error: updateError } = await supabase
        .from("consertos")
        .update(consertoData)
        .eq("id", editandoId)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from("consertos")
        .insert([consertoData])
      error = insertError
    }
    
    if (error) {
      alert("Erro ao salvar conserto!")
    } else {
      alert(`✅ Conserto ${editandoId ? "atualizado" : "salvo"} com sucesso!`)
      setModalAberto(false)
      setEditandoId(null)
      setFormData({
        data: new Date().toISOString().split('T')[0],
        modelo: "",
        servico: "",
        valor_cobrado: "",
        valor_custo: "",
        frete: "NÃO",
        lucro: "0",
        comissao: "0"
      })
      carregarConsertos()
    }
    setLoading(false)
  }

  const editarConserto = (conserto: Conserto) => {
    setEditandoId(conserto.id)
    const partes = conserto.data.split('/')
    const dataInput = partes.length === 3 ? `${partes[2]}-${partes[1]}-${partes[0]}` : ""
    setFormData({
      data: dataInput,
      modelo: conserto.modelo,
      servico: conserto.servico,
      valor_cobrado: conserto.valor_cobrado.toFixed(2),
      valor_custo: conserto.valor_custo.toFixed(2),
      frete: conserto.frete,
      lucro: conserto.lucro.toFixed(2),
      comissao: conserto.comissao.toFixed(2)
    })
    setModalAberto(true)
  }
  const excluirConserto = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este conserto?")) {
      const { error } = await supabase.from("consertos").delete().eq("id", id)
      if (error) {
        alert("Erro ao excluir conserto!")
      } else {
        alert("Conserto excluído com sucesso!")
        carregarConsertos()
      }
    }
  }

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const displayValor = (value: string) => {
    if (!value) return ""
    const num = parseFloat(value)
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const gerarPDF = () => {
    const doc = new jsPDF()
    const dataAtual = new Date().toLocaleDateString('pt-BR')
    const periodo = mesSelecionado || "Todos os períodos"
    const tecnicoInfo = usuarioSelecionado && userLogado?.role === 'admin' 
      ? usuarios.find(u => u.id === parseInt(usuarioSelecionado))?.username 
      : userLogado?.username
    
    doc.setFillColor(139, 92, 246)
    doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text("Relatório de Consertos", 14, 18)
    doc.setFontSize(9)
    doc.text(`Gerado em: ${dataAtual}`, 14, 28)
    
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont("helvetica", 'bold')
    doc.text("Informações do Relatório", 14, 50)
    doc.setFont("helvetica", 'normal')
    doc.setFontSize(9)
    doc.text(`Período: ${periodo}`, 14, 60)
    doc.text(`Técnico: ${tecnicoInfo || "Todos"}`, 14, 68)
    
    doc.setFont("helvetica", 'bold')
    doc.text("Resumo", 14, 80)
    doc.setFont("helvetica", 'normal')
    doc.text(`Total de Consertos: ${totais.quantidade}`, 14, 90)
    doc.text(`Total Vendas: ${formatCurrency(totais.totalVendas)}`, 14, 98)
    doc.text(`Total Lucro: ${formatCurrency(totais.totalLucro)}`, 14, 106)
    doc.text(`Comissão Total: ${formatCurrency(totais.comissaoTotal)}`, 14, 114)
    
    doc.setFont("helvetica", 'bold')
    doc.text("Lista de Consertos", 14, 130)
    doc.setFont("helvetica", 'normal')
    
    const headers = ["Data", "Modelo", "Serviço", "Valor", "Custo", "Lucro", "Comissão"]
    if (userLogado?.role === 'admin' && !usuarioSelecionado) {
      headers.unshift("Técnico")
    }
    
    const tabelaConsertos = [
      headers,
      ...consertosFiltrados.slice(0, 30).map(c => {
        const row = [
          c.data,
          c.modelo,
          c.servico,
          formatCurrency(c.valor_cobrado),
          formatCurrency(c.valor_custo),
          formatCurrency(c.lucro),
          formatCurrency(c.comissao)
        ]
        if (userLogado?.role === 'admin' && !usuarioSelecionado) {
          row.unshift(c.usuario_nome || "N/A")
        }
        return row
      })
    ]
    
    if (consertosFiltrados.length > 30) {
      tabelaConsertos.push(["", "", `... e mais ${consertosFiltrados.length - 30} consertos`, "", "", "", ""])
    }
    
    autoTable(doc, {
      startY: 137,
      head: [tabelaConsertos[0]],
      body: tabelaConsertos.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14 }
    })
    
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(128, 128, 128)
      doc.text(`Relatório de Consertos - Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 8)
    }
    
    doc.save(`relatorio_consertos_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  if (loading && consertos.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Consertos</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gestão de consertos realizados</p>
        </div>
        <button
          onClick={() => {
            setEditandoId(null)
            setFormData({
              data: new Date().toISOString().split('T')[0],
              modelo: "",
              servico: "",
              valor_cobrado: "",
              valor_custo: "",
              frete: "NÃO",
              lucro: "0",
              comissao: "0"
            })
            setModalAberto(true)
          }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:shadow-lg transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Conserto
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <TrendingUp className="w-4 h-4 opacity-80" />
            <span className="text-[9px] opacity-80">APARELHOS CONSERTADOS</span>
          </div>
          <p className="text-xl font-bold">{totais.quantidade}</p>
          <p className="text-[9px] opacity-80">este mês</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <DollarSign className="w-4 h-4 opacity-80" />
            <span className="text-[9px] opacity-80">TOTAL VENDAS</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(totais.totalVendas)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Wrench className="w-4 h-4 opacity-80" />
            <span className="text-[9px] opacity-80">TOTAL LUCRO</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(totais.totalLucro)}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Percent className="w-4 h-4 opacity-80" />
            <span className="text-[9px] opacity-80">COMISSÃO</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(totais.comissaoTotal)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por modelo ou serviço..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <select
              value={mesSelecionado}
              onChange={(e) => {
                setMesSelecionado(e.target.value)
                setUsuarioSelecionado("") // Resetar usuário selecionado ao mudar o mês
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 appearance-none"
            >
              <option value="">Todos os meses</option>
              {mesesDisponiveis.map(mes => (
                <option key={mes} value={mes}>{mes}</option>
              ))}
            </select>
          </div>

          {/* Seletor de Usuário - Apenas para Admin - Mostra apenas usuários com consertos no período */}
          {userLogado?.role === 'admin' && (
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <select
                value={usuarioSelecionado}
                onChange={(e) => setUsuarioSelecionado(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 appearance-none"
              >
                <option value="">Todos os técnicos</option>
                {usuariosComConsertosNoPeriodo
                  .filter(u => u.role !== 'admin')
                  .map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.username} {!usuario.ativo && "(Inativo)"}
                    </option>
                  ))}
              </select>
              {usuariosComConsertosNoPeriodo.filter(u => u.role !== 'admin').length === 0 && (
                <p className="text-xs text-gray-400 mt-1 absolute -bottom-5 left-0">
                  Nenhum técnico com consertos neste período
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setSearch("")
                setMesSelecionado("")
                if (userLogado?.role === 'admin') {
                  setUsuarioSelecionado("")
                }
              }}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
            
            <button
              onClick={gerarPDF}
              disabled={consertosFiltrados.length === 0}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              Gerar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {userLogado?.role === 'admin' && !usuarioSelecionado && (
                  <th className="text-left p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">TÉCNICO</th>
                )}
                <th className="text-left p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">DATA</th>
                <th className="text-left p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">MODELO</th>
                <th className="text-left p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">SERVIÇO</th>
                <th className="text-right p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">VALOR COBRADO</th>
                <th className="text-right p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">VALOR CUSTO</th>
                <th className="text-center p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">FRETE</th>
                <th className="text-right p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">LUCRO</th>
                <th className="text-right p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">COMISSÃO</th>
                <th className="text-center p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {consertosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={userLogado?.role === 'admin' && !usuarioSelecionado ? 10 : 9} className="text-center py-8 text-xs text-gray-500">
                    Nenhum conserto encontrado
                  </td>
                </tr>
              ) : (
                consertosFiltrados.map((conserto) => (
                  <tr key={conserto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    {userLogado?.role === 'admin' && !usuarioSelecionado && (
                      <td className="p-2 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                        {conserto.usuario_nome || "N/A"}
                      </td>
                    )}
                    <td className="p-2 text-[11px] text-gray-600 dark:text-gray-400">{conserto.data}</td>
                    <td className="p-2 text-[11px] font-medium text-gray-900 dark:text-white">{conserto.modelo}</td>
                    <td className="p-2 text-[11px] text-gray-600 dark:text-gray-400">{conserto.servico}</td>
                    <td className="p-2 text-[11px] text-right font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(conserto.valor_cobrado)}</td>
                    <td className="p-2 text-[11px] text-right text-red-600 dark:text-red-400">{formatCurrency(conserto.valor_custo)}</td>
                    <td className="p-2 text-[11px] text-center text-gray-600 dark:text-gray-400">
                      {conserto.frete === "NÃO" || !conserto.frete ? "NÃO" : conserto.frete}
                    </td>
                    <td className="p-2 text-[11px] text-right font-medium text-purple-600 dark:text-purple-400">{formatCurrency(conserto.lucro)}</td>
                    <td className="p-2 text-[11px] text-right text-amber-600 dark:text-amber-400">{formatCurrency(conserto.comissao)}</td>
                    <td className="p-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => editarConserto(conserto)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => excluirConserto(conserto.id)} className="p-1 text-red-600 hover:bg-red-50 rounded transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - mesmo código de antes */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {editandoId ? "Editar Conserto" : "Novo Conserto"}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">DATA *</label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({...formData, data: e.target.value})}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">MODELO *</label>
                <input
                  type="text"
                  value={formData.modelo}
                  onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900"
                  placeholder="Ex: Samsung M54, iPhone 12"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">SERVIÇO *</label>
                <input
                  type="text"
                  value={formData.servico}
                  onChange={(e) => setFormData({...formData, servico: e.target.value})}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900"
                  placeholder="Ex: Troca de tela, Remoção de vírus"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">VALOR COBRADO (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">R$</span>
                    <input
                      type="text"
                      value={displayValor(formData.valor_cobrado)}
                      onChange={handleValorCobradoChange}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">VALOR CUSTO (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">R$</span>
                    <input
                      type="text"
                      value={displayValor(formData.valor_custo)}
                      onChange={handleValorCustoChange}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Campo FRETE atualizado para valor digitável */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">FRETE</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">R$</span>
                  <input
                    type="text"
                    value={formData.frete === "NÃO" ? "" : formData.frete.replace('R$ ', '')}
                    onChange={(e) => {
                      let value = e.target.value
                      let numericValue = value.replace(/[^\d,]/g, '')
                      
                      if (numericValue === "") {
                        setFormData({...formData, frete: "NÃO"})
                      } else {
                        let cleanValue = numericValue.replace(',', '.')
                        let num = parseFloat(cleanValue)
                        if (!isNaN(num)) {
                          setFormData({...formData, frete: `R$ ${num.toFixed(2)}`})
                        } else {
                          setFormData({...formData, frete: value})
                        }
                      }
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900"
                    placeholder="Digite o valor do frete (ex: 50,00)"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  💡 Deixe vazio para marcar como "NÃO" ou digite o valor (ex: 50,00)
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">LUCRO (R$)</label>
                <input
                  type="text"
                  value={displayValor(formData.lucro)}
                  disabled
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">COMISSÃO (R$)</label>
                <input
                  type="text"
                  value={displayValor(formData.comissao)}
                  disabled
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  💰 Comissão: {comissaoPercentualUsuario}% do lucro
                </p>
              </div>
            </div>
              
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? "Salvando..." : (editandoId ? "Atualizar" : "Salvar")}
                </button>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
