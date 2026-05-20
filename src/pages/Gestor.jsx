import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRegistros, useFuncionarios, useConfig } from '../lib/hooks'
import { hoje, fmtMin, calcMin, calcStatus, fmtData, getIniciais, avatarCor } from '../lib/utils'
import Modal from '../components/Modal'

export default function Gestor() {
  const { funcionarios } = useFuncionarios()
  const { registros, loading, atualizar, excluir } = useRegistros({ data: hoje() })
  const [editando, setEditando] = useState(null)
  const [selectedSelfie, setSelectedSelfie] = useState(null)
  const [saving, setSaving] = useState(false)

  const { config } = useConfig()
  const jornadaMin = parseInt(config.jornada_horas || '8') * 60

  const ativos = funcionarios.filter(f => f.ativo)
  const comRegistro = registros.length
  const semRegistro = ativos.filter(f => !registros.find(r => r.func_id === f.id))
  const completos   = registros.filter(r => r.saida).length

  const handleEditar = (r) => setEditando({ ...r })
  const handleSalvar = async () => {
    if (!editando) return
    setSaving(true)
    await atualizar(editando.id, {
      entrada: editando.entrada || null, intervalo: editando.intervalo || null,
      retorno: editando.retorno || null, saida: editando.saida || null,
      obs: editando.obs || null,
    })
    setSaving(false)
    setEditando(null)
  }

  const dataHoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

  return (
    <div>
      <div style={{ marginBottom: 6, fontSize: 12, color: 'var(--text3)', textTransform: 'capitalize' }}>{dataHoje}</div>
      <div className="stat-grid">
        <div className="stat-card sc-gold"><div className="stat-label">Ativos</div><div className="stat-value sv-gold">{ativos.length}</div><div className="stat-sub">funcionários</div></div>
        <div className="stat-card sc-green"><div className="stat-label">Registraram</div><div className="stat-value sv-green">{comRegistro}</div><div className="stat-sub">hoje</div></div>
        <div className="stat-card sc-blue"><div className="stat-label">Completos</div><div className="stat-value sv-blue">{completos}</div><div className="stat-sub">saíram</div></div>
        <div className="stat-card sc-red"><div className="stat-label">Sem Registro</div><div className="stat-value sv-red">{semRegistro.length}</div><div className="stat-sub">hoje</div></div>
      </div>

      {semRegistro.length > 0 && (
        <div className="card">
          <div className="card-title">⚠️ Sem Registro Hoje</div>
          {semRegistro.map(f => (
            <div key={f.id} className="alert a-warn">
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarCor(f.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0D1018', flexShrink: 0 }}>
                {getIniciais(f.nome)}
              </div>
              <div><strong>{f.nome}</strong><span>{f.cargo || 'Funcionário'}</span></div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title">📋 Registros de Hoje</div>
        {loading ? <div className="loading"><div className="spin" /></div>
          : registros.length === 0
            ? <div className="empty-state"><div className="es-icon">📭</div><div className="es-text">Nenhum registro hoje</div></div>
            : registros.map(r => {
                const min = calcMin(r)
                const status = min !== null ? calcStatus(r, jornadaMin) : null
                return (
                  <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: avatarCor(r.func_id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#0D1018', flexShrink: 0 }}>
                        {getIniciais(r.funcionarios?.nome || '')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{r.funcionarios?.nome}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {r.gps_ok && <span style={{ marginRight: 6 }}>📍</span>}
                          {r.selfie_entrada && <span style={{ marginRight: 6 }}>📷</span>}
                          {r.editado && <span style={{ color: 'var(--amber)', marginRight: 6 }}>✏️</span>}
                          {r.obs && <span style={{ color: 'var(--text3)' }}>{r.obs}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {min !== null && <div style={{ fontFamily: 'Barlow Condensed,sans-serif', fontSize: 20, fontWeight: 800, color: status?.cor }}>{fmtMin(min)}</div>}
                        {status && <div style={{ fontSize: 10, color: status.cor }}>{status.label}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 5, marginBottom: 8 }}>
                      {[['Entrada','entrada','🟢'],['Intervalo','intervalo','🟡'],['Retorno','retorno','🔵'],['Saída','saida','🔴']].map(([l, k, ic]) => (
                        <div key={k} style={{ background: 'var(--bg3)', borderRadius: 7, padding: '6px', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 2 }}>{ic}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: r[k] ? 'var(--text)' : 'var(--text3)' }}>{r[k] || '—'}</div>
                          {r[`selfie_${k}`] && (
                            <button onClick={() => setSelectedSelfie(r[`selfie_${k}`])} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 10, marginTop: 2 }}>📷 ver</button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-secondary btn-sm btn-inline" style={{ width: 'auto' }} onClick={() => handleEditar(r)}>✏️ Editar</button>
                  </div>
                )
              })
        }
      </div>

      {editando && (
        <Modal title="Editar Ponto" onClose={() => setEditando(null)}>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
            {editando.funcionarios?.nome} — {fmtData(editando.data)}
          </div>
          <div className="fgrid">
            {[['Entrada','entrada'],['Intervalo','intervalo'],['Retorno','retorno'],['Saída','saida']].map(([l,k]) => (
              <div className="fg" key={k}>
                <label>{l}</label>
                <input type="time" value={editando[k] || ''} onChange={e => setEditando(v => ({ ...v, [k]: e.target.value || null }))} />
              </div>
            ))}
          </div>
          <div className="fg"><label>Observação</label><input value={editando.obs || ''} onChange={e => setEditando(v => ({ ...v, obs: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleSalvar} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            <button className="btn btn-secondary" onClick={() => setEditando(null)}>Cancelar</button>
          </div>
        </Modal>
      )}

      {selectedSelfie && (
        <div className="modal-overlay" onClick={() => setSelectedSelfie(null)}>
          <div style={{ padding: 20, maxWidth: 480, width: '100%' }}>
            <img src={selectedSelfie} alt="selfie" style={{ width: '100%', borderRadius: 12, display: 'block' }} />
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => setSelectedSelfie(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}
