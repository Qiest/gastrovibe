/**
 * src/components/GastroAssistant.jsx
 * AI sohbet asistanı FAB
 * — Gerçek conversation history
 * — Güvenli hata yönetimi
 * — Rezervasyon linki
 */
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import ReservationModal from './ReservationModal'
import AuthModal        from './AuthModal'

const SUGGESTIONS = [
  '🕯️ Romantik akşam yemeği',
  '🎶 Canlı müzikli mekan',
  '🌿 Doğa içinde bir yer',
  '👨‍👩‍👧 Aile yemeği için',
  '🌊 Deniz kenarında balık',
  '🔥 En iyi ocakbaşı',
  '☕ Kahvaltı yeri',
  '🏛️ Tarihi mekan',
]

function AiCard({ r, onReserve }) {
  return (
    <div className="flex items-center gap-3 bg-gv-white border border-gv-cream-dark rounded-2xl p-3 mt-1.5 cursor-pointer hover:border-gv-orange hover:shadow-card transition-all group">
      <div className="w-10 h-10 rounded-xl bg-gv-orange/10 flex items-center justify-center text-xl flex-shrink-0">
        {r.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[0.85rem] text-gv-ink truncate group-hover:text-gv-orange transition-colors">
          {r.name}
        </div>
        <div className="text-[0.72rem] text-gv-muted truncate">{r.location} · {r.price}</div>
        {r.badges?.length > 0 && (
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {r.badges.slice(0, 2).map(b => (
              <span key={b} className="text-[0.62rem] bg-gv-orange/10 text-gv-orange px-2 py-0.5 rounded-full font-medium">
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={() => onReserve(r)}
        className="text-[0.65rem] font-bold bg-gv-orange text-white px-2.5 py-1.5 rounded-full flex-shrink-0 hover:bg-gv-orange-dark transition-colors"
      >
        Rezerv.
      </button>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-gv-cream-dark rounded-2xl rounded-tl-sm w-fit max-w-[70px]">
      {[0, 150, 300].map(d => (
        <span
          key={d}
          className="w-1.5 h-1.5 rounded-full bg-gv-muted"
          style={{ animation: `bounce 1s ${d}ms infinite` }}
        />
      ))}
    </div>
  )
}

export default function GastroAssistant() {
  const { user, authFetch } = useAuth()
  const [open,      setOpen]     = useState(false)
  const [input,     setInput]    = useState('')
  const [messages,  setMessages] = useState([{
    id: 1, type: 'ai',
    text: '👋 Merhaba! Ben GastroVibe Asistanı. Nasıl bir deneyim arıyorsunuz?',
  }])
  const [history,   setHistory]  = useState([])
  const [showSugg,  setShowSugg] = useState(true)
  const [loading,   setLoading]  = useState(false)
  const [reserve,   setReserve]  = useState(null)
  const [showAuth,  setShowAuth] = useState(false)

  const endRef   = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300) }, [open])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput(''); setShowSugg(false); setLoading(true)

    const thinkId = Date.now()
    setMessages(prev => [
      ...prev,
      { id: thinkId - 1, type: 'user', text: msg },
      { id: thinkId,     type: 'thinking' },
    ])

    try {
      const res  = await authFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: msg, history: history.slice(-10) }),
      })
      const data = await res.json()

      setMessages(prev => [
        ...prev.filter(m => m.id !== thinkId),
        { id: Date.now(), type: 'ai', text: data.message, restaurants: data.restaurants },
      ])
      setHistory(prev => [
        ...prev,
        { role: 'user',      content: msg         },
        { role: 'assistant', content: data.message },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => m.id !== thinkId),
        { id: Date.now(), type: 'ai', text: '⚠️ Bağlantı hatası. Lütfen tekrar deneyin.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleReserveFromChat = (r) => {
    if (!user) { setShowAuth(true); return }
    setReserve({
      id: r.id ?? null,
      name: r.name,
      location: r.location || 'Bursa',
      price_level: 2,
      image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    })
  }

  const clearChat = () => {
    setMessages([{ id: 1, type: 'ai', text: '👋 Yeni sohbet başlatıldı! Nasıl bir deneyim arıyorsunuz?' }])
    setHistory([])
    setShowSugg(true)
  }

  return (
    <>
      <div className="fixed bottom-7 right-7 z-50">
        {open && (
          <div
            className="absolute bottom-20 right-0 w-[360px] bg-gv-white rounded-3xl overflow-hidden flex flex-col"
            style={{ maxHeight: '560px', boxShadow: '0 20px 80px rgba(28,26,23,0.22)', animation: 'panelUp 0.3s ease' }}
          >
            {/* Header */}
            <div className="bg-gv-emerald px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gv-orange flex items-center justify-center text-xl">🍽️</div>
              <div>
                <div className="font-semibold text-white text-sm">Gastro Asistan</div>
                <div className="text-white/60 text-xs flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  AI destekli · Anlık yanıt
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={clearChat}
                  title="Sohbeti temizle"
                  className="text-white/50 hover:text-white text-sm transition-colors"
                >
                  🗑️
                </button>
                <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-lg">✕</button>
              </div>
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scroll-smooth">
              {messages.map(msg => (
                <div key={msg.id}>
                  {msg.type === 'thinking' && <TypingIndicator />}
                  {msg.type === 'ai' && (
                    <div>
                      <div className="bg-gv-cream-dark text-gv-ink text-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[92%] leading-relaxed">
                        {msg.text}
                      </div>
                      {msg.restaurants?.map(r => (
                        <AiCard key={r.name} r={r} onReserve={handleReserveFromChat} />
                      ))}
                    </div>
                  )}
                  {msg.type === 'user' && (
                    <div className="flex justify-end">
                      <div className="bg-gv-orange text-white text-sm rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {showSugg && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s} onClick={() => send(s)}
                      className="text-[0.72rem] font-medium px-3 py-1.5 rounded-full bg-gv-cream border border-gv-cream-dark text-gv-ink-light hover:border-gv-orange hover:text-gv-orange transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-gv-cream-dark flex gap-2 items-center flex-shrink-0">
              <input
                ref={inputRef}
                type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ne tür bir yer arıyorsunuz?"
                maxLength={500}
                className="flex-1 text-sm bg-gv-cream rounded-xl px-4 py-2.5 outline-none text-gv-ink placeholder-gv-muted"
              />
              <button
                onClick={() => send()} disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-gv-orange text-white flex items-center justify-center font-bold hover:bg-gv-orange-dark disabled:opacity-50 transition-all hover:scale-105"
              >
                {loading ? '⋯' : '→'}
              </button>
            </div>
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-16 h-16 rounded-full bg-gv-orange text-2xl flex items-center justify-center shadow-orange-glow hover:scale-110 hover:shadow-orange-glow-lg transition-all duration-200"
        >
          {open ? '✕' : '🍽️'}
        </button>
        {!open && (
          <div className="absolute inset-0 rounded-full border-2 border-gv-orange/40 animate-ping pointer-events-none" />
        )}
      </div>

      {reserve  && <ReservationModal restaurant={reserve} onClose={() => setReserve(null)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="login" />}
    </>
  )
}
