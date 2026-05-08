import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RestaurantCard from './RestaurantCard'

export default function FeaturedSection() {
  const { authFetch }              = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    authFetch('/api/restaurants?featured=1')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setRestaurants(data.restaurants || []))
      .catch(err => console.error('Featured yüklenemedi:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="featured" className="px-12 py-20">
      <div className="flex justify-between items-end mb-11">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gv-orange mb-2">Bu Hafta Öne Çıkanlar</p>
          <h2 className="font-playfair font-extrabold leading-tight tracking-tight text-gv-ink"
            style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)' }}>
            Editörün <em className="italic text-gv-orange">Seçkileri</em>
          </h2>
        </div>
        {/* FIX: href="#" → Link to /restaurants */}
        <Link to="/restaurants"
          className="text-sm font-semibold text-gv-orange border-b-2 border-gv-orange pb-0.5 hover:opacity-70 whitespace-nowrap"
          style={{ textDecoration: 'none' }}>
          Tüm Mekanlar →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0,1,2].map(i => (
            <div key={i} className="bg-gv-white rounded-3xl overflow-hidden animate-pulse">
              <div className="bg-gv-cream-dark h-56" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gv-cream-dark rounded w-3/4" />
                <div className="h-3 bg-gv-cream-dark rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-16 text-gv-muted">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-sm">Henüz onaylanmış mekan yok.</p>
          <code className="text-xs bg-gv-cream-dark px-3 py-1 rounded-lg mt-2 inline-block">
            Backend çalışıyor mu? → npm run dev:backend
          </code>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ gridTemplateRows: 'auto auto' }}>
          {restaurants.map((r, i) => (
            <RestaurantCard key={r.id} restaurant={r} large={i === 0} />
          ))}
        </div>
      )}
    </section>
  )
}
