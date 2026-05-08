// src/components/ReservationModal.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const TIME_SLOTS = [
  '12:00','12:30','13:00','13:30','14:00',
  '19:00','19:30','20:00','20:30','21:00','21:30','22:00',
]
const PRICE_MAP = { 1:'₺', 2:'₺₺', 3:'₺₺₺', 4:'₺₺₺₺' }

export default function ReservationModal({ restaurant, onClose, onSuccess }) {
  const { authFetch } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    date: today, time: '20:00', party_size: 2, note: '', phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [done,    setDone]    = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res  = await authFetch('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ restaurant_id: restaurant.id, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDone(true)
      onSuccess?.(data.reservation)
      setTimeout(onClose, 2400)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-gv-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'panelUp 0.3s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── SUCCESS ── */}
        {done && (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="text-7xl mb-5">✅</div>
            <h3 className="font-playfair text-2xl font-bold text-gv-ink mb-3">Rezervasyon Onaylandı!</h3>
            <p className="text-gv-muted text-sm leading-relaxed">
              <strong className="text-gv-ink">{restaurant.name}</strong><br />
              {form.date} · {form.time} · {form.party_size} kişi
            </p>
            <div className="mt-6 w-full bg-gv-cream rounded-2xl px-5 py-4 text-xs text-gv-muted">
              Profil sayfanızdan rezervasyonlarınızı yönetebilirsiniz.
            </div>
          </div>
        )}

        {/* ── FORM ── */}
        {!done && (
          <>
            <div className="relative h-32 overflow-hidden flex-shrink-0">
              <img
                src={(Array.isArray(restaurant.images) && restaurant.images[0]) || restaurant.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'}
                alt={restaurant.name} className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
              <button onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all">
                ✕
              </button>
              <div className="absolute bottom-4 left-5">
                <div className="font-playfair font-bold text-white text-lg">{restaurant.name}</div>
                <div className="text-white/70 text-xs mt-0.5">
                  {restaurant.location} · {PRICE_MAP[restaurant.price_level] || restaurant.price || '₺₺'}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              <h3 className="font-playfair text-lg font-bold text-gv-ink">Rezervasyon Oluştur</h3>

              {/* Telefon */}
              <div>
                <label className="block text-[0.7rem] font-bold uppercase tracking-widest text-gv-muted mb-2">
                  📱 Telefon Numarası <span className="font-normal normal-case tracking-normal text-red-400">*</span>
                </label>
                <input
                  type="tel" required value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+90 5XX XXX XX XX"
                  className="w-full bg-gv-cream border-2 border-transparent focus:border-gv-orange rounded-xl px-4 py-3 text-sm outline-none transition-colors text-gv-ink"
                />
              </div>

              {/* Tarih */}
              <div>
                <label className="block text-[0.7rem] font-bold uppercase tracking-widest text-gv-muted mb-2">📅 Tarih</label>
                <input
                  type="date" required min={today} value={form.date}
                  onChange={e => set('date', e.target.value)}
                  className="w-full bg-gv-cream border-2 border-transparent focus:border-gv-orange rounded-xl px-4 py-3 text-sm outline-none transition-colors text-gv-ink"
                />
              </div>

              {/* Saat */}
              <div>
                <label className="block text-[0.7rem] font-bold uppercase tracking-widest text-gv-muted mb-2">🕐 Saat Seçin</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map(t => (
                    <button key={t} type="button" onClick={() => set('time', t)}
                      className={`py-2 text-xs font-semibold rounded-xl transition-all
                        ${form.time === t ? 'bg-gv-orange text-white shadow-orange-glow' : 'bg-gv-cream text-gv-ink-light hover:bg-gv-cream-dark'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kişi sayısı */}
              <div>
                <label className="block text-[0.7rem] font-bold uppercase tracking-widest text-gv-muted mb-2">👥 Kişi Sayısı</label>
                <div className="flex items-center gap-4 bg-gv-cream rounded-xl px-4 py-3">
                  <button type="button" onClick={() => set('party_size', Math.max(1, form.party_size - 1))}
                    className="w-8 h-8 rounded-full bg-gv-white font-bold text-lg flex items-center justify-center hover:bg-gv-orange hover:text-white transition-all">−</button>
                  <span className="flex-1 text-center font-bold text-gv-ink text-lg">{form.party_size} kişi</span>
                  <button type="button" onClick={() => set('party_size', Math.min(20, form.party_size + 1))}
                    className="w-8 h-8 rounded-full bg-gv-white font-bold text-lg flex items-center justify-center hover:bg-gv-orange hover:text-white transition-all">+</button>
                </div>
              </div>

              {/* Not */}
              <div>
                <label className="block text-[0.7rem] font-bold uppercase tracking-widest text-gv-muted mb-2">
                  📝 Not <span className="font-normal normal-case tracking-normal">(opsiyonel)</span>
                </label>
                <textarea value={form.note} onChange={e => set('note', e.target.value)}
                  placeholder="Özel istek, alerji, özel gün notu..."
                  rows={2}
                  className="w-full bg-gv-cream border-2 border-transparent focus:border-gv-orange rounded-xl px-4 py-3 text-sm outline-none resize-none transition-colors text-gv-ink"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-gv-orange text-white font-bold py-3.5 rounded-xl hover:bg-gv-orange-dark disabled:opacity-60 transition-all hover:-translate-y-0.5 text-sm shadow-orange-glow">
                {loading ? '⋯ İşleniyor...' : `🗓 Rezervasyon Yap — ${form.date} · ${form.time}`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
