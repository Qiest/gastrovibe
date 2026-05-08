import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RestaurantDetail from './RestaurantDetail'

const BADGE_COLORS = {
  blue: 'bg-blue-600/80 text-white', dark: 'bg-gv-ink/75 text-white',
  green: 'bg-gv-emerald/85 text-white', orange: 'bg-gv-orange/85 text-white', amber: 'bg-amber-500/85 text-white',
}

export default function DiscoveryCarousel() {
  const { authFetch }  = useAuth()
  const trackRef       = useRef(null)
  const [items, setItems]         = useState([])
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    authFetch('/api/restaurants')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const all       = data.restaurants || []
        const discovery = all.filter(r => !r.is_featured)
        setItems(discovery.length ? discovery : all.slice(3))
      })
      .catch(err => console.error('Discovery yüklenemedi:', err))
  }, [])

  const scroll = dir => trackRef.current?.scrollBy({ left: dir * 290, behavior: 'smooth' })
  if (items.length === 0) return null

  return (
    <>
      <section className="mx-8 my-4 px-12 py-16 rounded-4xl" style={{ background: '#EDE6DA' }}>
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gv-orange mb-2">Algoritma Seçimi</p>
            <h2 className="font-playfair font-extrabold leading-tight tracking-tight text-gv-ink"
              style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)' }}>
              Sana <em className="italic text-gv-orange">Gizli Kalmış</em> Yerler
            </h2>
          </div>
          {/* FIX: → /restaurants */}
          <Link to="/restaurants"
            className="text-sm font-semibold text-gv-orange border-b-2 border-gv-orange pb-0.5 hover:opacity-70 whitespace-nowrap"
            style={{ textDecoration: 'none' }}>
            Tümünü Keşfet →
          </Link>
        </div>

        <div ref={trackRef} className="carousel-track">
          {items.map(r => {
            const img   = Array.isArray(r.images) ? r.images[0] : r.image_url
            const badge = Array.isArray(r.badges)  ? r.badges[0] : null
            return (
              <div key={r.id}
                onClick={() => setSelectedId(r.id)}
                className="carousel-item min-w-[260px] rounded-2xl overflow-hidden bg-gv-white shadow-card hover:-translate-y-1 transition-transform duration-200 cursor-pointer flex-shrink-0">
                <div className="relative">
                  <img src={img} alt={r.name} className="w-full h-40 object-cover block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                  <div className="absolute top-2 right-2 text-[0.6rem] font-bold bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">
                    Detay
                  </div>
                </div>
                <div className="p-4">
                  {badge && (
                    <span className={`text-[0.68rem] font-semibold px-2.5 py-1 rounded-full ${BADGE_COLORS[badge.color] || BADGE_COLORS.dark}`}>
                      {badge.icon} {badge.label}
                    </span>
                  )}
                  <div className="font-playfair font-bold text-[0.95rem] text-gv-ink mt-2 mb-0.5">{r.name}</div>
                  <div className="text-[0.76rem] text-gv-muted">{r.district} · {r.price}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2.5 mt-6">
          {['←','→'].map((arrow, i) => (
            <button key={arrow} onClick={() => scroll(i === 0 ? -1 : 1)}
              className="w-11 h-11 rounded-full border-2 border-gv-cream bg-gv-white text-gv-ink flex items-center justify-center text-lg hover:bg-gv-orange hover:text-white hover:border-gv-orange transition-all">
              {arrow}
            </button>
          ))}
        </div>
      </section>

      {selectedId && (
        <RestaurantDetail restaurantId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  )
}
