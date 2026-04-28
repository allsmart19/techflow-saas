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
  
  // Novos campos comerciais
  const [enderecoLoja, setEnderecoLoja] = useState<string>("")
  const [telefoneLoja, setTelefoneLoja] = useState<string>("")
  const [cnpjLoja, setCnpjLoja] = useState<string>("")
  const [cidadeLoja, setCidadeLoja] = useState<string>("")

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
      setEnderecoLoja(config.endereco || "")
      setTelefoneLoja(config.telefone || "")
      setCnpjLoja(config.cnpj || "")
      setCidadeLoja(config.cidade || "")
    }
  }

  function carregarDadosLocal() {
    const savedUser = sessionStorage.getItem("user")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setUserName(user.username || "admin")
      setUserRole(user.role || "user")
      
      // 🔥 CONVERTER loja_id PARA NÚMERO (evitar UUID)
      let lojaIdValue = user.loja_id
      if (typeof lojaIdValue === 'string' && lojaIdValue.includes('-')) {
        // Se for UUID, buscar o loja_id correto do Supabase
        supabase
          .from('usuarios')
          .select('loja_id')
          .eq('email', user.email)
          .single()
          .then(({ data }) => {
            const idNumerico = data?.loja_id || 1
            setLojaId(Number(idNumerico))
            carregarDadosDoSupabase(Number(idNumerico))
          })
      } else {
        setLojaId(Number(lojaIdValue) || 1)
        carregarDadosDoSupabase(Number(lojaIdValue) || 1)
      }
    }
  }

  // 🔥 Função para buscar dados do Supabase (garantia de dados limpos)
