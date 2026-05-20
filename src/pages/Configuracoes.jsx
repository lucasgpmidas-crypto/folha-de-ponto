import { useState } from 'react'
import { useConfig } from '../lib/hooks'

export default function Configuracoes() {
  const { config, salvarConfig } = useConfig()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const c = form || config
  const setF = (k, v) => setForm(prev => ({ ...(prev || config), [k]: v }))

  const handleSalvar = async () => {
    setSaving(true)
    await salvarConfig(form || config)
    setForm(null)
    setSaving(false)
  }

  const getLocation = () => {
    if (!navigator.geolocation) { alert('GPS não disponível'); return }
    navigator.geolocation.getCurrentPosition(pos => {
      setF('gps_lat', String(pos.coords.latitude.toFixed(7)))
      setF('gps_lng', String(pos.coords.longitude.toFixed(7)))
    }, () => alert('Não foi possível obter a localização'))
  }

  return (
    <div>
      <div className="card mb16">
        <div className="card-title">⚙️ Configurações do Sistema</div>

        <div className="fg">
          <label>Jornada Diária (horas)</label>
          <input type="number" min="1" max="12" value={c.jornada_horas || '8'} onChange={e => setF('jornada_horas', e.target.value)} style={{ width: 100 }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 600 }}>Obrigatoriedades</div>
          {[
            ['gps_obrigatorio', '📍 GPS obrigatório para registrar ponto'],
            ['selfie_obrigatoria', '📷 Selfie obrigatória para registrar ponto'],
            ['wifi_verificar', '📶 Verificar rede WiFi'],
          ].map(([k, l]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13 }}>{l}</span>
              <button onClick={() => setF(k, c[k] === 'true' ? 'false' : 'true')} style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all .2s',
                background: c[k] === 'true' ? 'var(--green)' : 'var(--bg5)', position: 'relative'
              }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, transition: 'left .2s', left: c[k] === 'true' ? 23 : 3 }} />
              </button>
            </div>
          ))}
        </div>

        {c.wifi_verificar === 'true' && (
          <div className="fg">
            <label>SSID da Rede WiFi</label>
            <input value={c.wifi_ssid || ''} onChange={e => setF('wifi_ssid', e.target.value)} placeholder="Nome da rede WiFi da empresa" />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 600 }}>Localização da Empresa</div>
          <div className="fgrid">
            <div className="fg"><label>Latitude</label><input value={c.gps_lat || ''} onChange={e => setF('gps_lat', e.target.value)} placeholder="-21.123456" /></div>
            <div className="fg"><label>Longitude</label><input value={c.gps_lng || ''} onChange={e => setF('gps_lng', e.target.value)} placeholder="-47.123456" /></div>
          </div>
          <div className="fg"><label>Raio permitido (metros)</label><input type="number" value={c.gps_raio || '200'} onChange={e => setF('gps_raio', e.target.value)} style={{ width: 100 }} /></div>
          <button className="btn btn-secondary btn-inline" style={{ width: 'auto' }} onClick={getLocation}>📍 Usar minha localização atual</button>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>Deixe em branco para não restringir por localização.</div>
        </div>

        <button className="btn btn-primary" onClick={handleSalvar} disabled={saving || !form}>
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      <div className="card">
        <div className="card-title">ℹ️ Sobre</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
          {[['Sistema','Folha de Ponto Midas v1.0'],['Banco','Supabase (PostgreSQL)'],['Hospedagem','Vercel (gratuito)'],['Acesso','Qualquer navegador']].map(([k,v]) => (
            <div key={k} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>{k}</div>
              <div style={{ fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
