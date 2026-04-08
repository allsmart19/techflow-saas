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

  useEffect(() => {
    const savedFornecedores = localStorage.getItem("fornecedores")
    if (savedFornecedores) {
      const fornecedores = JSON.parse(savedFornecedores)
      setFornecedoresLista(fornecedores)
      if (fornecedores.length > 0 && !formData.fornecedor) {
        setFormData(prev => ({ ...prev, fornecedor: fornecedores[0].nome }))
      }
    } else {
      const defaultFornecedores = [
        { id: 1, nome: "NEW STORE" },
        { id: 2, nome: "NOVA PEÇAS" },
        { id: 3, nome: "FLORITEC" },
        { id: 4, nome: "VITOR CAMELÃO" }
      ]
      setFornecedoresLista(defaultFornecedores)
      setFormData(prev => ({ ...prev, fornecedor: "NEW STORE" }))
    }
    
    const savedMarcas = localStorage.getItem("marcas")
    if (savedMarcas) {
      const marcas = JSON.parse(savedMarcas)
      setMarcasLista(marcas)
      if (marcas.length > 0 && !formData.marca) {
        setFormData(prev => ({ ...prev, marca: marcas[0].nome }))
      }
    } else {
      const defaultMarcas = [
        { id: 1, nome: "SAMSUNG" }, { id: 2, nome: "APPLE" },
        { id: 3, nome: "MOTOROLA" }, { id: 4, nome: "XIAOMI" },
        { id: 5, nome: "LG" }, { id: 6, nome: "ASUS" }, { id: 7, nome: "INFINIX" }
      ]
      setMarcasLista(defaultMarcas)
      setFormData(prev => ({ ...prev, marca: "SAMSUNG" }))
    }
    
    const savedCondicoes = localStorage.getItem("condicoes")
    if (savedCondicoes) {
      const condicoes = JSON.parse(savedCondicoes)
      setCondicoesLista(condicoes)
      if (condicoes.length > 0 && !formData.condicao) {
        setFormData(prev => ({ ...prev, condicao: condicoes[0].nome }))
      }
    } else {
      const defaultCondicoes = [
        { id: 1, nome: "CONSERTO" }, { id: 2, nome: "GARANTIA" },
        { id: 3, nome: "LOJA" }, { id: 4, nome: "DEVOLUÇÃO" },
        { id: 5, nome: "DEVOLUÇÃO PAGA" }, { id: 6, nome: "QUEBRADA" }
      ]
      setCondicoesLista(defaultCondicoes)
      setFormData(prev => ({ ...prev, condicao: "CONSERTO" }))
    }
  }, [])

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
        marca: state.pedido.marca || (marcasLista[0]?.nome || "SAMSUNG"),
        valor: state.pedido.valor?.toString() || "",
        frete: state.pedido.frete?.toString() || "",
        data: converterData(state.pedido.data),
        data_vencimento: converterData(state.pedido.data_vencimento),
        fornecedor: state.pedido.fornecedor || (fornecedoresLista[0]?.nome || "NEW STORE"),
        condicao: state.pedido.condicao || (condicoesLista[0]?.nome || "CONSERTO"),
        observacoes: state.pedido.observacoes || ""
      })
    }
  }, [location, fornecedoresLista, marcasLista, condicoesLista])

  // Função para permitir apenas números no campo código
  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Permite apenas números
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
      observacoes: formData.observacoes
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
          {/* Código do Pedido - Aceita apenas números */}
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