// 🔥 SUBSTITUA A FUNÇÃO carregarDadosDoSupabase POR ESTA VERSÃO
async function carregarDadosDoSupabase(lojaIdValue: number) {
  // Buscar fornecedores direto do Supabase (ignorando cache)
  const { data: fornecedoresData, error: errF } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('loja_id', lojaIdValue)
    .order('nome')
  
  if (errF) {
    console.error("Erro ao buscar fornecedores:", errF)
  } else if (fornecedoresData) {
    setFornecedores(fornecedoresData)
    sessionStorage.setItem(`fornecedores_${lojaIdValue}`, JSON.stringify(fornecedoresData))
  }
  
  // Buscar marcas
  const { data: marcasData, error: errM } = await supabase
    .from('marcas')
    .select('*')
    .eq('loja_id', lojaIdValue)
    .order('nome')
  
  if (errM) {
    console.error("Erro ao buscar marcas:", errM)
  } else if (marcasData) {
    setMarcas(marcasData)
    sessionStorage.setItem(`marcas_${lojaIdValue}`, JSON.stringify(marcasData))
  }
  
  // Buscar condições
  const { data: condicoesData, error: errC } = await supabase
    .from('condicoes')
    .select('*')
    .eq('loja_id', lojaIdValue)
    .order('nome')
  
  if (errC) {
    console.error("Erro ao buscar condições:", errC)
  } else if (condicoesData) {
    setCondicoes(condicoesData)
    sessionStorage.setItem(`condicoes_${lojaIdValue}`, JSON.stringify(condicoesData))
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

  const removerLogo = async () => {
    setPreviewLogo(null)
    // Após limpar localmente, salvamos a configuração geral (que enviará logo_url como null)
    setTimeout(() => salvarConfigGeral(), 100)
  }

  const salvarConfigGeral = async () => {
    setSaving(true)
    const success = await updateConfigLoja({
      nome_loja: nomeLojaTemp,
      logo_url: previewLogo,
      endereco: enderecoLoja,
      telefone: telefoneLoja,
      cnpj: cnpjLoja,
      cidade: cidadeLoja
    })
    
    if (success) {
      setNomeLoja(nomeLojaTemp)
      setLogoUrl(previewLogo)
      setMensagem({ tipo: "success", texto: "Configurações da loja salvas com sucesso!" })
    } else {
      setMensagem({ tipo: "error", texto: "Erro ao salvar configurações!" })
    }
    setSaving(false)
    setTimeout(() => setMensagem(null), 3000)
  }

  const salvarLogo = async () => {
    await salvarConfigGeral()
  }

  const salvarNomeLoja = async () => {
    await salvarConfigGeral()
  }

  // ========== FUNÇÕES AUXILIARES PARA RECARREGAR DADOS ==========
async function carregarFornecedores(lojaIdValue: number) {
  console.log("🔄 Recarregando fornecedores da loja:", lojaIdValue);
  
  const { data, error } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('loja_id', lojaIdValue)
    .order('nome');
  
  if (error) {
    console.error("❌ Erro ao recarregar:", error);
  } else if (data) {
    console.log(`✅ ${data.length} fornecedores carregados`);
    setFornecedores(data);
    sessionStorage.setItem(`fornecedores_${lojaIdValue}`, JSON.stringify(data));
  }
}

async function carregarMarcas(lojaIdValue: number) {
  const { data, error } = await supabase
    .from('marcas')
    .select('*')
    .eq('loja_id', lojaIdValue)
    .order('nome')
  
  if (!error && data) {
    setMarcas(data)
    sessionStorage.setItem(`marcas_${lojaIdValue}`, JSON.stringify(data))
  }
}

async function carregarCondicoes(lojaIdValue: number) {
  const { data, error } = await supabase
    .from('condicoes')
    .select('*')
    .eq('loja_id', lojaIdValue)
    .order('nome')
  
  if (!error && data) {
    setCondicoes(data)
    sessionStorage.setItem(`condicoes_${lojaIdValue}`, JSON.stringify(data))
  }
}

// ========== FORNECEDORES ==========
const adicionarFornecedor = async () => {
  if (novoFornecedor.trim()) {
    const novo = { 
      nome: novoFornecedor.toUpperCase(),
      loja_id: Number(lojaId)
    }
    
    const { data, error } = await supabase
      .from('fornecedores')
      .insert([novo])
      .select()
    
    if (error) {
      console.error("Erro ao adicionar fornecedor:", error)
      setMensagem({ tipo: "error", texto: "Erro ao adicionar fornecedor!" })
    } else if (data && data[0]) {
      const novosFornecedores = [...fornecedores, data[0]]
      setFornecedores(novosFornecedores)
      sessionStorage.setItem(`fornecedores_${lojaId}`, JSON.stringify(novosFornecedores))
      setNovoFornecedor("")
      setMensagem({ tipo: "success", texto: "Fornecedor adicionado!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }
}

const editarFornecedor = (fornecedor: any) => {
  setEditandoFornecedor(fornecedor)
  setNovoFornecedor(fornecedor.nome)
}

const salvarEdicaoFornecedor = async () => {
  if (editandoFornecedor && novoFornecedor.trim()) {
    const { error } = await supabase
      .from('fornecedores')
      .update({ nome: novoFornecedor.toUpperCase() })
      .eq('id', editandoFornecedor.id)
      .eq('loja_id', Number(lojaId))
    
    if (error) {
      console.error("Erro ao atualizar fornecedor:", error)
      setMensagem({ tipo: "error", texto: "Erro ao atualizar fornecedor!" })
    } else {
      const novosFornecedores = fornecedores.map((f: any) => 
        f.id === editandoFornecedor.id ? { ...f, nome: novoFornecedor.toUpperCase() } : f
      )
      setFornecedores(novosFornecedores)
      sessionStorage.setItem(`fornecedores_${lojaId}`, JSON.stringify(novosFornecedores))
      setEditandoFornecedor(null)
      setNovoFornecedor("")
      setMensagem({ tipo: "success", texto: "Fornecedor atualizado!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }
}

const cancelarEdicaoFornecedor = () => {
  setEditandoFornecedor(null)
  setNovoFornecedor("")
}

// ========== EXCLUIR FORNECEDOR (CORRIGIDO - USANDO lojaId DO ESTADO) ==========
async function excluirFornecedor(id: number) {
  console.log("🔍 Excluindo fornecedor - ID:", id);
  console.log("🔍 lojaId (estado):", lojaId);
  
  if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return

  let lojaIdValue = lojaId;
  if (!lojaIdValue || isNaN(Number(lojaIdValue))) {
    console.error("❌ lojaId inválido:", lojaIdValue);
    setMensagem({ tipo: "error", texto: "Erro: ID da loja inválido." });
    setTimeout(() => setMensagem(null), 3000);
    return;
  }

  lojaIdValue = Number(lojaIdValue);
  console.log(`🚀 Enviando DELETE para fornecedor ${id} da loja ${lojaIdValue}`);

  const { error } = await supabase
    .from('fornecedores')
    .delete()
    .eq('id', id)
    .eq('loja_id', lojaIdValue);

  if (error) {
    console.error("❌ Erro detalhado:", error);
    setMensagem({ tipo: "error", texto: `Erro: ${error.message}` });
  } else {
    console.log("✅ Exclusão bem-sucedida!");
    await carregarFornecedores(lojaIdValue);
    setMensagem({ tipo: "success", texto: "Fornecedor excluído!" });
  }
  setTimeout(() => setMensagem(null), 3000);
}

// ========== MARCAS ==========
const adicionarMarca = async () => {
  if (novaMarca.trim()) {
    const nova = { 
      nome: novaMarca.toUpperCase(),
      loja_id: Number(lojaId)
    }
    
    const { data, error } = await supabase
      .from('marcas')
      .insert([nova])
      .select()
    
    if (error) {
      console.error("Erro ao adicionar marca:", error)
      setMensagem({ tipo: "error", texto: "Erro ao adicionar marca!" })
    } else if (data && data[0]) {
      const novasMarcas = [...marcas, data[0]]
      setMarcas(novasMarcas)
      sessionStorage.setItem(`marcas_${lojaId}`, JSON.stringify(novasMarcas))
      setNovaMarca("")
      setMensagem({ tipo: "success", texto: "Marca adicionada!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }
}

const editarMarca = (marca: any) => {
  setEditandoMarca(marca)
  setNovaMarca(marca.nome)
}

const salvarEdicaoMarca = async () => {
  if (editandoMarca && novaMarca.trim()) {
    const { error } = await supabase
      .from('marcas')
      .update({ nome: novaMarca.toUpperCase() })
      .eq('id', editandoMarca.id)
      .eq('loja_id', Number(lojaId))
    
    if (error) {
      console.error("Erro ao atualizar marca:", error)
      setMensagem({ tipo: "error", texto: "Erro ao atualizar marca!" })
    } else {
      const novasMarcas = marcas.map((m: any) => 
        m.id === editandoMarca.id ? { ...m, nome: novaMarca.toUpperCase() } : m
      )
      setMarcas(novasMarcas)
      sessionStorage.setItem(`marcas_${lojaId}`, JSON.stringify(novasMarcas))
      setEditandoMarca(null)
      setNovaMarca("")
      setMensagem({ tipo: "success", texto: "Marca atualizada!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }
}

const cancelarEdicaoMarca = () => {
  setEditandoMarca(null)
  setNovaMarca("")
}

// ========== EXCLUIR MARCA (CORRIGIDO - USANDO lojaId DO ESTADO) ==========
async function excluirMarca(id: number) {
  if (!confirm("Tem certeza que deseja excluir esta marca?")) return

  let lojaIdValue = lojaId;
  if (!lojaIdValue || isNaN(Number(lojaIdValue))) {
    console.error("❌ lojaId inválido no estado:", lojaIdValue);
    setMensagem({ tipo: "error", texto: "Erro: ID da loja inválido. Recarregue a página." });
    setTimeout(() => setMensagem(null), 3000);
    return;
  }

  lojaIdValue = Number(lojaIdValue);
  console.log(`🔍 Excluindo marca ${id} da loja ${lojaIdValue}`);

  const { error } = await supabase
    .from('marcas')
    .delete()
    .eq('id', id)
    .eq('loja_id', lojaIdValue);

  if (error) {
    console.error("Erro detalhado ao excluir marca:", error);
    setMensagem({ tipo: "error", texto: `Erro ao excluir marca: ${error.message}` });
  } else {
    const novasMarcas = marcas.filter(m => m.id !== id);
    setMarcas(novasMarcas);
    sessionStorage.setItem(`marcas_${lojaIdValue}`, JSON.stringify(novasMarcas));
    setMensagem({ tipo: "success", texto: "Marca excluída!" });
  }
  setTimeout(() => setMensagem(null), 3000);
}


// ========== CONDIÇÕES ==========
const adicionarCondicao = async () => {
  if (novaCondicao.trim()) {
    const nova = { 
      nome: novaCondicao.toUpperCase(),
      loja_id: Number(lojaId)
    }
    
    const { data, error } = await supabase
      .from('condicoes')
      .insert([nova])
      .select()
    
    if (error) {
      console.error("Erro ao adicionar condição:", error)
      setMensagem({ tipo: "error", texto: "Erro ao adicionar condição!" })
    } else if (data && data[0]) {
      const novasCondicoes = [...condicoes, data[0]]
      setCondicoes(novasCondicoes)
      sessionStorage.setItem(`condicoes_${lojaId}`, JSON.stringify(novasCondicoes))
      setNovaCondicao("")
      setMensagem({ tipo: "success", texto: "Condição adicionada!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }
}

const editarCondicao = (condicao: any) => {
  setEditandoCondicao(condicao)
  setNovaCondicao(condicao.nome)
}

const salvarEdicaoCondicao = async () => {
  if (editandoCondicao && novaCondicao.trim()) {
    const { error } = await supabase
      .from('condicoes')
      .update({ nome: novaCondicao.toUpperCase() })
      .eq('id', editandoCondicao.id)
      .eq('loja_id', Number(lojaId))
    
    if (error) {
      console.error("Erro ao atualizar condição:", error)
      setMensagem({ tipo: "error", texto: "Erro ao atualizar condição!" })
    } else {
      const novasCondicoes = condicoes.map((c: any) => 
        c.id === editandoCondicao.id ? { ...c, nome: novaCondicao.toUpperCase() } : c
      )
      setCondicoes(novasCondicoes)
      sessionStorage.setItem(`condicoes_${lojaId}`, JSON.stringify(novasCondicoes))
      setEditandoCondicao(null)
      setNovaCondicao("")
      setMensagem({ tipo: "success", texto: "Condição atualizada!" })
    }
    setTimeout(() => setMensagem(null), 3000)
  }
}

const cancelarEdicaoCondicao = () => {
  setEditandoCondicao(null)
  setNovaCondicao("")
}

// ========== EXCLUIR CONDIÇÃO (CORRIGIDO - USANDO lojaId DO ESTADO) ==========
async function excluirCondicao(id: number) {
  if (!confirm("Tem certeza que deseja excluir esta condição?")) return

  let lojaIdValue = lojaId;
  if (!lojaIdValue || isNaN(Number(lojaIdValue))) {
    console.error("❌ lojaId inválido no estado:", lojaIdValue);
    setMensagem({ tipo: "error", texto: "Erro: ID da loja inválido. Recarregue a página." });
    setTimeout(() => setMensagem(null), 3000);
    return;
  }

  lojaIdValue = Number(lojaIdValue);
  console.log(`🔍 Excluindo condição ${id} da loja ${lojaIdValue}`);

  const { error } = await supabase
    .from('condicoes')
    .delete()
    .eq('id', id)
    .eq('loja_id', lojaIdValue);

  if (error) {
    console.error("Erro detalhado ao excluir condição:", error);
    setMensagem({ tipo: "error", texto: `Erro ao excluir condição: ${error.message}` });
  } else {
    const novasCondicoes = condicoes.filter(c => c.id !== id);
    setCondicoes(novasCondicoes);
    sessionStorage.setItem(`condicoes_${lojaIdValue}`, JSON.stringify(novasCondicoes));
    setMensagem({ tipo: "success", texto: "Condição excluída!" });
  }
  setTimeout(() => setMensagem(null), 3000);
}

  // ========== EXPORTAR BACKUP ==========
  async function exportarBackup() {
    if (!lojaId) {
      setMensagem({ tipo: "error", texto: "Loja não identificada." })
      setTimeout(() => setMensagem(null), 3000)
      return
    }

    setSaving(true)

    try {
      const { data: pedidos, error: errorPedidos } = await supabase
        .from("pedidos")
        .select("*")
        .eq("loja_id", lojaId)

      if (errorPedidos) throw errorPedidos

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

  // ========== IMPORTAR BACKUP ==========
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
            
            if (!backupData.loja_id || backupData.loja_id !== lojaId) {
              setMensagem({ tipo: "error", texto: "Este backup pertence a outra loja. Importação cancelada." })
              setTimeout(() => setMensagem(null), 3000)
              setSaving(false)
              return
            }

            const totalItens = (backupData.pedidos?.length || 0) + (backupData.consertos?.length || 0)
            if (totalItens === 0) {
              setMensagem({ tipo: "error", texto: "Backup não contém pedidos ou consertos para restaurar." })
              setTimeout(() => setMensagem(null), 3000)
              setSaving(false)
              return
            }

            if (!confirm(`⚠️ ATENÇÃO: Isso irá SUBSTITUIR todos os ${backupData.pedidos?.length || 0} pedidos e ${backupData.consertos?.length || 0} consertos atuais da sua loja. Continuar?`)) {
              setSaving(false)
              return
            }

            await supabase.from("pedidos").delete().eq("loja_id", lojaId)
            await supabase.from("consertos").delete().eq("loja_id", lojaId)

            if (backupData.pedidos && backupData.pedidos.length > 0) {
              for (const pedido of backupData.pedidos) {
                delete pedido.id
                pedido.loja_id = lojaId
                await supabase.from("pedidos").insert([pedido])
              }
            }

            if (backupData.consertos && backupData.consertos.length > 0) {
              for (const conserto of backupData.consertos) {
                delete conserto.id
                conserto.loja_id = lojaId
                await supabase.from("consertos").insert([conserto])
              }
            }

            setMensagem({ tipo: "success", texto: "Backup restaurado com sucesso!" })
            setTimeout(() => window.location.reload(), 2000)
          } catch (error) {
            console.error("Erro ao processar backup:", error)
            setMensagem({ tipo: "error", texto: "Erro ao ler o arquivo de backup." })
            setSaving(false)
          }
        }
        reader.readAsText(file)
      } catch (error) {
        console.error("Erro ao importar backup:", error)
        setMensagem({ tipo: "error", texto: "Erro ao importar backup." })
        setSaving(false)
      }
    }
    input.click()
  }

  // ========== RESETAR PADRÃO ==========
  const resetarPadrao = async () => {
    if (confirm("Isso irá restaurar todas as configurações padrão. Continuar?")) {
      setSaving(true)
      await updateConfigLoja({ 
        nome_loja: "Store Tech", 
        logo_url: null,
        endereco: null,
        telefone: null,
        cnpj: null,
        cidade: null
      })
      setPreviewLogo(null)
      setLogoUrl(null)
      setNomeLojaTemp("Store Tech")
      setNomeLoja("Store Tech")
      setEnderecoLoja("")
      setTelefoneLoja("")
      setCnpjLoja("")
      setCidadeLoja("")
      
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

        <div className="space-y-4">
          {/* Identificação da Loja */}
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
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Nome da Loja</label>
                        <input 
                          type="text" 
                          value={nomeLojaTemp || ""} 
                          onChange={(e) => setNomeLojaTemp(e.target.value)} 
                          className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Ex: Store Tech Assistência"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">CNPJ (Opcional)</label>
                        <input 
                          type="text" 
                          value={cnpjLoja} 
                          onChange={(e) => setCnpjLoja(e.target.value)} 
                          className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="00.000.000/0000-00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Telefone / WhatsApp</label>
                        <input 
                          type="text" 
                          value={telefoneLoja} 
                          onChange={(e) => setTelefoneLoja(e.target.value)} 
                          className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Cidade / UF</label>
                        <input 
                          type="text" 
                          value={cidadeLoja} 
                          onChange={(e) => setCidadeLoja(e.target.value)} 
                          className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Ex: São Paulo - SP"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Endereço Completo</label>
                      <input 
                        type="text" 
                        value={enderecoLoja} 
                        onChange={(e) => setEnderecoLoja(e.target.value)} 
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Rua, Número, Bairro, CEP"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button onClick={salvarConfigGeral} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                        {saving ? <Plus className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3" />}
                        {saving ? "Salvando..." : "Salvar Configurações da Loja"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fornecedores */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button onClick={() => toggleSecao("fornecedores")} className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
            <button onClick={() => toggleSecao("marcas")} className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
            <button onClick={() => toggleSecao("condicoes")} className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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

          {/* Backup e Restauração */}
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
                  <button onClick={exportarBackup} disabled={saving} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50">
                    <Download className="w-4 h-4" />
                    {saving ? "Exportando..." : "Exportar Backup"}
                  </button>
                  <button onClick={importarBackup} disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    {saving ? "Importando..." : "Importar Backup"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Restaurar Padrão */}
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