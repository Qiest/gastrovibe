// src/pages/BlogPage.jsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const CATEGORIES = ['Tümü', 'Keşif', 'Rehber', 'Röportaj', 'Dergi', 'Tarif']

const CATEGORY_STYLES = {
  Keşif:    { bg:'bg-gv-orange/15',    text:'text-gv-orange',   border:'border-gv-orange'    },
  Rehber:   { bg:'bg-blue-100',        text:'text-blue-700',    border:'border-blue-400'     },
  Röportaj: { bg:'bg-amber-100',       text:'text-amber-700',   border:'border-amber-400'    },
  Dergi:    { bg:'bg-gv-emerald/15',   text:'text-gv-emerald',  border:'border-gv-emerald'   },
  Tarif:    { bg:'bg-purple-100',      text:'text-purple-700',  border:'border-purple-400'   },
}

function CategoryBadge({ cat, size = 'sm' }) {
  const s = CATEGORY_STYLES[cat] || { bg:'bg-gray-100', text:'text-gray-600', border:'border-gray-300' }
  return (
    <span className={`inline-block font-bold rounded-full ${s.bg} ${s.text}
      ${size === 'lg' ? 'text-xs px-4 py-1.5' : 'text-[0.65rem] px-3 py-1'}`}>
      {cat}
    </span>
  )
}

function ReadingTime({ minutes }) {
  return (
    <span className="flex items-center gap-1 text-xs text-gv-muted">
      <span>📖</span> {minutes} dk
    </span>
  )
}

