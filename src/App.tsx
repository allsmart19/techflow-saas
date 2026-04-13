import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Pedidos from "./pages/Pedidos"
import NovoPedido from "./pages/NovoPedido"
import Filtros from "./pages/Filtros"
import Relatorios from "./pages/Relatorios"
import Usuarios from "./pages/Usuarios"
import Assinatura from "./pages/Assinatura"
import Ajustes from "./pages/Ajustes"
import Consertos from "./pages/Consertos"
import Layout from "./components/Layout"
import SucessoAssinatura from "./pages/SucessoAssinatura"
import AuthCallback from "./pages/AuthCallback"
import { hasPermissao } from "./services/permissaoService"
import { useState, useEffect } from "react"

// Componente para rotas protegidas por permissão
function ProtectedRoute({ children, permissao }: { children: React.ReactNode; permissao: string }) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const userStr = sessionStorage.getItem("user")
  const user = userStr ? JSON.parse(userStr) : null

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setHasAccess(false)
        return
      }
      // Master e admin_loja têm acesso a tudo
      if (user.role === 'master' || user.role === 'admin_loja') {
        setHasAccess(true)
        return
      }
      const access = await hasPermissao(user.id, permissao as any)
      setHasAccess(access)
    }
    checkAccess()
  }, [])

  if (hasAccess === null) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>
  }
  if (!hasAccess) {
    return <Navigate to="/dashboard" />
  }
  return children
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = sessionStorage.getItem("user")
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROTAS PÚBLICAS (sem login) */}
        <Route path="/login" element={<Login />} />
        <Route path="/assinatura/sucesso" element={<SucessoAssinatura />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* ROTAS PRIVADAS (com login) */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard key="dashboard" />} />
          <Route path="/pedidos" element={
            <ProtectedRoute permissao="pedidos">
              <Pedidos key="pedidos" />
            </ProtectedRoute>
          } />
          <Route path="/consertos" element={
            <ProtectedRoute permissao="consertos">
              <Consertos key="consertos" />
            </ProtectedRoute>
          } />
          <Route path="/filtros" element={
            <ProtectedRoute permissao="filtros">
              <Filtros key="filtros" />
            </ProtectedRoute>
          } />
          <Route path="/novo" element={
            <ProtectedRoute permissao="novo_pedido">
              <NovoPedido key="novo" />
            </ProtectedRoute>
          } />
          <Route path="/relatorios" element={
            <ProtectedRoute permissao="relatorios">
              <Relatorios key="relatorios" />
            </ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <ProtectedRoute permissao="usuarios">
              <Usuarios key="usuarios" />
            </ProtectedRoute>
          } />
          <Route path="/assinatura" element={
            <ProtectedRoute permissao="assinatura">
              <Assinatura key="assinatura" />
            </ProtectedRoute>
          } />
          <Route path="/ajustes" element={
            <ProtectedRoute permissao="ajustes">
              <Ajustes key="ajustes" />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
