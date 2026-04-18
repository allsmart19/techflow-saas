import { useState, useEffect } from "react"
import { Calendar, Filter, Loader2, FileText } from "lucide-react"
import { supabase } from "../lib/supabase"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

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

interface CondicaoTotal {
  conserto: { qtd: number; valor: number }
  garantia: { qtd: number; valor: number }
  loja: { qtd: number; valor: number }
  devolucao: { qtd: number; valor: number }
  devolucaoPaga: { qtd: number; valor: number }
  quebrada: { qtd: number; valor: number }
  totalGeral: number
  totalPedidos: number
  freteTotal: number
}

export default function Relatorios() {
  const [loading, setLoading] = useState(false)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [tipoRelatorio, setTipoRelatorio] = useState<"mensal" | "anual">("mensal")
  const [anoSelecionado, setAnoSelecionado] = useState<string>("")
  const [mesSelecionado, setMesSelecionado] = useState<string>("")
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string>("")
  const [anosDisponiveis, setAnosDisponiveis] = useState<string[]>([])
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([])
  const [fornecedoresDisponiveis, setFornecedoresDisponiveis] = useState<string[]>([])
  const [relatorioData, setRelatorioData] = useState<CondicaoTotal | null>(null)
  const [pedidosFiltrados, setPedidosFiltrados] = useState<Pedido[]>([])
  const [lojaId, setLojaId] = useState<number | null>(null)

  // Carregar pedidos e fornecedores
  useEffect(() => {
    carregarPedidos()
    carregarFornecedores()
  }, [])

  // 🔥 CARREGAR FORNECEDORES DO SESSIONSTORAGE (integrados com a tela de Ajustes)
  async function carregarFornecedores() {
    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    if (!user) return

    // Buscar loja_id do usuário
    let lojaIdValue = user.loja_id
    if (!lojaIdValue) {
      const { data: userData } = await supabase
        .from("usuarios")
        .select("loja_id")
        .eq("id", user.id)
        .single()
      lojaIdValue = userData?.loja_id
    }

    if (!lojaIdValue) return

    // 🔥 Carregar fornecedores do sessionStorage (vindos da tela de Ajustes)
    const savedFornecedores = sessionStorage.getItem(`fornecedores_${lojaIdValue}`)
    if (savedFornecedores) {
      const fornecedores = JSON.parse(savedFornecedores)
      setFornecedoresDisponiveis(fornecedores.map((f: any) => f.nome))
    } else {
      // Fallback caso não existam dados no sessionStorage
      setFornecedoresDisponiveis(["NEW STORE", "NOVA PEÇAS", "FLORITEC", "VITOR CAMELÃO"])
    }
  }

  async function carregarPedidos() {
    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    if (!user) return

    setLoading(true)

    // 🔥 BUSCAR LOJA_ID DO USUÁRIO
    let lojaIdValue = user.loja_id
    if (!lojaIdValue) {
      const { data: userData } = await supabase
        .from("usuarios")
        .select("loja_id")
        .eq("id", user.id)
        .single()
      lojaIdValue = userData?.loja_id
    }

    if (!lojaIdValue) {
      console.error("Usuário sem loja_id")
      setLoading(false)
      return
    }

    setLojaId(lojaIdValue)

    // 🔥 FILTRAR POR LOJA_ID
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("loja_id", lojaIdValue)
      .order("data", { ascending: false })

    if (error) {
      console.error("Erro ao carregar pedidos:", error)
    } else {
      setPedidos(data || [])

      // Extrair anos e meses dos pedidos da loja
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

      if (anosLista.length > 0 && !anoSelecionado) setAnoSelecionado(anosLista[0])
      if (mesesLista.length > 0 && !mesSelecionado) setMesSelecionado(mesesLista[0])
    }
    setLoading(false)
  }

  function gerarRelatorio() {
    setLoading(true)

    let filtrados = [...pedidos]

    if (tipoRelatorio === "mensal" && mesSelecionado) {
      filtrados = filtrados.filter(p => p.data?.substring(3) === mesSelecionado)
    } else if (tipoRelatorio === "anual" && anoSelecionado) {
      filtrados = filtrados.filter(p => p.data?.substring(6) === anoSelecionado)
    }

    if (fornecedorSelecionado && fornecedorSelecionado !== "todos" && fornecedorSelecionado !== "") {
      filtrados = filtrados.filter(p => p.fornecedor === fornecedorSelecionado)
    }

    setPedidosFiltrados(filtrados)
    calcularTotais(filtrados)
    setLoading(false)
  }

  function calcularTotais(pedidosLista: Pedido[]) {
    let conserto = { qtd: 0, valor: 0 }
    let garantia = { qtd: 0, valor: 0 }
    let loja = { qtd: 0, valor: 0 }
    let devolucao = { qtd: 0, valor: 0 }
    let devolucaoPaga = { qtd: 0, valor: 0 }
    let quebrada = { qtd: 0, valor: 0 }
    let freteTotal = 0

    pedidosLista.forEach(pedido => {
      const valor = pedido.valor || 0
      const frete = pedido.frete || 0
      freteTotal += frete

      switch (pedido.condicao) {
        case "CONSERTO":
          conserto.qtd++
          conserto.valor += valor
          break
        case "GARANTIA":
          garantia.qtd++
          garantia.valor += valor
          break
        case "LOJA":
          loja.qtd++
          loja.valor += valor
          break
        case "DEVOLUÇÃO":
          devolucao.qtd++
          devolucao.valor += valor
          break
        case "DEVOLUÇÃO PAGA":
          devolucaoPaga.qtd++
          devolucaoPaga.valor += valor
          break
        case "QUEBRADA":
          quebrada.qtd++
          quebrada.valor += valor
          break
      }
    })

    const totalGeral = conserto.valor + garantia.valor + loja.valor

    setRelatorioData({
      conserto,
      garantia,
      loja,
      devolucao,
      devolucaoPaga,
      quebrada,
      totalGeral,
      totalPedidos: pedidosLista.length,
      freteTotal
    })
  }

  function gerarPDF() {
    const doc = new jsPDF()
    const periodo = tipoRelatorio === "mensal" ? mesSelecionado : anoSelecionado
    const nomeFornecedor = fornecedorSelecionado && fornecedorSelecionado !== "todos" && fornecedorSelecionado !== "" 
      ? fornecedorSelecionado 
      : "Todos os fornecedores"
    const dataAtual = new Date().toLocaleDateString('pt-BR')

    doc.setFillColor(139, 92, 246)
    doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text("TechFlow", 14, 18)
    doc.setFontSize(10)
    doc.text("Relatório de Pedidos", 14, 28)
    doc.setFontSize(8)
    doc.text(`Gerado em: ${dataAtual}`, 150, 28, { align: 'right' })

    doc.setTextColor(0, 0, 0)
    doc.setFillColor(245, 245, 250)
    doc.rect(14, 45, 182, 30, 'F')
    doc.setDrawColor(139, 92, 246)
    doc.setLineWidth(0.5)
    doc.rect(14, 45, 182, 30)

    doc.setFontSize(9)
    doc.setFont("helvetica", 'bold')
    doc.setTextColor(139, 92, 246)
    doc.text("Informações do Relatório", 20, 55)

    doc.setFont("helvetica", 'normal')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.text(`Período: ${periodo}`, 20, 65)
    doc.text(`Tipo: ${tipoRelatorio === "mensal" ? "Relatório Mensal" : "Relatório Anual"}`, 80, 65)
    doc.text(`Fornecedor: ${nomeFornecedor}`, 20, 72)

    let currentY = 88
    doc.setFontSize(10)
    doc.setFont("helvetica", 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text("Resumo do Período", 14, currentY)

    currentY += 6
    doc.setFontSize(8)
    doc.setFont("helvetica", 'normal')

    doc.setFillColor(245, 245, 245)
    doc.rect(14, currentY, 182, 8, 'F')
    doc.text("Total de Pedidos:", 20, currentY + 5.5)
    doc.text(`${relatorioData?.totalPedidos || 0}`, 180, currentY + 5.5, { align: 'right' })

    currentY += 9
    doc.text("Faturamento Total:", 20, currentY + 5.5)
    doc.text(`${formatCurrency(relatorioData?.totalGeral || 0)}`, 180, currentY + 5.5, { align: 'right' })

    currentY += 9
    doc.text("Ticket Médio:", 20, currentY + 5.5)
    doc.text(`${formatCurrency(relatorioData && relatorioData.totalPedidos > 0 ? relatorioData.totalGeral / relatorioData.totalPedidos : 0)}`, 180, currentY + 5.5, { align: 'right' })

    currentY += 9
    doc.text("Frete Total:", 20, currentY + 5.5)
    doc.text(`${formatCurrency(relatorioData?.freteTotal || 0)}`, 180, currentY + 5.5, { align: 'right' })

    currentY += 12
    doc.setFontSize(10)
    doc.setFont("helvetica", 'bold')
    doc.text("Detalhamento por Condição", 14, currentY)

    const tabelaCondicoes = [
      ["Condição", "Quantidade", "Valor Total", "%"],
      ["CONSERTO", relatorioData?.conserto.qtd.toString() || "0", formatCurrency(relatorioData?.conserto.valor || 0),
        `${relatorioData && relatorioData.totalGeral > 0 ? ((relatorioData.conserto.valor / relatorioData.totalGeral) * 100).toFixed(1) : 0}%`],
      ["GARANTIA", relatorioData?.garantia.qtd.toString() || "0", formatCurrency(relatorioData?.garantia.valor || 0),
        `${relatorioData && relatorioData.totalGeral > 0 ? ((relatorioData.garantia.valor / relatorioData.totalGeral) * 100).toFixed(1) : 0}%`],
      ["LOJA", relatorioData?.loja.qtd.toString() || "0", formatCurrency(relatorioData?.loja.valor || 0),
        `${relatorioData && relatorioData.totalGeral > 0 ? ((relatorioData.loja.valor / relatorioData.totalGeral) * 100).toFixed(1) : 0}%`],
      ["DEVOLUÇÃO", relatorioData?.devolucao.qtd.toString() || "0", formatCurrency(relatorioData?.devolucao.valor || 0),
        `${relatorioData && relatorioData.totalGeral > 0 ? ((relatorioData.devolucao.valor / relatorioData.totalGeral) * 100).toFixed(1) : 0}%`],
      ["DEVOLUÇÃO PAGA", relatorioData?.devolucaoPaga.qtd.toString() || "0", formatCurrency(relatorioData?.devolucaoPaga.valor || 0),
        `${relatorioData && relatorioData.totalGeral > 0 ? ((relatorioData.devolucaoPaga.valor / relatorioData.totalGeral) * 100).toFixed(1) : 0}%`],
      ["QUEBRADA", relatorioData?.quebrada.qtd.toString() || "0", formatCurrency(relatorioData?.quebrada.valor || 0),
        `${relatorioData && relatorioData.totalGeral > 0 ? ((relatorioData.quebrada.valor / relatorioData.totalGeral) * 100).toFixed(1) : 0}%`],
      ["TOTAL", relatorioData?.totalPedidos.toString() || "0", formatCurrency(relatorioData?.totalGeral || 0), "100%"]
    ]

    autoTable(doc, {
      startY: currentY + 6,
      head: [tabelaCondicoes[0]],
      body: tabelaCondicoes.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 70, halign: 'left' },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 50, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    })

    let finalY = (doc as any).lastAutoTable.finalY + 8

    if (pedidosFiltrados.length > 0) {
      doc.setFontSize(10)
      doc.setFont("helvetica", 'bold')
      doc.text("Pedidos no Período", 14, finalY)
      doc.setFontSize(7)
      doc.setFont("helvetica", 'normal')
      doc.text(`${pedidosFiltrados.length} pedidos encontrados`, 14, finalY + 5)

      const tabelaPedidos = [
        ["Data", "Código", "Modelo", "Condição", "Valor"],
        ...pedidosFiltrados.slice(0, 25).map(p => [
          p.data,
          p.codigo || "-",
          p.modelo.length > 25 ? p.modelo.substring(0, 22) + "..." : p.modelo,
          p.condicao,
          formatCurrency(p.valor)
        ])
      ]

      if (pedidosFiltrados.length > 25) {
        tabelaPedidos.push(["", "", `... e mais ${pedidosFiltrados.length - 25} pedidos`, "", ""])
      }

      autoTable(doc, {
        startY: finalY + 8,
        head: [tabelaPedidos[0]],
        body: tabelaPedidos.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontSize: 7, halign: 'center' },
        bodyStyles: { fontSize: 6 },
        columnStyles: {
          0: { cellWidth: 25, halign: 'left' },
          1: { cellWidth: 30, halign: 'left' },
          2: { cellWidth: 70, halign: 'left' },
          3: { cellWidth: 30, halign: 'center' },
          4: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      })
    }

    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(128, 128, 128)
      doc.text(`TechFlow - Relatório de Pedidos - Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 8)
    }

    const nomeArquivo = `relatorio_${tipoRelatorio}_${periodo}_${nomeFornecedor.replace(/\s/g, '_')}.pdf`
    doc.save(nomeArquivo)
  }

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const periodoLabel = tipoRelatorio === "mensal" ? mesSelecionado : anoSelecionado
  const nomeFornecedorLabel = fornecedorSelecionado && fornecedorSelecionado !== "todos" && fornecedorSelecionado !== "" 
    ? fornecedorSelecionado 
    : "Todos os fornecedores"

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Relatórios</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Análise detalhada de pedidos e faturamento</p>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Tipo</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTipoRelatorio("mensal")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    tipoRelatorio === "mensal" 
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" 
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setTipoRelatorio("anual")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    tipoRelatorio === "anual" 
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" 
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  Anual
                </button>
              </div>
            </div>

            {tipoRelatorio === "mensal" && (
              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Mês/Ano</label>
                <select
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {mesesDisponiveis.map(mes => (
                    <option key={mes} value={mes}>{mes}</option>
                  ))}
                </select>
              </div>
            )}

            {tipoRelatorio === "anual" && (
              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Ano</label>
                <select
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {anosDisponiveis.map(ano => (
                    <option key={ano} value={ano}>{ano}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Fornecedor</label>
              <select
                value={fornecedorSelecionado}
                onChange={(e) => setFornecedorSelecionado(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="todos">Todos os fornecedores</option>
                {fornecedoresDisponiveis.map(forn => (
                  <option key={forn} value={forn}>{forn}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={gerarRelatorio}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:shadow-lg transition"
              >
                <Filter className="w-3.5 h-3.5" />
                Gerar Relatório
              </button>
              {pedidosFiltrados.length > 0 && (
                <button
                  onClick={gerarPDF}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Gerar PDF
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resultados */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        )}

        {!loading && relatorioData && pedidosFiltrados.length > 0 && (
          <>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-900 mb-5">
              <h2 className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Informações do Relatório
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wide">Período</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{periodoLabel}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wide">Tipo</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {tipoRelatorio === "mensal" ? "Relatório Mensal" : "Relatório Anual"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wide">Fornecedor</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{nomeFornecedorLabel}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Resumo do Período</h2>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Total de Pedidos:</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{relatorioData.totalPedidos}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Faturamento Total:</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(relatorioData.totalGeral)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Ticket Médio:</span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(relatorioData.totalPedidos > 0 ? relatorioData.totalGeral / relatorioData.totalPedidos : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Frete Total:</span>
                  <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">{formatCurrency(relatorioData.freteTotal)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-5">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Detalhamento por Condição</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="text-left p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">Condição</th>
                      <th className="text-center p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">Quantidade</th>
                      <th className="text-right p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">Valor Total</th>
                      <th className="text-right p-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="p-2 text-xs font-medium text-purple-600 dark:text-purple-400">CONSERTO</td>
                      <td className="p-2 text-xs text-center text-gray-900 dark:text-white">{relatorioData.conserto.qtd}</td>
                      <td className="p-2 text-xs text-right text-gray-900 dark:text-white">{formatCurrency(relatorioData.conserto.valor)}</td>
                      <td className="p-2 text-xs text-right text-gray-500">
                        {relatorioData.totalGeral > 0 ? ((relatorioData.conserto.valor / relatorioData.totalGeral) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="p-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">GARANTIA</td>
                      <td className="p-2 text-xs text-center text-gray-900 dark:text-white">{relatorioData.garantia.qtd}</td>
                      <td className="p-2 text-xs text-right text-gray-900 dark:text-white">{formatCurrency(relatorioData.garantia.valor)}</td>
                      <td className="p-2 text-xs text-right text-gray-500">
                        {relatorioData.totalGeral > 0 ? ((relatorioData.garantia.valor / relatorioData.totalGeral) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="p-2 text-xs font-medium text-pink-600 dark:text-pink-400">LOJA</td>
                      <td className="p-2 text-xs text-center text-gray-900 dark:text-white">{relatorioData.loja.qtd}</td>
                      <td className="p-2 text-xs text-right text-gray-900 dark:text-white">{formatCurrency(relatorioData.loja.valor)}</td>
                      <td className="p-2 text-xs text-right text-gray-500">
                        {relatorioData.totalGeral > 0 ? ((relatorioData.loja.valor / relatorioData.totalGeral) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="p-2 text-xs font-medium text-red-600 dark:text-red-400">DEVOLUÇÃO</td>
                      <td className="p-2 text-xs text-center text-gray-900 dark:text-white">{relatorioData.devolucao.qtd}</td>
                      <td className="p-2 text-xs text-right text-gray-900 dark:text-white">{formatCurrency(relatorioData.devolucao.valor)}</td>
                      <td className="p-2 text-xs text-right text-gray-500">
                        {relatorioData.totalGeral > 0 ? ((relatorioData.devolucao.valor / relatorioData.totalGeral) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="p-2 text-xs font-medium text-amber-600 dark:text-amber-400">DEVOLUÇÃO PAGA</td>
                      <td className="p-2 text-xs text-center text-gray-900 dark:text-white">{relatorioData.devolucaoPaga.qtd}</td>
                      <td className="p-2 text-xs text-right text-gray-900 dark:text-white">{formatCurrency(relatorioData.devolucaoPaga.valor)}</td>
                      <td className="p-2 text-xs text-right text-gray-500">
                        {relatorioData.totalGeral > 0 ? ((relatorioData.devolucaoPaga.valor / relatorioData.totalGeral) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="p-2 text-xs font-medium text-gray-600 dark:text-gray-400">QUEBRADA</td>
                      <td className="p-2 text-xs text-center text-gray-900 dark:text-white">{relatorioData.quebrada.qtd}</td>
                      <td className="p-2 text-xs text-right text-gray-900 dark:text-white">{formatCurrency(relatorioData.quebrada.valor)}</td>
                      <td className="p-2 text-xs text-right text-gray-500">
                        {relatorioData.totalGeral > 0 ? ((relatorioData.quebrada.valor / relatorioData.totalGeral) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    <tr>
                      <td className="p-2 text-xs font-bold text-gray-900 dark:text-white">TOTAL</td>
                      <td className="p-2 text-xs text-center font-bold text-gray-900 dark:text-white">{relatorioData.totalPedidos}</td>
                      <td className="p-2 text-xs text-right font-bold text-gray-900 dark:text-white">{formatCurrency(relatorioData.totalGeral)}</td>
                      <td className="p-2 text-xs text-right font-bold text-gray-900 dark:text-white">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Pedidos no Período</h2>
                <p className="text-[9px] text-gray-500 mt-0.5">{pedidosFiltrados.length} pedidos encontrados</p>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr>
                      <th className="text-left p-1.5 text-[9px] font-medium text-gray-500 dark:text-gray-400">DATA</th>
                      <th className="text-left p-1.5 text-[9px] font-medium text-gray-500 dark:text-gray-400">CÓDIGO</th>
                      <th className="text-left p-1.5 text-[9px] font-medium text-gray-500 dark:text-gray-400">MODELO</th>
                      <th className="text-left p-1.5 text-[9px] font-medium text-gray-500 dark:text-gray-400">CONDIÇÃO</th>
                      <th className="text-right p-1.5 text-[9px] font-medium text-gray-500 dark:text-gray-400">VALOR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {pedidosFiltrados.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <td className="p-1.5 text-[10px] text-gray-600 dark:text-gray-400">{pedido.data}</td>
                        <td className="p-1.5 text-[10px] text-gray-600 dark:text-gray-400">{pedido.codigo || "-"}</td>
                        <td className="p-1.5 text-[10px] font-medium text-gray-900 dark:text-white">{pedido.modelo}</td>
                        <td className="p-1.5">
                          <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full ${
                            pedido.condicao === "CONSERTO" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                            pedido.condicao === "GARANTIA" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                            pedido.condicao === "LOJA" ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" :
                            pedido.condicao === "DEVOLUÇÃO" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                            pedido.condicao === "DEVOLUÇÃO PAGA" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                          }`}>
                            {pedido.condicao}
                          </span>
                        </td>
                        <td className="p-1.5 text-[10px] text-right font-medium text-gray-900 dark:text-white">{formatCurrency(pedido.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!loading && !relatorioData && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Filter className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Selecione o período e clique em "Gerar Relatório"</p>
          </div>
        )}
      </div>
    </div>
  )
}