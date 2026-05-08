// src/pages/CitiesPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CITY_DATA = [
  {
    name:    'Bursa',
    tagline: 'Orman, Dağ ve Deniz — Tek Şehirde',
    desc:    'Uludağ\'ın gölgesinde, Marmara kıyısında; ocakbaşından orman restoranlarına Türkiye\'nin en zengin sofra kültürü.',
    image:   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80',
    color:   '#1A4A3C',
    tags:    ['🌲 Orman', '🌊 Deniz', '🔥 Ocakbaşı'],
    featured: true,
  },
  {
    name:    'İstanbul',
    tagline: 'İki Kıtanın Lezzet Başkenti',
    desc:    'Boğaz manzaralı fine dining\'den tarihi çarşı içi meyhaneye; dünyada eşi olmayan bir sofra çeşitliliği.',
    image:   'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=900&q=80',
    color:   '#2D3748',
    tags:    ['🌊 Boğaz', '🏛️ Tarihi', '🍷 Fine Dining'],
    featured: true,
  },
  {
    name:    'İzmir',
    tagline: 'Ege\'nin Açık Hava Sofrası',
    desc:    'Çeşme\'nin rüzgarından Kordon\'un deniz kokusu; hafif, sağlıklı ve canlı bir Ege mutfağı.',
    image:   'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=80',
    color:   '#2B6CB0',
    tags:    ['🌊 Kordon', '🌿 Ege', '🐟 Deniz Ürünleri'],
    featured: false,
  },
  {
    name:    'Ankara',
    tagline: 'Başkentin Gizli Mutfağı',
    desc:    'İç Anadolu\'nun et kültürü ve geleneksel lezzetlerini modern yorumlarla buluşturan sürpriz şehir.',
    image:   'https://images.unsplash.com/photo-1550966871-3ed3cbe818b5?w=900&q=80',
    color:   '#744210',
    tags:    ['🥩 Et', '🏛️ Tarihi', '☕ Kafe'],
    featured: false,
  },
  {
    name:    'Antalya',
    tagline: 'Akdeniz\'in Taze Sofrası',
    desc:    'Taze deniz ürünleri, tarihî limanın balık restoranları ve narenciye bahçeli kahvaltı köyleri.',
    image:   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80',
    color:   '#276749',
    tags:    ['🌊 Liman', '🍊 Akdeniz', '🐟 Balık'],
    featured: false,
  },
  {
    name:    'Gaziantep',
    tagline: 'UNESCO Gastronomi Şehri',
    desc:    'Dünyanın en zengin mutfaklarından biri: baklava, kebap ve yüzlerce yıllık tarifin yaşayan müzesi.',
    image:   'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&q=80',
    color:   '#702459',
    tags:    ['🍢 Kebap', '🍯 Baklava', '🌶️ Baharatlı'],
    featured: false,
  },
]

function CityCard({ city, count, featured = false }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/restaurants?city=${encodeURIComponent(city.name)}`)}
      className={`relative rounded-3xl overflow-hidden cursor-pointer group shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5
        ${featured ? 'md:col-span-2 h-80' : 'h-60'}`}
    >
      {/* Background image */}
      <img src={city.image} alt={city.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-7 flex flex-col justify-end">
        {/* Tags */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {city.tags.map(t => (
            <span key={t} className="text-[0.65rem] font-bold bg-white/15 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
              {t}
            </span>
          ))}
        </div>

        <h3 className="font-playfair font-black text-white leading-tight mb-1"
          style={{ fontSize: featured ? '2rem' : '1.4rem' }}>
          {city.name}
        </h3>
        <p className="text-white/80 text-sm font-medium mb-2">{city.tagline}</p>

        {/* Description (shows on hover) */}
        <div className={`overflow-hidden transition-all duration-300 ${hovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <p className="text-white/70 text-xs leading-relaxed mb-3">{city.desc}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60 text-xs">
            {count !== undefined ? `${count} mekan` : ''}
          </span>
          <div className="flex items-center gap-1.5 bg-gv-orange px-4 py-2 rounded-full text-white text-xs font-bold
            opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
            Keşfet →
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CitiesPage() {
  const { authFetch } = useAuth()
  const navigate      = useNavigate()
  const [counts, setCounts]   = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch restaurant counts per city
    Promise.all(
      CITY_DATA.map(c =>
        authFetch(`/api/restaurants?city=${encodeURIComponent(c.name)}`)
          .then(r => r.json())
          .then(d => ({ city: c.name, count: (d.restaurants || []).length }))
          .catch(() => ({ city: c.name, count: 0 }))
      )
    ).then(results => {
      const map = {}
      results.forEach(r => { map[r.city] = r.count })
      setCounts(map)
    }).finally(() => setLoading(false))
  }, [])

  const featured = CITY_DATA.filter(c => c.featured)
  const rest     = CITY_DATA.filter(c => !c.featured)

  return (
    <div className="min-h-screen bg-gv-cream pt-24 pb-20">
      {/* Header */}
      <div className="px-8 md:px-16 mb-14">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gv-orange mb-3">Şehre Göre Keşfet</p>
          <h1 className="font-playfair font-black text-gv-ink leading-tight mb-4"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)' }}>
            Türkiye'nin <em className="italic text-gv-orange">Lezzet Haritası</em>
          </h1>
          <p className="text-gv-muted text-lg leading-relaxed">
            Her şehrin kendine özgü bir mutfak kimliği var. Gitmeden önce keşfedin, varmadan önce rezervasyon yapın.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-8 md:px-16 mb-12">
        <div className="bg-gv-emerald rounded-2xl px-8 py-5 flex gap-10 flex-wrap">
          {[
            { n: CITY_DATA.length, label: 'Aktif Şehir' },
            { n: Object.values(counts).reduce((a, b) => a + b, 0) || '2400+', label: 'Toplam Mekan' },
            { n: '18', label: 'Büyükşehir Yakında' },
          ].map(s => (
            <div key={s.label}>
              <div className="font-playfair font-black text-white text-2xl">{s.n}</div>
              <div className="text-white/50 text-xs uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured cities */}
      <div className="px-8 md:px-16 mb-6">
        <h2 className="font-playfair font-bold text-gv-ink text-xl mb-5">⭐ Öne Çıkan Şehirler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featured.map(c => (
            <CityCard key={c.name} city={c} count={counts[c.name]} featured />
          ))}
        </div>
      </div>

      {/* All cities */}
      <div className="px-8 md:px-16">
        <h2 className="font-playfair font-bold text-gv-ink text-xl mb-5">🗺️ Diğer Şehirler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {rest.map(c => (
            <CityCard key={c.name} city={c} count={counts[c.name]} />
          ))}
          {/* Coming soon card */}
          <div className="h-60 rounded-3xl border-2 border-dashed border-gv-cream-dark flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:border-gv-orange transition-colors group"
            onClick={() => navigate('/restaurants')}>
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🗺️</div>
            <div className="font-playfair font-bold text-gv-ink-light text-base mb-1">Daha Fazlası</div>
            <div className="text-xs text-gv-muted">14 şehir daha yakında ekleniyor</div>
          </div>
        </div>
      </div>
    </div>
  )
}