/* ── ARTICLE READER MODAL ─────────────────────────────────── */
function ArticleModal({ post, onClose }) {
  const date = new Date(post.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-0 md:p-8"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div
        className="relative bg-gv-white w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh', animation: 'panelUp 0.35s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cover */}
        <div className="relative h-52 flex-shrink-0">
          <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <button onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 font-bold text-lg">
            ←
          </button>
          <div className="absolute top-4 right-4">
            <CategoryBadge cat={post.category} size="lg" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-7 py-7">
          <h1 className="font-playfair font-black text-gv-ink leading-tight mb-4"
            style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)' }}>
            {post.title}
          </h1>

          {/* Byline */}
          <div className="flex items-center gap-4 pb-5 mb-6 border-b border-gv-cream-dark">
            <div className="w-9 h-9 rounded-full bg-gv-cream-dark flex items-center justify-center text-lg">
              {post.author_avatar}
            </div>
            <div>
              <div className="text-sm font-semibold text-gv-ink">{post.author_name}</div>
              <div className="text-xs text-gv-muted">{date}</div>
            </div>
            <div className="ml-auto">
              <ReadingTime minutes={post.read_minutes} />
            </div>
          </div>

          {/* Excerpt as pull quote */}
          <blockquote className="border-l-4 border-gv-orange pl-5 py-1 mb-6">
            <p className="text-gv-muted text-sm leading-relaxed italic font-medium">{post.excerpt}</p>
          </blockquote>

          {/* Body */}
          <div className="text-gv-ink-light text-sm leading-loose prose">
            {post.body.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className="mb-4">{para}</p>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-10 p-5 bg-gv-cream rounded-2xl text-center">
            <div className="text-2xl mb-2">🍽️</div>
            <p className="text-sm font-semibold text-gv-ink mb-1">Bu yazıyı beğendiniz mi?</p>
            <p className="text-xs text-gv-muted">GastroVibe Dergi'de her hafta yeni içerikler yayınlanıyor.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── FEATURED ARTICLE CARD ────────────────────────────────── */
function FeaturedCard({ post, onClick }) {
  const date = new Date(post.created_at).toLocaleDateString('tr-TR', { day:'numeric', month:'long' })
  return (
    <div onClick={onClick}
      className="relative rounded-3xl overflow-hidden cursor-pointer group h-96 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1">
      <img src={post.cover_url} alt={post.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute top-5 left-5">
        <CategoryBadge cat={post.category} size="lg" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-7">
        <h2 className="font-playfair font-black text-white leading-tight mb-2"
          style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)' }}>
          {post.title}
        </h2>
        <p className="text-white/75 text-sm line-clamp-2 mb-4">{post.excerpt}</p>
        <div className="flex items-center gap-3 text-white/60 text-xs">
          <span>{post.author_avatar} {post.author_name}</span>
          <span>·</span><span>{date}</span>
          <span>·</span><ReadingTime minutes={post.read_minutes} />
          <div className="ml-auto bg-gv-orange text-white font-bold px-4 py-1.5 rounded-full text-xs
            opacity-0 group-hover:opacity-100 transition-opacity">
            Oku →
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── REGULAR ARTICLE CARD ─────────────────────────────────── */
function ArticleCard({ post, onClick, horizontal = false }) {
  const date = new Date(post.created_at).toLocaleDateString('tr-TR', { day:'numeric', month:'long' })

  if (horizontal) {
    return (
      <div onClick={onClick}
        className="flex gap-4 bg-gv-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover cursor-pointer group transition-all hover:-translate-y-0.5">
        <img src={post.cover_url} alt={post.title}
          className="w-28 h-full object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-300" style={{ minHeight:90 }} />
        <div className="p-4 flex flex-col justify-center">
          <CategoryBadge cat={post.category} />
          <h3 className="font-playfair font-bold text-gv-ink text-sm leading-snug mt-2 mb-1 group-hover:text-gv-orange transition-colors line-clamp-2">
            {post.title}
          </h3>
          <div className="flex items-center gap-2 text-gv-muted text-xs mt-auto">
            <span>{post.author_name}</span>
            <span>·</span>
            <ReadingTime minutes={post.read_minutes} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div onClick={onClick}
      className="bg-gv-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover cursor-pointer group transition-all hover:-translate-y-1">
      <div className="relative h-44 overflow-hidden">
        <img src={post.cover_url} alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-3 left-3">
          <CategoryBadge cat={post.category} />
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-playfair font-bold text-gv-ink text-base leading-snug mb-2 group-hover:text-gv-orange transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-xs text-gv-muted line-clamp-2 mb-4 leading-relaxed">{post.excerpt}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gv-muted">
            <span>{post.author_avatar}</span>
            <span>{post.author_name}</span>
          </div>
          <ReadingTime minutes={post.read_minutes} />
        </div>
      </div>
    </div>
  )
}

/* ── MAIN BLOG PAGE ───────────────────────────────────────── */
export default function BlogPage() {
  const [posts,       setPosts]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [activePost,  setActivePost]  = useState(null)
  const [activeCategory, setActiveCategory] = useState('Tümü')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeCategory === 'Tümü'
    ? posts
    : posts.filter(p => p.category === activeCategory)

  const [featured, ...rest] = filtered
  const sidebarPosts = rest.slice(0, 3)
  const gridPosts    = rest.slice(3)

  return (
    <>
      <div className="min-h-screen bg-gv-cream pt-24 pb-20">

        {/* Masthead */}
        <div className="px-8 md:px-16 mb-12">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gv-orange mb-2">GastroVibe Dergi</p>
              <h1 className="font-playfair font-black text-gv-ink leading-none"
                style={{ fontSize: 'clamp(2.6rem, 6vw, 4rem)' }}>
                Lezzetin<br /><em className="italic text-gv-orange">Arka Yüzü</em>
              </h1>
            </div>
            <p className="text-gv-muted max-w-xs text-sm leading-relaxed">
              Şef röportajları, şehir rehberleri, gizli kalmış mekanlar ve yemek kültürü üzerine editoryal içerikler.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex-1 h-px bg-gv-cream-dark" />
            <span className="text-gv-muted text-xs font-bold uppercase tracking-widest">Kategoriler</span>
            <div className="flex-1 h-px bg-gv-cream-dark" />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mt-4">
            {CATEGORIES.map(cat => {
              const s = CATEGORY_STYLES[cat] || {}
              const isActive = activeCategory === cat
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`text-xs font-bold px-4 py-2 rounded-full border-2 transition-all
                    ${isActive
                      ? `${s.bg || 'bg-gv-ink'} ${s.text || 'text-white'} ${s.border || 'border-gv-ink'}`
                      : 'border-gv-cream-dark text-gv-ink-light hover:border-gv-orange hover:text-gv-orange'
                    }`}>
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="px-8 md:px-16 text-center py-16 text-gv-muted">
            <div className="text-4xl mb-3 animate-pulse">📰</div>
            <p className="text-sm">Yazılar yükleniyor...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="px-8 md:px-16 text-center py-16">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="font-playfair font-bold text-gv-ink text-xl mb-2">Henüz içerik yok</h3>
            <p className="text-gv-muted text-sm">Blog yazıları çok yakında burada olacak.</p>
          </div>
        ) : (
          <div className="px-8 md:px-16">

            {/* Featured + Sidebar layout */}
            {featured && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="md:col-span-2">
                  <FeaturedCard post={featured} onClick={() => setActivePost(featured)} />
                </div>
                {sidebarPosts.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-gv-muted mb-1">
                      Son Yazılar
                    </div>
                    {sidebarPosts.map(p => (
                      <ArticleCard key={p.id} post={p} onClick={() => setActivePost(p)} horizontal />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Divider with issue label */}
            {gridPosts.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-7">
                  <div className="flex-1 h-px bg-gv-cream-dark" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gv-muted px-3">
                    Tüm Yazılar
                  </span>
                  <div className="flex-1 h-px bg-gv-cream-dark" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {gridPosts.map(p => (
                    <ArticleCard key={p.id} post={p} onClick={() => setActivePost(p)} />
                  ))}
                </div>
              </>
            )}

            {/* Newsletter CTA */}
            <div className="mt-16 bg-gv-emerald rounded-3xl px-10 py-10 flex flex-col md:flex-row items-center gap-7">
              <div className="flex-1">
                <p className="text-gv-orange text-xs font-bold uppercase tracking-widest mb-2">📬 Bülten</p>
                <h3 className="font-playfair font-black text-white text-2xl mb-2">
                  Her Hafta Yeni Lezzetler
                </h3>
                <p className="text-white/60 text-sm">
                  En yeni mekanlar, şef röportajları ve şehir rehberleri — direkt e-postanıza gelsin.
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <input
                  type="email"
                  placeholder="E-posta adresiniz"
                  className="bg-white/10 text-white placeholder-white/40 text-sm px-5 py-3 rounded-xl outline-none border-2 border-white/20 focus:border-gv-orange transition-colors w-52"
                />
                <button
                  onClick={() => {}}
                  className="bg-gv-orange text-white font-bold px-5 py-3 rounded-xl hover:bg-gv-orange-dark transition-all text-sm whitespace-nowrap">
                  Abone Ol
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {activePost && <ArticleModal post={activePost} onClose={() => setActivePost(null)} />}
    </>
  )
}
