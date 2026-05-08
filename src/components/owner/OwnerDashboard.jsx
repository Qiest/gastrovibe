/**
 * src/components/owner/OwnerDashboard.jsx
 * Restoran sahibi ana dashboard sayfası
 * — Onay durumu takibi
 * — Canlı istatistikler
 * — Rezervasyon yönetimi
 * — Mekan önizleme
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import OwnerPanel from './OwnerPanel'

const STATUS_CONFIG = {
  pending:  { label:'İncelemede',   icon:'⏳', cls:'bg-amber-100 text-amber-700 border-amber-200', desc:'Ekibimiz başvurunuzu inceliyor. 1-2 iş günü içinde sonuç alırsınız.' },
  approved: { label:'Yayında',      icon:'✅', cls:'bg-green-100 text-green-700 border-green-200', desc:'Tebrikler! Restoranınız GastroVibe\'da yayında.' },
  rejected: { label:'Güncelleme Gerekli', icon:'❌', cls:'bg-red-100 text-red-600 border-red-200', desc:'Başvurunuz reddedildi. Bilgilerinizi güncelleyip tekrar başvurabilirsiniz.' },
}

export default function OwnerDashboard({ onClose, onStartOnboarding }) {
  const { user, authFetch } = useAuth()
  const [stats,       setStats]       = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [reservations,setReservations]= useState([])
  const [loading,     setLoading]     = useState(true)
  const [showPanel,   setShowPanel]   = useState(false)
  const [activeRes,   setActiveRes]   = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [s, r, rv] = await Promise.all([
        authFetch('/api/owner/stats').then(x=>x.json()),
        authFetch('/api/owner/restaurant').then(x=>x.json()),
        authFetch('/api/owner/reservations?status=confirmed').then(x=>x.json()),
      ])
      setStats(s)
      setRestaurants(r.restaurants || [])
      setReservations(rv.reservations || [])
    } finally { setLoading(false) }
  }, [authFetch])

  useEffect(() => { fetchData() }, [fetchData])

  const updateResStatus = async (id, status) => {
    await authFetch(`/api/owner/reservations/${id}`, { method:'PATCH', body:JSON.stringify({status}) })
    fetchData()
  }

  if (loading) {
    return (
      <Modal onClose={onClose}>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="text-4xl mb-3">🍽️</div>
            <div className="text-gv-muted text-sm animate-pulse">Yükleniyor...</div>
          </div>
        </div>
      </Modal>
    )
  }

  const hasRestaurant = restaurants.length > 0
  const mainRest      = restaurants[0]
  const statusCfg     = mainRest ? STATUS_CONFIG[mainRest.status] || STATUS_CONFIG.pending : null
  const todayResCount = reservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length

  return (
    <>
      <Modal onClose={onClose}>
        {/* Header */}
        <div className="bg-gradient-to-r from-gv-emerald to-gv-emerald-light px-8 py-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gv-orange flex items-center justify-center text-3xl shadow-lg">
            {user?.avatar || '🏪'}
          </div>
          <div className="flex-1">
            <div className="font-playfair font-bold text-white text-xl">{user?.name}</div>
            <div className="text-white/60 text-xs flex items-center gap-2 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
              İşletmeci Hesabı
              {hasRestaurant && <span>· {restaurants.length} Restoran</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {hasRestaurant && (
              <button onClick={() => setShowPanel(true)}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-all">
                Tam Panel
              </button>
            )}
            <button onClick={onClose} className="text-white/60 hover:text-white text-xl">✕</button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight:'calc(88vh - 100px)' }}>
          {!hasRestaurant ? (
            // ── Henüz restoran yok ──
            <div className="px-8 py-12 text-center">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="font-playfair text-2xl font-bold text-gv-ink mb-3">Restoranınızı Ekleyin</h3>
              <p className="text-gv-muted text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                GastroVibe'a mekanınızı ekleyin, binlerce yemek tutkununa ulaşın. Başvuru ücretsiz.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
                {[['📝','Başvur','Bilgileri girin'],['⏳','Bekleyin','1-2 gün inceleme'],['🚀','Yayına Alın','Müşterilere ulaşın']].map(([icon,t,s])=>(
                  <div key={t} className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gv-cream flex items-center justify-center text-2xl mx-auto mb-2">{icon}</div>
                    <div className="text-xs font-bold text-gv-ink">{t}</div>
                    <div className="text-[0.65rem] text-gv-muted mt-0.5">{s}</div>
                  </div>
                ))}
              </div>
              <button onClick={onStartOnboarding}
                className="bg-gv-orange text-white font-bold px-8 py-3.5 rounded-xl hover:bg-gv-orange-dark transition-all hover:-translate-y-0.5 shadow-orange-glow">
                🍽️ Restoranımı Ekle
              </button>
            </div>
          ) : (
            <div className="px-8 py-6 flex flex-col gap-6">

              {/* Durum kartı */}
              <div className={`rounded-2xl border-2 p-5 ${statusCfg.cls}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{statusCfg.icon}</span>
                  <div>
                    <div className="font-bold text-sm">{mainRest.name} — {statusCfg.label}</div>
                    <div className="text-xs opacity-80 mt-0.5">{statusCfg.desc}</div>
                  </div>
                </div>
                {mainRest.status === 'rejected' && (
                  <button onClick={() => setShowPanel(true)}
                    className="mt-2 text-xs font-bold underline">
                    Bilgileri Güncelle →
                  </button>
                )}
              </div>

              {/* İstatistikler */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon:'📅', val: stats.totalReservations,  lbl:'Rezervasyon'   },
                    { icon:'🕐', val: todayResCount,             lbl:'Bugün'         },
                    { icon:'⭐', val: stats.avgRating || '—',    lbl:'Ortalama Puan' },
                    { icon:'❤️', val: stats.totalFavorites,      lbl:'Favori'        },
                  ].map(c => (
                    <div key={c.lbl} className="bg-gv-cream rounded-2xl p-4 text-center">
                      <div className="text-xl mb-1">{c.icon}</div>
                      <div className="font-playfair text-2xl font-bold text-gv-ink">{c.val}</div>
                      <div className="text-[0.7rem] text-gv-muted mt-0.5">{c.lbl}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Restoran kartı */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-playfair font-bold text-gv-ink">Restoranlarım</h3>
                  {restaurants.length < 3 && (
                    <button onClick={onStartOnboarding}
                      className="text-xs font-bold text-gv-orange hover:underline">
                      + Yeni Ekle
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  {restaurants.map(r => {
                    const imgs = Array.isArray(r.images) ? r.images : []
                    const sc   = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
                    return (
                      <div key={r.id} className="bg-gv-cream rounded-2xl flex overflow-hidden">
                        <img src={imgs[0] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=60'}
                          alt={r.name} className="w-24 object-cover flex-shrink-0" style={{minHeight:80}} />
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-sm text-gv-ink">{r.name}</div>
                              <div className="text-xs text-gv-muted">{r.location} · {r.price} · {r.capacity} kişi</div>
                            </div>
                            <span className={`text-[0.62rem] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.icon} {sc.label}</span>
                          </div>
                          <button onClick={() => setShowPanel(true)}
                            className="mt-2 text-[0.72rem] font-bold text-gv-orange hover:underline">
                            Düzenle →
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Yaklaşan rezervasyonlar */}
              {reservations.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-playfair font-bold text-gv-ink">Yaklaşan Rezervasyonlar</h3>
                    <button onClick={() => setShowPanel(true)} className="text-xs font-bold text-gv-orange hover:underline">
                      Tümünü Gör →
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {reservations.slice(0, 3).map(r => (
                      <div key={r.id} className="bg-gv-cream rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gv-ink">{r.user_name}</div>
                          <div className="text-xs text-gv-muted flex gap-2 mt-0.5">
                            <span>📅 {r.date}</span>
                            <span>🕐 {r.time}</span>
                            <span>👥 {r.party_size} kişi</span>
                          </div>
                          {r.note && <div className="text-xs text-gv-muted italic mt-0.5">"{r.note}"</div>}
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => updateResStatus(r.id, 'completed')}
                            className="text-[0.65rem] font-bold px-2.5 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200">✓</button>
                          <button onClick={() => updateResStatus(r.id, 'cancelled')}
                            className="text-[0.65rem] font-bold px-2.5 py-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tam panel CTA */}
              <button onClick={() => setShowPanel(true)}
                className="w-full py-3.5 rounded-xl border-2 border-gv-orange text-gv-orange font-bold text-sm hover:bg-gv-orange hover:text-white transition-all">
                📊 Tam Paneli Aç
              </button>
            </div>
          )}
        </div>
      </Modal>

      {showPanel && <OwnerPanel onClose={() => setShowPanel(false)} />}
    </>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-gv-white rounded-3xl shadow-2xl w-full overflow-hidden"
        style={{ maxWidth:600, maxHeight:'88vh', animation:'panelUp 0.3s ease' }}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
