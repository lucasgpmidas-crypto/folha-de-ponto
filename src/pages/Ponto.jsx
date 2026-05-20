import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/auth'
import { useRegistros, useConfig } from '../lib/hooks'
import { hoje, agora, fmtDataLonga, calcMin, fmtMin, gpsDistance, PUNCH_LABELS, PUNCH_ICONS, PUNCH_ORDER } from '../lib/utils'

export default function Ponto() {
  const { funcSession } = useAuth()
  const funcId = funcSession?.id
  const { registros, loading, registrarPonto } = useRegistros({ funcId, data: hoje() })
  const { config } = useConfig()

  const [clock, setClock] = useState(agora())
  const [locState, setLocState] = useState({ gpsOk: false, wifiOk: false, lat: null, lng: null, checking: true, msg: 'Verificando localização...' })
  const [step, setStep] = useState('idle') // idle | camera | confirm
  const [pendingPunch, setPendingPunch] = useState(null)
  const [capturedSelfie, setCapturedSelfie] = useState(null)
  const [saving, setSaving] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)

  const rec = registros.find(r => r.func_id === funcId && r.data === hoje())
  const jornadaMin = parseInt(config.jornada_horas || '8') * 60
  const gpsObrigatorio = config.gps_obrigatorio === 'true'
  const selfieObrigatoria = config.selfie_obrigatoria === 'true'

  useEffect(() => {
    const t = setInterval(() => setClock(agora()), 10000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    checkLocation()
  }, [config])

  const checkLocation = () => {
    setLocState(s => ({ ...s, checking: true, msg: 'Verificando localização...' }))
    if (!navigator.geolocation) {
      setLocState({ gpsOk: false, wifiOk: false, lat: null, lng: null, checking: false, msg: 'GPS não disponível' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const cfgLat = parseFloat(config.gps_lat)
        const cfgLng = parseFloat(config.gps_lng)
        const raio = parseInt(config.gps_raio || '200')
        let gpsOk = true
        let msg = 'Localização OK'
        if (cfgLat && cfgLng) {
          const dist = gpsDistance(lat, lng, cfgLat, cfgLng)
          gpsOk = dist <= raio
          msg = gpsOk ? `📍 ${Math.round(dist)}m da empresa` : `⚠️ Fora do raio (${Math.round(dist)}m)`
        }
        setLocState({ gpsOk, wifiOk: false, lat, lng, checking: false, msg })
      },
      () => setLocState({ gpsOk: false, wifiOk: false, lat: null, lng: null, checking: false, msg: '⚠️ GPS não autorizado' })
    )
  }

  const nextPunch = () => {
    if (!rec) return 'entrada'
    for (const p of PUNCH_ORDER) { if (!rec[p]) return p }
    return null
  }
  const next = nextPunch()

  const handlePunchBtn = () => {
    if (!next) return
    if (gpsObrigatorio && !locState.gpsOk && config.gps_lat) {
      alert('GPS necessário. Você precisa estar na localização correta.')
      return
    }
    setPendingPunch(next)
    if (selfieObrigatoria) {
      startCamera()
      setStep('camera')
    } else {
      setStep('confirm')
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setCapturedSelfie(null)
      setStep('confirm')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
  }

  const takeSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return
    const v = videoRef.current
    const c = canvasRef.current
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    const dataUrl = c.toDataURL('image/jpeg', 0.6)
    setCapturedSelfie(dataUrl)
    stopCamera()
    setStep('confirm')
  }

  const cancelFlow = () => {
    stopCamera()
    setCapturedSelfie(null)
    setPendingPunch(null)
    setStep('idle')
  }

  const confirmarPonto = async () => {
    if (!pendingPunch) return
    setSaving(true)
    await registrarPonto(funcId, pendingPunch, {
      selfie: capturedSelfie,
      lat: locState.lat,
      lng: locState.lng,
      gpsOk: locState.gpsOk,
      wifiOk: locState.wifiOk,
    })
    setSaving(false)
    cancelFlow()
  }

  const horasTrabalhadas = rec ? fmtMin(calcMin(rec)) : null
  const completo = rec && rec.saida

  return (
    <div>
      <div className="ponto-card">
        <div className="ponto-clock">{clock}</div>
        <div className="ponto-date">{fmtDataLonga(hoje())}</div>

        <div className="loc-bar">
          <div className={`loc-dot ${locState.checking ? 'checking' : locState.gpsOk ? 'ok' : 'fail'}`} />
          <span style={{ color: 'var(--text2)', fontSize: 12 }}>{locState.msg}</span>
          <button onClick={checkLocation} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 13 }}>↺</button>
        </div>

        <div className="ponto-slots">
          {PUNCH_ORDER.map(p => (
            <div key={p} className={`ponto-slot ${rec?.[p] ? 'done' : p === next ? 'active' : ''}`}>
              <div className="slot-label">{PUNCH_ICONS[p]} {PUNCH_LABELS[p]}</div>
              <div className={`slot-time ${rec?.[p] ? 'done' : 'pending'}`}>{rec?.[p] || '-- : --'}</div>
            </div>
          ))}
        </div>

        {horasTrabalhadas && (
          <div style={{ background: 'var(--bg5)', borderRadius: 'var(--rs)', padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
            <span style={{ color: 'var(--text3)' }}>Horas trabalhadas: </span>
            <strong style={{ color: completo ? 'var(--green)' : 'var(--amber)' }}>{horasTrabalhadas}</strong>
            {completo && <span style={{ color: 'var(--text3)', marginLeft: 8 }}>/ {Math.floor(jornadaMin / 60)}h jornada</span>}
          </div>
        )}

        {next ? (
          <button className={`punch-btn ${next}`} onClick={handlePunchBtn} disabled={saving}>
            {PUNCH_ICONS[next]} REGISTRAR {PUNCH_LABELS[next].toUpperCase()}
          </button>
        ) : (
          <div style={{ background: 'rgba(40,180,133,.08)', border: '1px solid rgba(40,180,133,.2)', borderRadius: 10, padding: 12, textAlign: 'center', color: 'var(--green)', fontSize: 14, fontWeight: 700 }}>
            ✅ Ponto completo para hoje!
          </div>
        )}
      </div>

      {step === 'camera' && (
        <div className="camera-overlay">
          <video ref={videoRef} autoPlay playsInline className="camera-video" />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="camera-controls">
            <button className="btn btn-danger btn-inline" onClick={cancelFlow} style={{ width: 'auto', flex: 1 }}>✕ Cancelar</button>
            <button className="btn btn-primary btn-inline" onClick={takeSelfie} style={{ width: 'auto', flex: 2 }}>📷 Tirar Foto</button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">Confirmar {PUNCH_LABELS[pendingPunch]}?</div>
            {capturedSelfie && <img src={capturedSelfie} alt="selfie" className="camera-selfie-preview" style={{ marginBottom: 14 }} />}
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--rs)', padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>Tipo</span>
                <strong>{PUNCH_LABELS[pendingPunch]}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>Horário</span>
                <strong>{agora()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>GPS</span>
                <span style={{ color: locState.gpsOk ? 'var(--green)' : 'var(--text3)' }}>{locState.gpsOk ? '✓ OK' : '—'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={cancelFlow}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={confirmarPonto} disabled={saving}>
                {saving ? 'Registrando...' : `✓ Confirmar ${PUNCH_LABELS[pendingPunch]}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
