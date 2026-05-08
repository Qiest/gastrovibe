// src/pages/RestaurantsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RestaurantCard from '../components/RestaurantCard'

const CITIES       = ['Tümü', 'Bursa', 'İstanbul', 'İzmir', 'Ankara']
const PRICE_LEVELS = [
  { label: 'Tümü', value: '' },
  { label: '₺',    value: '1' },
  { label: '₺₺',   value: '2' },
  { label: '₺₺₺',  value: '3' },
  { label: '₺₺₺₺', value: '4' },
]
const BADGE_FILTERS = [
  { label: 'Tümü',        value: '' },
  { label: '🌊 Deniz',    value: 'Deniz' },
  { label: '🌲 Doğa',     value: 'Orman' },
  { label: '🎶 Müzik',    value: 'Müzik' },
  { label: '🔥 Ocakbaşı', value: 'Ocakbaşı' },
  { label: '🕯️ Romantik', value: 'Romantik' },
  { label: '🌿 Organik',  value: 'Organik' },
]

function SkeletonCard() {
  return (
    <div className="bg-gv-white rounded-3xl overflow-hidden animate-pulse">
      <div className="h-56 bg-gv-cream-dark" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gv-cream-dark rounded-full w-3/4" />
        <div className="h-3 bg-gv-cream-dark rounded-full w-1/2" />
        <div className="h-8 bg-gv-cream-dark rounded-xl w-full mt-4" />
      </div>
    </div>
  )
}

export default function RestaurantsPage() {
  const { authFetch }         = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [restaurants, setRestaurants] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [total,       setTotal]       = useState(0)

  // Filter state — read from URL on mount
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [city,   setCity]   = useState(searchParams.get('city')   || '')
  const [price,  setPrice]  = useState(searchParams.get('price')  || '')
  const [badge,  setBadge]  = useState(searchParams.get('badge')  || '')

  const fetchRestaurants = useCallback(async (filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.city && filters.city !== 'Tümü') params.set('city', filters.city)
      if (filters.price)  params.set('price',  filters.price)
      if (filters.badge)  params.set('badge',  filters.badge)

      const res  = await authFetch(`/api/restaurants?${params}`)
      const data = await res.json()
      const list = data.restaurants || []
      setRestaurants(list)
      setTotal(list.length)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  // Fetch when filters change
  useEffect(() => {
    const t = setTimeout(() => {
      fetchRestaurants({ search, city, price, badge })
      // sync URL
      const p = new URLSearchParams()
      if (search) p.set('search', search)
      if (city && city !== 'Tümü') p.set('city', city)
      if (price)  p.set('price',  price)
      if (badge)  p.set('badge',  badge)
      setSearchParams(p, { replace: true })
    }, 300)
    return () => clearTimeout(t)
  }, [search, city, price, badge])

  const clearFilters = () => { setSearch(''); setCity(''); setPrice(''); setBadge('') }
  const hasFilters   = search || (city && city !== 'Tümü') || price || badge

  return (
    <div className="min-h-screen bg-gv-cream pt-28 pb-20">
      {/* Header */}
      <div className="px-8 md:px-12 mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gv-orange mb-2">Tüm Mekanlar</p>
        <h1 className="font-playfair font-black text-gv-ink leading-tight mb-1"
          style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          Deneyimi <em className="italic text-gv-orange">Keşfet</em>
        </h1>
        <p className="text-gv-muted text-sm">{loading ? '...' : `${total} mekan bulundu`}</p>
      </div>

      {/* Search bar */}
      <div className="px-8 md:px-12 mb-6">
        <div className="bg-gv-white rounded-2xl shadow-card flex items-center gap-3 px-5 py-3.5 max-w-2xl">
          <span className="text-xl">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Mekan adı, semt, açıklama ara..."
            className="flex-1 bg-transparent text-sm text-gv-ink outline-none placeholder-gv-muted"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="text-gv-muted hover:text-gv-ink text-lg leading-none">✕</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 md:px-12 mb-8 flex flex-wrap gap-4 items-center">
        {/* City */}
        <div className="flex gap-1.5 flex-wrap">
          {CITIES.map(c => (
            <button key={c} onClick={() => setCity(c === 'Tümü' ? '' : c)}
              className={`text-xs font-semibold px-4 py-2 rounded-full border-2 transition-all
                ${(city === c || (!city && c === 'Tümü'))
                  ? 'bg-gv-emerald text-white border-gv-emerald'
                  : 'border-gv-cream-dark text-gv-ink-light hover:border-gv-emerald hover:text-gv-emerald'}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gv-cream-dark hidden md:block" />

        {/* Price */}
        <div className="flex gap-1.5">
          {PRICE_LEVELS.map(p => (
            <button key={p.value} onClick={() => setPrice(p.value)}
              className={`text-xs font-bold px-3 py-2 rounded-full border-2 transition-all
                ${price === p.value
                  ? 'bg-gv-orange text-white border-gv-orange'
                  : 'border-gv-cream-dark text-gv-ink-light hover:border-gv-orange hover:text-gv-orange'}`}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gv-cream-dark hidden md:block" />

        {/* Badge filter */}
        <div className="flex gap-1.5 flex-wrap">
          {BADGE_FILTERS.map(b => (
            <button key={b.value} onClick={() => setBadge(b.value)}
              className={`text-xs font-semibold px-3 py-2 rounded-full border-2 transition-all
                ${badge === b.value
                  ? 'bg-gv-orange text-white border-gv-orange'
                  : 'border-gv-cream-dark text-gv-ink-light hover:border-gv-orange hover:text-gv-orange'}`}>
              {b.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button onClick={clearFilters}
            className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors ml-auto">
            ✕ Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="px-8 md:px-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-5">🍽️</div>
            <h3 className="font-playfair font-bold text-gv-ink text-2xl mb-2">Sonuç bulunamadı</h3>
            <p className="text-gv-muted text-sm max-w-sm mb-6">
              Arama kriterlerinize uygun mekan yok. Filtreleri değiştirin veya temizleyin.
            </p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="bg-gv-orange text-white font-bold px-7 py-3 rounded-full hover:bg-gv-orange-dark transition-all">
                Tüm Mekanları Göster
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {restaurants.map(r => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
