import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { entrarAdmin, entrarFuncionario } = useAuth()
  const [modo, setModo] = useState('func')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [funcId, setFuncId] = useState('')
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [funcs, setFuncs] = useState([])
  const [erro, setErro] = useState('')
  const pinRefs = useRef([])

  useEffect(() => {
    supabase.from('funcionarios').select('id,nome,pin,ativo').eq('ativo', true).order('nome')
      .then(({ data }) => setFuncs(data || []))
  }, [])

  useEffect(() => {
    setPinDigits(['', '', '', ''])
    setErro('')
  }, [modo])

  const pin = pinDigits.join('')

  const handlePinChange = (index, value) => {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...pinDigits]
    next[index] = v
    setPinDigits(next)
    if (v && index < 3) pinRefs.current[index + 1]?.focus()
  }

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (pinDigits[index]) {
        const next = [...pinDigits]
        next[index] = ''
        setPinDigits(next)
      } else if (index > 0) {
        const next = [...pinDigits]
        next[index - 1] = ''
        setPinDigits(next)
        pinRefs.current[index - 1]?.focus()
      }
    }
  }

  const handlePinPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (!text.length) return
    e.preventDefault()
    const next = ['', '', '', '']
    for (let i = 0; i < text.length; i++) next[i] = text[i]
    setPinDigits(next)
    pinRefs.current[Math.min(text.length, 3)]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    if (modo === 'admin') {
      if (!email || !senha) { setErro('Preencha email e senha'); setLoading(false); return }
      const r = await entrarAdmin(email, senha)
      if (!r.ok) setErro(r.msg)
    } else {
      if (!funcId) { setErro('Selecione seu nome'); setLoading(false); return }
      if (pin.length < 4) { setErro('Digite o PIN de 4 dígitos'); setLoading(false); return }
      const r = await entrarFuncionario(Number(funcId), pin)
      if (!r.ok) setErro(r.msg)
    }
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">🕐</div>
        <div className="login-title">FOLHA DE PONTO</div>
        <div className="login-sub">Palheiros Midas</div>

        <div className="mode-btns">
          {[['func','👥 FUNCIONÁRIO'],['admin','🔐 GESTOR']].map(([m, label]) => (
            <button key={m} className="mode-btn" onClick={() => { setModo(m); setErro('') }} style={{
              border: `2px solid ${modo === m ? (m === 'func' ? 'var(--gold)' : 'var(--blue)') : 'var(--border2)'}`,
              background: modo === m ? (m === 'func' ? 'rgba(201,162,39,.15)' : 'rgba(59,130,246,.12)') : 'transparent',
              color: modo === m ? (m === 'func' ? 'var(--gold-light)' : 'var(--blue)') : 'var(--text2)',
            }}>{label}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {modo === 'admin' ? (
            <>
              <div className="fg" style={{ textAlign: 'left' }}>
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="gestor@email.com" autoFocus />
              </div>
              <div className="fg" style={{ textAlign: 'left' }}>
                <label>Senha</label>
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••" />
              </div>
            </>
          ) : (
            <>
              <div className="fg" style={{ textAlign: 'left' }}>
                <label>Seu nome</label>
                <select value={funcId} onChange={e => setFuncId(e.target.value)}>
                  <option value="">Selecionar...</option>
                  {funcs.map(f => <option key={f.id} value={f.id}>{f.nome}{!f.pin ? ' (sem PIN)' : ''}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>PIN (4 dígitos)</label>
                <div className="pin-digits">
                  {pinDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => pinRefs.current[i] = el}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handlePinChange(i, e.target.value)}
                      onKeyDown={e => handlePinKeyDown(i, e)}
                      onPaste={i === 0 ? handlePinPaste : undefined}
                      className={`pin-digit${d ? ' filled' : ''}`}
                      autoComplete="off"
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {erro && <div className="login-err">{erro}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'ENTRANDO...' : 'ENTRAR →'}
          </button>
        </form>

        <div className="login-hint">{modo === 'admin' ? 'Acesso gestor via email/senha' : 'PIN configurado pelo gestor'}</div>
      </div>
    </div>
  )
}
