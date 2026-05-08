/**
 * src/components/ProfileModal.jsx
 * Kullanıcı profili: Rezervasyonlar + Favoriler
 * — Rezervasyon güncelleme ve iptal
 * — Favoriden çıkarma
 * — Yükleme ve boş state yönetimi
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import ReservationModal from './ReservationModal'

const PRICE_MAP = { 1:'₺', 2:'₺₺', 3:'₺₺₺', 4:'₺₺₺₺' }
const STATUS_STYLES = {
  confirmed: { label: 'Onaylı',      cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal',       cls: 'bg-red-100 text-red-500'     },
  completed: { label: 'Tamamlandı',  cls: 'bg-gray-100 text-gray-500'   },
}

export default function ProfileModal({ onClose }) {
  const { user, logout, authFetch } = useAuth()
  const [tab,          setTab]          = useState('reservations')
  const [reservations, setReservations] = useState([])
  const [favorites,    setFavorites]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [editTarget,   setEditTarget]   = useState(null)  // rezervasyon güncelleme
  const [cancelLoading, setCancelLoading] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resData, favData] = await Promise.all([
        authFetch('/api/reservations/mine').then(r => r.json()),
        authFetch('/api/favorites/mine').then(r => r.json()),
      ])
      setReservations(resData.reservations || [])
      setFavorites(favData.favorites || [])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => { fetchData() }, [fetchData])

  const cancelReservation = async (id) => {
    if (!confirm('Rezervasyonu iptal etmek istediğinize emin misiniz?')) return
    setCancelLoading(id)
    try {
      const res = await authFetch(`/api/reservations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
      } else {
        const data = await res.json()
        alert(data.error)
      }
    } finally {
      setCancelLoading(null)
    }
  }

  const unfavorite = async (restaurantId) => {
    await authFetch(`/api/favorites/${restaurantId}`, { method: 'POST' })
    setFavorites(prev => prev.filter(f => f.id !== restaurantId))
  }

  const activeRes    = reservations.filter(r => r.status === 'confirmed')
  const pastRes      = reservations.filter(r => r.status !== 'confirmed')

  return (
    <>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative bg-gv-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
          style={{ maxHeight: '88vh', animation: 'panelUp 0.3s ease' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Profil başlık */}
          <div className="bg-gv-emerald px-7 py-5 flex items-center gap-4 flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gv-orange flex items-center justify-center text-3xl shadow-md">
              {user?.avatar || '👤'}
            </div>
            <div>
              <div className="font-playfair font-bold text-white text-lg">{user?.name}</div>
              <div className="text-white/60 text-xs">{user?.email}</div>
              <div className="text-white/40 text-xs mt-0.5">
                {activeRes.length} aktif rezervasyon · {favorites.length} favori
              </div>
            </div>
            <div className="ml-auto flex gap-2 items-center">
              <button
                onClick={() => { logout(); onClose() }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all"
              >
                Çıkış
              </button>
              <button onClick={onClose} className="text-white/60 hover:text-white text-xl ml-1">✕</button>
            </div>
          </div>

          {/* Sekmeler */}
          <div className="flex border-b border-gv-cream-dark flex-shrink-0">
            {[
              { key: 'reservations', label: `📅 Rezervasyonlar`, count: activeRes.length },
              { key: 'favorites',    label: `❤️ Favoriler`,       count: favorites.length },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2
                  ${tab === t.key ? 'text-gv-orange border-b-2 border-gv-orange' : 'text-gv-muted hover:text-gv-ink'}`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`text-[0.65rem] px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-gv-orange text-white' : 'bg-gv-cream text-gv-muted'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* İçerik */}
          <div className="overflow-y-auto flex-1 p-5">
            {loading ? (
              <div className="text-center py-12 text-gv-muted text-sm">
                <div className="text-3xl mb-3 animate-spin">⋯</div>
                Yükleniyor...
              </div>
            ) : tab === 'reservations' ? (
              reservations.length === 0 ? (
                <EmptyState icon="📅" title="Henüz rezervasyon yok" sub='Restoran kartındaki "Rezervasyon" butonuna tıklayın.' />
              ) : (
                <div className="flex flex-col gap-3">
                  {activeRes.length > 0 && (
                    <>
                      <p className="text-xs font-bold uppercase tracking-wider text-gv-muted">Aktif</p>
                      {activeRes.map(r => (
                        <ReservationRow
                          key={r.id} r={r}
                          onCancel={() => cancelReservation(r.id)}
                          onEdit={() => setEditTarget(r)}
                          cancelLoading={cancelLoading === r.id}
                        />
                      ))}
                    </>
                  )}
                  {pastRes.length > 0 && (
                    <>
                      <p className="text-xs font-bold uppercase tracking-wider text-gv-muted mt-2">Geçmiş</p>
                      {pastRes.map(r => <ReservationRow key={r.id} r={r} past />)}
                    </>
                  )}
                </div>
              )
            ) : (
              favorites.length === 0 ? (
                <EmptyState icon="❤️" title="Henüz favori mekan yok" sub="Restoran kartlarındaki kalp ikonuna tıklayın." />
              ) : (
                <div className="flex flex-col gap-3">
                  {favorites.map(r => (
                    <FavoriteRow key={r.id} r={r} onUnfav={() => unfavorite(r.id)} />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {editTarget && (
        <ReservationModal
          restaurant={{ id: editTarget.restaurant_id, name: editTarget.restaurant_name, image_url: editTarget.image_url, location: editTarget.location, price_level: editTarget.price_level }}
          existing={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { setEditTarget(null); fetchData() }}
        />
      )}
    </>
  )
}

function ReservationRow({ r, onCancel, onEdit, cancelLoading, past }) {
  const s = STATUS_STYLES[r.status] || STATUS_STYLES.confirmed
  const PRICE_MAP = { 1:'₺', 2:'₺₺', 3:'₺₺₺', 4:'₺₺₺₺' }

  return (
    <div className={`bg-gv-cream rounded-2xl overflow-hidden flex ${past ? 'opacity-60' : ''}`}>
      <img src={r.image_url} alt={r.restaurant_name} className="w-20 flex-shrink-0 object-cover" style={{ minHeight: '80px' }} />
      <div className="flex-1 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-sm text-gv-ink">{r.restaurant_name}</div>
            <div className="text-xs text-gv-muted">{r.location} · {PRICE_MAP[r.price_level]}</div>
          </div>
          <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.cls}`}>{s.label}</span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-gv-ink-light flex-wrap">
          <span>📅 {r.date}</span>
          <span>🕐 {r.time}</span>
          <span>👥 {r.party_size} kişi</span>
        </div>
        {r.note && <div className="text-xs text-gv-muted mt-1 italic">"{r.note}"</div>}
        {r.status === 'confirmed' && (
          <div className="flex gap-3 mt-2">
            <button onClick={onEdit} className="text-[0.65rem] font-bold text-gv-orange hover:underline transition-colors">
              ✏️ Güncelle
            </button>
            <button
              onClick={onCancel} disabled={cancelLoading}
              className="text-[0.65rem] font-bold text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {cancelLoading ? '⋯' : '✕ İptal Et'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FavoriteRow({ r, onUnfav }) {
  const PRICE_MAP = { 1:'₺', 2:'₺₺', 3:'₺₺₺', 4:'₺₺₺₺' }
  return (
    <div className="bg-gv-cream rounded-2xl overflow-hidden flex">
      <img src={r.image_url} alt={r.name} className="w-20 flex-shrink-0 object-cover" style={{ minHeight: '80px' }} />
      <div className="flex-1 p-3.5 flex justify-between items-start">
        <div>
          <div className="font-semibold text-sm text-gv-ink">{r.name}</div>
          <div className="text-xs text-gv-muted">{r.location}</div>
          <div className="text-xs font-bold text-gv-emerald mt-0.5">{PRICE_MAP[r.price_level]}</div>
          {r.cuisine_type && <div className="text-xs text-gv-muted mt-0.5">🍴 {r.cuisine_type}</div>}
        </div>
        <button onClick={onUnfav} title="Favorilerden çıkar" className="text-xl hover:scale-110 transition-transform">❤️</button>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="text-center py-14">
      <div className="text-5xl mb-3">{icon}</div>
      <div className="text-gv-muted text-sm font-medium">{title}</div>
      {sub && <p className="text-xs text-gv-muted mt-1">{sub}</p>}
    </div>
  )
}
