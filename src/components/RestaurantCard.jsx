import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import RestaurantDetail from './RestaurantDetail'
import AuthModal from './AuthModal'

const BADGE_COLORS = { orange: 'bg-gv-orange/85 text-white', green: 'bg-gv-emerald/85 text-white', dark: 'bg-gv-ink/75 text-white', blue: 'bg-blue-600/80 text-white', amber: 'bg-amber-500/85 text-white' }

export default function RestaurantCard({ restaurant: init, large = false }) {
  const { user, authFetch } = useAuth()
  const [r,           setR]           = useState(init)
  const [showDetail,  setShowDetail]  = useState(false)
  const [showAuth,    setShowAuth]    = useState(false)
  const [favLoading,  setFavLoading]  = useState(false)
  const [toast,       setToast]       = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const handleFav = async (e) => {
    e.stopPropagation()
    if (!user) { setShowAuth(true); return }
    if (favLoading) return
    setFavLoading(true)
    try {
      const res  = await authFetch(`/api/favorites/${r.id}`, { method: 'POST' })
      const data = await res.json()
      setR(prev => ({ ...prev, is_favorited: data.favorited }))
      showToast(data.message)
    } finally { setFavLoading(false) }
  }

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className={`bg-gv-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 cursor-pointer relative group ${large ? 'row-span-2' : ''}`}
      >
        {toast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-gv-ink text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl whitespace-nowrap pointer-events-none">
            {toast}
          </div>
        )}

        {/* Image */}
        <div className="relative overflow-hidden">
          <img src={r.image_url || r.images?.[0]} alt={r.name}
            className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${large ? 'h-80' : 'h-56'}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

          {/* Fav button */}
          <button onClick={handleFav} disabled={favLoading}
            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center text-base transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(254,252,248,0.90)', backdropFilter: 'blur(8px)' }}>
            {favLoading ? '⋯' : r.is_favorited ? '❤️' : '🤍'}
          </button>

          {/* "Detay" hint */}
          <div className="absolute top-3.5 left-3.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm text-white text-[0.65rem] font-bold px-2.5 py-1 rounded-full">
            Detayları Gör
          </div>

          {/* Badges */}
          <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
            {(r.badges || []).map(b => (
              <span key={b.label} className={`text-[0.68rem] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm whitespace-nowrap ${BADGE_COLORS[b.color] || BADGE_COLORS.dark}`}>
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-playfair font-bold text-[1.1rem] text-gv-ink leading-tight">{r.name}</h3>
            <div className="flex items-center gap-1 text-[0.82rem] font-semibold flex-shrink-0 ml-2">
              <span className="text-amber-400">★</span>
              <span className="text-gv-ink">{r.rating}</span>
            </div>
          </div>
          <p className="text-[0.78rem] text-gv-muted mb-3">📍 {r.location} · {r.review_count} yorum</p>
          {large && <p className="text-[0.82rem] text-gv-ink-light leading-relaxed mb-4 line-clamp-2">{r.description}</p>}
          <div className="flex justify-between items-center">
            <span className="text-[0.82rem] font-bold text-gv-emerald">{r.price}</span>
            <button
              onClick={e => { e.stopPropagation(); setShowDetail(true) }}
              className="text-[0.78rem] font-bold px-4 py-1.5 rounded-full bg-gv-orange text-white hover:bg-gv-orange-dark hover:scale-105 transition-all duration-200">
              İncele →
            </button>
          </div>
        </div>
      </div>

      {showDetail && <RestaurantDetail restaurantId={r.id} onClose={() => setShowDetail(false)} />}
      {showAuth   && <AuthModal onClose={() => setShowAuth(false)} defaultTab="login" />}
    </>
  )
}
