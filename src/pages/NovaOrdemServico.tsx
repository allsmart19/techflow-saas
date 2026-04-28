import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabase"
import {
  User, Smartphone, Wrench, FileText, ArrowLeft, Loader2,
  Check, Search, PlusCircle, Shield, ShieldCheck, ClipboardCheck,
  Battery, Wifi, Camera, Volume2, Fingerprint, Plug, CircleDot,
  Package, CreditCard, Calendar, AlertTriangle
} from "lucide-react"

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
}

const CHECKLIST_ITEMS = [
  { key: "checklist_tela", label: "Tela / Display", icon: Smartphone },
  { key: "checklist_traseira", label: "Tampa Traseira", icon: ShieldCheck },
  { key: "checklist_carcaca", label: "Carcaça / Laterais", icon: Shield },
  { key: "checklist_botoes", label: "Botões Físicos", icon: CircleDot },
  { key: "checklist_cameras", label: "Câmeras", icon: Camera },
  { key: "checklist_som", label: "Alto-falante / Mic", icon: Volume2 },
  { key: "checklist_carregamento", label: "Carregamento", icon: Plug },
  { key: "checklist_wifi", label: "Wi-Fi / Rede", icon: Wifi },
  { key: "checklist_biometria", label: "Biometria / FaceID", icon: Fingerprint },
]

const CHECKLIST_OPTIONS = ["OK", "Risco leve", "Trincado", "Quebrado", "Não funciona", "Não testado"]

const CORES = ["Preto", "Branco", "Azul", "Vermelho", "Dourado", "Prata", "Verde", "Roxo", "Rosa", "Outro"]

