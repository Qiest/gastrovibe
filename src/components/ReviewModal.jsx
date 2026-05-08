/**
 * src/components/ReviewModal.jsx
 * Restoran puanlama ve yorum modal'ı
 */
import { useState } from 'react'
import { useApi } from '../hooks/useApi'

export default function ReviewModal({ restaurant, onClose, onSuccess }) {
  const { request, loading } = useApi()
  const [rating,  setRating]  = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) { setError('Lütfen bir puan seçin.'); return }
    setError('')
    try {
      const data = await request(`/api/restaurants/${restaurant.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      })
      onSuccess?.(data.message)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-gv-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'panelUp 0.3s ease' }}
      >
        {/* Header */}
        <div className="bg-gv-emerald px-6 pt-6 pb-5">
          <button onClick={onClose} className="absolute top-4 right-5 text-white/60 hover:text-white text-xl">✕</button>
          <div className="font-playfair text-xl font-bold text-white mb-1">{restaurant.name}</div>
          <p className="text-white/60 text-xs">Deneyiminizi değerlendirin</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Yıldız seçici */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gv-muted mb-3">Puanınız</label>
            <div className="flex gap-2 justify-center">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-3xl transition-transform hover:scale-125 active:scale-110"
                >
                  <span className={(hovered || rating) >= s ? 'text-amber-400' : 'text-gray-200'}>★</span>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-xs text-gv-muted mt-2">
                {['','Berbat 😞','Kötü 😐','Fena değil 🙂','İyi 😊','Mükemmel 🤩'][rating]}
              </p>
            )}
          </div>

          {/* Yorum */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gv-muted mb-2">
              Yorumunuz <span className="normal-case font-normal">(opsiyonel)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Deneyiminizi kısaca anlatın..."
              rows={3}
              maxLength={500}
              className="w-full bg-gv-cream border-2 border-transparent focus:border-gv-orange rounded-xl px-4 py-3 text-sm outline-none resize-none transition-colors text-gv-ink"
            />
            <p className="text-right text-[0.7rem] text-gv-muted mt-1">{comment.length}/500</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || rating === 0}
            className="w-full bg-gv-orange text-white font-bold py-3.5 rounded-xl hover:bg-gv-orange-dark disabled:opacity-50 transition-all hover:-translate-y-0.5 text-sm"
          >
            {loading ? '⋯ Gönderiliyor...' : 'Yorumu Gönder ⭐'}
          </button>
        </form>
      </div>
    </div>
  )
}
