// src/components/Navbar.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal       from './AuthModal'
import ProfileModal    from './ProfileModal'
import OwnerDashboard  from './owner/OwnerDashboard'
import OwnerOnboarding from './owner/OwnerOnboarding'
import AdminPanel      from './owner/AdminPanel'

const NAV_LINKS = [
  { label:'Keşfet',     to:'/#discover' },
  { label:'Deneyimler', to:'/#experiences' },
  { label:'Şehirler',   to:'/cities' },
  { label:'Blog',       to:'/blog' },
]

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scrolled,       setScrolled]       = useState(false)
  const [showAuth,       setShowAuth]       = useState(false)
  const [authTab,        setAuthTab]        = useState('login')
  const [showProfile,    setShowProfile]    = useState(false)
  const [showOwnerDash,  setShowOwnerDash]  = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showAdmin,      setShowAdmin]      = useState(false)
  const [mobileOpen,     setMobileOpen]     = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openAuth = (tab) => { setAuthTab(tab); setShowAuth(true) }

  const handleOwnerClick = () => {
    if (!user) { openAuth('register'); return }
    if (user.role === 'admin') { setShowAdmin(true); return }
    setShowOwnerDash(true)
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between transition-all duration-300
        ${scrolled ? 'py-3 bg-gv-cream/92 shadow-sm' : 'py-5 bg-gv-cream/80'}
        backdrop-blur-xl border-b border-gv-orange/8 px-12`}>

        <Link to="/" className="font-playfair text-[1.55rem] font-black tracking-tight text-gv-ink no-underline">
          Gastro<span className="text-gv-orange">Vibe</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-9 list-none">
          {NAV_LINKS.map(({ label, to }) => (
            <li key={label}>
              <Link to={to}
                className="text-[0.88rem] font-medium text-gv-ink-light uppercase tracking-wide hover:text-gv-orange transition-colors no-underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex gap-3 items-center">
          <button onClick={handleOwnerClick}
            className="text-[0.82rem] font-semibold px-4 py-2 rounded-full border-[1.5px] border-gv-emerald text-gv-emerald hover:bg-gv-emerald hover:text-white transition-all">
            {user?.role === 'admin' ? '👑 Admin' : user?.role === 'owner' ? '🏪 Panelim' : '🍽️ İşletmeni Ekle'}
          </button>

          {user ? (
            <button onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-sm font-semibold text-gv-ink hover:text-gv-orange transition-colors">
              <span className="w-9 h-9 rounded-full bg-gv-orange flex items-center justify-center text-lg shadow-sm">
                {user.avatar || '👤'}
              </span>
              <span className="hidden lg:block">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <>
              <button onClick={() => openAuth('login')}
                className="text-[0.85rem] font-semibold px-5 py-2 rounded-full border-[1.5px] border-gv-orange text-gv-orange hover:bg-gv-orange hover:text-white transition-all">
                Giriş Yap
              </button>
              <button onClick={() => openAuth('register')}
                className="text-[0.85rem] font-semibold px-5 py-2 rounded-full bg-gv-orange text-white hover:bg-gv-orange-dark hover:-translate-y-0.5 transition-all">
                Üye Ol
              </button>
            </>
          )}
        </div>

        {/* Mobil hamburger */}
        <button className="md:hidden text-xl" onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobil menü */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[90] bg-gv-cream pt-20 px-8 flex flex-col gap-6 md:hidden"
          style={{ animation: 'panelUp 0.2s ease' }}>
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={label} to={to} onClick={() => setMobileOpen(false)}
              className="text-2xl font-playfair font-bold text-gv-ink hover:text-gv-orange transition-colors no-underline">
              {label}
            </Link>
          ))}
          <button onClick={() => { handleOwnerClick(); setMobileOpen(false) }}
            className="py-3 rounded-xl border-2 border-gv-emerald text-gv-emerald font-bold text-sm">
            🍽️ İşletmeni Ekle
          </button>
          <div className="flex gap-3">
            {user ? (
              <button onClick={() => { navigate('/profile'); setMobileOpen(false) }}
                className="flex-1 py-3 rounded-xl bg-gv-orange text-white font-bold">
                {user.avatar} Profilim
              </button>
            ) : (
              <>
                <button onClick={() => { openAuth('login'); setMobileOpen(false) }}
                  className="flex-1 py-3 rounded-xl border-2 border-gv-orange text-gv-orange font-bold">Giriş</button>
                <button onClick={() => { openAuth('register'); setMobileOpen(false) }}
                  className="flex-1 py-3 rounded-xl bg-gv-orange text-white font-bold">Üye Ol</button>
              </>
            )}
          </div>
        </div>
      )}

      {showAuth      && <AuthModal      onClose={() => setShowAuth(false)}      defaultTab={authTab} />}
      {showProfile   && <ProfileModal   onClose={() => setShowProfile(false)} />}
      {showOwnerDash && (
        <OwnerDashboard
          onClose={() => setShowOwnerDash(false)}
          onStartOnboarding={() => { setShowOwnerDash(false); setShowOnboarding(true) }}
        />
      )}
      {showOnboarding && (
        <OwnerOnboarding
          onClose={() => setShowOnboarding(false)}
          onSuccess={() => { setShowOnboarding(false); setShowOwnerDash(true) }}
        />
      )}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  )
}
