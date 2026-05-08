/**
 * src/components/owner/AdminPanel.jsx
 * Admin onay paneli
 * — Bekleyen restoranları onayla / reddet
 * — Kullanıcı rol yönetimi
 * — Platform istatistikleri
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

const STATUS_BADGE = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-500',
}

export default function AdminPanel({ onClose }) {
  const { authFetch } = useAuth()
  const [tab,     setTab]     = useState('pending')
  const [rests,   setRests]   = useState([])
  const [users,   setUsers]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast,   setToast]   = useState('')

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, r, u] = await Promise.all([
        authFetch('/api/admin/stats').then(x=>x.json()),
        authFetch('/api/admin/restaurants').then(x=>x.json()),
        authFetch('/api/admin/users').then(x=>x.json()),
      ])
      setStats(s)
      setRests(r.restaurants || [])
      setUsers(u.users || [])
    } finally { setLoading(false) }
  }, [authFetch])

  useEffect(() => { fetchAll() }, [fetchAll])

  const updateStatus = async (id, status) => {
    const res  = await authFetch(`/api/admin/restaurants/${id}`, { method:'PATCH', body:JSON.stringify({status}) })
    const data = await res.json()
    flash(data.message || 'Güncellendi.')
    fetchAll()
  }

  const updateRole = async (id, role) => {
    const res  = await authFetch(`/api/admin/users/${id}/role`, { method:'PATCH', body:JSON.stringify({role}) })
    const data = await res.json()
    flash(data.message)
    fetchAll()
  }

  const pendingRests   = rests.filter(r => r.status === 'pending')
  const approvedRests  = rests.filter(r => r.status === 'approved')
  const rejectedRests  = rests.filter(r => r.status === 'rejected')

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-gv-white rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col"
        style={{ maxWidth:900, maxHeight:'90vh', animation:'panelUp 0.3s ease' }}
        onClick={e => e.stopPropagation()}>

        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gv-ink text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="bg-gv-ink px-8 py-5 flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gv-orange flex items-center justify-center text-2xl">👑</div>
          <div>
            <div className="font-playfair font-bold text-white text-xl">Admin Paneli</div>
            <div className="text-white/50 text-xs">GastroVibe Yönetim</div>
          </div>
          <button onClick={onClose} className="ml-auto text-white/50 hover:text-white text-xl">✕</button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-0 border-b border-gv-cream-dark">
            {[
              ['👥', stats.users,                'Üye'],
              ['🏪', stats.owners,               'İşletmeci'],
              ['🍽️', stats.restaurants_total,    'Toplam Mekan'],
              ['⏳', stats.restaurants_pending,  'Bekleyen'],
              ['✅', stats.restaurants_approved, 'Yayında'],
              ['📅', stats.reservations_total,   'Rezervasyon'],
              ['📅', stats.reservations_today,   'Bugün'],
              ['💬', stats.reviews_total,        'Yorum'],
            ].map(([icon, val, lbl]) => (
              <div key={lbl} className="py-3 px-4 text-center border-r border-gv-cream-dark last:border-r-0">
                <div className="font-playfair font-bold text-lg text-gv-ink">{val}</div>
                <div className="text-[0.65rem] text-gv-muted">{lbl}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gv-cream-dark flex-shrink-0">
          {[
            { key:'pending',  label:`⏳ Bekleyen (${pendingRests.length})`  },
            { key:'approved', label:`✅ Yayında (${approvedRests.length})`  },
            { key:'rejected', label:`❌ Reddedilen (${rejectedRests.length})` },
            { key:'users',    label:`👥 Kullanıcılar (${users.length})`    },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap
                ${tab===t.key ? 'text-gv-orange border-b-2 border-gv-orange' : 'text-gv-muted hover:text-gv-ink'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="text-center py-12 text-gv-muted text-sm">Yükleniyor...</div>
          ) : tab === 'users' ? (
            <UsersTab users={users} onRoleChange={updateRole} />
          ) : (
            <RestaurantsTab
              restaurants={tab==='pending'?pendingRests : tab==='approved'?approvedRests:rejectedRests}
              onApprove={id => updateStatus(id,'approved')}
              onReject={id  => updateStatus(id,'rejected')}
              onPending={id => updateStatus(id,'pending')}
              tab={tab}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function RestaurantsTab({ restaurants, onApprove, onReject, onPending, tab }) {
  if (restaurants.length === 0) {
    return <div className="text-center py-16 text-gv-muted text-sm">Bu kategoride restoran yok.</div>
  }
  return (
    <div className="flex flex-col gap-4">
      {restaurants.map(r => {
        const imgs = Array.isArray(r.images) ? r.images : []
        return (
          <div key={r.id} className="bg-gv-cream rounded-2xl overflow-hidden">
            <div className="flex gap-4 p-4">
              <img src={imgs[0] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=60'}
                alt={r.name} className="w-24 h-20 object-cover rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-playfair font-bold text-gv-ink">{r.name}</div>
                    <div className="text-xs text-gv-muted">{r.location}</div>
                    {r.owner_name && <div className="text-xs text-gv-muted mt-0.5">İşletmeci: <span className="font-medium text-gv-ink">{r.owner_name}</span> ({r.owner_email})</div>}
                  </div>
                  <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_BADGE[r.status]}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-gv-ink-light mt-2 line-clamp-2">{r.description}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {tab === 'pending' && (
                    <>
                      <button onClick={() => onApprove(r.id)}
                        className="text-xs font-bold px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all">
                        ✅ Onayla
                      </button>
                      <button onClick={() => onReject(r.id)}
                        className="text-xs font-bold px-4 py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all">
                        ❌ Reddet
                      </button>
                    </>
                  )}
                  {tab === 'approved' && (
                    <button onClick={() => onReject(r.id)}
                      className="text-xs font-bold px-4 py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all">
                      ❌ Yayından Kaldır
                    </button>
                  )}
                  {tab === 'rejected' && (
                    <button onClick={() => onApprove(r.id)}
                      className="text-xs font-bold px-4 py-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition-all">
                      ✅ Onayla
                    </button>
                  )}
                  <span className="text-xs text-gv-muted self-center">
                    Kap: {r.capacity} · {['₺','₺₺','₺₺₺','₺₺₺₺'][r.price_level-1]} · {imgs.length} fotoğraf
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function UsersTab({ users, onRoleChange }) {
  return (
    <div className="flex flex-col gap-2">
      {users.map(u => (
        <div key={u.id} className="bg-gv-cream rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">{u.avatar}</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gv-ink">{u.name}</div>
            <div className="text-xs text-gv-muted">{u.email}</div>
          </div>
          <select
            value={u.role}
            onChange={e => onRoleChange(u.id, e.target.value)}
            className="text-xs font-bold bg-gv-white border border-gv-cream-dark rounded-lg px-3 py-1.5 text-gv-ink outline-none focus:border-gv-orange"
          >
            <option value="user">👤 Kullanıcı</option>
            <option value="owner">🏪 İşletmeci</option>
            <option value="admin">👑 Admin</option>
          </select>
        </div>
      ))}
    </div>
  )
}
