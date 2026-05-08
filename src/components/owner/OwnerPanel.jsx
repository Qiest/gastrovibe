/**
 * src/components/owner/OwnerPanel.jsx
 * Restoran sahibi tam paneli — modal olarak açılır
 * Sekmeler: Genel Bakış | Restoranım | Rezervasyonlar | Yorumlar
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

const BADGE_OPTIONS = [
  { icon:'🌲', label:'Orman İçinde', color:'green' },
  { icon:'🌊', label:'Deniz Kenarı', color:'blue'  },
  { icon:'🎶', label:'Canlı Müzik',  color:'dark'  },
  { icon:'🚗', label:'Vale Servisi', color:'orange'},
  { icon:'🕯️', label:'Romantik',    color:'amber' },
  { icon:'🌿', label:'Organik',      color:'green' },
  { icon:'🔥', label:'Ocakbaşı',     color:'orange'},
  { icon:'🥩', label:'Et Uzmanlığı', color:'dark'  },
  { icon:'🍷', label:'Şarap Listesi',color:'amber' },
  { icon:'🌸', label:'Bahçe',        color:'green' },
  { icon:'🏛️', label:'Tarihi Yapı',  color:'dark'  },
  { icon:'❄️', label:'Sezonluk',     color:'blue'  },
  { icon:'👨‍👩‍👧', label:'Aile Dostu',  color:'green' },
  { icon:'✨', label:'Fine Dining',  color:'orange'},
  { icon:'🌅', label:'Manzaralı',    color:'blue'  },
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

export default function OwnerPanel({ onClose }) {
  const { authFetch } = useAuth()
  const [tab,          setTab]          = useState('overview')
  const [stats,        setStats]        = useState(null)
  const [restaurants,  setRestaurants]  = useState([])
  const [reservations, setReservations] = useState([])
  const [reviews,      setReviews]      = useState([])
  const [editTarget,   setEditTarget]   = useState(null)  // null=yeni, obj=düzenle
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
          {/* Toast */}
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
          <div className="flex border-b border-gv-cream-dark flex-shrink-0 bg-gv-white">
            {[
              { key:'overview',      label:'📊 Genel Bakış'    },
              { key:'restaurant',    label:'🍽️ Restoranım'     },
              { key:'reservations',  label:`📅 Rezervasyonlar${stats?.pendingReservations > 0 ? ` (${stats.pendingReservations})` : ''}` },
              { key:'reviews',       label:'⭐ Yorumlar'        },
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
                <div className="text-4xl mb-3 animate-spin inline-block">⋯</div>
                <p>Yükleniyor...</p>
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

// ─── Overview ─────────────────────────────────────────────────
function OverviewTab({ stats, restaurants }) {
  if (!stats) return null
  const cards = [
    { icon:'📅', label:'Toplam Rezervasyon',  value: stats.totalReservations  },
    { icon:'🕐', label:'Bugünkü Rezervasyon', value: stats.todayReservations  },
    { icon:'⭐', label:'Ortalama Puan',        value: stats.avgRating || '—'   },
    { icon:'❤️', label:'Toplam Favori',        value: stats.totalFavorites     },
    { icon:'💬', label:'Yorum Sayısı',         value: stats.totalReviews       },
    { icon:'🍽️', label:'Restoranlarım',        value: stats.restaurants        },
  ]
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-gv-cream rounded-2xl p-5">
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="font-playfair text-3xl font-bold text-gv-ink mb-1">{c.value}</div>
            <div className="text-xs text-gv-muted font-medium">{c.label}</div>
          </div>
        ))}
      </div>
      {restaurants.length > 0 && (
        <div>
          <h3 className="font-playfair text-lg font-bold text-gv-ink mb-4">Restoranlarınız</h3>
          <div className="flex flex-col gap-3">
            {restaurants.map(r => {
              const s = STATUS_BADGE[r.status] || STATUS_BADGE.pending
              const imgs = Array.isArray(r.images) ? r.images : []
              return (
                <div key={r.id} className="bg-gv-cream rounded-2xl flex overflow-hidden gap-4 items-center">
                  <img src={imgs[0] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=60'} alt={r.name} className="w-20 h-16 object-cover flex-shrink-0" />
                  <div className="flex-1 py-3 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gv-ink">{r.name}</span>
                      <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="text-xs text-gv-muted mt-0.5">{r.location} · {r.price}</div>
                    {r.status === 'rejected' && <div className="text-xs text-red-500 mt-1">Güncelleme yapıp tekrar başvurabilirsiniz.</div>}
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

// ─── Restaurant Tab ───────────────────────────────────────────
function RestaurantTab({ restaurants, onNew, onEdit, onRefresh, flash, authFetch }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-playfair text-xl font-bold text-gv-ink">Restoranlarım</h3>
        {restaurants.length < 3 && (
          <button onClick={onNew} className="bg-gv-orange text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gv-orange-dark transition-all hover:-translate-y-0.5">
            + Yeni Restoran Ekle
          </button>
        )}
      </div>

      {restaurants.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-gv-muted text-sm mb-4">Henüz restoranınız yok.</p>
          <button onClick={onNew} className="bg-gv-orange text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-gv-orange-dark transition-all">
            İlk Restoranımı Ekle
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {restaurants.map(r => {
            const s = STATUS_BADGE[r.status] || STATUS_BADGE.pending
            const imgs = Array.isArray(r.images) ? r.images : []
            return (
              <div key={r.id} className="bg-gv-cream rounded-2xl overflow-hidden">
                <div className="flex gap-4 p-4 items-start">
                  <img src={imgs[0] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=60'} alt={r.name} className="w-24 h-20 object-cover rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="font-playfair font-bold text-gv-ink text-base">{r.name}</div>
                        <div className="text-xs text-gv-muted">{r.location} · {r.price} · Kapasite: {r.capacity} kişi</div>
                      </div>
                      <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${s.cls}`}>{s.label}</span>
                    </div>
                    <p className="text-xs text-gv-ink-light mt-2 line-clamp-2">{r.description}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => onEdit(r)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gv-orange text-white hover:bg-gv-orange-dark transition-all">✏️ Düzenle</button>
                      <span className="text-xs text-gv-muted self-center">
                        {imgs.length} fotoğraf · {Array.isArray(r.badges) ? r.badges.length : 0} rozet
                      </span>
                    </div>
                  </div>
                </div>
                {r.status === 'rejected' && (
                  <div className="px-4 pb-4">
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3">
                      ⚠️ Restoranınız reddedildi. Bilgileri güncelleyip tekrar başvurabilirsiniz.
                    </div>
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

// ─── Reservations Tab ─────────────────────────────────────────
function ReservationsTab({ reservations, onStatusChange }) {
  const [filter, setFilter] = useState('confirmed')
  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter)

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {[['all','Tümü'],['confirmed','Onaylı'],['completed','Tamamlandı'],['cancelled','İptal']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${filter===v ? 'bg-gv-orange text-white' : 'bg-gv-cream text-gv-muted hover:text-gv-ink'}`}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gv-muted text-sm">Bu filtrede rezervasyon yok.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(r => {
            const s = RES_STATUS[r.status] || RES_STATUS.confirmed
            return (
              <div key={r.id} className="bg-gv-cream rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-semibold text-sm text-gv-ink">{r.user_name}</div>
                    <div className="text-xs text-gv-muted">{r.user_email}</div>
                    <div className="flex gap-3 mt-1.5 text-xs text-gv-ink-light flex-wrap">
                      <span>📅 {r.date}</span>
                      <span>🕐 {r.time}</span>
                      <span>👥 {r.party_size} kişi</span>
                      <span className="font-medium text-gv-orange">{r.restaurant_name}</span>
                    </div>
                    {r.note && <div className="text-xs text-gv-muted mt-1 italic">"{r.note}"</div>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                    {r.status === 'confirmed' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => onStatusChange(r.id, 'completed')}
                          className="text-[0.65rem] font-bold px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-all">
                          ✓ Tamamlandı
                        </button>
                        <button onClick={() => onStatusChange(r.id, 'cancelled')}
                          className="text-[0.65rem] font-bold px-2.5 py-1 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-all">
                          ✕ İptal
                        </button>
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

// ─── Reviews Tab ──────────────────────────────────────────────
function ReviewsTab({ reviews }) {
  if (reviews.length === 0) return (
    <div className="text-center py-16 text-gv-muted text-sm">Henüz yorum yok.</div>
  )
  return (
    <div className="flex flex-col gap-3">
      {reviews.map(r => (
        <div key={r.id} className="bg-gv-cream rounded-2xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{r.author_avatar}</span>
              <div>
                <div className="font-semibold text-sm text-gv-ink">{r.author_name}</div>
                <div className="text-xs text-gv-muted">{r.restaurant_name} · {r.visit_type}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
              {'★'.repeat(r.rating)}<span className="text-gray-200">{'★'.repeat(5-r.rating)}</span>
            </div>
          </div>
          <p className="text-sm text-gv-ink-light mt-2 leading-relaxed">"{r.text}"</p>
          <div className="text-xs text-gv-muted mt-2">{new Date(r.created_at).toLocaleDateString('tr-TR')}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Restaurant Form Modal ────────────────────────────────────
function RestaurantForm({ existing, onClose, onSuccess, authFetch }) {
  const isEdit = !!existing
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name:        existing?.name        || '',
    location:    existing?.location    || '',
    district:    existing?.district    || '',
    city:        existing?.city        || 'Bursa',
    description: existing?.description || '',
    long_desc:   existing?.long_desc   || '',
    phone:       existing?.phone       || '',
    address:     existing?.address     || '',
    price_level: existing?.price_level || 2,
    capacity:    existing?.capacity    || 50,
    hours:       existing?.hours       || { 'Her Gün': '12:00–23:00' },
    images:      existing?.images      || [],
    badges:      existing?.badges      || [],
    features:    existing?.features    || [],
  })
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res  = await authFetch('/api/upload', { method: 'POST', headers: {}, body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set('images', [...form.images, data.url])
    } catch (err) { setError(err.message) } finally { setUploading(false) }
  }

  const removeImage = (url) => set('images', form.images.filter(i => i !== url))

  const toggleBadge = (badge) => {
    const exists = form.badges.find(b => b.label === badge.label)
    if (exists) set('badges', form.badges.filter(b => b.label !== badge.label))
    else if (form.badges.length < 5) set('badges', [...form.badges, badge])
  }

  const toggleFeature = (f) => {
    if (form.features.includes(f)) set('features', form.features.filter(x => x !== f))
    else set('features', [...form.features, f])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      const url    = isEdit ? `/api/owner/restaurant/${existing.id}` : '/api/owner/restaurant'
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await authFetch(url, { method, body: JSON.stringify(form) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSuccess(data.message)
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-gv-white rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col"
        style={{ maxWidth: 680, maxHeight: '92vh', animation: 'panelUp 0.25s ease' }}
        onClick={e => e.stopPropagation()}>

        <div className="bg-gv-emerald px-7 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="font-playfair font-bold text-white text-xl">{isEdit ? '✏️ Restoranı Düzenle' : '🍽️ Yeni Restoran Ekle'}</div>
            <div className="text-white/60 text-xs mt-0.5">Bilgiler admin onayından sonra yayınlanır</div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-7 py-6 flex flex-col gap-5">

          {/* Temel Bilgiler */}
          <Section title="📋 Temel Bilgiler">
            <Field label="Restoran Adı *">
              <input required value={form.name} onChange={e=>set('name',e.target.value)} maxLength={100}
                className={inputCls} placeholder="ör: Çınar Bahçe" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Şehir *">
                <input required value={form.city} onChange={e=>set('city',e.target.value)} className={inputCls} placeholder="Bursa" />
              </Field>
              <Field label="İlçe *">
                <input required value={form.district} onChange={e=>set('district',e.target.value)} className={inputCls} placeholder="Osmangazi" />
              </Field>
            </div>
            <Field label="Konum (kısa) *">
              <input required value={form.location} onChange={e=>set('location',e.target.value)} className={inputCls} placeholder="Mudanya, Bursa" />
            </Field>
            <Field label="Tam Adres">
              <input value={form.address} onChange={e=>set('address',e.target.value)} className={inputCls} placeholder="Mah. Cad. No:..." />
            </Field>
            <Field label="Telefon">
              <input value={form.phone} onChange={e=>set('phone',e.target.value)} className={inputCls} placeholder="+90 224 ..." />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fiyat Seviyesi *">
                <select value={form.price_level} onChange={e=>set('price_level',+e.target.value)} className={inputCls}>
                  <option value={1}>₺ — Uygun</option>
                  <option value={2}>₺₺ — Orta</option>
                  <option value={3}>₺₺₺ — Üst Segment</option>
                  <option value={4}>₺₺₺₺ — Lüks</option>
                </select>
              </Field>
              <Field label="Kapasite (kişi) *">
                <input type="number" min={1} max={1000} required value={form.capacity}
                  onChange={e=>set('capacity',+e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* Açıklamalar */}
          <Section title="📝 Açıklamalar">
            <Field label="Kısa Açıklama * (10-500 karakter)">
              <textarea required value={form.description} onChange={e=>set('description',e.target.value)}
                rows={2} maxLength={500} className={inputCls + ' resize-none'}
                placeholder="Mekanınızı bir cümleyle tanıtın..." />
              <div className="text-right text-[0.7rem] text-gv-muted">{form.description.length}/500</div>
            </Field>
            <Field label="Detaylı Açıklama">
              <textarea value={form.long_desc} onChange={e=>set('long_desc',e.target.value)}
                rows={4} maxLength={2000} className={inputCls + ' resize-none'}
                placeholder="Mekanınızın hikayesini, atmosferini, özel anlarını anlatın..." />
            </Field>
          </Section>

          {/* Fotoğraflar */}
          <Section title="📸 Fotoğraflar">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {form.images.map(url => (
                <div key={url} className="relative group rounded-xl overflow-hidden aspect-video bg-gv-cream">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(url)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ✕
                  </button>
                </div>
              ))}
              {form.images.length < 8 && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="aspect-video rounded-xl border-2 border-dashed border-gv-cream-dark flex flex-col items-center justify-center text-gv-muted hover:border-gv-orange hover:text-gv-orange transition-all cursor-pointer">
                  {uploading ? <span className="text-sm animate-spin">⋯</span> : <><span className="text-2xl">+</span><span className="text-xs mt-1">Fotoğraf Ekle</span></>}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <p className="text-xs text-gv-muted">En fazla 8 fotoğraf · JPEG, PNG, WebP · Maks 5MB</p>
          </Section>

          {/* Rozetler */}
          <Section title="🏷️ Deneyim Rozetleri (maks 5)">
            <div className="flex flex-wrap gap-2">
              {BADGE_OPTIONS.map(b => {
                const active = !!form.badges.find(x => x.label === b.label)
                return (
                  <button key={b.label} type="button" onClick={() => toggleBadge(b)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all ${active ? 'bg-gv-orange text-white border-gv-orange' : 'border-gv-cream-dark text-gv-ink-light hover:border-gv-orange hover:text-gv-orange'}`}>
                    {b.icon} {b.label}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Özellikler */}
          <Section title="✨ Özellikler">
            <div className="flex flex-wrap gap-2">
              {FEATURE_OPTIONS.map(f => {
                const active = form.features.includes(f)
                return (
                  <button key={f} type="button" onClick={() => toggleFeature(f)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all ${active ? 'bg-gv-emerald text-white border-gv-emerald' : 'border-gv-cream-dark text-gv-ink-light hover:border-gv-emerald hover:text-gv-emerald'}`}>
                    {active ? '✓ ' : ''}{f}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Çalışma Saatleri */}
          <Section title="🕐 Çalışma Saatleri">
            {Object.entries(form.hours).map(([day, hours]) => (
              <div key={day} className="flex gap-2 items-center">
                <input value={day} onChange={e => {
                  const newH = {}; Object.entries(form.hours).forEach(([k,v]) => { newH[k===day?e.target.value:k] = v }); set('hours', newH)
                }} className={inputCls + ' w-32 flex-shrink-0'} placeholder="Pzt-Cum" />
                <input value={hours} onChange={e => set('hours', {...form.hours, [day]: e.target.value})}
                  className={inputCls + ' flex-1'} placeholder="12:00–23:00 veya Kapalı" />
                <button type="button" onClick={() => { const h={...form.hours}; delete h[day]; set('hours',h) }}
                  className="text-red-400 hover:text-red-600 text-lg flex-shrink-0">✕</button>
              </div>
            ))}
            <button type="button"
              onClick={() => set('hours', {...form.hours, [`Gün ${Object.keys(form.hours).length+1}`]: ''})}
              className="text-xs font-bold text-gv-orange hover:underline">
              + Saat Ekle
            </button>
          </Section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2 pb-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gv-cream-dark text-gv-muted font-semibold text-sm hover:border-gv-ink hover:text-gv-ink transition-all">
              İptal
            </button>
            <button type="submit" disabled={saving}
              className="flex-2 flex-grow-[2] py-3 rounded-xl bg-gv-orange text-white font-bold text-sm hover:bg-gv-orange-dark disabled:opacity-60 transition-all hover:-translate-y-0.5">
              {saving ? '⋯ Kaydediliyor...' : isEdit ? '✓ Güncelle' : '🚀 Başvur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
