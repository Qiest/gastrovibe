/**
 * src/components/AuthModal.jsx
 * Giriş / Kayıt modal'ı
 * — Şifre göster/gizle
 * — Client-side validasyon
 * — Brute-force uyarısı
 */
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const AVATARS = ['👤','🍽️','👨‍🍳','🥂','🌮','🍣','🥩','🌿']

export default function AuthModal({ onClose, defaultTab = 'login' }) {
  const [tab,      setTab]     = useState(defaultTab)
  const [form,     setForm]    = useState({ name: '', email: '', password: '', avatar: '👤' })
  const [showPw,   setShowPw]  = useState(false)
  const [error,    setError]   = useState('')
  const [loading,  setLoading] = useState(false)
  const { login, register }    = useAuth()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    if (tab === 'register' && form.name.trim().length < 2)
      return 'Ad en az 2 karakter olmalı.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'Geçerli bir e-posta adresi girin.'
    if (form.password.length < 6)
      return 'Şifre en az 6 karakter olmalı.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ve = validate()
    if (ve) { setError(ve); return }
    setError(''); setLoading(true)
    try {
      if (tab === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form.name, form.email, form.password, form.avatar)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-gv-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'panelUp 0.3s ease' }}
      >
        {/* Header */}
        <div className="bg-gv-emerald px-8 pt-8 pb-6">
          <button onClick={onClose} className="absolute top-4 right-5 text-white/60 hover:text-white text-xl">✕</button>
          <div className="font-playfair text-2xl font-black text-white mb-1">
            Gastro<span className="text-gv-orange-light">Vibe</span>
          </div>
          <p className="text-white/60 text-sm">
            {tab === 'login' ? 'Tekrar hoş geldiniz 👋' : 'Aramıza katılın ✨'}
          </p>
          <div className="flex gap-1 mt-5 bg-white/10 rounded-xl p-1">
            {['login','register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white text-gv-emerald' : 'text-white/70 hover:text-white'}`}
              >
                {t === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-4">

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gv-muted mb-2">Ad Soyad</label>
              <input
                type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Adınız ve soyadınız" maxLength={50}
                className="w-full bg-gv-cream border-2 border-transparent focus:border-gv-orange rounded-xl px-4 py-3 text-sm outline-none transition-colors text-gv-ink"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gv-muted mb-2">E-posta</label>
            <input
              type="email" required value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="ornek@email.com"
              className="w-full bg-gv-cream border-2 border-transparent focus:border-gv-orange rounded-xl px-4 py-3 text-sm outline-none transition-colors text-gv-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gv-muted mb-2">Şifre</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} required value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={tab === 'register' ? 'En az 6 karakter' : '••••••••'}
                className="w-full bg-gv-cream border-2 border-transparent focus:border-gv-orange rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-colors text-gv-ink"
              />
              <button
                type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gv-muted hover:text-gv-ink text-lg"
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gv-muted mb-2">Avatarın</label>
              <div className="flex gap-2 flex-wrap">
                {AVATARS.map(a => (
                  <button
                    key={a} type="button" onClick={() => set('avatar', a)}
                    className={`w-10 h-10 text-xl rounded-xl transition-all ${form.avatar === a ? 'bg-gv-orange text-white scale-110 shadow-lg' : 'bg-gv-cream hover:bg-gv-cream-dark'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-gv-orange text-white font-bold py-3.5 rounded-xl hover:bg-gv-orange-dark disabled:opacity-60 transition-all duration-200 hover:-translate-y-0.5 text-sm mt-1"
          >
            {loading ? '⋯ Lütfen bekleyin...' : tab === 'login' ? 'Giriş Yap →' : 'Hesap Oluştur →'}
          </button>

          {tab === 'login' && (
            <p className="text-center text-xs text-gv-muted">
              Demo: <button type="button" className="font-bold text-gv-ink hover:text-gv-orange transition-colors"
                onClick={() => { set('email','demo@gastrovibe.com'); set('password','demo1234') }}>
                demo@gastrovibe.com / demo1234
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
