import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { 
  Package, Search, Plus, Trash2, Edit, 
  ArrowUpRight, ArrowDownLeft, AlertCircle, 
  History, Filter, Download, MoreHorizontal,
  PlusCircle, MinusCircle, LayoutGrid, List, X
} from "lucide-react"

interface PecaEstoque {
  id: number
  nome: string
  categoria: string
  quantidade: number
  minimo_estoque: number
  valor_compra: number
  valor_venda: number
  loja_id: number
  updated_at: string
}

const CATEGORIAS = ["Telas", "Baterias", "Conectores", "Botões", "Câmeras", "Carcacas", "Outros"]

export default function Estoque() {
  const [loading, setLoading] = useState(true)
  const [pecas, setPecas] = useState<PecaEstoque[]>([])
  const [search, setSearch] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null)
  const [lojaId, setLojaId] = useState<number | null>(null)
  
  // Modais
  const [modalAberto, setModalAberto] = useState(false)
  const [modalMovimentacao, setModalMovimentacao] = useState<{aberto: boolean, item?: PecaEstoque, tipo?: 'ENTRADA' | 'SAÍDA'}>({aberto: false})
  const [editando, setEditando] = useState<PecaEstoque | null>(null)
  
  // Formulário
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "Outros",
    quantidade: 0,
    minimo_estoque: 1,
    valor_compra: 0,
    valor_venda: 0
  })

  // Movimentação
  const [movData, setMovData] = useState({
    quantidade: 1,
    motivo: ""
  })

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    try {
      const userStr = sessionStorage.getItem("user")
      const user = userStr ? JSON.parse(userStr) : null
      if (!user) return

      let lojaIdValue = user.loja_id
      if (!lojaIdValue) {
        const { data } = await supabase.from("usuarios").select("loja_id").eq("id", user.id).single()
        lojaIdValue = data?.loja_id
      }
      setLojaId(lojaIdValue)

      const { data, error } = await supabase
        .from("pecas_estoque")
        .select("*")
        .eq("loja_id", lojaIdValue)
        .order("nome")

      if (error) throw error
      setPecas(data || [])
    } catch (err) {
      console.error("Erro ao carregar estoque:", err)
    } finally {
      setLoading(false)
    }
  }

  const pecasFiltradas = pecas.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase())
    const matchesCat = !categoriaFiltro || p.categoria === categoriaFiltro
    return matchesSearch && matchesCat
  })

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lojaId) return

    try {
      const payload = {
        ...formData,
        loja_id: lojaId,
        updated_at: new Date().toISOString()
      }

      if (editando) {
        const { error } = await supabase
          .from("pecas_estoque")
          .update(payload)
          .eq("id", editando.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("pecas_estoque")
          .insert([payload])
        if (error) throw error
      }

      setModalAberto(false)
      setEditando(null)
      carregarDados()
      resetForm()
    } catch (err) {
      alert("Erro ao salvar peça no estoque")
      console.error(err)
    }
  }

  const handleMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault()
    const item = modalMovimentacao.item
    if (!item || !lojaId) return

    try {
      const novaQtd = modalMovimentacao.tipo === 'ENTRADA' 
        ? item.quantidade + movData.quantidade 
        : item.quantidade - movData.quantidade

      if (novaQtd < 0) {
        alert("Estoque insuficiente para esta saída!")
        return
      }

      // 1. Atualizar estoque
      const { error: errUpdate } = await supabase
        .from("pecas_estoque")
        .update({ quantidade: novaQtd, updated_at: new Date().toISOString() })
        .eq("id", item.id)
      
      if (errUpdate) throw errUpdate

      // 2. Registrar no histórico
      const { error: errHist } = await supabase
        .from("movimentacao_estoque")
        .insert([{
          estoque_id: item.id,
          tipo: modalMovimentacao.tipo,
          quantidade: movData.quantidade,
          motivo: movData.motivo || (modalMovimentacao.tipo === 'ENTRADA' ? "Entrada manual" : "Saída manual"),
          estoque_anterior: item.quantidade,
          estoque_atual: novaQtd,
          loja_id: lojaId
        }])

      setModalMovimentacao({aberto: false})
      carregarDados()
      setMovData({quantidade: 1, motivo: ""})
    } catch (err) {
      alert("Erro ao registrar movimentação")
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormData({
      nome: "",
      categoria: "Outros",
      quantidade: 0,
      minimo_estoque: 1,
      valor_compra: 0,
      valor_venda: 0
    })
  }

  const abrirEdicao = (peca: PecaEstoque) => {
    setEditando(peca)
    setFormData({
      nome: peca.nome,
      categoria: peca.categoria,
      quantidade: peca.quantidade,
      minimo_estoque: peca.minimo_estoque,
      valor_compra: peca.valor_compra,
      valor_venda: peca.valor_venda
    })
    setModalAberto(true)
  }

  const excluirPeca = async (id: number) => {
    if (!confirm("Deseja realmente remover esta peça do estoque?")) return
    try {
      const { error } = await supabase.from("pecas_estoque").delete().eq("id", id)
      if (error) throw error
      carregarDados()
    } catch (err) {
      alert("Erro ao excluir")
    }
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header Profissional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            Controle de Estoque
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie suas peças e insumos com precisão</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { resetForm(); setEditando(null); setModalAberto(true); }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Novo Item
          </button>
        </div>
      </div>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total de Itens</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{pecas.length}</h3>
            </div>
            <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Peças em Falta</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">{pecas.filter(p => p.quantidade <= 0).length}</h3>
            </div>
            <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Estoque Baixo</p>
              <h3 className="text-2xl font-bold text-amber-500 mt-1">{pecas.filter(p => p.quantidade > 0 && p.quantidade <= p.minimo_estoque).length}</h3>
            </div>
            <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-lg flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Valor em Estoque</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {formatCurrency(pecas.reduce((acc, p) => acc + (p.valor_compra * p.quantidade), 0))}
              </h3>
            </div>
            <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar peça por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button 
            onClick={() => setCategoriaFiltro(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${!categoriaFiltro ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200"}`}
          >
            Todas
          </button>
          {CATEGORIAS.map(cat => (
            <button 
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${categoriaFiltro === cat ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listagem Estilo Moderna */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Peça</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Qtd Atual</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Preço Venda</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Carregando estoque...</td></tr>
              ) : pecasFiltradas.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhuma peça encontrada.</td></tr>
              ) : pecasFiltradas.map(item => {
                const status = item.quantidade <= 0 ? 'CRÍTICO' : item.quantidade <= item.minimo_estoque ? 'BAIXO' : 'OK'
                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.nome}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Atualizado em: {new Date(item.updated_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-[10px] font-bold">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${status === 'CRÍTICO' ? 'text-red-600' : status === 'BAIXO' ? 'text-amber-500' : 'text-emerald-600'}`}>
                          {item.quantidade} un
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => setModalMovimentacao({aberto: true, item, tipo: 'ENTRADA'})} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"><PlusCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setModalMovimentacao({aberto: true, item, tipo: 'SAÍDA'})} className="p-1 text-red-600 hover:bg-red-50 rounded transition"><MinusCircle className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(item.valor_venda)}</p>
                      <p className="text-[10px] text-emerald-500 font-medium">Margem: {formatCurrency(item.valor_venda - item.valor_compra)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        status === 'CRÍTICO' ? 'bg-red-100 text-red-600' :
                        status === 'BAIXO' ? 'bg-amber-100 text-amber-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => abrirEdicao(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => excluirPeca(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastro/Edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editando ? "Editar Peça" : "Nova Peça no Estoque"}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome da Peça / Modelo</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Ex: Tela iPhone 11 Original"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Categoria</label>
                  <select 
                    value={formData.categoria}
                    onChange={e => setFormData({...formData, categoria: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                {!editando && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Qtd Inicial</label>
                    <input 
                      type="number" 
                      value={formData.quantidade}
                      onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Preço Compra (UN)</label>
                  <input 
                    type="number" step="0.01"
                    value={formData.valor_compra}
                    onChange={e => setFormData({...formData, valor_compra: Number(e.target.value)})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Preço Venda (UN)</label>
                  <input 
                    type="number" step="0.01"
                    value={formData.valor_venda}
                    onChange={e => setFormData({...formData, valor_venda: Number(e.target.value)})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-bold text-emerald-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mínimo para Alerta</label>
                <input 
                  type="number"
                  value={formData.minimo_estoque}
                  onChange={e => setFormData({...formData, minimo_estoque: Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-semibold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-bold text-sm shadow-lg shadow-purple-200 dark:shadow-none">
                  {editando ? "Salvar Alterações" : "Cadastrar Peça"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Entrada/Saída Rápida */}
      {modalMovimentacao.aberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center ${
              modalMovimentacao.tipo === 'ENTRADA' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${
                modalMovimentacao.tipo === 'ENTRADA' ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {modalMovimentacao.tipo === 'ENTRADA' ? <PlusCircle className="w-4 h-4"/> : <MinusCircle className="w-4 h-4"/>}
                Registrar {modalMovimentacao.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
              </h2>
            </div>
            <form onSubmit={handleMovimentacao} className="p-6 space-y-4">
              <div className="text-center mb-2">
                <p className="text-xs text-gray-500">Peça:</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{modalMovimentacao.item?.nome}</p>
                <div className="mt-2 text-[10px] text-gray-400">Estoque atual: {modalMovimentacao.item?.quantidade} un</div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Quantidade</label>
                <input 
                  type="number" 
                  min="1"
                  value={movData.quantidade}
                  onChange={e => setMovData({...movData, quantidade: Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-center text-xl font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Motivo / Observação</label>
                <input 
                  type="text" 
                  value={movData.motivo}
                  onChange={e => setMovData({...movData, motivo: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm"
                  placeholder={modalMovimentacao.tipo === 'ENTRADA' ? "Ex: Compra com fornecedor" : "Ex: Peça danificada"}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setModalMovimentacao({aberto: false})} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm">Voltar</button>
                <button type="submit" className={`flex-1 px-4 py-2.5 text-white rounded-xl transition font-bold text-sm shadow-lg ${
                  modalMovimentacao.tipo === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'
                }`}>
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
