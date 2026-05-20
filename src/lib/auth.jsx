import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, loginAdmin, loginFuncionario, logoutAdmin, getSession } from './supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]       = useState(null)
  const [funcSession, setFuncSession] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    getSession().then(s => { setSession(s); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    const saved = sessionStorage.getItem('fp_func')
    if (saved) { try { setFuncSession(JSON.parse(saved)) } catch {} }
    return () => subscription.unsubscribe()
  }, [])

  const entrarAdmin = async (email, senha) => {
    const r = await loginAdmin(email, senha)
    if (r.ok) { setFuncSession(null); sessionStorage.removeItem('fp_func') }
    return r
  }

  const entrarFuncionario = async (funcId, pin) => {
    const r = await loginFuncionario(funcId, pin)
    if (r.ok) { setFuncSession(r.funcionario); sessionStorage.setItem('fp_func', JSON.stringify(r.funcionario)) }
    return r
  }

  const sair = async () => {
    await logoutAdmin()
    setFuncSession(null)
    setSession(null)
    sessionStorage.removeItem('fp_func')
  }

  const isAdmin      = !!session
  const isFuncionario = !session && !!funcSession
  const isLogado     = isAdmin || isFuncionario

  return (
    <AuthCtx.Provider value={{ session, funcSession, loading, isAdmin, isFuncionario, isLogado, entrarAdmin, entrarFuncionario, sair }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
