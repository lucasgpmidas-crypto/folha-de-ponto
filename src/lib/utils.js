import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const pad   = n => String(n).padStart(2, '0')
export const hoje  = () => new Date().toISOString().slice(0, 10)
export const agora = () => { const n = new Date(); return `${pad(n.getHours())}:${pad(n.getMinutes())}` }

export const fmtData = (d) => {
  if (!d) return '—'
  return format(typeof d === 'string' ? parseISO(d) : d, 'dd/MM/yyyy', { locale: ptBR })
}

export const fmtDataLonga = (d) => {
  if (!d) return '—'
  return format(typeof d === 'string' ? parseISO(d + 'T12:00') : d, "EEEE, dd 'de' MMMM", { locale: ptBR })
}

export const toMin = (t) => {
  if (!t || !t.includes(':')) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export const calcMin = (r) => {
  if (!r || !r.entrada || !r.saida) return null
  let t = toMin(r.saida) - toMin(r.entrada)
  if (r.intervalo && r.retorno) {
    const iv = toMin(r.retorno) - toMin(r.intervalo)
    if (iv > 0) t -= iv
  }
  return t < 0 ? null : t
}

export const fmtMin = (m) => {
  if (m === null || m === undefined) return '—'
  return `${Math.floor(m / 60)}h${pad(m % 60)}`
}

export const calcStatus = (r, jornadaMin = 480) => {
  const m = calcMin(r)
  if (m === null) return null
  const diff = m - jornadaMin
  if (Math.abs(diff) < 5) return { label: 'Exato', cor: 'var(--green)', min: 0 }
  if (diff > 0) return { label: '+' + fmtMin(diff), cor: 'var(--blue)', min: diff }
  return { label: fmtMin(-diff), cor: 'var(--red)', min: diff }
}

export const gpsDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export const getIniciais = (nome = '') =>
  nome.split(' ').slice(0, 2).map(x => x[0] || '').join('').toUpperCase()

const CORES = ['#C9A227', '#3B82F6', '#28B485', '#8B5CF6', '#F59E0B', '#06B6D4']
export const avatarCor = (id) => CORES[(id || 0) % CORES.length]

export const exportCSV = (rows, filename) => {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export const PUNCH_LABELS = { entrada: 'Entrada', intervalo: 'Intervalo', retorno: 'Retorno', saida: 'Saída' }
export const PUNCH_ICONS  = { entrada: '🟢', intervalo: '🟡', retorno: '🔵', saida: '🔴' }
export const PUNCH_ORDER  = ['entrada', 'intervalo', 'retorno', 'saida']
