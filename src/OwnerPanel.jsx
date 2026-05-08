/**
 * src/components/owner/OwnerPanel.jsx
 * Restoran sahibi tam paneli — modal olarak açılır
 * Sekmeler: Genel Bakış | Restoranım | Rezervasyonlar | Yorumlar
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

const BADGE_OPTIONS = [
  { icon:'🌲', label:'Orman İçinde', color:'green'  },
  { icon:'🌊', label:'Deniz Kenarı', color:'blue'   },
  { icon:'🎶', label:'Canlı Müzik',  color:'dark'   },
  { icon:'🚗', label:'Vale Servisi', color:'orange' },
  { icon:'🕯️', label:'Romantik',    color:'amber'  },
  { icon:'🌿', label:'Organik',      color:'green'  },
  { icon:'🔥', label:'Ocakbaşı',     color:'orange' },
  { icon:'🥩', label:'Et Uzmanlığı', color:'dark'   },
  { icon:'🍷', label:'Şarap Listesi',color:'amber'  },
  { icon:'🌸', label:'Bahçe',        color:'green'  },
  { icon:'🏛️', label:'Tarihi Yapı',  color:'dark'   },
  { icon:'❄️', label:'Sezonluk',     color:'blue'   },
  { icon:'👨‍👩‍👧', label:'Aile Dostu',  color:'green'  },
  { icon:'✨', label:'Fine Dining',  color:'orange' },
  { icon:'🌅', label:'Manzaralı',    color:'blue'   },
]

const FEATURE_OPTIONS = [
  'Açık Hava Terası','Vale Park','Vejetaryen Menü','Özel Davet',
  'Doğum Günü Organizasyonu','Canlı Müzik','Şarap Eşleştirme',
  'Tadım Menüsü','Çocuk Dostu','Engelli Erişimi','Paket Servis',
  'Kahvaltı Büfesi','Alkollü İçecek','Rezervasyon Önerilir',
  'Şömine','Grup Masaları','Özel Oda',
]

const STATUS_BADGE = {
  pending:  { label:'İncelemede ⏳', cls:'bg-amber-100 text-amber-700'  },
  approved: { label:'Yayında ✅',    cls:'bg-green-100 text-green-700'  },
  rejected: { label:'Reddedildi ❌', cls:'bg-red-100 text-red-500'      },
}

const RES_STATUS = {
  confirmed: { label:'Onaylı',     cls:'bg-green-100 text-green-700' },
  cancelled: { label:'İptal',      cls:'bg-red-100 text-red-500'     },
  completed: { label:'Tamamlandı', cls:'bg-gray-100 text-gray-500'   },
}

/* ─── MAIN PANEL ─────────────────────────────────────────────── */
export default function OwnerPanel({ onClose }) {
  const { authFetch }  = useAuth()
  const [tab,          setTab]          = useState('overview')
  const [stats,        setStats]        = useState(null)
  const [restaurants,  setRestaurants]  = useState([])
  const [reservations, setReservations] = useState([])
  const [reviews,      setReviews]      = useState([])
  const [editTarget,   setEditTarget]   = useState(null)
  const [showForm,     setShowForm]     = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [toast,        setToast]        = useState('')

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, r, rv, rw] = await Promise.all([
        authFetch('/api/owner/stats').then(r => r.json()),
        authFetch('/api/owner/restaurant').then(r => r.json()),
        authFetch('/api/owner/reservations').then(r => r.json()),
        authFetch('/api/owner/reviews').then(r => r.json()),
      ])
      setStats(s)
      setRestaurants(r.restaurants || [])
      setReservations(rv.reservations || [])
      setReviews(rw.reviews || [])
    } finally { setLoading(false) }
  }, [authFetch])

  useEffect(() => { fetchAll() }, [fetchAll])

  const updateReservationStatus = async (id, status) => {
    const res = await authFetch(`/api/owner/reservations/${id}`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    })
    if (res.ok) { flash('Rezervasyon güncellendi ✅'); fetchAll() }
  }

  return (
    <>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative bg-gv-white rounded-3xl shadow-2xl w-full flex flex-col overflow-hidden"
          style={{ maxWidth: 900, maxHeight: '90vh', animation: 'panelUp 0.3s ease' }}
          onClick={e => e.stopPropagation()}
        >
          {toast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gv-ink text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap">
              {toast}
            </div>
          )}

          {/* Header */}
          <div className="bg-gv-emerald px-8 py-5 flex items-center gap-4 flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gv-orange flex items-center justify-center text-2xl">🏪</div>
            <div>
              <div className="font-playfair font-bold text-white text-xl">Restoran Paneli</div>
              <div className="text-white/60 text-xs">İşletmenizi yönetin</div>
            </div>
            <button onClick={onClose} className="ml-auto text-white/60 hover:text-white text-xl">✕</button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gv-cream-dark flex-shrink-0 bg-gv-white overflow-x-auto">
            {[
              { key:'overview',     label:'📊 Genel Bakış' },
              { key:'restaurant',   label:'🍽️ Restoranım' },
              { key:'reservations', label:`📅 Rezervasyonlar${stats?.pendingReservations > 0 ? ` (${stats.pendingReservations})` : ''}` },
              { key:'reviews',      label:'⭐ Yorumlar' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap
                  ${tab === t.key ? 'text-gv-orange border-b-2 border-gv-orange' : 'text-gv-muted hover:text-gv-ink'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6">
            {loading ? (
              <div className="text-center py-16 text-gv-muted">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-sm">Yükleniyor...</p>
              </div>
            ) : tab === 'overview' ? (
              <OverviewTab stats={stats} restaurants={restaurants} />
            ) : tab === 'restaurant' ? (
              <RestaurantTab
                restaurants={restaurants}
                onNew={() => { setEditTarget(null); setShowForm(true) }}
                onEdit={r => { setEditTarget(r); setShowForm(true) }}
                onRefresh={fetchAll}
                flash={flash}
                authFetch={authFetch}
              />
            ) : tab === 'reservations' ? (
              <ReservationsTab reservations={reservations} onStatusChange={updateReservationStatus} />
            ) : (
              <ReviewsTab reviews={reviews} />
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <RestaurantForm
          existing={editTarget}
          onClose={() => setShowForm(false)}
          onSuccess={(msg) => { flash(msg); setShowForm(false); fetchAll() }}
          authFetch={authFetch}
        />
      )}
    </>
  )
}

/* ─── OVERVIEW TAB ───────────────────────────────────────────── */
function OverviewTab({ stats, restaurants }) {
  if (!stats) return null

  const cards = [
    { icon:'📅', label:'Toplam Rezervasyon',   value: stats.totalReservations,   color:'text-gv-orange'  },
    { icon:'🔔', label:'Bekleyen',              value: stats.pendingReservations, color:'text-amber-500'  },
    { icon:'📆', label:'Bugünkü',               value: stats.todayReservations,   color:'text-blue-600'   },
    { icon:'⭐', label:'Ort. Puan',             value: stats.avgRating ? `${stats.avgRating}/5` : '–', color:'text-amber-400' },
    { icon:'💬', label:'Toplam Yorum',          value: stats.totalReviews,        color:'text-gv-emerald' },
    { icon:'❤️', label:'Favoriye Ekleme',       value: stats.totalFavorites,      color:'text-red-500'    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-gv-cream rounded-2xl p-5 flex flex-col gap-1">
            <span className="text-2xl">{c.icon}</span>
            <span className={`text-3xl font-black font-playfair ${c.color}`}>{c.value ?? 0}</span>
            <span className="text-xs text-gv-muted font-medium">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Restaurant status list */}
      {restaurants.length > 0 && (
        <div>
          <h3 className="font-playfair font-bold text-gv-ink text-lg mb-4">Restoranlarım</h3>
          <div className="space-y-3">
            {restaurants.map(r => {
              const s = STATUS_BADGE[r.status] || STATUS_BADGE.pending
              const img = Array.isArray(r.images) ? r.images[0] : r.image_url
              return (
                <div key={r.id} className="bg-gv-cream rounded-2xl flex gap-4 overflow-hidden items-center">
                  {img && <img src={img} alt={r.name} className="w-20 h-16 object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-playfair font-bold text-gv-ink">{r.name}</span>
                      <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="text-xs text-gv-muted mt-0.5">{r.location} · {r.price} · Kapasite: {r.capacity} kişi</div>
                  </div>
                  <div className="pr-4 text-right">
                    <div className="text-amber-400 text-sm font-bold">★ {r.rating}</div>
                    <div className="text-xs text-gv-muted">{r.review_count} yorum</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── RESTAURANT TAB ─────────────────────────────────────────── */
function RestaurantTab({ restaurants, onNew, onEdit, flash, authFetch }) {
  const canAdd = restaurants.length < 3

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair font-bold text-gv-ink text-xl">Restoranlarım</h3>
          <p className="text-xs text-gv-muted mt-0.5">En fazla 3 restoran ekleyebilirsiniz ({restaurants.length}/3)</p>
        </div>
        {canAdd && (
          <button onClick={onNew}
            className="bg-gv-orange text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-gv-orange-dark transition-all hover:-translate-y-0.5">
            + Yeni Restoran
          </button>
        )}
      </div>

      {restaurants.length === 0 ? (
        <div className="text-center py-16 bg-gv-cream rounded-2xl">
          <div className="text-5xl mb-4">🍽️</div>
          <h4 className="font-playfair font-bold text-gv-ink text-lg mb-2">Henüz restoranınız yok</h4>
          <p className="text-sm text-gv-muted mb-6">Restoranınızı ekleyin, admin onayından sonra yayına alınır.</p>
          <button onClick={onNew}
            className="bg-gv-orange text-white text-sm font-bold px-7 py-3 rounded-full hover:bg-gv-orange-dark transition-all">
            🚀 İlk Restoranımı Ekle
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {restaurants.map(r => {
            const s   = STATUS_BADGE[r.status] || STATUS_BADGE.pending
            const img = Array.isArray(r.images) ? r.images[0] : null
            return (
              <div key={r.id} className="bg-gv-cream rounded-2xl overflow-hidden">
                <div className="flex gap-4 items-start p-4">
                  {img && (
                    <img src={img} alt={r.name}
                      className="w-28 h-20 object-cover rounded-xl flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-playfair font-bold text-gv-ink text-lg">{r.name}</span>
                          <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                        </div>
                        <p className="text-xs text-gv-muted mt-1">{r.location} · {r.price} · {r.capacity} kişi kapasiteli</p>
                        <p className="text-xs text-gv-ink-light mt-1.5 line-clamp-2">{r.description}</p>
                      </div>
                      <button onClick={() => onEdit(r)}
                        className="flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full border-2 border-gv-orange text-gv-orange hover:bg-gv-orange hover:text-white transition-all">
                        Düzenle
                      </button>
                    </div>

                    {/* Badges */}
                    {r.badges?.length > 0 && (
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {r.badges.map(b => (
                          <span key={b.label} className="text-[0.65rem] font-semibold bg-gv-white px-2.5 py-1 rounded-full text-gv-ink-light">
                            {b.icon} {b.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex gap-4 mt-3 text-xs text-gv-muted">
                      <span>⭐ {r.rating}</span>
                      <span>💬 {r.review_count} yorum</span>
                      <span>📸 {Array.isArray(r.images) ? r.images.length : 0} fotoğraf</span>
                    </div>

                    {r.status === 'rejected' && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                        ❌ Restoranınız reddedildi. Bilgileri güncelleyip tekrar başvurabilirsiniz.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── RESERVATIONS TAB ───────────────────────────────────────── */
function ReservationsTab({ reservations, onStatusChange }) {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter(r => r.status === filter)

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-playfair font-bold text-gv-ink text-xl">Gelen Rezervasyonlar</h3>
        <div className="flex gap-2">
          {[
            { key: 'all',       label: 'Tümü'       },
            { key: 'confirmed', label: 'Onaylı'      },
            { key: 'completed', label: 'Tamamlandı'  },
            { key: 'cancelled', label: 'İptal'       },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${filter === f.key ? 'bg-gv-orange text-white' : 'bg-gv-cream text-gv-muted hover:text-gv-ink'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-14 bg-gv-cream rounded-2xl">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-sm text-gv-muted">Bu filtrede rezervasyon yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const s      = RES_STATUS[r.status] || RES_STATUS.confirmed
            const isUpcoming = r.date >= today && r.status === 'confirmed'
            return (
              <div key={r.id} className={`bg-gv-cream rounded-2xl p-4 ${isUpcoming ? 'ring-2 ring-gv-orange/30' : ''}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gv-white flex items-center justify-center text-xl flex-shrink-0">
                      {r.user_avatar || '👤'}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gv-ink">{r.user_name}</div>
                      <div className="text-xs text-gv-muted">{r.user_email}</div>
                    </div>
                  </div>
                  <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                </div>

                <div className="flex gap-4 mt-3 text-xs text-gv-ink flex-wrap">
                  <span>📅 {r.date}</span>
                  <span>🕐 {r.time}</span>
                  <span>👥 {r.party_size} kişi</span>
                  <span className="text-gv-muted font-medium">{r.restaurant_name}</span>
                </div>

                {r.note && (
                  <div className="mt-2 text-xs text-gv-muted italic bg-gv-white px-3 py-2 rounded-lg">
                    "{r.note}"
                  </div>
                )}

                {r.status === 'confirmed' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => onStatusChange(r.id, 'completed')}
                      className="text-xs font-bold px-3 py-1.5 rounded-full bg-gv-emerald text-white hover:opacity-80 transition-opacity">
                      ✓ Tamamlandı
                    </button>
                    <button onClick={() => onStatusChange(r.id, 'cancelled')}
                      className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                      ✕ İptal Et
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── REVIEWS TAB ────────────────────────────────────────────── */
function ReviewsTab({ reviews }) {
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-playfair font-bold text-gv-ink text-xl">Gelen Yorumlar</h3>
        {avg && (
          <div className="flex items-center gap-2 bg-gv-cream px-4 py-2 rounded-full">
            <span className="text-amber-400 text-lg">★</span>
            <span className="font-black text-gv-ink">{avg}</span>
            <span className="text-xs text-gv-muted">/ {reviews.length} yorum</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-14 bg-gv-cream rounded-2xl">
          <div className="text-4xl mb-3">⭐</div>
          <p className="text-sm text-gv-muted">Henüz yorum yok. Misafirlerinizi yoruma teşvik edin!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => {
            const date = new Date(r.created_at).toLocaleDateString('tr-TR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })
            return (
              <div key={r.id} className="bg-gv-cream rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gv-white flex items-center justify-center text-lg">
                      {r.author_avatar || '👤'}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gv-ink">{r.author_name}</div>
                      <div className="text-xs text-gv-muted">{r.visit_type} · {date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-amber-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gv-ink-light leading-relaxed">{r.text}</p>
                {r.restaurant_name && (
                  <div className="mt-2 text-[0.65rem] font-medium text-gv-muted">
                    📍 {r.restaurant_name}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── RESTAURANT FORM ────────────────────────────────────────── */
function RestaurantForm({ existing, onClose, onSuccess, authFetch }) {
  const isEdit  = !!existing
  const fileRef = useRef(null)

  const blank = {
    name: '', city: '', district: '', location: '', address: '',
    phone: '', price_level: 2, capacity: 50,
    description: '', long_desc: '',
    images: [], badges: [], features: [],
    hours: { 'Pzt-Cum': '12:00–23:00', 'Cmt-Paz': '11:00–00:00' },
  }

  const [form,     setForm]     = useState(() => existing
    ? {
        ...blank,
        ...existing,
        badges:   Array.isArray(existing.badges)   ? existing.badges   : [],
        features: Array.isArray(existing.features) ? existing.features : [],
        images:   Array.isArray(existing.images)   ? existing.images   : [],
        hours:    (existing.hours && typeof existing.hours === 'object') ? existing.hours : blank.hours,
      }
    : blank
  )
  const [saving,   setSaving]   = useState(false)
  const [uploading,setUploading]= useState(false)
  const [error,    setError]    = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleBadge = (b) => {
    const has = form.badges.find(x => x.label === b.label)
    if (has) set('badges', form.badges.filter(x => x.label !== b.label))
    else if (form.badges.length < 5) set('badges', [...form.badges, b])
  }

  const toggleFeature = (f) => {
    set('features', form.features.includes(f) ? form.features.filter(x => x !== f) : [...form.features, f])
  }

  const removeImage = (url) => set('images', form.images.filter(u => u !== url))

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await authFetch('/api/upload', { method: 'POST', headers: {}, body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Yükleme başarısız')
      set('images', [...form.images, data.url])
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const url    = isEdit ? `/api/owner/restaurant/${existing.id}` : '/api/owner/restaurant'
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await authFetch(url, { method, body: JSON.stringify(form) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSuccess(data.message || (isEdit ? '✅ Güncellendi!' : '🎉 Restoran oluşturuldu!'))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-gv-white rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col"
        style={{ maxWidth: 680, maxHeight: '92vh', animation: 'panelUp 0.3s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Form header */}
        <div className="bg-gv-emerald px-7 py-5 flex items-center gap-3 flex-shrink-0">
          <div className="font-playfair font-black text-white text-xl">
            {isEdit ? `✏️ ${existing.name} — Düzenle` : '🚀 Yeni Restoran Başvurusu'}
          </div>
          <button onClick={onClose} className="ml-auto text-white/60 hover:text-white text-xl">✕</button>
        </div>

        {!isEdit && (
          <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            ℹ️ Restoranınız eklendikten sonra <strong>admin onayına</strong> gönderilecek. Onay sonrası yayınlanır.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-6">
          {/* Temel Bilgiler */}
          <Section title="📋 Temel Bilgiler">
            <Field label="Restoran Adı *">
              <input required value={form.name} onChange={e => set('name', e.target.value)} maxLength={100}
                className={inputCls} placeholder="ör: Çınar Bahçe" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Şehir *">
                <input required value={form.city} onChange={e => set('city', e.target.value)}
                  className={inputCls} placeholder="Bursa" />
              </Field>
              <Field label="İlçe *">
                <input required value={form.district} onChange={e => set('district', e.target.value)}
                  className={inputCls} placeholder="Osmangazi" />
              </Field>
            </div>
            <Field label="Konum (kısa gösterim) *">
              <input required value={form.location} onChange={e => set('location', e.target.value)}
                className={inputCls} placeholder="Mudanya, Bursa" />
            </Field>
            <Field label="Tam Adres">
              <input value={form.address} onChange={e => set('address', e.target.value)}
                className={inputCls} placeholder="Mah. Cad. No:..." />
            </Field>
            <Field label="Telefon">
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className={inputCls} placeholder="+90 224 ..." />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fiyat Seviyesi *">
                <select value={form.price_level} onChange={e => set('price_level', +e.target.value)} className={inputCls}>
                  <option value={1}>₺ — Uygun Fiyatlı</option>
                  <option value={2}>₺₺ — Orta Segment</option>
                  <option value={3}>₺₺₺ — Üst Segment</option>
                  <option value={4}>₺₺₺₺ — Lüks</option>
                </select>
              </Field>
              <Field label="Kapasite (kişi) *">
                <input type="number" min={1} max={1000} required value={form.capacity}
                  onChange={e => set('capacity', +e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* Açıklamalar */}
          <Section title="📝 Açıklamalar">
            <Field label="Kısa Açıklama * (10–500 karakter)">
              <textarea required value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={2} maxLength={500} className={inputCls + ' resize-none'}
                placeholder="Mekanınızı bir cümleyle tanıtın..." />
              <div className="text-right text-[0.7rem] text-gv-muted">{form.description.length}/500</div>
            </Field>
            <Field label="Detaylı Açıklama">
              <textarea value={form.long_desc}
                onChange={e => set('long_desc', e.target.value)}
                rows={4} maxLength={2000} className={inputCls + ' resize-none'}
                placeholder="Mekanınızın hikayesini, atmosferini, özel anlarını anlatın..." />
            </Field>
          </Section>

          {/* Fotoğraflar */}
          <Section title="📸 Fotoğraflar">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {form.images.map(url => (
                <div key={url} className="relative group rounded-xl overflow-hidden aspect-video bg-gv-cream">
                  <img src={url.startsWith('/uploads') ? `http://localhost:3001${url}` : url}
                    alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(url)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ✕
                  </button>
                </div>
              ))}
              {form.images.length < 8 && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="aspect-video rounded-xl border-2 border-dashed border-gv-cream-dark flex flex-col items-center justify-center text-gv-muted hover:border-gv-orange hover:text-gv-orange transition-all">
                  {uploading
                    ? <span className="text-sm">⏳</span>
                    : <><span className="text-3xl">+</span><span className="text-xs mt-1">Fotoğraf Ekle</span></>
                  }
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <p className="text-xs text-gv-muted">En fazla 8 fotoğraf · JPEG, PNG, WebP · Maks 5MB</p>
          </Section>

          {/* Rozetler */}
          <Section title="🏷️ Deneyim Rozetleri (maks 5 seçin)">
            <div className="flex flex-wrap gap-2">
              {BADGE_OPTIONS.map(b => {
                const active = !!form.badges.find(x => x.label === b.label)
                return (
                  <button key={b.label} type="button" onClick={() => toggleBadge(b)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all
                      ${active
                        ? 'bg-gv-orange text-white border-gv-orange'
                        : 'border-gv-cream-dark text-gv-ink-light hover:border-gv-orange hover:text-gv-orange'
                      } ${!active && form.badges.length >= 5 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    {b.icon} {b.label}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gv-muted">{form.badges.length}/5 seçildi</p>
          </Section>

          {/* Özellikler */}
          <Section title="✨ Özellikler">
            <div className="flex flex-wrap gap-2">
              {FEATURE_OPTIONS.map(f => {
                const active = form.features.includes(f)
                return (
                  <button key={f} type="button" onClick={() => toggleFeature(f)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all
                      ${active
                        ? 'bg-gv-emerald text-white border-gv-emerald'
                        : 'border-gv-cream-dark text-gv-ink-light hover:border-gv-emerald hover:text-gv-emerald'
                      }`}>
                    {active ? '✓ ' : ''}{f}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Çalışma Saatleri */}
          <Section title="🕐 Çalışma Saatleri">
            <div className="flex flex-col gap-2">
              {Object.entries(form.hours).map(([day, hrs]) => (
                <div key={day} className="flex gap-2 items-center">
                  <input value={day}
                    onChange={e => {
                      const newH = {}
                      Object.entries(form.hours).forEach(([k, v]) => { newH[k === day ? e.target.value : k] = v })
                      set('hours', newH)
                    }}
                    className={inputCls + ' w-32 flex-shrink-0'} placeholder="Pzt-Cum" />
                  <input value={hrs}
                    onChange={e => set('hours', { ...form.hours, [day]: e.target.value })}
                    className={inputCls + ' flex-1'} placeholder="12:00–23:00 veya Kapalı" />
                  <button type="button"
                    onClick={() => { const h = { ...form.hours }; delete h[day]; set('hours', h) }}
                    className="text-red-400 hover:text-red-600 text-lg flex-shrink-0 w-8 text-center">✕</button>
                </div>
              ))}
            </div>
            <button type="button"
              onClick={() => set('hours', { ...form.hours, [`Gün ${Object.keys(form.hours).length + 1}`]: '' })}
              className="text-xs font-bold text-gv-orange hover:underline mt-1">
              + Saat Ekle
            </button>
          </Section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2 pb-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gv-cream-dark text-gv-muted font-semibold text-sm hover:border-gv-ink hover:text-gv-ink transition-all">
              İptal
            </button>
            <button type="submit" disabled={saving}
              className="flex-[2] py-3 rounded-xl bg-gv-orange text-white font-bold text-sm hover:bg-gv-orange-dark disabled:opacity-60 transition-all hover:-translate-y-0.5">
              {saving ? '⋯ Kaydediliyor...' : isEdit ? '✓ Güncelle' : '🚀 Başvuru Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Helpers ─────────────────────────────────────────────────── */
const inputCls = 'w-full bg-gv-cream border-2 border-transparent focus:border-gv-orange rounded-xl px-4 py-2.5 text-sm outline-none transition-colors text-gv-ink'

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-gv-muted mb-3">{title}</h4>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gv-ink-light mb-1.5">{label}</label>
      {children}
    </div>
  )
}
