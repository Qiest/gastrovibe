// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGlobalToast } from '../App'
import AuthModal from '../components/AuthModal'

const PRICE_MAP = { 1:'₺', 2:'₺₺', 3:'₺₺₺', 4:'₺₺₺₺' }
const STATUS = {
  confirmed: { label:'Onaylı',      cls:'bg-green-100 text-green-700',  icon:'✅' },
  cancelled: { label:'İptal',       cls:'bg-red-100 text-red-500',      icon:'❌' },
  completed: { label:'Tamamlandı',  cls:'bg-gray-100 text-gray-500',    icon:'🏁' },
}

function ReservationCard({ reservation: r, onCancel }) {
  const s       = STATUS[r.status] || STATUS.confirmed
  const isUpcoming = r.is_upcoming
  const date    = new Date(r.date).toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric', weekday:'long' })

  return (
    <div className={`bg-gv-white rounded-2xl overflow-hidden shadow-card transition-all ${isUpcoming ? 'ring-2 ring-gv-orange/30' : ''}`}>
      <div className="flex gap-0">
        {r.image_url && (
          <img src={r.image_url} alt={r.restaurant_name}
            className="w-24 h-full object-cover flex-shrink-0 min-h-[90px]" />
        )}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-playfair font-bold text-gv-ink text-base leading-tight">
                {r.restaurant_name}
              </div>
              <div className="text-xs text-gv-muted mt-0.5">{r.location}</div>
            </div>
            <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${s.cls}`}>
              {s.icon} {s.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gv-ink-light">
            <span>📅 {date}</span>
            <span>🕐 {r.time}</span>
            <span>👥 {r.party_size} kişi</span>
            <span className="font-bold text-gv-emerald">{PRICE_MAP[r.price_level] || '₺₺'}</span>
          </div>

          {r.note && !r.note.startsWith('[İPTAL') && (
            <div className="mt-2 text-[0.72rem] text-gv-muted italic bg-gv-cream px-3 py-1.5 rounded-lg">
              "{r.note}"
            </div>
          )}
          {r.note?.startsWith('[İPTAL') && (
            <div className="mt-2 text-[0.72rem] text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">
              {r.note.replace(/\[|\]/g, '')}
            </div>
          )}

          {r.status === 'confirmed' && isUpcoming && (
            <button
              onClick={() => onCancel(r)}
              className="mt-3 text-[0.72rem] font-bold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1">
              ✕ Rezervasyonu İptal Et
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FavoriteCard({ restaurant: r }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/restaurants?search=${r.name}`)}
      className="bg-gv-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all cursor-pointer group">
      {r.image_url && (
        <img src={r.image_url} alt={r.name} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
      )}
      <div className="p-4">
        <div className="font-playfair font-bold text-gv-ink text-sm">{r.name}</div>
        <div className="text-xs text-gv-muted mt-0.5">{r.location}</div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-bold text-gv-emerald">{r.price}</span>
          <span className="text-xs text-amber-400">★ {r.rating}</span>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, authFetch, logout } = useAuth()
  const navigate = useNavigate()
  const { success, error: toastError, info } = useGlobalToast()

  const [tab,          setTab]          = useState('upcoming')
  const [reservations, setReservations] = useState([])
  const [favorites,    setFavorites]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling,   setCancelling]   = useState(false)
  const [editMode,     setEditMode]     = useState(false)
  const [profile,      setProfile]      = useState({ name: '', phone: '', avatar: '👤' })
  const [saving,       setSaving]       = useState(false)
  const [showAuth,     setShowAuth]     = useState(false)

  useEffect(() => {
    if (!user) return
    setProfile({ name: user.name, phone: user.phone || '', avatar: user.avatar || '👤' })
  }, [user])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      authFetch('/api/reservations/mine').then(r => r.json()),
      authFetch('/api/favorites/mine').then(r => r.json()),
    ]).then(([res, fav]) => {
      setReservations(res.reservations || [])
      setFavorites(fav.favorites || [])
    }).finally(() => setLoading(false))
  }, [user])

  const upcoming = reservations.filter(r => r.is_upcoming)
  const past     = reservations.filter(r => !r.is_upcoming)

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      const res  = await authFetch(`/api/reservations/${cancelTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReservations(prev => prev.map(r =>
        r.id === cancelTarget.id ? { ...r, status: 'cancelled', is_upcoming: false } : r
      ))
      success('Rezervasyon iptal edildi. Onay e-postası gönderildi.')
      setCancelTarget(null)
    } catch (err) {
      toastError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res  = await authFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify(profile) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      success('Profil güncellendi ✅')
      setEditMode(false)
    } catch (err) {
      toastError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gv-cream flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="font-playfair font-black text-2xl text-gv-ink mb-3">Giriş Yapın</h2>
          <p className="text-gv-muted text-sm mb-6">Profilinizi görüntülemek için giriş yapmanız gerekiyor.</p>
          <button onClick={() => setShowAuth(true)}
            className="bg-gv-orange text-white font-bold px-7 py-3 rounded-full hover:bg-gv-orange-dark transition-all">
            Giriş Yap
          </button>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    )
  }

  const TABS = [
    { key:'upcoming',  label:`Yaklaşan (${upcoming.length})`  },
    { key:'past',      label:`Geçmiş (${past.length})`        },
    { key:'favorites', label:`Favoriler (${favorites.length})` },
    { key:'settings',  label:'⚙️ Ayarlar'                    },
  ]

  return (
    <>
      <div className="min-h-screen bg-gv-cream pt-24 pb-20">

        {/* Hero banner */}
        <div className="bg-gv-emerald px-8 md:px-16 py-10 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gv-orange flex items-center justify-center text-3xl shadow-orange-glow">
              {user.avatar}
            </div>
            <div>
              <h1 className="font-playfair font-black text-white text-2xl">{user.name}</h1>
              <p className="text-white/60 text-sm mt-0.5">{user.email}</p>
              {user.phone && <p className="text-white/50 text-xs mt-0.5">📞 {user.phone}</p>}
            </div>
            <div className="ml-auto flex gap-3">
              <button onClick={() => setEditMode(true)}
                className="text-xs font-bold px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                ✏️ Düzenle
              </button>
              <button
                onClick={() => { logout(); navigate('/') }}
                className="text-xs font-bold px-4 py-2 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all">
                Çıkış
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-6">
            {[
              { icon:'📅', label:'Rezervasyon',  value: reservations.length },
              { icon:'⏳', label:'Yaklaşan',     value: upcoming.length      },
              { icon:'❤️', label:'Favori',       value: favorites.length     },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-black text-white font-playfair">{s.value}</div>
                <div className="text-white/50 text-xs">{s.icon} {s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 md:px-16">
          <div className="flex gap-1 bg-gv-white rounded-2xl p-1.5 shadow-card mb-8 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap px-3
                  ${tab === t.key
                    ? 'bg-gv-orange text-white shadow-orange-glow'
                    : 'text-gv-muted hover:text-gv-ink'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 text-gv-muted">
              <div className="text-4xl mb-3 animate-bounce">⏳</div>
              <p className="text-sm">Yükleniyor...</p>
            </div>
          ) : tab === 'upcoming' ? (
            <div className="flex flex-col gap-4">
              {upcoming.length === 0 ? (
                <EmptyState
                  icon="📅"
                  title="Yaklaşan rezervasyon yok"
                  desc="Henüz gelecek bir rezervasyonunuz bulunmuyor."
                  cta="Mekan Keşfet"
                  onClick={() => navigate('/restaurants')}
                />
              ) : upcoming.map(r => (
                <ReservationCard key={r.id} reservation={r} onCancel={setCancelTarget} />
              ))}
            </div>
          ) : tab === 'past' ? (
            <div className="flex flex-col gap-4">
              {past.length === 0 ? (
                <EmptyState icon="🏁" title="Geçmiş deneyim yok" desc="Tamamlanan rezervasyonlarınız burada görünür." />
              ) : past.map(r => (
                <ReservationCard key={r.id} reservation={r} onCancel={setCancelTarget} />
              ))}
            </div>
          ) : tab === 'favorites' ? (
            favorites.length === 0 ? (
              <EmptyState
                icon="❤️"
                title="Favori mekan yok"
                desc="Restoran kartlarındaki kalp ikonuna tıklayarak favorilere ekleyin."
                cta="Mekanları Keşfet"
                onClick={() => navigate('/restaurants')}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {favorites.map(r => <FavoriteCard key={r.id} restaurant={r} />)}
              </div>
            )
          ) : tab === 'settings' ? (
            <SettingsTab
              profile={profile}
              setProfile={setProfile}
              editMode={editMode}
              setEditMode={setEditMode}
              onSave={handleSaveProfile}
              saving={saving}
              onLogout={() => { logout(); navigate('/') }}
            />
          ) : null}
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" onClick={() => setCancelTarget(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-gv-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center"
            style={{ animation: 'panelUp 0.3s ease' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="font-playfair font-bold text-gv-ink text-xl mb-2">Rezervasyonu İptal Et?</h3>
            <p className="text-gv-muted text-sm mb-1">
              <strong>{cancelTarget.restaurant_name}</strong>
            </p>
            <p className="text-gv-muted text-sm mb-6">
              {cancelTarget.date} · {cancelTarget.time} · {cancelTarget.party_size} kişi
            </p>
            <p className="text-xs text-gv-muted mb-6 bg-gv-cream rounded-xl px-4 py-3">
              İptal onay e-postası adresinize gönderilecektir.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)}
                className="flex-1 py-3 rounded-xl border-2 border-gv-cream-dark text-gv-muted font-semibold text-sm hover:border-gv-ink transition-all">
                Vazgeç
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-60 transition-all">
                {cancelling ? '⋯' : '✕ İptal Et'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SettingsTab({ profile, setProfile, editMode, setEditMode, onSave, saving, onLogout }) {
  const AVATARS = ['👤','🍽️','👨‍🍳','🥂','🌮','🍣','🥩','🌿','☕','🎸']
  return (
    <div className="max-w-md">
      <h3 className="font-playfair font-bold text-gv-ink text-xl mb-6">Hesap Ayarları</h3>
      <form onSubmit={onSave} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gv-muted mb-2">Ad Soyad</label>
          <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            className="w-full bg-gv-white border-2 border-gv-cream-dark focus:border-gv-orange rounded-xl px-4 py-3 text-sm outline-none transition-colors text-gv-ink" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gv-muted mb-2">Telefon</label>
          <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
            placeholder="+90 5__ ___ __ __"
            className="w-full bg-gv-white border-2 border-gv-cream-dark focus:border-gv-orange rounded-xl px-4 py-3 text-sm outline-none transition-colors text-gv-ink" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gv-muted mb-2">Avatar</label>
          <div className="flex gap-2 flex-wrap">
            {AVATARS.map(a => (
              <button key={a} type="button" onClick={() => setProfile(p => ({ ...p, avatar: a }))}
                className={`w-10 h-10 text-xl rounded-xl transition-all ${profile.avatar === a ? 'bg-gv-orange shadow-orange-glow scale-110' : 'bg-gv-cream hover:bg-gv-cream-dark'}`}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="bg-gv-orange text-white font-bold py-3 rounded-xl hover:bg-gv-orange-dark disabled:opacity-60 transition-all text-sm">
          {saving ? '⋯ Kaydediliyor...' : 'Değişiklikleri Kaydet ✓'}
        </button>
      </form>
      <div className="mt-8 pt-6 border-t border-gv-cream-dark">
        <button onClick={onLogout}
          className="w-full py-3 rounded-xl border-2 border-red-200 text-red-400 font-bold text-sm hover:bg-red-50 transition-all">
          Çıkış Yap
        </button>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, desc, cta, onClick }) {
  return (
    <div className="text-center py-16 bg-gv-white rounded-2xl shadow-card">
      <div className="text-5xl mb-4">{icon}</div>
      <h4 className="font-playfair font-bold text-gv-ink text-lg mb-2">{title}</h4>
      <p className="text-gv-muted text-sm mb-6 max-w-xs mx-auto">{desc}</p>
      {cta && (
        <button onClick={onClick}
          className="bg-gv-orange text-white font-bold px-7 py-3 rounded-full hover:bg-gv-orange-dark transition-all text-sm">
          {cta} →
        </button>
      )}
    </div>
  )
}
