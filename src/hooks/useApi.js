/**
 * src/hooks/useApi.js
 * Merkezi API hook'u: loading, error, data yönetimi
 */
import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export function useApi() {
  const { authFetch } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const request = useCallback(async (url, opts = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res  = await authFetch(url, opts)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Bir hata oluştu')
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  return { request, loading, error, setError }
}

/** Basit public fetch (auth gerektirmeyen) */
export function usePublicApi() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const request = useCallback(async (url, opts = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Bir hata oluştu')
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { request, loading, error, setError }
}
