import { useState, useEffect, useCallback } from 'react'
import { supabase, getConfig, setConfigKey } from './supabase'
import { calcMin } from './utils'
import toast from 'react-hot-toast'

// ── Funcionários ──────────────────────────────────────────────
export function useFuncionarios() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: rows } = await supabase.from('funcionarios').select('*').order('nome')
    setData(rows || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const salvar = async (payload, id = null) => {
    const row = { ...payload }
    if (!row.pin) delete row.pin
    if (id) {
      const { error } = await supabase.from('funcionarios').update(row).eq('id', id)
      if (error) { toast.error('Erro ao atualizar'); return false }
      toast.success('Funcionário atualizado!')
    } else {
      const { error } = await supabase.from('funcionarios').insert(row)
      if (error) { toast.error(error.message.includes('unique') ? 'Usuário já existe' : 'Erro ao cadastrar'); return false }
      toast.success('Funcionário cadastrado!')
    }
    await fetch()
    return true
  }

  const excluir = async (id) => {
    const { error } = await supabase.from('funcionarios').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return false }
    toast.success('Funcionário excluído')
    await fetch()
    return true
  }

  return { funcionarios: data, loading, refetch: fetch, salvar, excluir }
}

// ── Registros de Ponto ────────────────────────────────────────
export function useRegistros(filtros = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('registros_ponto')
      .select('*, funcionarios(nome, cargo)')
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })

    if (filtros.data)       q = q.eq('data', filtros.data)
    if (filtros.dataInicio) q = q.gte('data', filtros.dataInicio)
    if (filtros.dataFim)    q = q.lte('data', filtros.dataFim)
    if (filtros.funcId)     q = q.eq('func_id', filtros.funcId)

    const { data: rows, error } = await q
    if (error) toast.error('Erro ao carregar registros')
    setData(rows || [])
    setLoading(false)
  }, [filtros.data, filtros.dataInicio, filtros.dataFim, filtros.funcId])

  useEffect(() => { fetch() }, [fetch])

  const registrarPonto = async (funcId, tipo, extras = {}) => {
    const hoje = new Date().toISOString().slice(0, 10)
    const hora = (() => { const n = new Date(); return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}` })()

    const { data: existing } = await supabase
      .from('registros_ponto').select('*').eq('func_id', funcId).eq('data', hoje).single()

    const rec = existing || { func_id: funcId, data: hoje }
    if (rec[tipo]) { toast.error('Ponto já registrado!'); return false }

    rec[tipo] = hora
    if (extras.selfie) rec[`selfie_${tipo}`] = extras.selfie
    if (extras.lat)    { rec.lat = extras.lat; rec.lng = extras.lng }
    if (extras.gpsOk !== undefined) rec.gps_ok = extras.gpsOk
    if (extras.wifiOk !== undefined) rec.wifi_ok = extras.wifiOk

    if (tipo === 'saida' && rec.entrada) {
      rec.minutos = calcMin(rec)
    }

    const { error } = await supabase.from('registros_ponto')
      .upsert(rec, { onConflict: 'func_id,data' })

    if (error) { toast.error('Erro ao registrar ponto'); return false }
    const labels = { entrada: 'Entrada', intervalo: 'Intervalo', retorno: 'Retorno', saida: 'Saída' }
    toast.success(`✓ ${labels[tipo]} registrada às ${hora}`)
    await fetch()
    return true
  }

  const atualizar = async (id, payload) => {
    if (payload.saida && payload.entrada) {
      payload.minutos = calcMin(payload)
    }
    payload.editado = true
    const { error } = await supabase.from('registros_ponto').update(payload).eq('id', id)
    if (error) { toast.error('Erro ao atualizar'); return false }
    toast.success('Registro atualizado!')
    await fetch()
    return true
  }

  const excluir = async (id) => {
    const { error } = await supabase.from('registros_ponto').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return false }
    toast.success('Registro excluído')
    await fetch()
    return true
  }

  const getTodayRec = (funcId) => data.find(r => r.func_id === funcId && r.data === new Date().toISOString().slice(0, 10))

  return { registros: data, loading, refetch: fetch, registrarPonto, atualizar, excluir, getTodayRec }
}

// ── Configurações ─────────────────────────────────────────────
export function useConfig() {
  const [config, setConfig] = useState({
    gps_obrigatorio: 'true', selfie_obrigatoria: 'true',
    wifi_verificar: 'false', gps_lat: '', gps_lng: '',
    gps_raio: '200', wifi_ssid: '', jornada_horas: '8'
  })

  useEffect(() => {
    getConfig().then(c => { if (Object.keys(c).length) setConfig(prev => ({ ...prev, ...c })) })
  }, [])

  const salvarConfig = async (novaConfig) => {
    for (const [k, v] of Object.entries(novaConfig)) {
      await setConfigKey(k, v)
    }
    setConfig(prev => ({ ...prev, ...novaConfig }))
    toast.success('Configurações salvas!')
  }

  return { config, salvarConfig }
}
