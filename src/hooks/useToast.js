import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info', duration = 2800) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const success = useCallback((msg) => toast(msg, 'success'), [toast])
  const info    = useCallback((msg) => toast(msg, 'info'),    [toast])
  const warn    = useCallback((msg) => toast(msg, 'warn'),    [toast])
  const error   = useCallback((msg) => toast(msg, 'error'),  [toast])

  return { toasts, toast, success, info, warn, error }
}
