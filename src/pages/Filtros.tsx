import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Search, Filter, Download, Loader2, X, TrendingUp, Calculator, FileText } from "lucide-react"

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

interface Totais {
  CONSERTO: { qtd: number; valor: number }
  GARANTIA: { qtd: number; valor: number }
  DEVOLUÇÃO: { qtd: number; valor: number }
  DEVOLUÇÃO_PAGA: { qtd: number; valor: number }
  FRETE: { qtd: number; valor: number }
  LOJA: { qtd: number; valor: number }
  QUEBRADA: { qtd: number; valor: number }
  TOTAL_NOTAS: number
  TOTAL_A_PAGAR: number
  QUANTIDADE: number
}

// Chaves para salvar no localStorage
const STORAGE_KEYS = {
  DATA_INICIO: "filtros_data_inicio",
  DATA_FIM: "filtros_data_fim",
  MES: "filtros_mes",
  FORNECEDOR: "filtros_fornecedor",
  CONDICAO: "filtros_condicao"
}

export default function Filtros() {
  const [loading, setLoading] = useState(false)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [resultados, setResultados] = useState<Pedido[]>([])
  const [totais, setTotais] = useState<Totais>({
    CONSERTO: { qtd: 0, valor: 0 },
    GARANTIA: { qtd: 0, valor: 0 },
    DEVOLUÇÃO: { qtd: 0, valor: 0 },
    DEVOLUÇÃO_PAGA: { qtd: 0, valor: 0 },
    FRETE: { qtd: 0, valor: 0 },
    LOJA: { qtd: 0, valor: 0 },
    QUEBRADA: { qtd: 0, valor: 0 },
    TOTAL_NOTAS: 0,
    TOTAL_A_PAGAR: 0,
    QUANTIDADE: 0
  })

  // Estados dos filtros
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [mesSelecionado, setMesSelecionado] = useState("")
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState("")
  const [condicaoSelecionada, setCondicaoSelecionada] = useState("")
  
  // Opções para os selects
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([])
  const [fornecedoresLista, setFornecedoresLista] = useState<string[]>([])
  const [condicoesLista, setCondicoesLista] = useState<string[]>([])
  const [lojaId, setLojaId] = useState<number | null>(null)

  // Carregar último filtro salvo ao iniciar
  useEffect(() => {
    const savedDataInicio = sessionStorage.getItem(STORAGE_KEYS.DATA_INICIO)
    const savedDataFim = sessionStorage.getItem(STORAGE_KEYS.DATA_FIM)
    const savedMes = sessionStorage.getItem(STORAGE_KEYS.MES)
    const savedFornecedor = sessionStorage.getItem(STORAGE_KEYS.FORNECEDOR)
    const savedCondicao = sessionStorage.getItem(STORAGE_KEYS.CONDICAO)
    
    if (savedDataInicio) setDataInicio(savedDataInicio)
    if (savedDataFim) setDataFim(savedDataFim)
    if (savedMes) setMesSelecionado(savedMes)
    if (savedFornecedor) setFornecedorSelecionado(savedFornecedor)
    if (savedCondicao) setCondicaoSelecionada(savedCondicao)
    
    carregarDados()
  }, [])

  async function carregarDados() {
    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    if (!user) return

    setLoading(true)

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

    if (!lojaIdValue) {
      console.error("Usuário sem loja_id")
      setLoading(false)
      return
    }

    setLojaId(lojaIdValue)

    // 🔥 CARREGAR FORNECEDORES DO SESSIONSTORAGE (integrados com Ajustes)
    const savedFornecedores = sessionStorage.getItem(`fornecedores_${lojaIdValue}`)
    if (savedFornecedores) {
      const fornecedores = JSON.parse(savedFornecedores)
      setFornecedoresLista(fornecedores.map((f: any) => f.nome))
    } else {
      // Fallback padrão
      setFornecedoresLista(["NEW STORE", "NOVA PEÇAS", "FLORITEC", "VITOR CAMELÃO"])
    }

    // 🔥 CARREGAR CONDIÇÕES DO SESSIONSTORAGE (integrados com Ajustes)
    const savedCondicoes = sessionStorage.getItem(`condicoes_${lojaIdValue}`)
    if (savedCondicoes) {
      const condicoes = JSON.parse(savedCondicoes)
      setCondicoesLista(condicoes.map((c: any) => c.nome))
    } else {
      // Fallback padrão
      setCondicoesLista(["CONSERTO", "GARANTIA", "LOJA", "DEVOLUÇÃO", "DEVOLUÇÃO PAGA", "QUEBRADA"])
    }

    // Carregar pedidos da loja
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("loja_id", lojaIdValue)
      .order("data", { ascending: false })

    if (error) {
      console.error("Erro ao carregar pedidos:", error)
    } else {
      setPedidos(data || [])
      
      // Extrair meses únicos
      const meses = new Set<string>()
      data?.forEach((pedido: Pedido) => {
        if (pedido.data) {
          const mes = pedido.data.substring(3)
          meses.add(mes)
        }
      })
      setMesesDisponiveis(Array.from(meses).sort().reverse())
    }
    setLoading(false)
  }

  // Salvar filtros sempre que mudarem
  useEffect(() => {
    if (pedidos.length > 0) {
      sessionStorage.setItem(STORAGE_KEYS.DATA_INICIO, dataInicio)
      sessionStorage.setItem(STORAGE_KEYS.DATA_FIM, dataFim)
      sessionStorage.setItem(STORAGE_KEYS.MES, mesSelecionado)
      sessionStorage.setItem(STORAGE_KEYS.FORNECEDOR, fornecedorSelecionado)
      sessionStorage.setItem(STORAGE_KEYS.CONDICAO, condicaoSelecionada)
      
      // Aplicar filtros automaticamente quando os dados estiverem carregados
      if (dataInicio || dataFim || mesSelecionado || fornecedorSelecionado || condicaoSelecionada) {
        aplicarFiltros()
      }
    }
  }, [dataInicio, dataFim, mesSelecionado, fornecedorSelecionado, condicaoSelecionada, pedidos.length])

  // Função para converter data do formato brasileiro (dd/mm/aaaa) para string YYYY-MM-DD
  function converterDataParaComparacao(dataStr: string): string {
    if (!dataStr) return ""
    const partes = dataStr.split('/')
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`
    }
    return ""
  }

  function aplicarFiltros() {
    setLoading(true)
    
    let filtrados = [...pedidos]
    
    // FILTRO POR DATA
    if (dataInicio && dataFim) {
      const inicio = dataInicio
      const fim = dataFim
      
      filtrados = filtrados.filter(pedido => {
        if (!pedido.data) return false
        const dataPedido = converterDataParaComparacao(pedido.data)
        return dataPedido >= inicio && dataPedido <= fim
      })
    } 
    else if (dataInicio && !dataFim) {
      const dataSelecionada = dataInicio
      
      filtrados = filtrados.filter(pedido => {
        if (!pedido.data) return false
        const dataPedido = converterDataParaComparacao(pedido.data)
        return dataPedido === dataSelecionada
      })
    }
    else if (!dataInicio && dataFim) {
      const fim = dataFim
      
      filtrados = filtrados.filter(pedido => {
        if (!pedido.data) return false
        const dataPedido = converterDataParaComparacao(pedido.data)
        return dataPedido <= fim
      })
    }
    
    // Filtro por mês
    if (mesSelecionado) {
      filtrados = filtrados.filter(pedido => pedido.data?.substring(3) === mesSelecionado)
    }
    
    // Filtro por fornecedor
    if (fornecedorSelecionado && fornecedorSelecionado !== "TODOS" && fornecedorSelecionado !== "") {
      filtrados = filtrados.filter(pedido => pedido.fornecedor === fornecedorSelecionado)
    }
    
    // Filtro por condição
    if (condicaoSelecionada && condicaoSelecionada !== "TODAS" && condicaoSelecionada !== "") {
      filtrados = filtrados.filter(pedido => pedido.condicao === condicaoSelecionada)
    }
    
    setResultados(filtrados)
    calcularTotais(filtrados)
    setLoading(false)
  }

  function calcularTotais(pedidosLista: Pedido[]) {
    let conserto = { qtd: 0, valor: 0 }
    let garantia = { qtd: 0, valor: 0 }
    let devolucao = { qtd: 0, valor: 0 }
    let devolucaoPaga = { qtd: 0, valor: 0 }
    let frete = { qtd: 0, valor: 0 }
    let loja = { qtd: 0, valor: 0 }
    let quebrada = { qtd: 0, valor: 0 }
    
    pedidosLista.forEach(pedido => {
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
    
    const totalNotas = conserto.valor + garantia.valor + devolucao.valor + devolucaoPaga.valor + frete.valor + loja.valor + quebrada.valor
    const totalAPagar = conserto.valor + frete.valor + loja.valor + quebrada.valor - devolucaoPaga.valor
    
    setTotais({
      CONSERTO: conserto,
      GARANTIA: garantia,
      DEVOLUÇÃO: devolucao,
      DEVOLUÇÃO_PAGA: devolucaoPaga,
      FRETE: frete,
      LOJA: loja,
      QUEBRADA: quebrada,
      TOTAL_NOTAS: totalNotas,
      TOTAL_A_PAGAR: totalAPagar,
      QUANTIDADE: pedidosLista.length
    })
  }

  function limparFiltros() {
    setDataInicio("")
    setDataFim("")
    setMesSelecionado("")
    setFornecedorSelecionado("")
    setCondicaoSelecionada("")
    
    sessionStorage.removeItem(STORAGE_KEYS.DATA_INICIO)
    sessionStorage.removeItem(STORAGE_KEYS.DATA_FIM)
    sessionStorage.removeItem(STORAGE_KEYS.MES)
    sessionStorage.removeItem(STORAGE_KEYS.FORNECEDOR)
    sessionStorage.removeItem(STORAGE_KEYS.CONDICAO)
    
    setResultados([])
    setTotais({
      CONSERTO: { qtd: 0, valor: 0 },
      GARANTIA: { qtd: 0, valor: 0 },
      DEVOLUÇÃO: { qtd: 0, valor: 0 },
      DEVOLUÇÃO_PAGA: { qtd: 0, valor: 0 },
      FRETE: { qtd: 0, valor: 0 },
      LOJA: { qtd: 0, valor: 0 },
      QUEBRADA: { qtd: 0, valor: 0 },
      TOTAL_NOTAS: 0,
      TOTAL_A_PAGAR: 0,
      QUANTIDADE: 0
    })
  }

  
//function gerarPDF() {
async function gerarPDF() {
  if (resultados.length === 0) {
    alert("Não há dados para gerar o PDF.")
    return
  }

  // 🔥 BUSCAR NOME DA LOJA
  let nomeLoja = "Store Tech"
  
  try {
    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    
    if (user && user.id) {
      const { data: userData } = await supabase
        .from("usuarios")
        .select("loja_id")
        .eq("id", user.id)
        .single()
      
      if (userData && userData.loja_id) {
        const { data: configData } = await supabase
          .from("config_loja")
          .select("nome_loja")
          .eq("loja_id", userData.loja_id)
          .single()
        
        if (configData && configData.nome_loja) {
          nomeLoja = configData.nome_loja
        }
      }
    }
  } catch (error) {
    console.error("Erro ao buscar nome da loja:", error)
  }

  const doc = new jsPDF()
  const dataAtual = new Date().toLocaleDateString('pt-BR')
  const horaAtual = new Date().toLocaleTimeString('pt-BR')

  // Cabeçalho
  doc.setFillColor(139, 92, 246)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text(nomeLoja, 14, 18)
  doc.setFontSize(10)
  doc.text("Relatório de Filtros Avançados", 14, 28)
  doc.setFontSize(8)
  doc.text(`Gerado em: ${dataAtual} às ${horaAtual}`, 150, 28, { align: 'right' })

  // 🔥 INFORMAÇÃO DO PERÍODO (SEM FUNDO E SEM TÍTULOS)
  let currentY = 55
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont("helvetica", 'normal')
  
  if (dataInicio && dataFim) {
    doc.text(`Período: ${dataInicio} até ${dataFim}`, 14, currentY)
    currentY += 10
  } else if (dataInicio && !dataFim) {
    doc.text(`Data específica: ${dataInicio}`, 14, currentY)
    currentY += 10
  } else if (mesSelecionado) {
    doc.text(`Mês/Ano: ${mesSelecionado}`, 14, currentY)
    currentY += 10
  }
  
  if (fornecedorSelecionado && fornecedorSelecionado !== "TODOS") {
    doc.text(`Fornecedor: ${fornecedorSelecionado}`, 14, currentY)
    currentY += 10
  }
  
  if (condicaoSelecionada && condicaoSelecionada !== "TODAS") {
    doc.text(`Condição: ${condicaoSelecionada}`, 14, currentY)
    currentY += 10
  }

  // 🔥 RESUMO DOS TOTAIS (SEM TÍTULO)
  currentY += 5
  doc.setFontSize(9)
  doc.setFont("helvetica", 'bold')
  doc.setTextColor(0, 0, 0)
  
  doc.text(`Total de Pedidos: ${totais.QUANTIDADE}`, 14, currentY)
  currentY += 7
  doc.text(`Faturamento Total: ${formatCurrency(totais.TOTAL_NOTAS)}`, 14, currentY)
  currentY += 7
  doc.setFontSize(12)
  doc.setTextColor(139, 92, 246)
  doc.text(`Total a Pagar: ${formatCurrency(totais.TOTAL_A_PAGAR)}`, 14, currentY)
  currentY += 10
  
  doc.setFontSize(9)
  doc.setFont("helvetica", 'bold')
  doc.setTextColor(0, 0, 0)

  // Tabela de condições
  doc.text("Detalhamento por Condição", 14, currentY)
  currentY += 6

  const tabelaCondicoes = [
    ["Condição", "Qtd", "Valor Total"],
    ["CONSERTO", totais.CONSERTO.qtd.toString(), formatCurrency(totais.CONSERTO.valor)],
    ["GARANTIA", totais.GARANTIA.qtd.toString(), formatCurrency(totais.GARANTIA.valor)],
    ["DEVOLUÇÃO", totais.DEVOLUÇÃO.qtd.toString(), formatCurrency(totais.DEVOLUÇÃO.valor)],
    ["DEVOLUÇÃO PAGA", totais.DEVOLUÇÃO_PAGA.qtd.toString(), formatCurrency(totais.DEVOLUÇÃO_PAGA.valor)],
    ["FRETE", totais.FRETE.qtd.toString(), formatCurrency(totais.FRETE.valor)],
    ["LOJA", totais.LOJA.qtd.toString(), formatCurrency(totais.LOJA.valor)],
    ["QUEBRADA", totais.QUEBRADA.qtd.toString(), formatCurrency(totais.QUEBRADA.valor)],
    ["TOTAL", totais.QUANTIDADE.toString(), formatCurrency(totais.TOTAL_NOTAS)]
  ]

  autoTable(doc, {
    startY: currentY,
    head: [tabelaCondicoes[0]],
    body: tabelaCondicoes.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246], textColor: 255, fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 80, halign: 'left' },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 65, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  })

  let finalY = (doc as any).lastAutoTable.finalY + 8

  // Lista de Pedidos
  if (resultados.length > 0) {
    doc.setFontSize(10)
    doc.setFont("helvetica", 'bold')
    doc.text("Lista de Pedidos", 14, finalY)
    doc.setFontSize(7)
    doc.setFont("helvetica", 'normal')
    doc.text(`${resultados.length} pedidos encontrados`, 14, finalY + 5)

    const tabelaPedidos = [
      ["Data", "Código", "Modelo", "Condição", "Valor"],
      ...resultados.slice(0, 20).map(p => [
        p.data,
        p.codigo || "-",
        p.modelo.length > 25 ? p.modelo.substring(0, 22) + "..." : p.modelo,
        p.condicao,
        formatCurrency(p.valor)
      ])
    ]

    if (resultados.length > 20) {
      tabelaPedidos.push(["", "", `... e mais ${resultados.length - 20} pedidos`, "", ""])
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
        2: { cellWidth: 65, halign: 'left' },
        3: { cellWidth: 35, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    })
  }

  // Rodapé
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(128, 128, 128)
    doc.text(`${nomeLoja} - Relatório de Filtros - Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 8)
  }

  doc.save(`relatorio_filtros_${new Date().toISOString().split('T')[0]}.pdf`)
}

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pedidos / Fornecedor</h1>
        <p className="text-sm text-gray-500 mt-1">Filtre pedidos por período, fornecedor e condição</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DATA INÍCIO</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DATA FINAL</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            />
            <p className="text-xs text-gray-400 mt-1">Para um dia específico, preencha a mesma data nos dois campos</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MÊS</label>
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            >
              <option value="">Todos</option>
              {mesesDisponiveis.map(mes => (
                <option key={mes} value={mes}>{mes}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FORNECEDOR</label>
            <select
              value={fornecedorSelecionado}
              onChange={(e) => setFornecedorSelecionado(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            >
              <option value="">Todos</option>
              {fornecedoresLista.map(forn => (
                <option key={forn} value={forn}>{forn}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha com Condição e Botões */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CONDIÇÃO</label>
            <select
              value={condicaoSelecionada}
              onChange={(e) => setCondicaoSelecionada(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            >
              <option value="">Todas</option>
              {condicoesLista.map(cond => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end gap-3">
            <button
              onClick={aplicarFiltros}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition"
            >
              <Search className="w-4 h-4" />
              Filtrar
            </button>
            <button
              onClick={limparFiltros}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
           {resultados.length > 0 && (
  <button
    onClick={gerarPDF}
    className="border border-red-500 text-red-600 px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-50 transition"
  >
    <FileText className="w-4 h-4" />
    Gerar PDF
  </button>
)}
          </div>
        </div>
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <>
          {/* Cards de Totais */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-semibold text-gray-900">📊 Resumo dos Filtros</h2>
              <span className="text-xs text-gray-500">{totais.QUANTIDADE} resultados encontrados</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-1.5">
              <div className="bg-purple-50 rounded-md p-1.5 text-center">
                <p className="text-lg font-bold text-purple-700">{totais.CONSERTO.qtd}</p>
                <p className="text-[10px] text-purple-600 font-medium uppercase tracking-wide">CONSERTO</p>
                <p className="text-[11px] text-gray-600">{formatCurrency(totais.CONSERTO.valor)}</p>
              </div>

              <div className="bg-emerald-50 rounded-md p-1.5 text-center">
                <p className="text-lg font-bold text-emerald-700">{totais.GARANTIA.qtd}</p>
                <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">GARANTIA</p>
                <p className="text-[11px] text-gray-600">{formatCurrency(totais.GARANTIA.valor)}</p>
              </div>

              <div className="bg-red-50 rounded-md p-1.5 text-center">
                <p className="text-lg font-bold text-red-700">{totais.DEVOLUÇÃO.qtd}</p>
                <p className="text-[10px] text-red-600 font-medium uppercase tracking-wide">DEVOLUÇÃO</p>
                <p className="text-[11px] text-gray-600">{formatCurrency(totais.DEVOLUÇÃO.valor)}</p>
              </div>

              <div className="bg-amber-50 rounded-md p-1.5 text-center">
                <p className="text-lg font-bold text-amber-700">{totais.DEVOLUÇÃO_PAGA.qtd}</p>
                <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">DEV.PAGA</p>
                <p className="text-[11px] text-gray-600">{formatCurrency(totais.DEVOLUÇÃO_PAGA.valor)}</p>
              </div>

              <div className="bg-cyan-50 rounded-md p-1.5 text-center">
                <p className="text-lg font-bold text-cyan-700">{totais.FRETE.qtd}</p>
                <p className="text-[10px] text-cyan-600 font-medium uppercase tracking-wide">FRETE</p>
                <p className="text-[11px] text-gray-600">{formatCurrency(totais.FRETE.valor)}</p>
              </div>

              <div className="bg-pink-50 rounded-md p-1.5 text-center">
                <p className="text-lg font-bold text-pink-700">{totais.LOJA.qtd}</p>
                <p className="text-[10px] text-pink-600 font-medium uppercase tracking-wide">LOJA</p>
                <p className="text-[11px] text-gray-600">{formatCurrency(totais.LOJA.valor)}</p>
              </div>

              <div className="bg-gray-50 rounded-md p-1.5 text-center">
                <p className="text-lg font-bold text-gray-700">{totais.QUEBRADA.qtd}</p>
                <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wide">QUEBRADA</p>
                <p className="text-[11px] text-gray-600">{formatCurrency(totais.QUEBRADA.valor)}</p>
              </div>

              <div className="bg-blue-50 rounded-md p-1.5 text-center ring-1 ring-blue-200">
                <Calculator className="w-3 h-3 text-blue-600 mx-auto mb-0.5" />
                <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wide">TOTAL NOTAS</p>
                <p className="text-sm font-bold text-blue-700">{formatCurrency(totais.TOTAL_NOTAS)}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-md p-1.5 text-center shadow-md">
                <TrendingUp className="w-3 h-3 text-white mx-auto mb-0.5" />
                <p className="text-[10px] text-white font-medium uppercase tracking-wide">TOTAL A PAGAR</p>
                <p className="text-sm font-bold text-white">{formatCurrency(totais.TOTAL_A_PAGAR)}</p>
              </div>
            </div>
          </div>

          {/* Tabela de Resultados */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">DATA</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">CÓDIGO</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">MODELO</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">FORNECEDOR</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">MARCA</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">VALOR</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">FRETE</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">CONDIÇÃO</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">OBSERVAÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((pedido, index) => (
                    <tr key={pedido.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="p-2 text-xs text-gray-600">{pedido.data}</td>
                      <td className="p-2 text-xs text-gray-600">{pedido.codigo || "-"}</td>
                      <td className="p-2 text-xs font-medium text-gray-900">{pedido.modelo}</td>
                      <td className="p-2 text-xs text-gray-600">{pedido.fornecedor}</td>
                      <td className="p-2 text-xs text-gray-600">{pedido.marca}</td>
                      <td className="p-2 text-xs text-gray-600">{formatCurrency(pedido.valor)}</td>
                      <td className="p-2 text-xs text-gray-600">{pedido.frete > 0 ? formatCurrency(pedido.frete) : "NÃO"}</td>
                      <td className="p-2">
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: 
                              pedido.condicao === "CONSERTO" ? "#8b5cf620" :
                              pedido.condicao === "GARANTIA" ? "#10b98120" :
                              pedido.condicao === "LOJA" ? "#ec489920" :
                              pedido.condicao === "DEVOLUÇÃO" ? "#ef444420" :
                              pedido.condicao === "DEVOLUÇÃO PAGA" ? "#f59e0b20" :
                              "#6b728020",
                            color:
                              pedido.condicao === "CONSERTO" ? "#8b5cf6" :
                              pedido.condicao === "GARANTIA" ? "#10b981" :
                              pedido.condicao === "LOJA" ? "#ec4899" :
                              pedido.condicao === "DEVOLUÇÃO" ? "#ef4444" :
                              pedido.condicao === "DEVOLUÇÃO PAGA" ? "#f59e0b" :
                              "#6b7280"
                          }}
                        >
                          {pedido.condicao}
                        </span>
                      </td>
                      <td className="p-2 text-xs text-gray-500 max-w-xs truncate">{pedido.observacoes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {resultados.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aplique os filtros acima para visualizar os resultados</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      )}
    </div>
  )
}