import logoPadrao from "../assets/StoreTech.svg"
import { useState, useEffect, useRef } from "react"
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
import { checkAccess } from "../services/accessService"


const todosMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", permissao: "dashboard" },
  { icon: Package, label: "Pedidos", path: "/pedidos", permissao: "pedidos" },
  { icon: Wrench, label: "Consertos", path: "/consertos", permissao: "consertos" },
  { icon: Plus, label: "Novo Pedido", path: "/novo", permissao: "novo_pedido" },
  { icon: Filter, label: "Filtros Avançados", path: "/filtros", permissao: "filtros" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios", permissao: "relatorios" },
  { icon: Users, label: "Usuários", path: "/usuarios", permissao: "usuarios" },
  { icon: CreditCard, label: "Assinatura", path: "/assinatura", permissao: "assinatura" },
  { icon: Settings, label: "Ajustes", path: "/ajustes", permissao: "ajustes" }
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  const [collapsed, setCollapsed] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [nomeLoja, setNomeLoja] = useState("Store Tech")
  const [menuItems, setMenuItems] = useState(todosMenuItems)

  const [loading, setLoading] = useState(true)
  const [bloqueado, setBloqueado] = useState(false)
  const [userRole, setUserRole] = useState<string>("")

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRunningRef = useRef(false)

  useEffect(() => {
    const userStr = sessionStorage.getItem("user")
    console.log("🔍 Layout - Verificando usuário:", userStr)

    if (!userStr) {
      console.log("❌ Layout - Usuário não encontrado, redirecionando para login")
      navigate("/login")
      return
    }

    let user: any
    try {
      user = JSON.parse(userStr)
      console.log("✅ Layout - Usuário logado:", user.username)
      setUserRole(user.role || "user")
    } catch {
      sessionStorage.removeItem("user")
      navigate("/login")
      return
    }

    init(user)

    intervalRef.current = setInterval(() => {
      const freshUserStr = sessionStorage.getItem("user")
      if (!freshUserStr) return

      try {
        const freshUser = JSON.parse(freshUserStr)
        init(freshUser)
      } catch {
        sessionStorage.removeItem("user")
        navigate("/login")
      }
    }, 15000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  async function init(user: any) {
    if (isRunningRef.current) return
    isRunningRef.current = true

    try {
      // 🔥 Verificar acesso (7 dias grátis ou assinatura)
      const access = await checkAccess(user.id)
      setBloqueado(!access.hasAccess)

      await Promise.all([
        carregarPermissoes(user),
        carregarConfig()
      ])

      setLoading(false)
    } catch (err) {
      console.error("Erro init layout:", err)
    } finally {
      isRunningRef.current = false
    }
  }

  async function carregarPermissoes(user: any) {
    // Master tem acesso a tudo
    if (user.role === "master") {
      setMenuItems(todosMenuItems)
      return
    }

    // Admin de loja tem acesso a tudo
    if (user.role === "admin_loja") {
      setMenuItems(todosMenuItems)
      return
    }

    // Técnico: filtrar por permissões
    try {
      const permissoes = await getPermissoesUsuario(user.id)
      const filtrado = todosMenuItems.filter(
        (item) => permissoes[item.permissao as keyof Permissoes] === true
      )
      setMenuItems(filtrado.length ? filtrado : todosMenuItems.slice(0, 3))
    } catch {
      setMenuItems(todosMenuItems.slice(0, 3))
    }
  }

  async function carregarConfig() {
    const config = await getConfigLoja()
    if (config) {
      setNomeLoja(config.nome_loja)
      setLogoUrl(config.logo_url)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("user")
    navigate("/login")
  }

  const handleNavigation = (path: string) => {
    // Se bloqueado, só permite ir para página de assinatura
    if (bloqueado && path !== "/assinatura") {
      return
    }
    if (location.pathname !== path) {
      navigate(path)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (bloqueado) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 text-center p-6">
        <div className="max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Bloqueado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Seu período de teste gratuito expirou.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Assine um plano para continuar usando o sistema.
          </p>
          <button
            onClick={() => navigate("/assinatura")}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition"
          >
            Ver Planos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`relative bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 shrink-0 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Botão de recolher/expandir */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-600 transition z-10 shadow-md"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo / Header */}
        <div className={`p-5 text-center border-b border-gray-200 dark:border-gray-700 transition-all ${collapsed ? "px-2" : ""}`}>
          <div className="flex flex-col items-center">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className={`${collapsed ? "w-10 h-10" : "w-14 h-14"} object-contain rounded-lg mb-2`}
              />
            ) : (
              <div className={`${collapsed ? "w-10 h-10" : "w-14 h-14"} bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-2`}>
                <Wrench className={`${collapsed ? "w-5 h-5" : "w-7 h-7"} text-white`} />
              </div>
            )}
            {!collapsed && (
              <>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-1">{nomeLoja}</h2>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Gestão de Pedidos e Consertos</p>
              </>
            )}
          </div>
        </div>

        {/* Menu de navegação */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    collapsed ? "justify-center" : "justify-start"
                  } ${
                    isActive 
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title={collapsed ? item.label : ""}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Botões inferiores */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              collapsed ? "justify-center" : "justify-start"
            } text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`}
            title={collapsed ? (theme === "light" ? "Tema Escuro" : "Tema Claro") : ""}
          >
            {theme === "light" ? <Moon className="w-4 h-4 shrink-0" /> : <Sun className="w-4 h-4 shrink-0" />}
            {!collapsed && <span>{theme === "light" ? "Tema Escuro" : "Tema Claro"}</span>}
          </button>
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              collapsed ? "justify-center" : "justify-start"
            } text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}
            title={collapsed ? "Sair" : ""}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}