import { useState, useCallback } from 'react'

export function useChat() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendMessage = useCallback(async (message, history = []) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data
    } catch (err) {
      setError(err.message)
      // Fallback mock response
      return {
        message: 'Harika bir seçim! İşte size özel önerilerim 🍽️',
        restaurants: [
          { name: 'Çınar Bahçe', location: 'Bursa · Mudanya', price: '₺₺₺', badges: ['🌲 Orman İçinde', '🎶 Canlı Müzik'], description: 'Çam ormanları arasında eşsiz bir akşam.', emoji: '🌲' },
          { name: 'Liman 1924',  location: 'Bursa · Mudanya', price: '₺₺',  badges: ['🌊 Deniz Kenarı'],                    description: 'Efsanevi balık sofrası.',              emoji: '🌊' },
          { name: 'Toprak Bistro', location: 'Bursa · Nilüfer', price: '₺₺₺', badges: ['✨ Modern Anadolu'],                description: 'Zarif bir Anadolu deneyimi.',          emoji: '✨' },
        ],
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return { sendMessage, loading, error }
}
