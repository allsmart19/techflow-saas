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
  Moon
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { getConfigLoja } from "../services/configService"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Package, label: "Pedidos", path: "/pedidos" },
  { icon: Plus, label: "Novo Pedido", path: "/novo" },
  { icon: Filter, label: "Filtros Avançados", path: "/filtros" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
  { icon: Wrench, label: "Consertos", path: "/consertos" }, 
  { icon: CreditCard, label: "Assinatura", path: "/assinatura" },
  { icon: Settings, label: "Ajustes", path: "/ajustes" },
]

// Menu de administrador (com Usuários)
const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Package, label: "Pedidos", path: "/pedidos" },
  { icon: Plus, label: "Novo Pedido", path: "/novo" },
  { icon: Filter, label: "Filtros Avançados", path: "/filtros" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
  { icon: Wrench, label: "Consertos", path: "/consertos" }, 
  { icon: Users, label: "Usuários", path: "/usuarios" },
  { icon: CreditCard, label: "Assinatura", path: "/assinatura" },
  { icon: Settings, label: "Ajustes", path: "/ajustes" },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [nomeLoja, setNomeLoja] = useState("TechFlow")
  const [userRole, setUserRole] = useState<string>("")

  // Carregar configurações do Supabase e role do usuário
  useEffect(() => {
    carregarConfiguracoes()
    carregarUserRole()
  }, [])

  async function carregarConfiguracoes() {
    const config = await getConfigLoja()
    if (config) {
      setNomeLoja(config.nome_loja)
      setLogoUrl(config.logo_url)
    }
  }

  function carregarUserRole() {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setUserRole(user.role || "user")
    }
  }

  // Escutar mudanças na configuração (quando salvar em outra aba)
  useEffect(() => {
    const handleStorageChange = () => {
      carregarConfiguracoes()
      carregarUserRole()
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    navigate("/login")
  }

  // Definir quais itens do menu mostrar baseado no role
  const currentMenuItems = userRole === "admin" ? adminMenuItems : menuItems

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
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Controle de Pedidos</p>
              </>
            )}
          </div>
        </div>

        {/* Menu de navegação */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-3">
            {currentMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
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