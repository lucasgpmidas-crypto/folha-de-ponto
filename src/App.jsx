import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './lib/auth'
import Login from './pages/Login'
import AppShell from './components/AppShell'
import Ponto from './pages/Ponto'
import Historico from './pages/Historico'
import Gestor from './pages/Gestor'
import Funcionarios from './pages/Funcionarios'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'

function Protected({ children, adminOnly = false }) {
  const { isLogado, isAdmin, loading } = useAuth()
  if (loading) return <div className="loading"><div className="spin" /></div>
  if (!isLogado) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/ponto" replace />
  return children
}

function AppRoutes() {
  const { isLogado, isAdmin, loading } = useAuth()
  if (loading) return <div className="loading"><div className="spin" /></div>
  return (
    <Routes>
      <Route path="/login" element={isLogado ? <Navigate to={isAdmin ? '/gestor' : '/ponto'} replace /> : <Login />} />
      <Route path="/" element={<Protected><AppShell /></Protected>}>
        <Route index element={<Navigate to={isAdmin ? '/gestor' : '/ponto'} replace />} />
        <Route path="ponto"         element={<Protected><Ponto /></Protected>} />
        <Route path="historico"     element={<Protected><Historico /></Protected>} />
        <Route path="gestor"        element={<Protected adminOnly><Gestor /></Protected>} />
        <Route path="funcionarios"  element={<Protected adminOnly><Funcionarios /></Protected>} />
        <Route path="relatorios"    element={<Protected adminOnly><Relatorios /></Protected>} />
        <Route path="configuracoes" element={<Protected adminOnly><Configuracoes /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-center" toastOptions={{
          style: { background: '#1B2235', color: '#ECEEf5', border: '1px solid #364060', fontFamily: "'Barlow',sans-serif", fontSize: 13, borderRadius: 10 },
          success: { iconTheme: { primary: '#28B485', secondary: '#1B2235' } },
          error:   { iconTheme: { primary: '#E84040', secondary: '#1B2235' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  )
}
