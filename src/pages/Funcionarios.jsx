import { useState } from 'react'
import { useFuncionarios } from '../lib/hooks'
import { getIniciais, avatarCor } from '../lib/utils'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const FORM0 = { nome: '', usuario: '', cargo: '', tipo: 'funcionario', pin: '', ativo: true }

export default function Funcionarios() {
  const { funcionarios, loading, salvar, excluir } = useFuncionarios()
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(FORM0)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')
  const [confirmDel, setConfirmDel] = useState(null)

  const lista = funcionarios.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()))
  const ativos = funcionarios.filter(f => f.ativo).length

  const abrirNovo = () => { setEditId(null); setForm(FORM0); setModal(true) }
  const abrirEditar = (f) => {
    setEditId(f.id)
    setForm({ nome: f.nome, usuario: f.usuario, cargo: f.cargo || '', tipo: f.tipo, pin: '', ativo: f.ativo })
    setModal(true)
  }

  const handleSalvar = async () => {
    if (!form.nome.trim() || !form.usuario.trim()) { toast.error('Preencha nome e usuário'); return }
    if (!editId && !form.pin) { toast.error('Defina um PIN para o novo funcionário'); return }
    setSaving(true)
    const payload = { nome: form.nome.trim(), usuario: form.usuario.trim().toLowerCase(), cargo: form.cargo.trim(), tipo: form.tipo, ativo: form.ativo }
    if (form.pin) payload.pin = form.pin
    const ok = await salvar(payload, editId)
    if (ok) setModal(false)
    setSaving(false)
  }

  const handleExcluir = async () => {
    if (!confirmDel) return
    await excluir(confirmDel.id)
    setConfirmDel(null)
  }

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input placeholder="🔍 Buscar..." value={busca} onChange={e => setBusca(e.target.value)}
          style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
        <button className="btn btn-primary btn-inline" style={{ width: 'auto' }} onClick={abrirNovo}>+ Novo</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <span style={{ background: 'var(--bg3)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: 'var(--text3)' }}>
          Ativos: <strong style={{ color: 'var(--green)' }}>{ativos}</strong>
        </span>
        <span style={{ background: 'var(--bg3)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: 'var(--text3)' }}>
          Total: <strong>{funcionarios.length}</strong>
        </span>
      </div>

      {loading ? <div className="loading"><div className="spin" /></div>
        : lista.length === 0
          ? <div className="empty-state"><div className="es-icon">👥</div><div className="es-text">Nenhum funcionário encontrado</div></div>
          : lista.map(f => (
            <div key={f.id} className="card" style={{ padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: avatarCor(f.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#0D1018', flexShrink: 0 }}>
                  {getIniciais(f.nome)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{f.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>@{f.usuario} · {f.cargo || 'Funcionário'}</div>
                  <div style={{ marginTop: 5, display: 'flex', gap: 6 }}>
                    <span className={`badge ${f.ativo ? 'b-green' : 'b-red'}`}>{f.ativo ? 'Ativo' : 'Inativo'}</span>
                    <span className={`badge ${f.pin ? 'b-gold' : 'b-red'}`}>{f.pin ? '🔑 PIN OK' : 'Sem PIN'}</span>
                    <span className="badge b-blue">{f.tipo}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm btn-inline" style={{ width: 'auto' }} onClick={() => abrirEditar(f)}>✏️</button>
                  <button className="btn btn-danger btn-sm btn-inline" style={{ width: 'auto' }} onClick={() => setConfirmDel(f)}>🗑</button>
                </div>
              </div>
            </div>
          ))
      }

      {modal && (
        <Modal title={editId ? 'Editar Funcionário' : 'Novo Funcionário'} onClose={() => setModal(false)}>
          <div className="fgrid">
            <div className="fg"><label>Nome *</label><input value={form.nome} onChange={e => setF('nome', e.target.value)} placeholder="Nome completo" autoFocus /></div>
            <div className="fg"><label>Usuário *</label><input value={form.usuario} onChange={e => setF('usuario', e.target.value.toLowerCase())} placeholder="usuario" /></div>
            <div className="fg"><label>Cargo</label><input value={form.cargo} onChange={e => setF('cargo', e.target.value)} placeholder="Ex: Enrolador" /></div>
            <div className="fg"><label>Tipo</label>
              <select value={form.tipo} onChange={e => setF('tipo', e.target.value)}>
                <option value="funcionario">Funcionário</option>
                <option value="gestor">Gestor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="fg" style={{ background: 'rgba(201,162,39,.06)', border: '1px solid rgba(201,162,39,.2)', borderRadius: 'var(--rs)', padding: 12 }}>
            <label style={{ color: 'var(--gl)' }}>🔑 PIN de Acesso (4 dígitos)</label>
            <input type="password" maxLength={4} inputMode="numeric" value={form.pin} onChange={e => setF('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder={editId ? 'Deixe em branco para não alterar' : 'Ex: 1234'}
              style={{ letterSpacing: 8, fontSize: 20, textAlign: 'center', width: 140 }} />
          </div>
          <div className="fg">
            <label>Situação</label>
            <select value={form.ativo ? 'true' : 'false'} onChange={e => setF('ativo', e.target.value === 'true')}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleSalvar} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Excluir funcionário?" onClose={() => setConfirmDel(null)}>
          <div className="alert a-danger" style={{ marginBottom: 16 }}>
            <div><strong>{confirmDel.nome}</strong><span>Todos os registros de ponto serão excluídos permanentemente.</span></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger" onClick={handleExcluir}>Sim, excluir</button>
            <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
