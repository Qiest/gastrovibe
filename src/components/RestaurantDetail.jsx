import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import ReservationModal from './ReservationModal'
import AuthModal from './AuthModal'

const PRICE_MAP = { 1: '₺', 2: '₺₺', 3: '₺₺₺', 4: '₺₺₺₺' }
const BADGE_COLORS = { orange: 'bg-gv-orange/15 text-gv-orange', green: 'bg-emerald-100 text-gv-emerald', dark: 'bg-gv-ink/10 text-gv-ink-light', blue: 'bg-blue-100 text-blue-700', amber: 'bg-amber-100 text-amber-700' }
const VISIT_TYPES  = ['Çift', 'Aile', 'Arkadaşlar', 'İş Yemeği', 'Solo']

function Stars({ rating, interactive = false, onRate }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type={interactive ? 'button' : 'submit'}
          disabled={!interactive}
          onClick={() => interactive && onRate?.(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`text-xl transition-transform ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
        >
          <span className={(interactive ? hover || rating : rating) >= n ? 'text-amber-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  )
}

function ReviewCard({ review }) {
  const date = new Date(review.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="bg-gv-cream rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gv-cream-dark flex items-center justify-center text-xl">{review.author_avatar}</div>
          <div>
            <div className="font-semibold text-sm text-gv-ink">{review.author_name}</div>
            <div className="text-xs text-gv-muted">{review.visit_type} · {date}</div>
          </div>
        </div>
        <Stars rating={review.rating} />
      </div>
      <p className="text-sm text-gv-ink-light leading-relaxed">{review.text}</p>
    </div>
  )
}

function WriteReviewForm({ restaurantId, onSubmitted }) {
  const { user, authFetch } = useAuth()
  const [rating,    setRating]    = useState(0)
  const [text,      setText]      = useState('')
  const [visitType, setVisitType] = useState('Çift')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (rating === 0)   return setError('Lütfen bir puan verin')
    if (!text.trim())   return setError('Yorum boş olamaz')
    setLoading(true); setError('')
    try {
      const res  = await authFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ restaurant_id: restaurantId, rating, text, visit_type: visitType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSubmitted(data.review)
      setRating(0); setText(''); setVisitType('Çift')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return (
    <div className="bg-gv-cream rounded-2xl p-5 text-center">
      <div className="text-3xl mb-2">✍️</div>
      <p className="text-sm text-gv-muted">Yorum yazmak için giriş yapmanız gerekiyor.</p>
    </div>
  )

  return (
    <form onSubmit={submit} className="bg-gv-cream rounded-2xl p-5 flex flex-col gap-4">
      <div className="font-semibold text-gv-ink">Yorum Yaz</div>
      <div>
        <div className="text-xs text-gv-muted mb-2">Puanınız</div>
        <Stars rating={rating} interactive onRate={setRating} />
      </div>
      <div className="flex gap-2 flex-wrap">
        {VISIT_TYPES.map(t => (
          <button key={t} type="button" onClick={() => setVisitType(t)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border-2 transition-all ${visitType === t ? 'border-gv-orange bg-orange-50 text-gv-orange' : 'border-gv-cream-dark text-gv-muted hover:border-gv-orange'}`}>
            {t}
          </button>
        ))}
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Deneyiminizi paylaşın..."
        className="w-full bg-gv-white border-2 border-transparent focus:border-gv-orange rounded-xl px-4 py-3 text-sm outline-none resize-none text-gv-ink placeholder-gv-muted" />
      {error && <div className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">⚠️ {error}</div>}
      <button type="submit" disabled={loading}
        className="self-start bg-gv-orange text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-gv-orange-dark disabled:opacity-50 transition-all">
        {loading ? '⋯ Gönderiliyor...' : 'Yorum Gönder →'}
      </button>
    </form>
  )
}

