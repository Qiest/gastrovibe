import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

const FILTER_CHIPS = [
  { label:'🌊 Deniz Kenarı', badge:'Deniz'    },
  { label:'🌲 Doğa',         badge:'Orman'    },
  { label:'🕯️ Romantik',    badge:'Romantik' },
  { label:'🎶 Canlı Müzik',  badge:'Müzik'    },
  { label:'🔥 Ocakbaşı',     badge:'Ocakbaşı' },
  { label:'🍷 Bar & Şarap',  badge:'Şarap'    },
]

export default function Hero() {
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const [query,      setQuery]      = useState('')
  const [activeChip, setActiveChip] = useState(null)
  const [showAuth,   setShowAuth]   = useState(false)

  const handleSearch = () => {
    if (!query.trim()) { navigate('/restaurants'); return }
    navigate(`/restaurants?search=${encodeURIComponent(query.trim())}`)
  }

  const handleChip = (chip) => {
    const next = chip.label === activeChip ? null : chip.label
    setActiveChip(next)
    if (next) navigate(`/restaurants?badge=${encodeURIComponent(chip.badge)}`)
    else      navigate('/restaurants')
  }

  return (
    <>
      <section
        className="min-h-screen grid md:grid-cols-2 items-center gap-14 relative overflow-hidden"
        style={{ padding: '120px 48px 80px' }}
      >
        {/* BG blobs */}
        <div className="absolute -top-32 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(200,96,42,0.07) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-24 left-[10%] w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(26,74,60,0.06) 0%, transparent 70%)' }} />

        {/* LEFT */}
        <div className="relative z-10">
          <div className="fade-up inline-flex items-center gap-2 bg-gv-emerald text-gv-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-7">
            <span className="text-green-400 text-[8px]">●</span>
            Türkiye'nin Deneyim Platformu
          </div>

          <h1 className="fade-up-1 font-playfair font-black leading-[1.05] tracking-tight mb-5"
            style={{ fontSize: 'clamp(2.8rem, 5vw, 4.4rem)' }}>
            Sadece Yemek Değil,<br />
            <em className="text-gv-orange" style={{ fontStyle: 'italic' }}>Bir Hikaye</em> Ara
          </h1>

          <p className="fade-up-2 text-gv-muted leading-relaxed mb-10 max-w-md" style={{ fontSize: '1.05rem' }}>
            Ambiyans, deneyim ve his odaklı Türkiye'nin en seçkin restoran platformu.
            Nasıl bir gece istediğini yaz, biz bulalım.
          </p>

          {/* Search box */}
          <div className="fade-up-3 bg-gv-white rounded-2xl shadow-[0_8px_40px_rgba(28,26,23,0.12)] p-6">
            <span className="block text-[0.7rem] font-bold uppercase tracking-[0.1em] text-gv-muted mb-3">
              Nasıl bir deneyim arıyorsunuz?
            </span>
            <div className="flex gap-3 items-end">
              <textarea
                className="flex-1 font-dm text-base text-gv-ink bg-transparent border-none outline-none resize-none leading-relaxed placeholder-[#BEB5AC]"
                style={{ minHeight: '56px', caretColor: '#C8602A' }}
                placeholder="Örn: Deniz kenarında, caz müziği çalan, mum ışığında şık bir yer..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSearch())}
                rows={2}
              />
              <button onClick={handleSearch}
                className="w-14 h-14 flex-shrink-0 bg-gv-orange rounded-2xl flex items-center justify-center text-2xl hover:bg-gv-orange-dark hover:scale-105 transition-all duration-200 shadow-orange-glow">
                🔍
              </button>
            </div>
            <div className="h-px bg-gv-cream-dark my-4" />
            <div className="flex gap-2 flex-wrap">
              {FILTER_CHIPS.map(chip => (
                <button key={chip.label}
                  onClick={() => handleChip(chip)}
                  className={`text-xs font-medium px-4 py-1.5 rounded-full border-2 transition-all duration-200
                    ${activeChip === chip.label
                      ? 'border-gv-orange bg-orange-50 text-gv-orange'
                      : 'border-gv-cream-dark text-gv-ink-light hover:border-gv-orange hover:text-gv-orange'}`}>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {!user && (
            <p className="fade-up-4 mt-5 text-xs text-gv-muted">
              Rezervasyon yapmak için{' '}
              <button onClick={() => setShowAuth(true)} className="text-gv-orange font-bold hover:underline">giriş yapın</button>
              {' '}veya{' '}
              <button onClick={() => setShowAuth(true)} className="text-gv-orange font-bold hover:underline">üye olun</button>,
              ücretsiz.
            </p>
          )}
        </div>

        {/* RIGHT: image collage */}
        <div className="fade-up-4 relative h-[540px] hidden md:block">
          <div className="absolute top-0 right-0 w-[76%] h-[68%] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(28,26,23,0.22)]">
            <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80" alt="Premium restoran"
              className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-10 left-0 w-[52%] h-[52%] rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(28,26,23,0.18)] border-4 border-gv-cream">
            <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80" alt="Restoran ambiyans"
              className="w-full h-full object-cover" />
          </div>
          <div className="float-anim absolute top-7 -left-5 bg-gv-white rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(28,26,23,0.14)] flex flex-col gap-1">
            <span className="text-[0.7rem] text-gv-muted font-medium">Çınar Bahçe</span>
            <span className="text-amber-400 tracking-wider text-xs">★★★★★</span>
            <span className="text-[0.7rem] font-bold text-gv-ink">4.9 · 284 yorum</span>
          </div>
          <div className="float-anim-2 absolute bottom-36 -right-3 bg-gv-white rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(28,26,23,0.14)] flex items-center gap-2 text-sm font-semibold text-gv-ink">
            <div className="pulse-dot w-2 h-2 rounded-full bg-red-500" />
            Canlı Müzik — Bu Gece
          </div>
          <button
            onClick={() => navigate('/restaurants')}
            className="absolute bottom-4 right-16 bg-gv-orange text-gv-white text-xs font-bold px-4 py-2 rounded-full shadow-orange-glow hover:bg-gv-orange-dark transition-all hover:-translate-y-0.5">
            3 Masa Kaldı 🔥
          </button>
        </div>
      </section>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </>
  )
}
