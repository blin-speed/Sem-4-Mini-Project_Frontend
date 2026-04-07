import { useState, useEffect, useCallback } from 'react'
import api from '../api/api'

const CACHE_KEY = 'matrix_settings_cache'
const CACHE_TTL = 30 * 1000 // 30 seconds — short enough to feel hot-loaded

const defaultSettings = {
  landingAgentMode: 'ASSISTANT',
  requestMode: 'AGENT',
  catalogEnabled: false,
  businessContext: '',
  agentName: 'Assistant',
  agentPersona: '',
}

let inFlightPromise = null

export const fetchPublicSettings = async (force = false) => {
  if (!force) {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const { data, ts } = JSON.parse(raw)
        if (Date.now() - ts < CACHE_TTL) return data
      }
    } catch { /* ignore */ }
  }

  if (!inFlightPromise) {
    inFlightPromise = api.get('/settings/public')
      .then(res => {
        const data = res.data?.data || res.data || defaultSettings
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
        return data
      })
      .catch(() => defaultSettings)
      .finally(() => { inFlightPromise = null })
  }
  return inFlightPromise
}

export const invalidateSettingsCache = () => {
  sessionStorage.removeItem(CACHE_KEY)
}

/** Hook for components that need settings reactively with hot-reload on tab focus. */
export const useSettings = () => {
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async (force = false) => {
    if (force) invalidateSettingsCache()
    const s = await fetchPublicSettings(force)
    setSettings(s)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
    // Re-fetch when tab regains focus — picks up admin changes immediately
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload(true)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload])

  return { settings, loading, reload }
}

export const fetchAdminSettings = async () => {
  const res = await api.get('/settings')
  return res.data?.data || res.data
}

export const saveAdminSettings = async (payload) => {
  const res = await api.put('/settings', payload)
  invalidateSettingsCache()
  return res.data?.data || res.data
}
