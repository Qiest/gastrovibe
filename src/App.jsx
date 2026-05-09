// src/App.jsx
import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Navbar            from './components/Navbar'
import Hero              from './components/Hero'
import StatsBar          from './components/StatsBar'
import ExperienceBadges  from './components/ExperienceBadges'
import FeaturedSection   from './components/FeaturedSection'
import DiscoveryCarousel from './components/DiscoveryCarousel'
import MapTeaser         from './components/MapTeaser'
import GastroAssistant   from './components/GastroAssistant'
import Footer            from './components/Footer'

import BlogPage    from './pages/BlogPage'
import CitiesPage  from './pages/CitiesPage'
import ProfilePage from './pages/ProfilePage'

// ─── Global Toast ─────────────────────────────────────────────
const ToastContext = createContext(null)

export function useGlobalToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) return {
    info:    (msg) => alert(msg),
    success: (msg) => alert(msg),
    error:   (msg) => alert(msg),
  }
  return ctx
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])

  const info    = useCallback((msg) => push(msg, 'info'),    [push])
  const success = useCallback((msg) => push(msg, 'success'), [push])
  const error   = useCallback((msg) => push(msg, 'error'),   [push])

  const STYLES = {
    info:    'bg-gv-ink text-white',
    success: 'bg-green-600 text-white',
    error:   'bg-red-500 text-white',
  }

  return (
    <ToastContext.Provider value={{ info, success, error }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap ${STYLES[t.type]}`}
            style={{ animation: 'panelUp 0.25s ease' }}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ─── Private Route ────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gv-cream">
      <div className="text-4xl animate-pulse">🍽️</div>
    </div>
  )
  return user ? children : <Navigate to="/" replace />
}

// ─── Ana Sayfa ────────────────────────────────────────────────
function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <ExperienceBadges />
      <FeaturedSection />
      <DiscoveryCarousel />
      <MapTeaser />
    </>
  )
}

// ─── App ──────────────────────────────────────────────────────
function AppContent() {
  useEffect(() => {
    const dot  = document.getElementById('cursor-dot')
    const ring = document.getElementById('cursor-ring')
    if (!dot || !ring) return

    let mx = 0, my = 0, rx = 0, ry = 0, raf

    const onMove = (e) => { mx = e.clientX; my = e.clientY }

    const animate = () => {
      dot.style.transform  = `translate(${mx - 4}px, ${my - 4}px)`
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      ring.style.transform = `translate(${rx - 16}px, ${ry - 16}px)`
      raf = requestAnimationFrame(animate)
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(animate)

    const grow   = () => { ring.style.width = '52px'; ring.style.height = '52px'; ring.style.opacity = '0.35' }
    const shrink = () => { ring.style.width = '32px'; ring.style.height = '32px'; ring.style.opacity = '0.5'  }

    const bindCursor = () => {
      document.querySelectorAll('a, button, [role="button"], input, textarea, select').forEach(el => {
        el.removeEventListener('mouseenter', grow)
        el.removeEventListener('mouseleave', shrink)
        el.addEventListener('mouseenter', grow)
        el.addEventListener('mouseleave', shrink)
      })
    }

    bindCursor()
    const observer = new MutationObserver(bindCursor)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return (
    <BrowserRouter>
      <div id="cursor-dot"
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-gv-orange pointer-events-none z-[9999]"
        style={{ transition: 'none' }}
      />
      <div id="cursor-ring"
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-gv-orange/50 pointer-events-none z-[9998]"
        style={{ transition: 'width 0.2s, height 0.2s, opacity 0.2s' }}
      />
      <Navbar />
      <main>
        <Routes>
          <Route path="/"        element={<HomePage />} />
          <Route path="/blog"    element={<BlogPage />} />
          <Route path="/cities"  element={<CitiesPage />} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <GastroAssistant />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  )
}
