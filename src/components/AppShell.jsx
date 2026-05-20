import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getIniciais, avatarCor } from '../lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const ADMIN_NAV = [
  { to: '/gestor',        icon: '📊', label: 'Painel' },
  { to: '/funcionarios',  icon: '👥', label: 'Equipe' },
  { to: '/relatorios',    icon: '📄', label: 'Relatórios' },
  { to: '/configuracoes', icon: '⚙️', label: 'Config' },
]

const FUNC_NAV = [
  { to: '/ponto',     icon: '🕐', label: 'Meu Ponto' },
  { to: '/historico', icon: '📋', label: 'Histórico' },
]

export default function AppShell() {
  const { isAdmin, isFuncionario, funcSession, session, sair } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const nav = isAdmin ? ADMIN_NAV : FUNC_NAV

  const userName = isAdmin
    ? (session?.user?.email?.split('@')[0] || 'Admin')
    : (funcSession?.nome?.split(' ')[0] || 'Funcionário')

  const userRole = isAdmin ? 'Administrador' : (funcSession?.cargo || 'Funcionário')
  const avatarText = isAdmin ? 'AD' : getIniciais(funcSession?.nome || '')
  const avatarBg = isAdmin ? 'linear-gradient(135deg,#7A5C10,#F0C040)' : avatarCor(funcSession?.id || 0)

  const hora = format(new Date(), "HH:mm · EEE dd/MM", { locale: ptBR })

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-logo">
          <span>🕐</span> MIDAS
        </div>
        <div className="topbar-user">
          <div style={{ textAlign: 'right' }}>
            <div className="topbar-name">{userName}</div>
            <div className="topbar-role">{userRole}</div>
          </div>
          <div className="topbar-avatar" style={{ background: avatarBg }}>{avatarText}</div>
          <button onClick={sair} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18, padding: 4 }} title="Sair">⏏</button>
        </div>
      </header>

      <div className="page">
        <Outlet />
      </div>

      <nav className="bottom-nav">
        {nav.map(item => (
          <button key={item.to} className={`bn-item ${location.pathname === item.to ? 'active' : ''}`} onClick={() => navigate(item.to)}>
            <span className="bn-icon">{item.icon}</span>
            <span className="bn-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
