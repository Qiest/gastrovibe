import { useNavigate } from 'react-router-dom'
import { useGlobalToast } from '../App'

export default function MapTeaser() {
  const navigate = useNavigate()
  const { info } = useGlobalToast()

  return (
    <div className="mx-8 my-8 rounded-4xl overflow-hidden flex flex-col md:flex-row"
      style={{ background: 'linear-gradient(135deg, #1A4A3C 0%, #0D2B22 100%)', minHeight: '240px' }}>
      <div className="flex-1 p-12 flex flex-col justify-center">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-gv-orange mb-3">📍 Harita Modu</div>
        <h2 className="font-playfair font-black text-white leading-tight mb-4"
          style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
          Çevrendeki <em className="italic text-gv-orange">Tüm Vibelara</em> Bak
        </h2>
        <p className="text-white/60 text-sm leading-relaxed mb-7 max-w-sm">
          Konumunuza göre filtreli, anlık doluluk ve rezervasyon bilgisiyle interaktif harita deneyimi.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => info('İnteraktif harita çok yakında! 🗺️')}
            className="text-sm font-bold px-6 py-3 rounded-full bg-gv-white text-gv-emerald hover:bg-gv-cream transition-colors">
            🗺️ Haritayı Aç
          </button>
          <button
            onClick={() => navigate('/restaurants')}
            className="text-sm font-bold px-6 py-3 rounded-full border-2 border-white/30 text-white hover:border-white/60 transition-colors">
            Tüm Mekanlar →
          </button>
        </div>
      </div>

      {/* Decorative map visual */}
      <div className="flex-1 relative map-grid flex items-center justify-center min-h-[200px] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(200,96,42,0.15) 0%, transparent 70%)' }} />
        {[
          { top:'28%', left:'35%', delay:'0s'   },
          { top:'55%', left:'60%', delay:'0.4s' },
          { top:'40%', left:'75%', delay:'0.8s' },
        ].map((p, i) => (
          <div key={i} className="absolute flex flex-col items-center"
            style={{ top: p.top, left: p.left, animation: `floatBadge 4s ease-in-out ${p.delay} infinite` }}>
            <div className="w-8 h-8 rounded-full bg-gv-orange flex items-center justify-center text-base shadow-orange-glow">📍</div>
            <div className="w-0.5 h-3 bg-gv-orange/60" />
          </div>
        ))}
        <div className="absolute bottom-5 right-5 text-white/30 text-xs font-medium">Bursa & Çevresi</div>
      </div>
    </div>
  )
}
