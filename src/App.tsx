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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem("user")
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROTAS PÚBLICAS (sem login) */}
        <Route path="/login" element={<Login />} />
        <Route path="/assinatura/sucesso" element={<SucessoAssinatura />} />
        
        {/* ROTAS PRIVADAS (com login) */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard key="dashboard" />} />
          <Route path="/pedidos" element={<Pedidos key="pedidos" />} />
          <Route path="/consertos" element={<Consertos key="consertos" />} />
          <Route path="/filtros" element={<Filtros key="filtros" />} />
          <Route path="/novo" element={<NovoPedido key="novo" />} />
          <Route path="/relatorios" element={<Relatorios key="relatorios" />} />
          <Route path="/usuarios" element={<Usuarios key="usuarios" />} />
          <Route path="/assinatura" element={<Assinatura key="assinatura" />} />
          <Route path="/ajustes" element={<Ajustes key="ajustes" />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App