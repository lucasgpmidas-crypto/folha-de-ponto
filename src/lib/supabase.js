import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url || '', key || '')

// ── Auth ──────────────────────────────────────────────────────
export async function loginAdmin(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error) return { ok: false, msg: 'Email ou senha inválidos' }
  return { ok: true, user: data.user }
}

export async function loginFuncionario(funcId, pin) {
  const { data, error } = await supabase
    .from('funcionarios').select('id,nome,usuario,cargo,tipo,pin,ativo').eq('id', funcId).single()
  if (error || !data) return { ok: false, msg: 'Funcionário não encontrado' }
  if (!data.ativo)    return { ok: false, msg: 'Funcionário inativo' }
  if (!data.pin)      return { ok: false, msg: 'PIN não configurado. Fale com o administrador.' }
  if (String(data.pin) !== String(pin)) return { ok: false, msg: 'PIN incorreto' }
  return { ok: true, funcionario: data }
}

export async function logoutAdmin() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ── Config ────────────────────────────────────────────────────
export async function getConfig() {
  const { data } = await supabase.from('configuracoes').select('chave,valor')
  if (!data) return {}
  return Object.fromEntries(data.map(r => [r.chave, r.valor]))
}

export async function setConfigKey(chave, valor) {
  await supabase.from('configuracoes')
    .upsert({ chave, valor: String(valor) }, { onConflict: 'chave' })
}
