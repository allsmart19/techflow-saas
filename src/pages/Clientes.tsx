import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { Search, Plus, Loader2, Edit, Trash2, Contact, Smartphone, Mail, X } from "lucide-react"

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  cpf_cnpj: string;
  endereco: string;
}

export default function Clientes() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState("")
  const [lojaId, setLojaId] = useState<number>(1)
  
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    cpf_cnpj: "",
    endereco: ""
  })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarClientes()
  }, [])

  async function carregarClientes() {
    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    if (!user) {
      navigate('/login')
      return
    }

    setLoading(true)

    try {
      let lojaIdValue = user.loja_id
      if (!lojaIdValue) {
        const { data } = await supabase.from("usuarios").select("loja_id").eq("id", user.id).single()
        lojaIdValue = data?.loja_id
      }
      setLojaId(lojaIdValue)

      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("loja_id", lojaIdValue)
        .order("nome", { ascending: true })

      if (error && error.code !== '42P01') {
        console.error("Erro ao carregar clientes:", error)
      } else if (data) {
        setClientes(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.substring(0, 11)
    
    if (value.length > 2 && value.length <= 6) {
      value = `(${value.substring(0, 2)}) ${value.substring(2)}`
    } else if (value.length > 6 && value.length <= 10) {
      value = `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6)}`
    } else if (value.length > 10) {
      value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`
    }
    setFormData({ ...formData, telefone: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)

    const clienteData = {
      ...formData,
      loja_id: lojaId,
      nome: formData.nome.toUpperCase()
    }

    try {
      if (editandoId) {
        await supabase.from("clientes").update(clienteData).eq("id", editandoId)
      } else {
        await supabase.from("clientes").insert([clienteData])
      }
      
      setModalAberto(false)
      setEditandoId(null)
      carregarClientes()
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar o cliente.")
    } finally {
      setSalvando(false)
    }
  }

  const excluirCliente = async (id: number) => {
    if (confirm("Deseja realmente excluir este cliente? Ordens de serviço atreladas a ele podem ficar sem referência.")) {
      const { error } = await supabase.from("clientes").delete().eq("id", id)
      if (error) alert("Erro ao excluir cliente")
      else carregarClientes()
    }
  }

  const abrirNovaOrdemComCliente = (cliente: Cliente) => {
    navigate('/nova-os', { state: { prefillCliente: cliente } })
  }

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) || 
    (c.telefone && c.telefone.includes(search))
  )

  if (loading && clientes.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Contact className="w-5 h-5 text-purple-600" /> Cadastro de Clientes
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gerencie os clientes da sua assistência</p>
        </div>
        <button
          onClick={() => {
            setEditandoId(null)
            setFormData({ nome: "", telefone: "", email: "", cpf_cnpj: "", endereco: "" })
            setModalAberto(true)
          }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:shadow-lg transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 mb-5 flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300">Cliente</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300">Contato</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300">Endereço</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 text-center w-40">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="py-3 px-4">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{cliente.nome}</div>
                    {cliente.cpf_cnpj && <div className="text-[10px] text-gray-400">Doc: {cliente.cpf_cnpj}</div>}
                  </td>
                  <td className="py-3 px-4">
                    {cliente.telefone && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 mb-0.5">
                        <Smartphone className="w-3 h-3 text-purple-500" /> {cliente.telefone}
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <Mail className="w-3 h-3 text-indigo-500" /> {cliente.email}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={cliente.endereco}>
                      {cliente.endereco || '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => abrirNovaOrdemComCliente(cliente)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded"
                        title="Nova Ordem de Serviço"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditandoId(cliente.id)
                          setFormData({
                            nome: cliente.nome,
                            telefone: cliente.telefone || "",
                            email: cliente.email || "",
                            cpf_cnpj: cliente.cpf_cnpj || "",
                            endereco: cliente.endereco || ""
                          })
                          setModalAberto(true)
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => excluirCliente(cliente.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhum cliente encontrado. Adicione um novo no botão superior.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Contact className="w-5 h-5 text-purple-600" />
                {editandoId ? "Editar Cliente" : "Novo Cliente"}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-900 dark:text-white"
                    placeholder="João da Silva"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={handleTelefoneChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-900 dark:text-white"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-900 dark:text-white"
                    placeholder="cliente@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">CPF / CNPJ</label>
                  <input
                    type="text"
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-900 dark:text-white"
                    placeholder="Documento para garantia"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
                  <textarea
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-900 dark:text-white resize-none"
                    placeholder="Rua, Número, Bairro, Cidade"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center shadow-lg transition disabled:opacity-50"
                >
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
