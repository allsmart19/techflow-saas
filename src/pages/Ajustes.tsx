import { useState, useEffect } from "react"
import { Save, Trash2, Upload, Building, Plus, Edit, X, Package, Truck, Tag, Check, AlertCircle, ChevronDown, ChevronUp, User } from "lucide-react"
import { getConfigLoja, updateConfigLoja } from "../services/configService"
import { supabase } from "../lib/supabase"

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
  const [userId, setUserId] = useState<number | null>(null)
  const [lojaId, setLojaId] = useState<number | null>(null)

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

  // Estado para condições (tabela: condicoes)
  const [condicoes, setCondicoes] = useState<any[]>([])
  const [novaCondicao, setNovaCondicao] = useState<string>("")
  const [editandoCondicao, setEditandoCondicao] = useState<any>(null)

  // Carregar configurações da loja e dados do usuário
  useEffect(() => {
    carregarConfiguracoes()
    carregarUsuario()
  }, [])

  async function carregarUsuario() {
    const userStr = sessionStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserName(user.username || "admin")
      setUserRole(user.role || "user")
      setUserId(user.id)
      
      // Buscar loja_id do usuário
      const { data: userInfo } = await supabase
        .from("usuarios")
        .select("loja_id")
        .eq("id", user.id)
        .single()
      
      const lojaIdValue = userInfo?.loja_id || 1
      setLojaId(lojaIdValue)
      
      if (user.id) {
        await Promise.all([
          carregarFornecedores(lojaIdValue),
          carregarMarcas(lojaIdValue),
          carregarCondicoes(lojaIdValue)
        ])
      }
    }
  }

  async function carregarConfiguracoes() {
    const config = await getConfigLoja()
    if (config) {
      setNomeLoja(config.nome_loja)
      setNomeLojaTemp(config.nome_loja)
      setLogoUrl(config.logo_url)
      setPreviewLogo(config.logo_url)
    }
  }

  // ========== FORNECEDORES ==========
  async function carregarFornecedores(lojaIdValue: number) {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('loja_id', lojaIdValue)
      .order('nome')
    if (!error && data) setFornecedores(data)
  }

  async function adicionarFornecedor() {
    if (!novoFornecedor.trim() || !lojaId) return
    
    const { error } = await supabase
      .from('fornecedores')
      .insert([{ nome: novoFornecedor.toUpperCase(), loja_id: lojaId }])
    if (error) {
      console.error("Erro ao adicionar fornecedor:", error)
      setMensagem({ tipo: "error", texto: "Erro ao adicionar fornecedor" })
    } else {
      setNovoFornecedor("")
      await carregarFornecedores(lojaId)
      setMensagem({ tipo: "success", texto: "Fornecedor adicionado!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }

  async function salvarEdicaoFornecedor() {
    if (!editandoFornecedor || !novoFornecedor.trim() || !lojaId) return
    const { error } = await supabase
      .from('fornecedores')
      .update({ nome: novoFornecedor.toUpperCase() })
      .eq('id', editandoFornecedor.id)
      .eq('loja_id', lojaId)
    if (error) {
      setMensagem({ tipo: "error", texto: "Erro ao atualizar fornecedor" })
    } else {
      setEditandoFornecedor(null)
      setNovoFornecedor("")
      await carregarFornecedores(lojaId)
      setMensagem({ tipo: "success", texto: "Fornecedor atualizado!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }

  async function excluirFornecedor(id: number) {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return
    if (!lojaId) return
    
    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id)
      .eq('loja_id', lojaId)
    if (error) {
      setMensagem({ tipo: "error", texto: "Erro ao excluir fornecedor" })
    } else {
      await carregarFornecedores(lojaId)
      setMensagem({ tipo: "success", texto: "Fornecedor excluído!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }

  const cancelarEdicaoFornecedor = () => {
    setEditandoFornecedor(null)
    setNovoFornecedor("")
  }

  // ========== MARCAS ==========
  async function carregarMarcas(lojaIdValue: number) {
    const { data, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('loja_id', lojaIdValue)
      .order('nome')
    if (!error && data) setMarcas(data)
  }

  async function adicionarMarca() {
    if (!novaMarca.trim() || !lojaId) return
    
    const { error } = await supabase
      .from('marcas')
      .insert([{ nome: novaMarca.toUpperCase(), loja_id: lojaId }])
    if (error) {
      console.error("Erro ao adicionar marca:", error)
      setMensagem({ tipo: "error", texto: "Erro ao adicionar marca" })
    } else {
      setNovaMarca("")
      await carregarMarcas(lojaId)
      setMensagem({ tipo: "success", texto: "Marca adicionada!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }

  async function salvarEdicaoMarca() {
    if (!editandoMarca || !novaMarca.trim() || !lojaId) return
    const { error } = await supabase
      .from('marcas')
      .update({ nome: novaMarca.toUpperCase() })
      .eq('id', editandoMarca.id)
      .eq('loja_id', lojaId)
    if (error) {
      setMensagem({ tipo: "error", texto: "Erro ao atualizar marca" })
    } else {
      setEditandoMarca(null)
      setNovaMarca("")
      await carregarMarcas(lojaId)
      setMensagem({ tipo: "success", texto: "Marca atualizada!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }

  async function excluirMarca(id: number) {
    if (!confirm("Tem certeza que deseja excluir esta marca?")) return
    if (!lojaId) return
    
    const { error } = await supabase
      .from('marcas')
      .delete()
      .eq('id', id)
      .eq('loja_id', lojaId)
    if (error) {
      setMensagem({ tipo: "error", texto: "Erro ao excluir marca" })
    } else {
      await carregarMarcas(lojaId)
      setMensagem({ tipo: "success", texto: "Marca excluída!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }

  const cancelarEdicaoMarca = () => {
    setEditandoMarca(null)
    setNovaMarca("")
  }

  // ========== CONDIÇÕES ========== (tabela: condicoes)
  async function carregarCondicoes(lojaIdValue: number) {
    const { data, error } = await supabase
      .from('condicoes')
      .select('*')
      .eq('loja_id', lojaIdValue)
      .order('nome')
    if (!error && data) setCondicoes(data)
  }

  async function adicionarCondicao() {
    if (!novaCondicao.trim() || !lojaId) return
    
    const { error } = await supabase
      .from('condicoes')
      .insert([{ nome: novaCondicao.toUpperCase(), loja_id: lojaId }])
    if (error) {
      console.error("Erro ao adicionar condição:", error)
      setMensagem({ tipo: "error", texto: "Erro ao adicionar condição" })
    } else {
      setNovaCondicao("")
      await carregarCondicoes(lojaId)
      setMensagem({ tipo: "success", texto: "Condição adicionada!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }

  async function salvarEdicaoCondicao() {
    if (!editandoCondicao || !novaCondicao.trim() || !lojaId) return
    const { error } = await supabase
      .from('condicoes')
      .update({ nome: novaCondicao.toUpperCase() })
      .eq('id', editandoCondicao.id)
      .eq('loja_id', lojaId)
    if (error) {
      setMensagem({ tipo: "error", texto: "Erro ao atualizar condição" })
    } else {
      setEditandoCondicao(null)
      setNovaCondicao("")
      await carregarCondicoes(lojaId)
      setMensagem({ tipo: "success", texto: "Condição atualizada!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }

  async function excluirCondicao(id: number) {
    if (!confirm("Tem certeza que deseja excluir esta condição?")) return
    if (!lojaId) return
    
    const { error } = await supabase
      .from('condicoes')
      .delete()
      .eq('id', id)
      .eq('loja_id', lojaId)
    if (error) {
      setMensagem({ tipo: "error", texto: "Erro ao excluir condição" })
    } else {
      await carregarCondicoes(lojaId)
      setMensagem({ tipo: "success", texto: "Condição excluída!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }

  const cancelarEdicaoCondicao = () => {
    setEditandoCondicao(null)
    setNovaCondicao("")
  }

  // ========== RESETAR PADRÃO ==========
  const resetarPadrao = async () => {
    if (!confirm("Isso irá restaurar todas as configurações padrão. Continuar?")) return
    if (!lojaId) return
    setSaving(true)

    // Atualizar configurações da loja
    await updateConfigLoja("Sua Loja", null)
    setPreviewLogo(null)
    setLogoUrl(null)
    setNomeLojaTemp("Sua Loja")
    setNomeLoja("Sua Loja")

    // Remover dados existentes da loja
    await supabase.from('fornecedores').delete().eq('loja_id', lojaId)
    await supabase.from('marcas').delete().eq('loja_id', lojaId)
    await supabase.from('condicoes').delete().eq('loja_id', lojaId)

    // Fornecedores padrão
    const defaultFornecedores = [
      "NEW STORE", "NOVA PEÇAS", "FLORITEC", "VITOR CAMELÃO"
    ]
    for (const nome of defaultFornecedores) {
      await supabase
        .from('fornecedores')
        .insert({ nome, loja_id: lojaId })
    }
    await carregarFornecedores(lojaId)

    // Marcas padrão
    const defaultMarcas = [
      "SAMSUNG", "APPLE", "MOTOROLA", "XIAOMI", "LG", "ASUS", "INFINIX"
    ]
    for (const nome of defaultMarcas) {
      await supabase
        .from('marcas')
        .insert({ nome, loja_id: lojaId })
    }
    await carregarMarcas(lojaId)

    // Condições padrão
    const defaultCondicoes = [
      "CONSERTO", "GARANTIA", "LOJA", "DEVOLUÇÃO", "DEVOLUÇÃO PAGA", "QUEBRADA"
    ]
    for (const nome of defaultCondicoes) {
      await supabase
        .from('condicoes')
        .insert({ nome, loja_id: lojaId })
    }
    await carregarCondicoes(lojaId)

    setMensagem({ tipo: "success", texto: "Configurações restauradas para o padrão!" })
    setSaving(false)
    setTimeout(() => setMensagem(null), 3000)
  }

  // ========== FUNÇÕES DE UI ==========
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
      reader.onloadend = () => setPreviewLogo(reader.result as string)
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
                      <button onClick={() => setEditandoFornecedor(f)} className="p-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
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
                      <button onClick={() => setEditandoMarca(m)} className="p-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
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
                      <button onClick={() => setEditandoCondicao(c)} className="p-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
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