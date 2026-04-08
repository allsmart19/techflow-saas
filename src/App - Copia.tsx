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
import Layout from "./components/Layout"
import Consertos from "./pages/Consertos"

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem("user")
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/filtros" element={<Filtros />} />
          <Route path="/novo" element={<NovoPedido />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/consertos" element={<Consertos />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/assinatura" element={<Assinatura />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App