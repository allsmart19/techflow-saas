import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import {
  Users,
  Plus,
  Key,
  Shield,
  User,
  Loader2,
  AlertCircle,
  Edit2,
  Save,
  X,
  Power,
  PowerOff,
  CheckSquare,
  Square,
  Percent
} from "lucide-react"

interface Usuario {
  id: number
  username: string
  email?: string
  role: string
  comissao_percentual: number
  ativo: boolean
  permissoes?: Permissoes
}

interface Permissoes {
  dashboard?: boolean
  pedidos?: boolean
  consertos?: boolean
  novo_pedido?: boolean
  filtros?: boolean
  relatorios?: boolean
  usuarios?: boolean
  assinatura?: boolean
  ajustes?: boolean
}

// Lista de todas as permissões disponíveis
const todasPermissoes = [
  { nome: "dashboard", label: "Dashboard", rota: "/dashboard" },
  { nome: "pedidos", label: "Pedidos", rota: "/pedidos" },
  { nome: "consertos", label: "Consertos", rota: "/consertos" },
  { nome: "novo_pedido", label: "Novo Pedido", rota: "/novo" },
  { nome: "filtros", label: "Filtros Avançados", rota: "/filtros" },
  { nome: "relatorios", label: "Relatórios", rota: "/relatorios" },
  { nome: "usuarios", label: "Usuários", rota: "/usuarios" },
  { nome: "assinatura", label: "Assinatura", rota: "/assinatura" },
  { nome: "ajustes", label: "Ajustes", rota: "/ajustes" },
]

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("")
  const [userLogado, setUserLogado] = useState<any>(null)
  const [mensagem, setMensagem] = useState<{ tipo: "success" | "error"; texto: string } | null>(null)
  const [lojaId, setLojaId] = useState<number | null>(null)

  const [novoUsername, setNovoUsername] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [novaRole, setNovaRole] = useState<"user" | "admin_loja">("user")
  const [novasPermissoes, setNovasPermissoes] = useState<Permissoes>({})
  const [saving, setSaving] = useState(false)

  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null)
  const [novaSenhaReset, setNovaSenhaReset] = useState("")

  const [editandoComissaoId, setEditandoComissaoId] = useState<number | null>(null)
  const [editandoComissaoValor, setEditandoComissaoValor] = useState<string>("")

  const [editandoPermissoesId, setEditandoPermissoesId] = useState<number | null>(null)
  const [editandoPermissoes, setEditandoPermissoes] = useState<Permissoes>({})

  useEffect(() => {
    carregarUserRole()
  }, [])

  useEffect(() => {
    if (userLogado?.id && lojaId !== null) {
      carregarUsuarios()
    }
  }, [userLogado, lojaId])

  async function carregarUserRole() {
    const userStr = sessionStorage.getItem("user")
    if (!userStr) return

    const user = JSON.parse(userStr)
    setUserLogado(user)

    const { data } = await supabase
      .from("usuarios")
      .select("role, loja_id")
      .eq("id", user.id)
      .single()

    if (data) {
      setUserRole(data.role)
      setLojaId(data.loja_id ?? null)
    }
  }

  async function carregarUsuarios() {
    setLoading(true)

    if (!lojaId) {
      console.error("❌ Usuário sem loja_id → bloqueando query")
      setUsuarios([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("id, username, email, role, comissao_percentual, ativo, permissoes")
      .eq("loja_id", lojaId)
      .order("id")

    if (error) {
      console.error("Erro ao carregar usuários:", error)
      setUsuarios([])
    } else {
      setUsuarios(data || [])
    }

    setLoading(false)
  }

async function cadastrarUsuario(e: React.FormEvent) {
  e.preventDefault()

  if (!isAdmin) {
    setMensagem({ tipo: "error", texto: "Apenas administradores podem cadastrar novos usuários!" })
    setTimeout(() => setMensagem(null), 3000)
    return
  }

  if (!novoUsername.trim() || !novaSenha.trim()) {
    setMensagem({ tipo: "error", texto: "Preencha todos os campos!" })
    setTimeout(() => setMensagem(null), 3000)
    return
  }

  setSaving(true)

  try {
    // Obter a loja_id do usuário logado (admin)
    const { data: adminData, error: adminError } = await supabase
      .from("usuarios")
      .select("loja_id")
      .eq("id", userLogado?.id)
      .single()

    if (adminError || !adminData?.loja_id) {
      setMensagem({ tipo: "error", texto: "Administrador não possui loja vinculada!" })
      setSaving(false)
      setTimeout(() => setMensagem(null), 3000)
      return
    }

    const lojaId = adminData.loja_id
    const tecnicoEmail = `${novoUsername.toLowerCase()}@tecnicotech.com`

    // Criar usuário no Supabase Auth
    const { error: authError } = await supabase.auth.signUp({
      email: tecnicoEmail,
      password: novaSenha,
      options: {
        data: { username: novoUsername.toLowerCase() }
      }
    })

    if (authError) {
      setMensagem({ tipo: "error", texto: authError.message })
      setSaving(false)
      setTimeout(() => setMensagem(null), 3000)
      return
    }

    // Preparar permissões padrão para técnico
    let permissoes = null
    if (novaRole === "user") {
      permissoes = {
        dashboard: true,
        pedidos: true,
        consertos: true,
        novo_pedido: true,
        filtros: true,
        relatorios: true,
        usuarios: false,
        assinatura: false,
        ajustes: false
      }
    }

    // Inserir na tabela usuarios com a loja_id correta
    const { error: insertError } = await supabase.from("usuarios").insert({
      username: novoUsername.toLowerCase(),
      email: tecnicoEmail,
      role: novaRole,
      comissao_percentual: 10,
      ativo: true,
      loja_id: lojaId,
      permissoes: permissoes
    })

    if (insertError) {
      setMensagem({ tipo: "error", texto: insertError.message })
    } else {
      setMensagem({ tipo: "success", texto: `Usuário ${novoUsername} cadastrado com sucesso!` })
      setNovoUsername("")
      setNovaSenha("")
      setNovaRole("user")
      carregarUsuarios()
    }
  } catch (error: any) {
    setMensagem({ tipo: "error", texto: error.message || "Erro ao cadastrar usuário" })
  }

  setSaving(false)
  setTimeout(() => setMensagem(null), 3000)
}

// =========================
// RESETAR SENHA (VIA API)
// =========================
async function resetarSenha() {
  if (!usuarioSelecionado) return;

  if (!isAdmin) {
    setMensagem({ tipo: "error", texto: "Apenas administradores podem resetar senhas!" });
    setTimeout(() => setMensagem(null), 3000);
    return;
  }

  if (!novaSenhaReset.trim()) {
    setMensagem({ tipo: "error", texto: "Digite a nova senha!" });
    setTimeout(() => setMensagem(null), 3000);
    return;
  }

  if (novaSenhaReset.length < 6) {
    setMensagem({ tipo: "error", texto: "A senha deve ter pelo menos 6 caracteres!" });
    setTimeout(() => setMensagem(null), 3000);
    return;
  }

  setSaving(true);

  try {
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: usuarioSelecionado.id,
        newPassword: novaSenhaReset
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao resetar senha');
    }

    setMensagem({ tipo: "success", texto: `Senha de ${usuarioSelecionado.username} alterada com sucesso!` });
    setUsuarioSelecionado(null);
    setNovaSenhaReset("");
    carregarUsuarios(); // recarregar lista (opcional)
 } catch (error) {
  console.error(error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  setMensagem({ tipo: "error", texto: errorMessage || "Erro ao resetar senha" });
}

  setSaving(false);
  setTimeout(() => setMensagem(null), 3000);
}

  async function toggleUsuarioAtivo(id: number, username: string, ativoAtual: boolean) {
    if (username === userLogado?.username) {
      setMensagem({ tipo: "error", texto: "Você não pode alterar o status do seu próprio usuário!" })
      setTimeout(() => setMensagem(null), 3000)
      return
    }

    const acaoTexto = ativoAtual ? "desativado" : "ativado"

    if (confirm(`Tem certeza que deseja ${ativoAtual ? "desativar" : "ativar"} o usuário "${username}"?`)) {
      setLoading(true)

      const { error } = await supabase
        .from("usuarios")
        .update({ ativo: !ativoAtual })
        .eq("id", id)
        .eq("loja_id", lojaId)

      if (error) {
        setMensagem({ tipo: "error", texto: `Erro ao ${ativoAtual ? "desativar" : "ativar"} usuário!` })
      } else {
        setMensagem({ tipo: "success", texto: `Usuário "${username}" ${acaoTexto} com sucesso!` })
        carregarUsuarios()
      }

      setLoading(false)
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  async function salvarComissao(id: number) {
    const comissao = parseFloat(editandoComissaoValor)
    if (isNaN(comissao) || comissao < 0 || comissao > 100) {
      setMensagem({ tipo: "error", texto: "Comissão deve ser um número entre 0 e 100" })
      setTimeout(() => setMensagem(null), 3000)
      return
    }

    setSaving(true)
    const { error } = await supabase
      .from("usuarios")
      .update({ comissao_percentual: comissao })
      .eq("id", id)

    if (error) {
      setMensagem({ tipo: "error", texto: "Erro ao salvar comissão!" })
    } else {
      setMensagem({ tipo: "success", texto: "Comissão atualizada com sucesso!" })
      setEditandoComissaoId(null)
      carregarUsuarios()
    }
    setSaving(false)
    setTimeout(() => setMensagem(null), 3000)
  }

  function iniciarEdicaoComissao(usuario: Usuario) {
    setEditandoComissaoId(usuario.id)
    setEditandoComissaoValor(usuario.comissao_percentual.toString())
  }

  function iniciarEdicaoPermissoes(usuario: Usuario) {
    setEditandoPermissoesId(usuario.id)
    setEditandoPermissoes(usuario.permissoes || {})
  }

  async function salvarPermissoes(id: number) {
    setSaving(true)
    const { error } = await supabase
      .from("usuarios")
      .update({ permissoes: editandoPermissoes })
      .eq("id", id)

    if (error) {
      setMensagem({ tipo: "error", texto: "Erro ao salvar permissões!" })
    } else {
      setMensagem({ tipo: "success", texto: "Permissões atualizadas com sucesso!" })
      setEditandoPermissoesId(null)
      carregarUsuarios()
    }
    setSaving(false)
    setTimeout(() => setMensagem(null), 3000)
  }

  function togglePermissao(permissao: string, valor: boolean) {
    setEditandoPermissoes(prev => ({ ...prev, [permissao]: valor }))
  }

  const isAdmin = userRole === "admin_loja" || userRole === "master"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Usuários</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Gerencie os usuários do sistema
            {!isAdmin && " • Visualização apenas - Apenas administradores podem gerenciar"}
          </p>
        </div>

        {mensagem && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
            mensagem.tipo === "success" 
              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
              : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
          }`}>
            <AlertCircle className="w-4 h-4" />
            {mensagem.texto}
          </div>
        )}

        {!isAdmin && (
          <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800 mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Você está no modo de visualização. Apenas administradores podem cadastrar novos usuários, resetar senhas e gerenciar comissões.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Cadastro */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${!isAdmin ? "opacity-75" : ""}`}>
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Novo Usuário</h2>
              </div>
            </div>
            <div className="p-5">
              <form onSubmit={cadastrarUsuario} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome de usuário *
                  </label>
                  <input
                    type="text"
                    value={novoUsername}
                    onChange={(e) => setNovoUsername(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                    placeholder="Ex: joao, maria"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Senha *
                  </label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                    placeholder="********"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Usuário *
                  </label>
                  <select
                    value={novaRole}
                    onChange={(e) => setNovaRole(e.target.value as "user" | "admin_loja")}
                    disabled={!isAdmin}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="user">Técnico</option>
                    <option value="admin_loja">Administrador da Loja</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!isAdmin || saving}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {saving ? "Cadastrando..." : "Cadastrar Usuário"}
                </button>
              </form>
            </div>
          </div>

          {/* Resetar Senha */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${!isAdmin ? "opacity-75" : ""}`}>
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Resetar Senha</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Selecionar Usuário
                  </label>
                  <select
                    value={usuarioSelecionado?.id || ""}
                    onChange={(e) => {
                      const user = usuarios.find(u => u.id === Number(e.target.value))
                      setUsuarioSelecionado(user || null)
                    }}
                    disabled={!isAdmin}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Selecione um usuário</option>
                    {usuarios.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} {user.role === "admin_loja" && "(Admin)"} {!user.ativo && "(Inativo)"}
                      </option>
                    ))}
                  </select>
                </div>
                {usuarioSelecionado && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nova Senha
                      </label>
                      <input
                        type="password"
                        value={novaSenhaReset}
                        onChange={(e) => setNovaSenhaReset(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                        placeholder="********"
                      />
                    </div>
                    <button
                      onClick={resetarSenha}
                      disabled={!isAdmin || saving || !novaSenhaReset}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {saving ? "Resetando..." : "Resetar Senha"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-6">
          <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Lista de Usuários</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400">ID</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400">Usuário</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                  <th className="text-center p-3 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-center p-3 text-xs font-medium text-gray-500 dark:text-gray-400">Comissão</th>
                  <th className="text-center p-3 text-xs font-medium text-gray-500 dark:text-gray-400">Permissões</th>
                  <th className="text-center p-3 text-xs font-medium text-gray-500 dark:text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {usuarios.map((user) => (
                  <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition ${!user.ativo ? 'opacity-60' : ''}`}>
                    <td className="p-3 text-xs text-gray-600 dark:text-gray-400">{user.id}</td>
                    <td className="p-3 text-xs font-medium text-gray-900 dark:text-white">
                      {user.username}
                      {user.username === userLogado?.username && (
                        <span className="ml-2 text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">
                          Você
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-gray-500 dark:text-gray-400">{user.email || "-"}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        user.role === "admin_loja" || user.role === "master"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" 
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {user.role === "admin_loja" || user.role === "master" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {user.role === "master" ? "Master" : user.role === "admin_loja" ? "Admin Loja" : "Técnico"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        user.ativo 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {user.ativo ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                        {user.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {editandoComissaoId === user.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="relative w-24">
                            <input
                              type="number"
                              value={editandoComissaoValor}
                              onChange={(e) => setEditandoComissaoValor(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-gray-900 text-center"
                              step="0.5"
                              min="0"
                              max="100"
                              autoFocus
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                          </div>
                          <button
                            onClick={() => salvarComissao(user.id)}
                            disabled={saving}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditandoComissaoId(null)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user.comissao_percentual || 10}%
                          </span>
                          {isAdmin && user.role !== "admin_loja" && user.role !== "master" && (
                            <button
                              onClick={() => iniciarEdicaoComissao(user)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Editar comissão"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {editandoPermissoesId === user.id ? (
                        <div className="flex flex-col gap-1">
                          <div className="grid grid-cols-2 gap-1">
                            {todasPermissoes.map((perm) => (
                              <label key={perm.nome} className="flex items-center gap-1 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => togglePermissao(perm.nome, !editandoPermissoes[perm.nome as keyof Permissoes])}
                                  className="text-purple-600"
                                >
                                  {editandoPermissoes[perm.nome as keyof Permissoes] ? 
                                    <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                                </button>
                                {perm.label}
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-1 justify-center mt-1">
                            <button
                              onClick={() => salvarPermissoes(user.id)}
                              disabled={saving}
                              className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditandoPermissoesId(null)}
                              className="p-0.5 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => iniciarEdicaoPermissoes(user)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Editar permissões"
                          disabled={user.role === "admin_loja" || user.role === "master"}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {isAdmin && user.username !== userLogado?.username && user.role !== "master" && (
                        <button
                          onClick={() => toggleUsuarioAtivo(user.id, user.username, user.ativo)}
                          className={`p-1 rounded transition ${
                            user.ativo 
                              ? "text-red-600 hover:bg-red-50" 
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={user.ativo ? "Desativar usuário" : "Ativar usuário"}
                        >
                          {user.ativo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      )}
                      {user.username === userLogado?.username && (
                        <span className="text-xs text-gray-400">Ativo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              ℹ️ <strong>Gerenciamento de Usuários:</strong><br />
              • Usuários <strong>inativos</strong> não podem fazer login, mas seus dados permanecem no sistema.<br />
              • A comissão padrão para novos técnicos é <strong>10%</strong>.<br />
              • Para <strong>reativar</strong> um usuário inativo, clique no botão verde ao lado do nome.<br />
              • Técnicos podem ter permissões <strong>granulares</strong> (quais telas podem acessar).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}