export default function NovaOrdemServico() {
  const navigate = useNavigate()
  const location = useLocation()

  const stateData = location.state as any
  const prefillCliente = stateData?.prefillCliente
  const editOSId = stateData?.editOSId

  const [loading, setLoading] = useState(false)
  const [lojaId, setLojaId] = useState<number>(1)
  const [marcasLista, setMarcasLista] = useState<{ id: number; nome: string }[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [buscaCliente, setBuscaCliente] = useState("")
  const [mostrarDropdownBusca, setMostrarDropdownBusca] = useState(false)
  const [step, setStep] = useState(1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    cliente_id: null as number | null,
    cliente_nome: "",
    cliente_telefone: "",
    marca: "",
    modelo: "",
    cor: "Preto",
    imei: "",
    senha: "",
    aparelho_liga: true,
    // checklist
    checklist_tela: "OK",
    checklist_traseira: "OK",
    checklist_carcaca: "OK",
    checklist_botoes: "OK",
    checklist_cameras: "OK",
    checklist_som: "OK",
    checklist_carregamento: "OK",
    checklist_wifi: "OK",
    checklist_biometria: "OK",
    // acessórios
    acessorio_chip: false,
    acessorio_cartao_memoria: false,
    acessorio_carregador: false,
    acessorio_capinha: false,
    acessorio_pelicula: false,
    acessorio_outros: "",
    // serviço
    defeito_relatado: "",
    observacoes: "",
    valor_orcamento: "",
    valor_pecas: "",
    valor_mao_obra: "",
    forma_pagamento: "",
    data_previsao: "",
    garantia_dias: "90",
    prioridade: "Normal",
  })

  useEffect(() => {
    carregarRequisitos()
    const handleClickFora = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMostrarDropdownBusca(false)
      }
    }
    document.addEventListener("mousedown", handleClickFora)
    return () => document.removeEventListener("mousedown", handleClickFora)
  }, [])

  async function carregarRequisitos() {
    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    if (!user) { navigate("/login"); return }

    let lojaIdValue = user.loja_id
    if (!lojaIdValue) {
      const { data } = await supabase.from("usuarios").select("loja_id").eq("id", user.id).single()
      lojaIdValue = data?.loja_id || 1
    }
    setLojaId(lojaIdValue)

    const savedMarcas = sessionStorage.getItem(`marcas_${lojaIdValue}`)
    if (savedMarcas) {
      const parsed = JSON.parse(savedMarcas)
      setMarcasLista(parsed)
      if (parsed.length > 0 && !formData.marca) setFormData(prev => ({ ...prev, marca: parsed[0].nome }))
    } else {
      const fallback = [
        { id: 1, nome: "APPLE" }, { id: 2, nome: "SAMSUNG" }, { id: 3, nome: "MOTOROLA" },
        { id: 4, nome: "XIAOMI" }, { id: 5, nome: "LG" }, { id: 6, nome: "HUAWEI" }, { id: 7, nome: "ASUS" }
      ]
      setMarcasLista(fallback)
      setFormData(prev => ({ ...prev, marca: "APPLE" }))
    }

    const { data: dbClientes } = await supabase.from("clientes").select("id, nome, telefone").eq("loja_id", lojaIdValue)
    if (dbClientes) setClientes(dbClientes)

    if (prefillCliente) setClientesPrefill(prefillCliente)
    if (editOSId) carregarOSParaEdicao(editOSId)
  }

  async function carregarOSParaEdicao(id: number) {
    const { data } = await supabase.from("ordens_servico").select("*").eq("id", id).single()
    if (data) {
      setBuscaCliente(data.cliente_nome)
      setFormData({
        cliente_id: data.cliente_id || null,
        cliente_nome: data.cliente_nome,
        cliente_telefone: data.cliente_telefone || "",
        marca: data.marca || "",
        modelo: data.modelo,
        cor: data.cor || "Preto",
        imei: data.imei || "",
        senha: data.senha || "",
        aparelho_liga: data.aparelho_liga ?? true,
        checklist_tela: data.checklist_tela || "OK",
        checklist_traseira: data.checklist_traseira || "OK",
        checklist_carcaca: data.checklist_carcaca || "OK",
        checklist_botoes: data.checklist_botoes || "OK",
        checklist_cameras: data.checklist_cameras || "OK",
        checklist_som: data.checklist_som || "OK",
        checklist_carregamento: data.checklist_carregamento || "OK",
        checklist_wifi: data.checklist_wifi || "OK",
        checklist_biometria: data.checklist_biometria || "OK",
        acessorio_chip: data.acessorio_chip || false,
        acessorio_cartao_memoria: data.acessorio_cartao_memoria || false,
        acessorio_carregador: data.acessorio_carregador || false,
        acessorio_capinha: data.acessorio_capinha || false,
        acessorio_pelicula: data.acessorio_pelicula || false,
        acessorio_outros: data.acessorio_outros || "",
        defeito_relatado: data.defeito_relatado || "",
        observacoes: data.observacoes || "",
        valor_orcamento: data.valor_orcamento?.toString() || "",
        valor_pecas: data.valor_pecas?.toString() || "",
        valor_mao_obra: data.valor_mao_obra?.toString() || "",
        forma_pagamento: data.forma_pagamento || "",
        data_previsao: data.data_previsao ? new Date(data.data_previsao).toISOString().split("T")[0] : "",
        garantia_dias: data.garantia_dias?.toString() || "90",
        prioridade: data.prioridade || "Normal",
      })
    }
  }

  const setClientesPrefill = (cli: Cliente) => {
    setBuscaCliente(cli.nome)
    setFormData(prev => ({
      ...prev,
      cliente_id: cli.id,
      cliente_nome: cli.nome,
      cliente_telefone: cli.telefone || "",
    }))
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 11) value = value.substring(0, 11)
    if (value.length <= 2) {
      // só números
    } else if (value.length <= 6) {
      value = `(${value.substring(0, 2)}) ${value.substring(2)}`
    } else if (value.length <= 10) {
      value = `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6)}`
    } else {
      value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`
    }
    setFormData({ ...formData, cliente_telefone: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null

    try {
      let cliente_final_id = formData.cliente_id
      if (!cliente_final_id) {
        const clienteFound = clientes.find(c => c.nome.toLowerCase() === buscaCliente.toLowerCase())
        if (clienteFound) {
          cliente_final_id = clienteFound.id
        } else {
          const { data: newCli } = await supabase.from("clientes").insert([{
            nome: buscaCliente.toUpperCase(),
            telefone: formData.cliente_telefone,
            loja_id: lojaId,
          }]).select()
          if (newCli && newCli.length > 0) cliente_final_id = newCli[0].id
        }
      }

      const osPayload: any = {
        loja_id: lojaId,
        cliente_id: cliente_final_id,
        cliente_nome: buscaCliente.toUpperCase(),
        cliente_telefone: formData.cliente_telefone,
        marca: formData.marca,
        modelo: formData.modelo.toUpperCase(),
        cor: formData.cor,
        imei: formData.imei,
        senha: formData.senha,
        aparelho_liga: formData.aparelho_liga,
        checklist_tela: formData.checklist_tela,
        checklist_traseira: formData.checklist_traseira,
        checklist_carcaca: formData.checklist_carcaca,
        checklist_botoes: formData.checklist_botoes,
        checklist_cameras: formData.checklist_cameras,
        checklist_som: formData.checklist_som,
        checklist_carregamento: formData.checklist_carregamento,
        checklist_wifi: formData.checklist_wifi,
        checklist_biometria: formData.checklist_biometria,
        acessorio_chip: formData.acessorio_chip,
        acessorio_cartao_memoria: formData.acessorio_cartao_memoria,
        acessorio_carregador: formData.acessorio_carregador,
        acessorio_capinha: formData.acessorio_capinha,
        acessorio_pelicula: formData.acessorio_pelicula,
        acessorio_outros: formData.acessorio_outros,
        defeito_relatado: formData.defeito_relatado,
        observacoes: formData.observacoes,
        valor_orcamento: parseFloat(formData.valor_orcamento) || 0,
        valor_pecas: parseFloat(formData.valor_pecas) || 0,
        valor_mao_obra: parseFloat(formData.valor_mao_obra) || 0,
        forma_pagamento: formData.forma_pagamento,
        garantia_dias: parseInt(formData.garantia_dias) || 90,
        prioridade: formData.prioridade,
      }

      if (formData.data_previsao) {
        osPayload.data_previsao = new Date(formData.data_previsao).toISOString()
      }

      if (editOSId) {
        const { error } = await supabase.from("ordens_servico").update(osPayload).eq("id", editOSId)
        if (error) throw error
        alert("Ordem de serviço atualizada com sucesso!")
      } else {
        const { error } = await supabase.from("ordens_servico").insert([{
          ...osPayload,
          status: "Entrada",
          data_entrada: new Date().toISOString(),
          user_id: user?.id,
          tecnico_id: user?.id,
        }])
        if (error) throw error
        alert("Ordem de serviço criada com sucesso!")
      }

      navigate("/os")
    } catch (err: any) {
      console.error(err)
      alert("Erro ao salvar a OS: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredClientes = clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase()))

  const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
  const labelClass = "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
  const cardClass = "bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700"
  const sectionTitleClass = "text-sm font-semibold text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-2 border-b border-purple-100 dark:border-purple-900/30 pb-2"

  const STEPS = [
    { num: 1, label: "Cliente e Aparelho" },
    { num: 2, label: "Checklist de Entrada" },
    { num: 3, label: "Serviço e Valores" },
  ]

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/os")} className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {editOSId ? `Editar Ordem #${editOSId}` : "Nova Ordem de Serviço"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Preencha todas as informações de entrada do equipamento</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${step === s.num
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30"
                  : step > s.num
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
            >
              {step > s.num ? <Check className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full bg-white/20 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold">{s.num}</span>}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${step > s.num ? "bg-emerald-300 dark:bg-emerald-700" : "bg-gray-200 dark:bg-gray-700"}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* ================== STEP 1: CLIENTE + APARELHO ================== */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in">
            {/* Card Cliente */}
            <div className={cardClass}>
              <h2 className={sectionTitleClass}><User className="w-4 h-4" /> Dados do Cliente</h2>
              <div className="space-y-4">
                <div className="relative" ref={dropdownRef}>
                  <label className={labelClass}>Nome Completo *</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" value={buscaCliente} required
                      onChange={e => { setBuscaCliente(e.target.value); setFormData({ ...formData, cliente_id: null }); setMostrarDropdownBusca(true) }}
                      onFocus={() => setMostrarDropdownBusca(true)}
                      className={`${inputClass} pl-9`} placeholder="Buscar ou cadastrar novo..."
                    />
                    {formData.cliente_id && <Check className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-500" />}
                  </div>
                  {mostrarDropdownBusca && buscaCliente.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {filteredClientes.length > 0 ? (
                        <ul>{filteredClientes.map(c => (
                          <li key={c.id} onClick={() => { setClientesPrefill(c); setMostrarDropdownBusca(false) }}
                            className="px-4 py-2.5 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200 flex justify-between items-center border-b border-gray-50 dark:border-gray-700 last:border-0">
                            <span className="font-medium">{c.nome}</span>
                            <span className="text-xs text-gray-400">{c.telefone}</span>
                          </li>
                        ))}</ul>
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <PlusCircle className="w-4 h-4 text-purple-500" /> Cliente novo será cadastrado automaticamente ao salvar.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>WhatsApp / Telefone</label>
                  <input type="text" value={formData.cliente_telefone} onChange={handleTelefoneChange} className={inputClass} placeholder="(00) 00000-0000" />
                </div>
              </div>
            </div>

            {/* Card Aparelho */}
            <div className={cardClass}>
              <h2 className={sectionTitleClass}><Smartphone className="w-4 h-4" /> Dados do Aparelho</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Marca *</label>
                  <select value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} className={inputClass}>
                    {marcasLista.map(m => (<option key={m.id} value={m.nome}>{m.nome}</option>))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Modelo *</label>
                  <input type="text" value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value })} required className={inputClass} placeholder="Ex: iPhone 15 Pro" />
                </div>
                <div>
                  <label className={labelClass}>Cor</label>
                  <select value={formData.cor} onChange={e => setFormData({ ...formData, cor: e.target.value })} className={inputClass}>
                    {CORES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>IMEI / Nº de Série</label>
                  <input type="text" value={formData.imei} onChange={e => setFormData({ ...formData, imei: e.target.value })} className={inputClass} placeholder="Discar *#06#" maxLength={20} />
                </div>
                <div>
                  <label className={labelClass}>Senha de Desbloqueio</label>
                  <input type="text" value={formData.senha} onChange={e => setFormData({ ...formData, senha: e.target.value })} className={inputClass} placeholder="PIN, Padrão, Senha..." />
                </div>
                <div>
                  <label className={labelClass}>Aparelho liga?</label>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setFormData({ ...formData, aparelho_liga: true })}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${formData.aparelho_liga ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400" : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-400"}`}>
                      ✅ Sim
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, aparelho_liga: false })}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${!formData.aparelho_liga ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400" : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-400"}`}>
                      ❌ Não
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão Avançar */}
            <div className="lg:col-span-2 flex justify-end">
              <button type="button" onClick={() => setStep(2)} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg transition">
                Próximo: Checklist de Entrada →
              </button>
            </div>
          </div>
        )}

        {/* ================== STEP 2: CHECKLIST ================== */}
        {step === 2 && (
          <div className="space-y-6 animate-in">
            <div className={cardClass}>
              <h2 className={sectionTitleClass}><ClipboardCheck className="w-4 h-4" /> Checklist de Entrada — Estado do Aparelho</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 -mt-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Registre o estado de cada componente para segurança jurídica e evitar reclamações.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CHECKLIST_ITEMS.map(item => {
                  const Icon = item.icon
                  const val = (formData as any)[item.key]
                  const isOk = val === "OK"
                  return (
                    <div key={item.key} className={`p-3 rounded-xl border transition ${isOk ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10" : "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${isOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`} />
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{item.label}</span>
                      </div>
                      <select value={val}
                        onChange={e => setFormData({ ...formData, [item.key]: e.target.value })}
                        className={`w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none ${isOk ? "border-emerald-200 bg-white dark:bg-gray-800 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400" : "border-amber-200 bg-white dark:bg-gray-800 dark:border-amber-700 text-amber-700 dark:text-amber-400"}`}>
                        {CHECKLIST_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Acessórios Entregues */}
            <div className={cardClass}>
              <h2 className={sectionTitleClass}><Package className="w-4 h-4" /> Acessórios Entregues pelo Cliente</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { key: "acessorio_chip", label: "Chip SIM" },
                  { key: "acessorio_cartao_memoria", label: "Cartão de Memória" },
                  { key: "acessorio_carregador", label: "Carregador" },
                  { key: "acessorio_capinha", label: "Capinha / Case" },
                  { key: "acessorio_pelicula", label: "Película" },
                ].map(acc => {
                  const checked = (formData as any)[acc.key]
                  return (
                    <button type="button" key={acc.key}
                      onClick={() => setFormData({ ...formData, [acc.key]: !checked })}
                      className={`p-3 rounded-xl border text-xs font-semibold transition text-center ${checked ? "bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-400" : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"}`}>
                      {checked ? "✅ " : ""}{acc.label}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3">
                <label className={labelClass}>Outros acessórios</label>
                <input type="text" value={formData.acessorio_outros} onChange={e => setFormData({ ...formData, acessorio_outros: e.target.value })} className={inputClass} placeholder="Fone, stylus, caixa original..." />
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <button type="button" onClick={() => setStep(1)} className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                ← Voltar
              </button>
              <button type="button" onClick={() => setStep(3)} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg transition">
                Próximo: Serviço e Valores →
              </button>
            </div>
          </div>
        )}

        {/* ================== STEP 3: SERVIÇO E VALORES ================== */}
        {step === 3 && (
          <div className="space-y-6 animate-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Defeito & Obs */}
              <div className={cardClass}>
                <h2 className={sectionTitleClass}><Wrench className="w-4 h-4" /> Detalhes do Serviço</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Defeito Relatado pelo Cliente *</label>
                    <textarea value={formData.defeito_relatado} required rows={4}
                      onChange={e => setFormData({ ...formData, defeito_relatado: e.target.value })}
                      className={`${inputClass} resize-none`} placeholder="Descreva exatamente o que o cliente informou sobre o problema..." />
                  </div>
                  <div>
                    <label className={labelClass}>Observações Internas</label>
                    <textarea value={formData.observacoes} rows={3}
                      onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                      className={`${inputClass} resize-none`} placeholder="Anotações para uso interno da equipe técnica..." />
                  </div>
                  <div>
                    <label className={labelClass}>Prioridade</label>
                    <div className="flex gap-2">
                      {["Normal", "Urgente"].map(p => (
                        <button key={p} type="button" onClick={() => setFormData({ ...formData, prioridade: p })}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${formData.prioridade === p
                              ? p === "Urgente" ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400" : "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400"
                              : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-400"
                            }`}>
                          {p === "Urgente" ? "🔴 " : "🔵 "}{p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div className={cardClass}>
                <h2 className={sectionTitleClass}><CreditCard className="w-4 h-4" /> Orçamento e Financeiro</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Valor das Peças (R$)</label>
                      <input type="number" step="0.01" min="0" value={formData.valor_pecas} onChange={e => setFormData({ ...formData, valor_pecas: e.target.value })} className={inputClass} placeholder="0.00" />
                    </div>
                    <div>
                      <label className={labelClass}>Mão de Obra (R$)</label>
                      <input type="number" step="0.01" min="0" value={formData.valor_mao_obra} onChange={e => setFormData({ ...formData, valor_mao_obra: e.target.value })} className={inputClass} placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Valor Total / Orçamento (R$)</label>
                    <input type="number" step="0.01" min="0" value={formData.valor_orcamento} onChange={e => setFormData({ ...formData, valor_orcamento: e.target.value })} className={inputClass} placeholder="0.00" />
                    <p className="text-[10px] text-gray-400 mt-1">Se deixar vazio, será "A combinar".</p>
                  </div>
                  <div>
                    <label className={labelClass}>Forma de Pagamento</label>
                    <select value={formData.forma_pagamento} onChange={e => setFormData({ ...formData, forma_pagamento: e.target.value })} className={inputClass}>
                      <option value="">Não definido</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="PIX">PIX</option>
                      <option value="Cartão Débito">Cartão Débito</option>
                      <option value="Cartão Crédito">Cartão Crédito</option>
                      <option value="Cartão Crédito Parcelado">Cartão Crédito Parcelado</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Previsão de Entrega</label>
                      <input type="date" value={formData.data_previsao} onChange={e => setFormData({ ...formData, data_previsao: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Garantia (dias)</label>
                      <select value={formData.garantia_dias} onChange={e => setFormData({ ...formData, garantia_dias: e.target.value })} className={inputClass}>
                        <option value="30">30 dias</option>
                        <option value="60">60 dias</option>
                        <option value="90">90 dias (padrão)</option>
                        <option value="180">180 dias</option>
                        <option value="365">1 ano</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões finais */}
            <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" onClick={() => setStep(2)} className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                ← Voltar
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={() => navigate("/os")} className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-70">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editOSId ? "💾 Salvar Alterações" : "✅ Criar Ordem de Serviço")}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
