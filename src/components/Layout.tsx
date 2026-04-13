import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  Package, 
  Filter, 
  Plus, 
  BarChart3, 
  Users, 
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Settings,
  Sun,
  Moon,
  Loader2
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { getConfigLoja } from "../services/configService"
import { getPermissoesUsuario, Permissoes } from "../services/permissaoService"
import { supabase } from "../lib/supabase"

// 🔒 COMPONENTE DE BLOQUEIO (inline pra não quebrar import)
function BloqueioAssinatura() {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md text-center shadow-xl">
        <CreditCard className="w-10 h-10 mx-auto text-purple-600 mb-3" />

        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Assinatura necessária
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Seu plano expirou ou você não possui uma assinatura ativa.
        </p>

        <button
          onClick={() => navigate("/assinatura")}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg text-sm font-semibold"
        >
          Ver Planos
        </button>
      </div>
    </div>
  )
}

// 🔒 MENU
const todosMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", permissao: "dashboard" },
  { icon: Package, label: "Pedidos", path: "/pedidos", permissao: "pedidos" },
  { icon: Wrench, label: "Consertos", path: "/consertos", permissao: "consertos" },
  { icon: Plus, label: "Novo Pedido", path: "/novo", permissao: "novo_pedido" },
  { icon: Filter, label: "Filtrar Pedidos", path: "/filtros", permissao: "filtros" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios", permissao: "relatorios" },
  { icon: Users, label: "Usuários", path: "/usuarios", permissao: "usuarios" },
  { icon: CreditCard, label: "Assinatura", path: "/assinatura", permissao: "assinatura" },
  { icon: Settings, label: "Ajustes", path: "/ajustes", permissao: "ajustes" },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  const [collapsed, setCollapsed] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [nomeLoja, setNomeLoja] = useState("TechFlow")
  const [userRole, setUserRole] = useState<string>("")
  const [accessLoading, setAccessLoading] = useState(true)
  const [menuItems, setMenuItems] = useState(todosMenuItems)

  // 🔥 NOVO: controle de bloqueio
  const [bloqueado, setBloqueado] = useState(false)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    await carregarConfiguracoes()
    await carregarUserData()
    await verificarAcessoAssinatura()
  }

  // 🔒 VERIFICA ASSINATURA
  async function verificarAcessoAssinatura() {
    const userStr = sessionStorage.getItem("user")

    if (!userStr) {
      navigate("/login")
      return
    }

    const user = JSON.parse(userStr)

    try {
      const { data } = await supabase
        .from("assinaturas")
        .select("status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle()

      if (!data) {
        setBloqueado(true)
      } else {
        setBloqueado(false)
      }

    } catch (error) {
      console.error("Erro ao verificar assinatura:", error)
      setBloqueado(true)
    }
  }

  async function carregarUserData() {
    const savedUser = sessionStorage.getItem("user")

    if (savedUser) {
      const user = JSON.parse(savedUser)
      setUserRole(user.role || "user")

      // Admin vê tudo
      if (user.role === 'master' || user.role === 'admin_loja') {
        setMenuItems(todosMenuItems)
        setAccessLoading(false)
        return
      }

      try {
        const permissoes = await getPermissoesUsuario(user.id)

        const itemsFiltrados = todosMenuItems.filter(item =>
          permissoes[item.permissao as keyof Permissoes] === true
        )

        setMenuItems(
          itemsFiltrados.length > 0
            ? itemsFiltrados
            : todosMenuItems.slice(0, 3)
        )

      } catch (error) {
        console.error("Erro ao carregar permissões:", error)
        setMenuItems(todosMenuItems.slice(0, 3))
      }
    }

    setAccessLoading(false)
  }

  async function carregarConfiguracoes() {
    const config = await getConfigLoja()
    if (config) {
      setNomeLoja(config.nome_loja)
      setLogoUrl(config.logo_url)
    }
  }

  useEffect(() => {
    const handleStorageChange = () => {
      carregarConfiguracoes()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem("user")
    navigate("/login")
  }

  const handleNavigation = (path: string) => {
    if (location.pathname !== path) {
      navigate(path)
    }
  }

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* SIDEBAR */}
      <aside className={`relative bg-white dark:bg-gray-800 border-r flex flex-col transition-all ${collapsed ? "w-20" : "w-64"}`}>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-white border rounded-full p-1 shadow"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>

        {/* LOGO */}
        <div className="p-5 text-center border-b">
          {logoUrl ? (
            <img src={logoUrl} className="w-12 mx-auto" />
          ) : (
            <Wrench className="mx-auto text-purple-600" />
          )}
          {!collapsed && <h2 className="text-sm font-semibold mt-2">{nomeLoja}</h2>}
        </div>

        {/* MENU */}
        <nav className="flex-1 py-4">
          {menuItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-2 px-3 py-2 ${
                  isActive ? "bg-purple-600 text-white" : "hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {!collapsed && item.label}
              </button>
            )
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-4">
          <button onClick={toggleTheme} className="w-full flex gap-2 py-2">
            {theme === "light" ? <Moon /> : <Sun />}
            {!collapsed && "Tema"}
          </button>

          <button onClick={handleLogout} className="w-full flex gap-2 text-red-600 py-2">
            <LogOut />
            {!collapsed && "Sair"}
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* 🔒 BLOQUEIO GLOBAL */}
      {bloqueado && location.pathname !== "/assinatura" && (
        <BloqueioAssinatura />
      )}
    </div>
  )
}