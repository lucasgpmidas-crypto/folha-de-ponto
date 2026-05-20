import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRegistros, useFuncionarios, useConfig } from '../lib/hooks'
import { hoje, fmtData, fmtMin, calcMin, calcStatus, exportCSV } from '../lib/utils'

export default function Relatorios() {
  const [aba, setAba] = useState('diario')
  const [data, setData] = useState(hoje())
  const [mes, setMes] = useState(hoje().substring(0, 7))
  const [funcId, setFuncId] = useState('')
  const [periodo, setPeriodo] = useState('30')

  const { funcionarios } = useFuncionarios()
  const { config } = useConfig()
  const jornadaMin = parseInt(config.jornada_horas || '8') * 60
  const ini30 = format(subDays(new Date(), Number(periodo)), 'yyyy-MM-dd')

  const { registros: regsDia }   = useRegistros({ data })
  const { registros: regsMes }   = useRegistros({ dataInicio: mes + '-01', dataFim: mes + '-31' })
  const { registros: regsInd }   = useRegistros({ funcId: funcId || undefined, dataInicio: ini30, dataFim: hoje() })

  const f = funcionarios.find(x => x.id === Number(funcId))

  const exportarDia = () => exportCSV(
    [['Funcionário', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Horas', 'GPS'],
     ...regsDia.map(r => [r.funcionarios?.nome, r.entrada||'—', r.intervalo||'—', r.retorno||'—', r.saida||'—', fmtMin(calcMin(r)), r.gps_ok?'Sim':'Não'])],
    `ponto_diario_${data}.csv`
  )

  const exportarMes = () => exportCSV(
    [['Funcionário', 'Data', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Horas', 'Extras', 'Devidas', 'GPS'],
     ...regsMes.map(r => {
       const st = calcStatus(r, jornadaMin)
       return [r.funcionarios?.nome, fmtData(r.data), r.entrada||'—', r.intervalo||'—', r.retorno||'—', r.saida||'—', fmtMin(calcMin(r)),
         st && st.min > 0 ? fmtMin(st.min) : '—',
         st && st.min < 0 ? fmtMin(Math.abs(st.min)) : '—',
         r.gps_ok?'Sim':'Não']
     })],
    `ponto_mensal_${mes}.csv`
  )

  const exportarInd = () => {
    if (!f) return
    exportCSV(
      [['Data', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Horas', 'Extras', 'Devidas', 'GPS', 'Obs.'],
       ...regsInd.map(r => {
         const st = calcStatus(r, jornadaMin)
         return [fmtData(r.data), r.entrada||'—', r.intervalo||'—', r.retorno||'—', r.saida||'—', fmtMin(calcMin(r)),
           st && st.min > 0 ? fmtMin(st.min) : '—',
           st && st.min < 0 ? fmtMin(Math.abs(st.min)) : '—',
           r.gps_ok?'Sim':'Não', r.obs||'']
       })],
      `ponto_${f.nome.replace(/\s/g,'_')}_${periodo}d.csv`
    )
  }

  return (
    <div>
      <div className="tabs">
        {[['diario','Diário'],['mensal','Mensal'],['individual','Individual']].map(([id,l]) => (
          <button key={id} className={`tab ${aba===id?'active':''}`} onClick={() => setAba(id)}>{l}</button>
        ))}
      </div>

      {aba === 'diario' && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div className="fg" style={{ margin: 0, flex: 1 }}><label>Data</label><input type="date" value={data} max={hoje()} onChange={e => setData(e.target.value)} /></div>
              <button className="btn btn-secondary btn-sm btn-inline" style={{ width: 'auto', marginBottom: 14 }} onClick={() => setData(hoje())}>Hoje</button>
              <button className="btn btn-secondary btn-sm btn-inline" style={{ width: 'auto', marginBottom: 14 }} onClick={() => setData(format(subDays(new Date(),1),'yyyy-MM-dd'))}>Ontem</button>
              <button className="btn btn-secondary btn-sm btn-inline" style={{ width: 'auto', marginBottom: 14 }} onClick={exportarDia}>⬇ CSV</button>
            </div>
          </div>
          {regsDia.length === 0
            ? <div className="empty-state"><div className="es-icon">📭</div><div className="es-text">Sem registros nesta data</div></div>
            : <div className="card">
                <div className="card-title">
                  {format(new Date(data+'T12:00'),"EEEE, dd 'de' MMMM",{locale:ptBR})} — {regsDia.length} registro(s)
                </div>
                {regsDia.map(r => (
                  <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <strong>{r.funcionarios?.nome}</strong>
                      <span style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtMin(calcMin(r))}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text3)' }}>
                      {[['🟢',r.entrada],['🟡',r.intervalo],['🔵',r.retorno],['🔴',r.saida]].map(([ic,v],i) => v && <span key={i}>{ic} {v}</span>)}
                      {r.gps_ok && <span>📍</span>}
                      {r.selfie_entrada && <span>📷</span>}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {aba === 'mensal' && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div className="fg" style={{ margin: 0, flex: 1 }}><label>Mês</label><input type="month" value={mes} onChange={e => setMes(e.target.value)} /></div>
              <button className="btn btn-secondary btn-sm btn-inline" style={{ width: 'auto', marginBottom: 14 }} onClick={exportarMes}>⬇ CSV</button>
            </div>
          </div>
          {regsMes.length === 0
            ? <div className="empty-state"><div className="es-icon">📭</div><div className="es-text">Sem registros no mês</div></div>
            : <div className="card">
                <div className="card-title">{regsMes.length} registros</div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Funcionário</th><th>Data</th><th>Entrada</th><th>Saída</th><th>Horas</th><th>Extras</th><th>Devidas</th><th>GPS</th></tr></thead>
                    <tbody>
                      {regsMes.map(r => {
                        const st = calcStatus(r, jornadaMin)
                        return (
                          <tr key={r.id}>
                            <td><strong>{r.funcionarios?.nome}</strong></td>
                            <td>{fmtData(r.data)}</td>
                            <td>{r.entrada || '—'}</td>
                            <td>{r.saida || '—'}</td>
                            <td style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtMin(calcMin(r))}</td>
                            <td style={{ color: 'var(--blue)', fontWeight: 700 }}>{st && st.min > 0 ? '+' + fmtMin(st.min) : '—'}</td>
                            <td style={{ color: 'var(--red)', fontWeight: 700 }}>{st && st.min < 0 ? fmtMin(Math.abs(st.min)) : '—'}</td>
                            <td>{r.gps_ok ? '✅' : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
          }
        </div>
      )}

      {aba === 'individual' && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="fg" style={{ margin: 0, flex: 1 }}>
                <label>Funcionário</label>
                <select value={funcId} onChange={e => setFuncId(e.target.value)}>
                  <option value="">Selecionar...</option>
                  {funcionarios.filter(f => f.ativo).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div className="fg" style={{ margin: 0 }}>
                <label>Período</label>
                <select value={periodo} onChange={e => setPeriodo(e.target.value)}>
                  {[['7','7 dias'],['15','15 dias'],['30','30 dias'],['60','60 dias']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <button className="btn btn-secondary btn-sm btn-inline" style={{ width: 'auto', marginBottom: 14 }} onClick={exportarInd} disabled={!funcId}>⬇ CSV</button>
            </div>
          </div>
          {!funcId
            ? <div className="empty-state"><div className="es-icon">👤</div><div className="es-text">Selecione um funcionário</div></div>
            : regsInd.length === 0
              ? <div className="empty-state"><div className="es-icon">📭</div><div className="es-text">Sem registros no período</div></div>
              : <div className="card">
                  <div className="card-title">{f?.nome} — {regsInd.length} dias · {fmtMin(regsInd.reduce((s,r) => s+(calcMin(r)||0), 0))} total</div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <div style={{ flex: 1, background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Horas Extras</div>
                      <div style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 18 }}>
                        {(() => { const t = regsInd.reduce((s,r) => { const st = calcStatus(r,jornadaMin); return s+(st&&st.min>0?st.min:0) },0); return t>0?'+'+fmtMin(t):'—' })()}
                      </div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Horas Devidas</div>
                      <div style={{ fontWeight: 800, color: 'var(--red)', fontSize: 18 }}>
                        {(() => { const t = regsInd.reduce((s,r) => { const st = calcStatus(r,jornadaMin); return s+(st&&st.min<0?Math.abs(st.min):0) },0); return t>0?fmtMin(t):'—' })()}
                      </div>
                    </div>
                  </div>
                  {regsInd.map(r => {
                    const st = calcStatus(r, jornadaMin)
                    return (
                      <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
                            {format(new Date(r.data+'T12:00'),"EEE dd/MM",{locale:ptBR})}
                          </span>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtMin(calcMin(r))}</div>
                            {st && st.min > 0 && <div style={{ fontSize: 11, color: 'var(--blue)' }}>+{fmtMin(st.min)} extra</div>}
                            {st && st.min < 0 && <div style={{ fontSize: 11, color: 'var(--red)' }}>{fmtMin(Math.abs(st.min))} devida</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text3)' }}>
                          {[['🟢',r.entrada],['🟡',r.intervalo],['🔵',r.retorno],['🔴',r.saida]].map(([ic,v],i) => <span key={i}>{ic} {v||'—'}</span>)}
                        </div>
                      </div>
                    )
                  })}
                </div>
          }
        </div>
      )}
    </div>
  )
}
