import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '../lib/auth'
import { useRegistros, useConfig } from '../lib/hooks'
import { fmtData, fmtMin, calcMin, calcStatus, hoje, exportCSV } from '../lib/utils'

export default function Historico() {
  const { funcSession } = useAuth()
  const funcId = funcSession?.id
  const [periodo, setPeriodo] = useState('30')
  const ini = format(subDays(new Date(), Number(periodo)), 'yyyy-MM-dd')
  const { registros, loading } = useRegistros({ funcId, dataInicio: ini, dataFim: hoje() })
  const { config } = useConfig()
  const jornadaMin = parseInt(config.jornada_horas || '8') * 60

  const totalDias     = registros.length
  const totalMin      = registros.reduce((s, r) => s + (calcMin(r) || 0), 0)
  const diasCompletos = registros.filter(r => r.entrada && r.saida).length
  const totalExtras   = registros.reduce((s, r) => { const st = calcStatus(r, jornadaMin); return s + (st && st.min > 0 ? st.min : 0) }, 0)
  const totalDevidas  = registros.reduce((s, r) => { const st = calcStatus(r, jornadaMin); return s + (st && st.min < 0 ? Math.abs(st.min) : 0) }, 0)

  const handleExportar = () => {
    exportCSV(
      [['Data', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Horas', 'Extras', 'Devidas', 'GPS', 'Obs.'],
       ...registros.map(r => {
         const st = calcStatus(r, jornadaMin)
         return [
           fmtData(r.data),
           r.entrada || '—', r.intervalo || '—', r.retorno || '—', r.saida || '—',
           fmtMin(calcMin(r)),
           st && st.min > 0 ? fmtMin(st.min) : '—',
           st && st.min < 0 ? fmtMin(Math.abs(st.min)) : '—',
           r.gps_ok ? 'Sim' : 'Não', r.obs || ''
         ]
       })],
      `ponto_${funcSession?.nome?.replace(/\s/g, '_')}_${periodo}d.csv`
    )
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="fg" style={{ margin: 0, flex: 1 }}>
            <label>Período</label>
            <select value={periodo} onChange={e => setPeriodo(e.target.value)}>
              {[['7','7 dias'],['15','15 dias'],['30','30 dias'],['60','60 dias']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary btn-sm btn-inline" style={{ width: 'auto', marginBottom: 14 }} onClick={handleExportar}>⬇ CSV</button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card sc-gold"><div className="stat-label">Dias Registrados</div><div className="stat-value sv-gold">{totalDias}</div></div>
        <div className="stat-card sc-green"><div className="stat-label">Total de Horas</div><div className="stat-value sv-green" style={{ fontSize: 20 }}>{fmtMin(totalMin)}</div></div>
        <div className="stat-card sc-blue"><div className="stat-label">Dias Completos</div><div className="stat-value sv-blue">{diasCompletos}</div></div>
        <div className="stat-card sc-amber"><div className="stat-label">Média/Dia</div><div className="stat-value sv-amber" style={{ fontSize: 20 }}>{diasCompletos > 0 ? fmtMin(Math.round(totalMin / diasCompletos)) : '—'}</div></div>
        <div className="stat-card sc-blue"><div className="stat-label">Horas Extras</div><div className="stat-value sv-blue" style={{ fontSize: 20 }}>{totalExtras > 0 ? '+' + fmtMin(totalExtras) : '—'}</div></div>
        <div className="stat-card" style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}><div className="stat-label">Horas Devidas</div><div className="stat-value" style={{ color: 'var(--red)', fontSize: 20 }}>{totalDevidas > 0 ? fmtMin(totalDevidas) : '—'}</div></div>
      </div>

      <div className="card">
        <div className="card-title">📋 Registros</div>
        {loading ? <div className="loading"><div className="spin" /></div>
          : registros.length === 0
            ? <div className="empty-state"><div className="es-icon">📭</div><div className="es-text">Sem registros no período</div></div>
            : registros.map(r => {
                const min = calcMin(r)
                const status = min !== null ? calcStatus(r, jornadaMin) : null
                return (
                  <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, textTransform: 'capitalize' }}>
                          {format(new Date(r.data + 'T12:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                          {r.gps_ok && <span style={{ marginRight: 6 }}>📍 GPS</span>}
                          {r.selfie_entrada && <span style={{ marginRight: 6 }}>📷 Selfie</span>}
                          {r.editado && <span style={{ color: 'var(--amber)' }}>✏️ Editado</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {min !== null && <div style={{ fontFamily: 'Barlow Condensed,sans-serif', fontSize: 20, fontWeight: 800, color: status?.cor || 'var(--text)' }}>{fmtMin(min)}</div>}
                        {status && status.min === 0 && <div style={{ fontSize: 11, color: status.cor }}>Exato</div>}
                        {status && status.min > 0 && <div style={{ fontSize: 11, color: status.cor }}>+{fmtMin(status.min)} extra</div>}
                        {status && status.min < 0 && <div style={{ fontSize: 11, color: status.cor }}>{fmtMin(Math.abs(status.min))} devida</div>}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                      {[['Entrada', r.entrada, '🟢'], ['Intervalo', r.intervalo, '🟡'], ['Retorno', r.retorno, '🔵'], ['Saída', r.saida, '🔴']].map(([l, v, ic]) => (
                        <div key={l} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 2 }}>{ic} {l}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: v ? 'var(--text)' : 'var(--text3)' }}>{v || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
        }
      </div>
    </div>
  )
}