export default function RestaurantDetail({ restaurantId, onClose }) {
  const { authFetch } = useAuth()
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [photoIdx,    setPhotoIdx]    = useState(0)
  const [showReserve, setShowReserve] = useState(false)
  const [showAuth,    setShowAuth]    = useState(false)
  const [favLoading,  setFavLoading]  = useState(false)
  const [toast,       setToast]       = useState('')
  const { user }                      = useAuth()

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  const load = useCallback(() => {
    setLoading(true)
    authFetch(`/api/restaurants/${restaurantId}`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [restaurantId])

  useEffect(() => { load() }, [load])

  // Trap scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleFavorite = async () => {
    if (!user) { setShowAuth(true); return }
    setFavLoading(true)
    try {
      const res  = await authFetch(`/api/favorites/${restaurantId}`, { method: 'POST' })
      const body = await res.json()
      setData(d => ({ ...d, restaurant: { ...d.restaurant, is_favorited: body.favorited } }))
      showToast(body.message)
    } finally { setFavLoading(false) }
  }

  const handleReviewSubmitted = (review) => {
    setData(d => ({ ...d, reviews: [review, ...d.reviews] }))
    showToast('✅ Yorumunuz eklendi!')
  }

  if (loading) return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="text-white text-lg animate-pulse">⋯ Yükleniyor</div>
    </div>
  )

  const { restaurant: r, reviews = [] } = data || {}
  if (!r) return null

  const images  = r.images?.length ? r.images : ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80']
  const hours   = r.hours || {}

  return (
    <>
      <div className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative bg-gv-white w-full md:max-w-3xl rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col"
          style={{ maxHeight: '92vh', animation: 'panelUp 0.35s ease' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Toast */}
          {toast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gv-ink text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-xl whitespace-nowrap">
              {toast}
            </div>
          )}

          {/* ── PHOTO GALLERY ── */}
          <div className="relative flex-shrink-0 h-64 md:h-80 bg-gv-cream-dark overflow-hidden">
            <img key={photoIdx} src={images[photoIdx]} alt={r.name}
              className="w-full h-full object-cover transition-opacity duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            {/* Close */}
            <button onClick={onClose}
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all text-lg">
              ←
            </button>

            {/* Favorite */}
            <button onClick={handleFavorite} disabled={favLoading}
              className="absolute top-4 right-14 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all text-base">
              {favLoading ? '⋯' : r.is_favorited ? '❤️' : '🤍'}
            </button>

            {/* Reserve */}
            <button onClick={() => user ? setShowReserve(true) : setShowAuth(true)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gv-orange text-white flex items-center justify-center hover:bg-gv-orange-dark transition-all text-base shadow-orange-glow">
              📅
            </button>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)}
                    className={`w-12 h-8 rounded-lg overflow-hidden border-2 transition-all ${i === photoIdx ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-90'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── SCROLLABLE CONTENT ── */}
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gv-cream-dark">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-playfair font-black text-2xl text-gv-ink mb-1">{r.name}</h2>
                  <div className="flex items-center gap-3 text-sm text-gv-muted flex-wrap">
                    <span>📍 {r.location}</span>
                    <span>·</span>
                    <span className="font-bold text-gv-emerald">{PRICE_MAP[r.price_level]}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <span className="text-amber-400">★</span>
                      <span className="font-semibold text-gv-ink">{r.rating}</span>
                      <span className="text-gv-muted">({r.review_count} yorum)</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => user ? setShowReserve(true) : setShowAuth(true)}
                  className="flex-shrink-0 bg-gv-orange text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-gv-orange-dark hover:-translate-y-0.5 transition-all shadow-orange-glow">
                  Rezervasyon
                </button>
              </div>

              {/* Badges */}
              <div className="flex gap-2 flex-wrap mt-4">
                {r.badges?.map(b => (
                  <span key={b.label} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${BADGE_COLORS[b.color] || BADGE_COLORS.dark}`}>
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-6 py-5 flex flex-col gap-7">
              {/* Description */}
              <div>
                <h3 className="font-playfair font-bold text-lg text-gv-ink mb-3">Mekan Hakkında</h3>
                <p className="text-sm text-gv-ink-light leading-relaxed">{r.long_desc || r.description}</p>
              </div>

              {/* Features + Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Features */}
                {r.features?.length > 0 && (
                  <div>
                    <h3 className="font-playfair font-bold text-base text-gv-ink mb-3">Özellikler</h3>
                    <div className="flex flex-col gap-1.5">
                      {r.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-sm text-gv-ink-light">
                          <span className="w-1.5 h-1.5 rounded-full bg-gv-orange flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info */}
                <div>
                  <h3 className="font-playfair font-bold text-base text-gv-ink mb-3">İletişim & Saatler</h3>
                  <div className="flex flex-col gap-2">
                    {r.phone && (
                      <a href={`tel:${r.phone}`} className="flex items-center gap-2 text-sm text-gv-ink-light hover:text-gv-orange transition-colors" style={{textDecoration:'none'}}>
                        <span>📞</span>{r.phone}
                      </a>
                    )}
                    {r.address && (
                      <div className="flex items-start gap-2 text-sm text-gv-ink-light">
                        <span className="flex-shrink-0">📍</span>{r.address}
                      </div>
                    )}
                    {Object.entries(hours).length > 0 && (
                      <div className="mt-1 flex flex-col gap-1">
                        {Object.entries(hours).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-xs">
                            <span className="text-gv-muted">{k}</span>
                            <span className="font-medium text-gv-ink">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="font-playfair font-bold text-lg text-gv-ink">
                    Yorumlar <span className="text-gv-muted text-sm font-normal">({reviews.length})</span>
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 text-lg">★</span>
                    <span className="font-bold text-gv-ink">{r.rating}</span>
                    <span className="text-xs text-gv-muted">/ 5</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-5">
                  {reviews.length === 0
                    ? <div className="text-sm text-gv-muted text-center py-6 bg-gv-cream rounded-2xl">Henüz yorum yapılmamış. İlk siz yazın!</div>
                    : reviews.map(rv => <ReviewCard key={rv.id} review={rv} />)
                  }
                </div>

                <WriteReviewForm restaurantId={r.id} onSubmitted={handleReviewSubmitted} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReserve && <ReservationModal restaurant={r} onClose={() => setShowReserve(false)} onSuccess={() => showToast('✅ Rezervasyon oluşturuldu!')} />}
      {showAuth    && <AuthModal onClose={() => setShowAuth(false)} defaultTab="login" />}
    </>
  )
}
