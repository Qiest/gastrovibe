// src/App.jsx
import { useEffect } from 'react'
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

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gv-cream">
      <div className="text-4xl animate-pulse">🍽️</div>
    </div>
  )
  return user ? children : <Navigate to="/" replace />
}

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

function AppContent() {
  // ─── Custom cursor — tüm sayfalarda aktif ─────────────────
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

    // Tıklanabilir elemanlarda ring büyür
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

    // Yeni render edilen elemanlar için MutationObserver
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
      {/* Cursor — DOM'da kalıcı */}
      <div
        id="cursor-dot"
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-gv-orange pointer-events-none z-[9999]"
        style={{ transition: 'none' }}
      />
      <div
        id="cursor-ring"
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-gv-orange/50 pointer-events-none z-[9998]"
        style={{ transition: 'width 0.2s, height 0.2s, opacity 0.2s' }}
      />

      <Navbar />
      <main>
        <Routes>
          <Route path="/"        element={<HomePage />} />
          <Route path="/blog"    element={<BlogPage />} />
          <Route path="/cities"  element={<CitiesPage />} />
          <Route path="/profile" element={
            <PrivateRoute><ProfilePage /></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
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
      <AppContent />
    </AuthProvider>
  )
}
