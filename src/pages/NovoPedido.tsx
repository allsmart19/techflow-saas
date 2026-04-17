import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabase"

interface Fornecedor {
  id: number
  nome: string
}

interface Marca {
  id: number
  nome: string
}

interface Condicao {
  id: number
  nome: string
}

export default function NovoPedido() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [fornecedoresLista, setFornecedoresLista] = useState<Fornecedor[]>([])
  const [marcasLista, setMarcasLista] = useState<Marca[]>([])
  const [condicoesLista, setCondicoesLista] = useState<Condicao[]>([])
  const [carregandoListas, setCarregandoListas] = useState(true)
  const [lojaId, setLojaId] = useState<number>(1)
  
  const [formData, setFormData] = useState({
    codigo: "",
    modelo: "",
    marca: "",
    valor: "",
    frete: "",
    data: new Date().toISOString().split('T')[0],
    data_vencimento: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
    fornecedor: "",
    condicao: "",
    observacoes: ""
  })

  // Carregar listas do sessionStorage (integradas com a tela de Ajustes)
  useEffect(() => {
    const carregarListas = async () => {
      const userStr = sessionStorage.getItem("user")
      const user = userStr ? JSON.parse(userStr) : null
      if (!user) {
        navigate("/login")
        return
      }

      // Obter loja_id do usuário logado
      let lojaIdValue = user.loja_id
      if (!lojaIdValue) {
        const { data: userInfo, error: userError } = await supabase
          .from("usuarios")
          .select("loja_id")
          .eq("id", user.id)
          .single()
        if (!userError && userInfo) {
          lojaIdValue = userInfo.loja_id
        }
      }
      
      if (!lojaIdValue) lojaIdValue = 1
      setLojaId(lojaIdValue)

      setCarregandoListas(true)

      // 🔥 Carregar FORNECEDORES do sessionStorage (vindos da tela de Ajustes)
      const savedFornecedores = sessionStorage.getItem(`fornecedores_${lojaIdValue}`)
      if (savedFornecedores) {
        setFornecedoresLista(JSON.parse(savedFornecedores))
      } else {
        // Dados padrão caso não existam
        const defaultFornecedores = [
          { id: 1, nome: "NEW STORE" }, { id: 2, nome: "NOVA PEÇAS" },
          { id: 3, nome: "FLORITEC" }, { id: 4, nome: "VITOR CAMELÃO" }
        ]
        setFornecedoresLista(defaultFornecedores)
        sessionStorage.setItem(`fornecedores_${lojaIdValue}`, JSON.stringify(defaultFornecedores))
      }

      // 🔥 Carregar MARCAS do sessionStorage (vindos da tela de Ajustes)
      const savedMarcas = sessionStorage.getItem(`marcas_${lojaIdValue}`)
      if (savedMarcas) {
        setMarcasLista(JSON.parse(savedMarcas))
      } else {
        const defaultMarcas = [
          { id: 1, nome: "SAMSUNG" }, { id: 2, nome: "APPLE" },
          { id: 3, nome: "MOTOROLA" }, { id: 4, nome: "XIAOMI" },
          { id: 5, nome: "LG" }, { id: 6, nome: "ASUS" }, { id: 7, nome: "INFINIX" }
        ]
        setMarcasLista(defaultMarcas)
        sessionStorage.setItem(`marcas_${lojaIdValue}`, JSON.stringify(defaultMarcas))
      }

      // 🔥 Carregar CONDIÇÕES do sessionStorage (vindos da tela de Ajustes)
      const savedCondicoes = sessionStorage.getItem(`condicoes_${lojaIdValue}`)
      if (savedCondicoes) {
        setCondicoesLista(JSON.parse(savedCondicoes))
      } else {
        const defaultCondicoes = [
          { id: 1, nome: "CONSERTO" }, { id: 2, nome: "GARANTIA" },
          { id: 3, nome: "LOJA" }, { id: 4, nome: "DEVOLUÇÃO" },
          { id: 5, nome: "DEVOLUÇÃO PAGA" }, { id: 6, nome: "QUEBRADA" }
        ]
        setCondicoesLista(defaultCondicoes)
        sessionStorage.setItem(`condicoes_${lojaIdValue}`, JSON.stringify(defaultCondicoes))
      }

      setCarregandoListas(false)
    }

    carregarListas()
  }, [navigate])

  // Preencher valores padrão quando as listas carregarem
  useEffect(() => {
    if (fornecedoresLista.length > 0 && !formData.fornecedor) {
      setFormData(prev => ({ ...prev, fornecedor: fornecedoresLista[0].nome }))
    }
    if (marcasLista.length > 0 && !formData.marca) {
      setFormData(prev => ({ ...prev, marca: marcasLista[0].nome }))
    }
    if (condicoesLista.length > 0 && !formData.condicao) {
      setFormData(prev => ({ ...prev, condicao: condicoesLista[0].nome }))
    }
  }, [fornecedoresLista, marcasLista, condicoesLista])

  // Carregar dados para edição
  useEffect(() => {
    const state = location.state as any
    if (state?.isEditing && state?.pedido) {
      setIsEditing(true)
      setEditingId(state.pedido.id)
      
      const converterData = (dataStr: string) => {
        if (!dataStr) return ""
        const partes = dataStr.split('/')
        if (partes.length === 3) {
          return `${partes[2]}-${partes[1]}-${partes[0]}`
        }
        return ""
      }
      
      setFormData({
        codigo: state.pedido.codigo || "",
        modelo: state.pedido.modelo || "",
        marca: state.pedido.marca || (marcasLista[0]?.nome || ""),
        valor: state.pedido.valor?.toString() || "",
        frete: state.pedido.frete?.toString() || "",
        data: converterData(state.pedido.data),
        data_vencimento: converterData(state.pedido.data_vencimento),
        fornecedor: state.pedido.fornecedor || (fornecedoresLista[0]?.nome || ""),
        condicao: state.pedido.condicao || (condicoesLista[0]?.nome || ""),
        observacoes: state.pedido.observacoes || ""
      })
    }
  }, [location, marcasLista, fornecedoresLista, condicoesLista])

  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const apenasNumeros = value.replace(/\D/g, '')
    setFormData({...formData, codigo: apenasNumeros})
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value) {
      const numericValue = (parseFloat(value) / 100).toFixed(2)
      setFormData({...formData, valor: numericValue})
    } else {
      setFormData({...formData, valor: ""})
    }
  }

  const handleFreteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value) {
      const numericValue = (parseFloat(value) / 100).toFixed(2)
      setFormData({...formData, frete: numericValue})
    } else {
      setFormData({...formData, frete: ""})
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    if (!user) {
      alert("Usuário não identificado.")
      navigate("/login")
      return
    }

    // 🔥 BUSCAR LOJA_ID DO USUÁRIO
    let lojaIdValue = user.loja_id
    
    if (!lojaIdValue) {
      const { data } = await supabase
        .from("usuarios")
        .select("loja_id")
        .eq("id", user.id)
        .single()
      lojaIdValue = data?.loja_id
    }

    if (!lojaIdValue) {
      alert("Erro: Usuário não vinculado a uma loja. Contate o administrador.")
      return
    }

    setLoading(true)

    const dataFormatada = new Date(formData.data).toLocaleDateString('pt-BR')
    const vencimentoFormatado = new Date(formData.data_vencimento).toLocaleDateString('pt-BR')

    const pedidoData = {
      codigo: formData.codigo || null,
      modelo: formData.modelo.toUpperCase(),
      marca: formData.marca,
      valor: parseFloat(formData.valor) || 0,
      frete: parseFloat(formData.frete) || 0,
      data: dataFormatada,
      data_vencimento: vencimentoFormatado,
      fornecedor: formData.fornecedor,
      condicao: formData.condicao,
      observacoes: formData.observacoes,
      user_id: user.id,
      loja_id: lojaIdValue
    }

    let error = null

    if (isEditing && editingId) {
      const { error: updateError } = await supabase
        .from("pedidos")
        .update(pedidoData)
        .eq("id", editingId)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from("pedidos")
        .insert([pedidoData])
      error = insertError
    }

    setLoading(false)

    if (error) {
      console.error("Erro detalhado:", error)
      alert(`Erro ao ${isEditing ? "atualizar" : "salvar"} pedido: ${error.message}`)
    } else {
      alert(`✅ Pedido ${isEditing ? "atualizado" : "salvo"} com sucesso!`)
      navigate("/pedidos")
    }
  }

  const displayValor = () => {
    if (!formData.valor) return ""
    const num = parseFloat(formData.valor)
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const displayFrete = () => {
    if (!formData.frete) return ""
    const num = parseFloat(formData.frete)
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  if (carregandoListas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-gray-500">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          {isEditing ? "Editar Pedido" : "Novo Pedido"}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {isEditing ? "Altere os dados do pedido" : "Preencha os dados do pedido"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Código do Pedido */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código do Pedido
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.codigo}
              onChange={handleCodigoChange}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Ex: 12345"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Apenas números - Identificador único do pedido</p>
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Modelo *</label>
            <input
              type="text"
              value={formData.modelo}
              onChange={(e) => setFormData({...formData, modelo: e.target.value})}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Ex: iPhone 12, Galaxy S22"
              required
            />
          </div>

          {/* Marca */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Marca *</label>
            <select
              value={formData.marca}
              onChange={(e) => setFormData({...formData, marca: e.target.value})}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
              required
            >
              {marcasLista.map((marca) => (
                <option key={marca.id} value={marca.nome}>{marca.nome}</option>
              ))}
            </select>
          </div>

          {/* Fornecedor */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fornecedor *</label>
            <select
              value={formData.fornecedor}
              onChange={(e) => setFormData({...formData, fornecedor: e.target.value})}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
              required
            >
              {fornecedoresLista.map((fornecedor) => (
                <option key={fornecedor.id} value={fornecedor.nome}>{fornecedor.nome}</option>
              ))}
            </select>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">R$</span>
              <input
                type="text"
                value={displayValor()}
                onChange={handleValorChange}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          {/* Frete */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Frete (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">R$</span>
              <input
                type="text"
                value={displayFrete()}
                onChange={handleFreteChange}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0,00"
              />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Valor do frete (se houver)</p>
          </div>

          {/* Data do Pedido */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data do Pedido *</label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({...formData, data: e.target.value})}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Data de Vencimento */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Vencimento *</label>
            <input
              type="date"
              value={formData.data_vencimento}
              onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Condição */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Condição *</label>
            <select
              value={formData.condicao}
              onChange={(e) => setFormData({...formData, condicao: e.target.value})}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
              required
            >
              {condicoesLista.map((condicao) => (
                <option key={condicao.id} value={condicao.nome}>{condicao.nome}</option>
              ))}
            </select>
          </div>

          {/* Observações - ocupa 2 colunas */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows={2}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white resize-none"
              placeholder="Informações adicionais sobre o pedido..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-1.5 rounded-lg text-sm font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? "Salvando..." : (isEditing ? "Atualizar Pedido" : "Salvar Pedido")}
          </button>
          <button 
            type="button" 
            onClick={() => navigate("/pedidos")}
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-5 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}