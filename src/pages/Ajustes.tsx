import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { Save, Trash2, Upload, Building, Plus, Edit, X, Package, Truck, Tag, Check, AlertCircle, ChevronDown, ChevronUp, User, Download } from "lucide-react"
import { getConfigLoja, updateConfigLoja } from "../services/configService"

export default function Ajustes() {
  // Estado da logo e nome da loja
  const [logoUrl, setLogoUrl] = useState<any>(null)
  const [previewLogo, setPreviewLogo] = useState<any>(null)
  const [, setNomeLoja] = useState<any>("")
  const [nomeLojaTemp, setNomeLojaTemp] = useState<any>("")
  const [mensagem, setMensagem] = useState<any>(null)
  const [userName, setUserName] = useState<string>("admin")
  const [userRole, setUserRole] = useState<string>("user")
  const [saving, setSaving] = useState(false)
  const [lojaId, setLojaId] = useState<number>(1)

  // Estado para controlar seções expandidas
  const [secaoAberta, setSecaoAberta] = useState<string>("fornecedores")

  // Estado para fornecedores
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [novoFornecedor, setNovoFornecedor] = useState<string>("")
  const [editandoFornecedor, setEditandoFornecedor] = useState<any>(null)

  // Estado para marcas
  const [marcas, setMarcas] = useState<any[]>([])
  const [novaMarca, setNovaMarca] = useState<string>("")
  const [editandoMarca, setEditandoMarca] = useState<any>(null)

  // Estado para condições
  const [condicoes, setCondicoes] = useState<any[]>([])
  const [novaCondicao, setNovaCondicao] = useState<string>("")
  const [editandoCondicao, setEditandoCondicao] = useState<any>(null)

  // Carregar configurações do Supabase e dados locais
  useEffect(() => {
    carregarConfiguracoes()
    carregarDadosLocal()
  }, [])

  async function carregarConfiguracoes() {
    const config = await getConfigLoja()
    if (config) {
      setNomeLoja(config.nome_loja)
      setNomeLojaTemp(config.nome_loja)
      setLogoUrl(config.logo_url)
      setPreviewLogo(config.logo_url)
    }
  }

  function carregarDadosLocal() {
    const savedUser = sessionStorage.getItem("user")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setUserName(user.username || "admin")
      setUserRole(user.role || "user")
      
      // 🔥 Buscar loja_id do usuário
      const lojaIdValue = user.loja_id || 1
      setLojaId(lojaIdValue)
      
      // Carregar fornecedores do sessionStorage usando lojaId
      const savedFornecedores = sessionStorage.getItem(`fornecedores_${lojaIdValue}`)
      if (savedFornecedores) {
        setFornecedores(JSON.parse(savedFornecedores))
      } else {
        const defaultFornecedores = [
          { id: 1, nome: "NEW STORE" },
          { id: 2, nome: "NOVA PEÇAS" },
          { id: 3, nome: "FLORITEC" },
          { id: 4, nome: "VITOR CAMELÃO" }
        ]
        setFornecedores(defaultFornecedores)
        sessionStorage.setItem(`fornecedores_${lojaIdValue}`, JSON.stringify(defaultFornecedores))
      }
      
      // Carregar marcas do sessionStorage usando lojaId
      const savedMarcas = sessionStorage.getItem(`marcas_${lojaIdValue}`)
      if (savedMarcas) {
        setMarcas(JSON.parse(savedMarcas))
      } else {
        const defaultMarcas = [
          { id: 1, nome: "SAMSUNG" }, { id: 2, nome: "APPLE" },
          { id: 3, nome: "MOTOROLA" }, { id: 4, nome: "XIAOMI" },
          { id: 5, nome: "LG" }, { id: 6, nome: "ASUS" }, { id: 7, nome: "INFINIX" }
        ]
        setMarcas(defaultMarcas)
        sessionStorage.setItem(`marcas_${lojaIdValue}`, JSON.stringify(defaultMarcas))
      }
      
      // Carregar condições do sessionStorage usando lojaId
      const savedCondicoes = sessionStorage.getItem(`condicoes_${lojaIdValue}`)
      if (savedCondicoes) {
        setCondicoes(JSON.parse(savedCondicoes))
      } else {
        const defaultCondicoes = [
          { id: 1, nome: "CONSERTO" }, { id: 2, nome: "GARANTIA" },
          { id: 3, nome: "LOJA" }, { id: 4, nome: "DEVOLUÇÃO" },
          { id: 5, nome: "DEVOLUÇÃO PAGA" }, { id: 6, nome: "QUEBRADA" }
        ]
        setCondicoes(defaultCondicoes)
        sessionStorage.setItem(`condicoes_${lojaIdValue}`, JSON.stringify(defaultCondicoes))
      }
    }
  }

  // ========== FUNÇÕES DE LOGO E NOME ==========
  const handleLogoUpload = (event: any) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.match(/image\/(png|jpeg|jpg|svg|webp)/)) {
        setMensagem({ tipo: "error", texto: "Formato inválido. Use PNG, JPG, SVG ou WEBP." })
        setTimeout(() => setMensagem(null), 3000)
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        setMensagem({ tipo: "error", texto: "Imagem muito grande. Máximo 2MB." })
        setTimeout(() => setMensagem(null), 3000)
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const salvarLogo = async () => {
    if (previewLogo) {
      setSaving(true)
      const success = await updateConfigLoja(nomeLojaTemp, previewLogo)
      if (success) {
        setLogoUrl(previewLogo)
        setMensagem({ tipo: "success", texto: "Logo salva com sucesso!" })
      } else {
        setMensagem({ tipo: "error", texto: "Erro ao salvar logo!" })
      }
      setSaving(false)
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  const removerLogo = async () => {
    setSaving(true)
    const success = await updateConfigLoja(nomeLojaTemp, null)
    if (success) {
      setPreviewLogo(null)
      setLogoUrl(null)
      setMensagem({ tipo: "success", texto: "Logo removida com sucesso!" })
    } else {
      setMensagem({ tipo: "error", texto: "Erro ao remover logo!" })
    }
    setSaving(false)
    setTimeout(() => setMensagem(null), 3000)
  }

  const salvarNomeLoja = async () => {
    if (nomeLojaTemp && nomeLojaTemp.trim()) {
      setSaving(true)
      const success = await updateConfigLoja(nomeLojaTemp, logoUrl)
      if (success) {
        setNomeLoja(nomeLojaTemp)
        setMensagem({ tipo: "success", texto: "Nome da loja salvo com sucesso!" })
      } else {
        setMensagem({ tipo: "error", texto: "Erro ao salvar nome da loja!" })
      }
      setSaving(false)
      setTimeout(() => setMensagem(null), 3000)
    } else {
      setMensagem({ tipo: "error", texto: "O nome da loja não pode estar vazio." })
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  // ========== FORNECEDORES ==========
  const adicionarFornecedor = () => {
    if (novoFornecedor.trim()) {
      const novo = { id: Date.now(), nome: novoFornecedor.toUpperCase() }
      const novosFornecedores = [...fornecedores, novo]
      setFornecedores(novosFornecedores)
      sessionStorage.setItem(`fornecedores_${lojaId}`, JSON.stringify(novosFornecedores))
      setNovoFornecedor("")
      setMensagem({ tipo: "success", texto: "Fornecedor adicionado!" })
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  const editarFornecedor = (fornecedor: any) => {
    setEditandoFornecedor(fornecedor)
    setNovoFornecedor(fornecedor.nome)
  }

  const salvarEdicaoFornecedor = () => {
    if (editandoFornecedor && novoFornecedor.trim()) {
      const novosFornecedores = fornecedores.map((f: any) => 
        f.id === editandoFornecedor.id ? { ...f, nome: novoFornecedor.toUpperCase() } : f
      )
      setFornecedores(novosFornecedores)
      sessionStorage.setItem(`fornecedores_${lojaId}`, JSON.stringify(novosFornecedores))
      setEditandoFornecedor(null)
      setNovoFornecedor("")
      setMensagem({ tipo: "success", texto: "Fornecedor atualizado!" })
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  const cancelarEdicaoFornecedor = () => {
    setEditandoFornecedor(null)
    setNovoFornecedor("")
  }

  const excluirFornecedor = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
      const novosFornecedores = fornecedores.filter((f: any) => f.id !== id)
      setFornecedores(novosFornecedores)
      sessionStorage.setItem(`fornecedores_${lojaId}`, JSON.stringify(novosFornecedores))
      setMensagem({ tipo: "success", texto: "Fornecedor excluído!" })
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  // ========== MARCAS ==========
  const adicionarMarca = () => {
    if (novaMarca.trim()) {
      const novo = { id: Date.now(), nome: novaMarca.toUpperCase() }
      const novasMarcas = [...marcas, novo]
      setMarcas(novasMarcas)
      sessionStorage.setItem(`marcas_${lojaId}`, JSON.stringify(novasMarcas))
      setNovaMarca("")
      setMensagem({ tipo: "success", texto: "Marca adicionada!" })
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  const editarMarca = (marca: any) => {
    setEditandoMarca(marca)
    setNovaMarca(marca.nome)
  }

  const salvarEdicaoMarca = () => {
    if (editandoMarca && novaMarca.trim()) {
      const novasMarcas = marcas.map((m: any) => 
        m.id === editandoMarca.id ? { ...m, nome: novaMarca.toUpperCase() } : m
      )
      setMarcas(novasMarcas)
      sessionStorage.setItem(`marcas_${lojaId}`, JSON.stringify(novasMarcas))
      setEditandoMarca(null)
      setNovaMarca("")
      setMensagem({ tipo: "success", texto: "Marca atualizada!" })
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  const cancelarEdicaoMarca = () => {
    setEditandoMarca(null)
    setNovaMarca("")
  }

  const excluirMarca = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta marca?")) {
      const novasMarcas = marcas.filter((m: any) => m.id !== id)
      setMarcas(novasMarcas)
      sessionStorage.setItem(`marcas_${lojaId}`, JSON.stringify(novasMarcas))
      setMensagem({ tipo: "success", texto: "Marca excluída!" })
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  // ========== CONDIÇÕES ==========
  const adicionarCondicao = () => {
    if (novaCondicao.trim()) {
      const novo = { id: Date.now(), nome: novaCondicao.toUpperCase() }
      const novasCondicoes = [...condicoes, novo]
      setCondicoes(novasCondicoes)
      sessionStorage.setItem(`condicoes_${lojaId}`, JSON.stringify(novasCondicoes))
      setNovaCondicao("")
      setMensagem({ tipo: "success", texto: "Condição adicionada!" })
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  const editarCondicao = (condicao: any) => {
    setEditandoCondicao(condicao)
    setNovaCondicao(condicao.nome)
  }

  const salvarEdicaoCondicao = () => {
    if (editandoCondicao && novaCondicao.trim()) {
      const novasCondicoes = condicoes.map((c: any) => 
        c.id === editandoCondicao.id ? { ...c, nome: novaCondicao.toUpperCase() } : c
      )
      setCondicoes(novasCondicoes)
      sessionStorage.setItem(`condicoes_${lojaId}`, JSON.stringify(novasCondicoes))
      setEditandoCondicao(null)
      setNovaCondicao("")
      setMensagem({ tipo: "success", texto: "Condição atualizada!" })
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  const cancelarEdicaoCondicao = () => {
    setEditandoCondicao(null)
    setNovaCondicao("")
  }

  const excluirCondicao = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta condição?")) {
      const novasCondicoes = condicoes.filter((c: any) => c.id !== id)
      setCondicoes(novasCondicoes)
      sessionStorage.setItem(`condicoes_${lojaId}`, JSON.stringify(novasCondicoes))
      setMensagem({ tipo: "success", texto: "Condição excluída!" })
      setTimeout(() => setMensagem(null), 3000)
    }
  }

// ========== EXPORTAR BACKUP (APENAS PEDIDOS E CONSERTOS) ==========
async function exportarBackup() {
  if (!lojaId) {
    setMensagem({ tipo: "error", texto: "Loja não identificada." })
    setTimeout(() => setMensagem(null), 3000)
    return
  }

  setSaving(true)

  try {
    // Buscar apenas pedidos da loja
    const { data: pedidos, error: errorPedidos } = await supabase
      .from("pedidos")
      .select("*")
      .eq("loja_id", lojaId)

    if (errorPedidos) throw errorPedidos

    // Buscar apenas consertos da loja
    const { data: consertos, error: errorConsertos } = await supabase
      .from("consertos")
      .select("*")
      .eq("loja_id", lojaId)

    if (errorConsertos) throw errorConsertos

    const backupData = {
      loja_id: lojaId,
      data_exportacao: new Date().toISOString(),
      versao: "1.0",
      pedidos: pedidos || [],
      consertos: consertos || []
    }

    const jsonString = JSON.stringify(backupData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement("a")
    link.href = url
    link.download = `backup_loja_${lojaId}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setMensagem({ tipo: "success", texto: `Backup exportado com ${pedidos?.length || 0} pedidos e ${consertos?.length || 0} consertos!` })
  } catch (error) {
    console.error("Erro ao exportar backup:", error)
    setMensagem({ tipo: "error", texto: "Erro ao exportar backup. Tente novamente." })
  } finally {
    setSaving(false)
    setTimeout(() => setMensagem(null), 3000)
  }
}

// ========== IMPORTAR BACKUP (APENAS PEDIDOS E CONSERTOS) ==========
const importarBackup = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    setSaving(true)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const backupData = JSON.parse(event.target?.result as string)
          
          // Validar estrutura do backup
          if (!backupData.loja_id || backupData.loja_id !== lojaId) {
            setMensagem({ tipo: "error", texto: "Este backup pertence a outra loja. Importação cancelada." })
            setTimeout(() => setMensagem(null), 3000)
            setSaving(false)
            return
          }

          // Confirmar antes de restaurar
          const totalItens = (backupData.pedidos?.length || 0) + (backupData.consertos?.length || 0)
          if (totalItens === 0) {
            setMensagem({ tipo: "error", texto: "Backup não contém pedidos ou consertos para restaurar." })
            setTimeout(() => setMensagem(null), 3000)
            setSaving(false)
            return
          }

          if (!confirm(`⚠️ ATENÇÃO: Isso irá SUBSTITUIR todos os ${backupData.pedidos?.length || 0} pedidos e ${backupData.consertos?.length || 0} consertos atuais da sua loja. As configurações (fornecedores, marcas, condições) NÃO serão alteradas. Continuar?`)) {
            setSaving(false)
            return
          }

          // 1. DELETAR todos os pedidos existentes da loja
          const { error: deletePedidosError } = await supabase
            .from("pedidos")
            .delete()
            .eq("loja_id", lojaId)
          
          if (deletePedidosError) throw deletePedidosError

          // 2. DELETAR todos os consertos existentes da loja
          const { error: deleteConsertosError } = await supabase
            .from("consertos")
            .delete()
            .eq("loja_id", lojaId)
          
          if (deleteConsertosError) throw deleteConsertosError

          // 3. INSERIR os pedidos do backup
          if (backupData.pedidos && backupData.pedidos.length > 0) {
            for (const pedido of backupData.pedidos) {
              // Remover o id original para não causar conflito
              delete pedido.id
              pedido.loja_id = lojaId
              
              const { error: insertError } = await supabase
                .from("pedidos")
                .insert([pedido])
              
              if (insertError) {
                console.error("Erro ao inserir pedido:", insertError)
              }
            }
          }

          // 4. INSERIR os consertos do backup
          if (backupData.consertos && backupData.consertos.length > 0) {
            for (const conserto of backupData.consertos) {
              // Remover o id original para não causar conflito
              delete conserto.id
              conserto.loja_id = lojaId
              
              const { error: insertError } = await supabase
                .from("consertos")
                .insert([conserto])
              
              if (insertError) {
                console.error("Erro ao inserir conserto:", insertError)
              }
            }
          }

          setMensagem({ tipo: "success", texto: `Backup restaurado com sucesso! ${backupData.pedidos?.length || 0} pedidos e ${backupData.consertos?.length || 0} consertos.` })
          
          setTimeout(() => {
            window.location.reload()
          }, 2000)
          
        } catch (error) {
          console.error("Erro ao processar backup:", error)
          setMensagem({ tipo: "error", texto: "Erro ao ler o arquivo de backup. Verifique o formato." })
          setTimeout(() => setMensagem(null), 3000)
          setSaving(false)
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error("Erro ao importar backup:", error)
      setMensagem({ tipo: "error", texto: "Erro ao importar backup. Tente novamente." })
      setSaving(false)
      setTimeout(() => setMensagem(null), 3000)
    }
  }
  
  input.click()
}

  // ========== RESETAR PADRÃO ==========
  const resetarPadrao = async () => {
    if (confirm("Isso irá restaurar todas as configurações padrão. Continuar?")) {
      setSaving(true)
      await updateConfigLoja("Store Tech", null)
      setPreviewLogo(null)
      setLogoUrl(null)
      setNomeLojaTemp("Store Tech")
      setNomeLoja("Store Tech")
      
      const defaultFornecedores = [
        { id: 1, nome: "NEW STORE" }, { id: 2, nome: "NOVA PEÇAS" },
        { id: 3, nome: "FLORITEC" }, { id: 4, nome: "VITOR CAMELÃO" }
      ]
      setFornecedores(defaultFornecedores)
      sessionStorage.setItem(`fornecedores_${lojaId}`, JSON.stringify(defaultFornecedores))
      
      const defaultMarcas = [
        { id: 1, nome: "SAMSUNG" }, { id: 2, nome: "APPLE" },
        { id: 3, nome: "MOTOROLA" }, { id: 4, nome: "XIAOMI" },
        { id: 5, nome: "LG" }, { id: 6, nome: "ASUS" }, { id: 7, nome: "INFINIX" }
      ]
      setMarcas(defaultMarcas)
      sessionStorage.setItem(`marcas_${lojaId}`, JSON.stringify(defaultMarcas))
      
      const defaultCondicoes = [
        { id: 1, nome: "CONSERTO" }, { id: 2, nome: "GARANTIA" },
        { id: 3, nome: "LOJA" }, { id: 4, nome: "DEVOLUÇÃO" },
        { id: 5, nome: "DEVOLUÇÃO PAGA" }, { id: 6, nome: "QUEBRADA" }
      ]
      setCondicoes(defaultCondicoes)
      sessionStorage.setItem(`condicoes_${lojaId}`, JSON.stringify(defaultCondicoes))
      
      setMensagem({ tipo: "success", texto: "Configurações restauradas para o padrão!" })
      setSaving(false)
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  const toggleSecao = (secao: string) => {
    setSecaoAberta(secaoAberta === secao ? "" : secao)
  }

  const isAdmin = userRole === "admin" || userRole === "admin_loja" || userRole === "master"

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Cabeçalho com informações do usuário */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Configurações</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Personalize sua loja e gerencie os dados do sistema
              {!isAdmin && " • Modo usuário - Apenas fornecedores, marcas e condições"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{userName}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {isAdmin ? "Administrador" : "Técnico"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem de feedback */}
        {mensagem && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
            mensagem.tipo === "success" 
              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
              : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
          }`}>
            {mensagem.tipo === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {mensagem.texto}
          </div>
        )}

        {/* Cards de configuração */}
        <div className="space-y-4">
          {/* Identificação da Loja - APENAS PARA ADMIN */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Identificação da Loja</h2>
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center text-center">
                    {previewLogo ? (
                      <img src={previewLogo} alt="Logo" className="w-20 h-20 object-contain rounded-xl mb-2" />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mb-2">
                        <span className="text-3xl text-purple-600 dark:text-purple-400">🔧</span>
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors">
                        <Upload className="w-3 h-3 inline mr-1" />
                        Upload
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      {previewLogo && (
                        <button onClick={removerLogo} disabled={saving} className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                          Remover
                        </button>
                      )}
                    </div>
                    {previewLogo && previewLogo !== logoUrl && (
                      <button onClick={salvarLogo} disabled={saving} className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                        {saving ? "Salvando..." : "Salvar Logo"}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Nome da Loja</label>
                    <input 
                      type="text" 
                      value={nomeLojaTemp || ""} 
                      onChange={(e) => setNomeLojaTemp(e.target.value)} 
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Digite o nome da sua loja"
                    />
                    <button onClick={salvarNomeLoja} disabled={saving} className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                      {saving ? "Salvando..." : "Salvar Nome"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fornecedores */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleSecao("fornecedores")}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Fornecedores</h2>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">{fornecedores.length}</span>
              </div>
              {secaoAberta === "fornecedores" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            
            {secaoAberta === "fornecedores" && (
              <div className="px-5 pb-5">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={novoFornecedor}
                    onChange={(e) => setNovoFornecedor(e.target.value)}
                    placeholder={editandoFornecedor ? "Editando fornecedor..." : "Novo fornecedor..."}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  {editandoFornecedor ? (
                    <div className="flex gap-2">
                      <button onClick={salvarEdicaoFornecedor} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                        <Save className="w-3 h-3" /> Salvar
                      </button>
                      <button onClick={cancelarEdicaoFornecedor} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={adicionarFornecedor} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {fornecedores.map((f: any) => (
                    <div key={f.id} className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg px-2 py-1.5 transition-colors">
                      <span className="text-xs text-gray-700 dark:text-gray-300">{f.nome}</span>
                      <button onClick={() => editarFornecedor(f)} className="p-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                        <Edit className="w-3 h-3" />
                      </button>
                      <button onClick={() => excluirFornecedor(f.id)} className="p-0.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Marcas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleSecao("marcas")}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Marcas</h2>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">{marcas.length}</span>
              </div>
              {secaoAberta === "marcas" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            
            {secaoAberta === "marcas" && (
              <div className="px-5 pb-5">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={novaMarca}
                    onChange={(e) => setNovaMarca(e.target.value)}
                    placeholder={editandoMarca ? "Editando marca..." : "Nova marca..."}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  {editandoMarca ? (
                    <div className="flex gap-2">
                      <button onClick={salvarEdicaoMarca} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                        <Save className="w-3 h-3" /> Salvar
                      </button>
                      <button onClick={cancelarEdicaoMarca} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={adicionarMarca} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {marcas.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg px-2 py-1.5 transition-colors">
                      <span className="text-xs text-gray-700 dark:text-gray-300">{m.nome}</span>
                      <button onClick={() => editarMarca(m)} className="p-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                        <Edit className="w-3 h-3" />
                      </button>
                      <button onClick={() => excluirMarca(m.id)} className="p-0.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Condições */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleSecao("condicoes")}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Condições</h2>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">{condicoes.length}</span>
              </div>
              {secaoAberta === "condicoes" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            
            {secaoAberta === "condicoes" && (
              <div className="px-5 pb-5">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={novaCondicao}
                    onChange={(e) => setNovaCondicao(e.target.value)}
                    placeholder={editandoCondicao ? "Editando condição..." : "Nova condição..."}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  {editandoCondicao ? (
                    <div className="flex gap-2">
                      <button onClick={salvarEdicaoCondicao} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                        <Save className="w-3 h-3" /> Salvar
                      </button>
                      <button onClick={cancelarEdicaoCondicao} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={adicionarCondicao} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {condicoes.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg px-2 py-1.5 transition-colors">
                      <span className="text-xs text-gray-700 dark:text-gray-300">{c.nome}</span>
                      <button onClick={() => editarCondicao(c)} className="p-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                        <Edit className="w-3 h-3" />
                      </button>
                      <button onClick={() => excluirCondicao(c.id)} className="p-0.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botões de Backup e Restauração - APENAS PARA ADMIN */}
          {isAdmin && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Backup e Restauração
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Exporte seus dados para um arquivo de backup ou importe um backup existente.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={exportarBackup}
                    disabled={saving}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {saving ? "Exportando..." : "Exportar Backup"}
                  </button>
                  <button
                    onClick={importarBackup}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {saving ? "Importando..." : "Importar Backup"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Restaurar Padrão - APENAS PARA ADMIN */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 text-center">
                <button onClick={resetarPadrao} disabled={saving} className="text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors disabled:opacity-50">
                  Restaurar configurações padrão
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}