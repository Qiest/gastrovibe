import { useState, useEffect } from 'react'

const CATEGORY_COLORS = {
  'Keşif':    'bg-gv-orange/15 text-gv-orange',
  'Dergi':    'bg-gv-emerald/15 text-gv-emerald',
  'Rehber':   'bg-blue-100 text-blue-700',
  'Röportaj': 'bg-amber-100 text-amber-700',
}

function BlogCard({ post, featured = false }) {
  const [open, setOpen] = useState(false)
  const date = new Date(post.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const categoryClass = CATEGORY_COLORS[post.category] || 'bg-white/80 text-gv-ink'

  return (
    <>
      <article
        onClick={() => setOpen(true)}
        className={`bg-gv-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group ${featured ? 'md:col-span-2' : ''}`}
      >
        {/* Cover */}
        <div className={`relative overflow-hidden ${featured ? 'h-64' : 'h-48'}`}>
          <img src={post.cover_url} alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <span className={`absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm ${categoryClass}`}>
            {post.category}
          </span>
          {featured && (
            <div className="absolute bottom-5 left-5 right-5">
              <h3 className="font-playfair font-black text-white text-xl leading-tight mb-2">{post.title}</h3>
              <p className="text-white/75 text-sm line-clamp-2">{post.excerpt}</p>
            </div>
          )}
        </div>

        {/* Body (non-featured only) */}
        {!featured && (
          <div className="p-5">
            <h3 className="font-playfair font-bold text-gv-ink text-base leading-snug mb-2 group-hover:text-gv-orange transition-colors">
              {post.title}
            </h3>
            <p className="text-xs text-gv-muted leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
            <div className="flex items-center justify-between text-xs text-gv-muted">
              <span>{post.author_avatar} {post.author_name}</span>
              <span>{post.read_minutes} dk okuma</span>
            </div>
          </div>
        )}

        {/* Footer (featured only) */}
        {featured && (
          <div className="px-5 py-3 flex items-center justify-between text-xs text-gv-muted border-t border-gv-cream-dark">
            <span>{post.author_avatar} {post.author_name} · {date}</span>
            <span className="font-semibold text-gv-orange">{post.read_minutes} dk →</span>
          </div>
        )}
      </article>

      {/* Reader modal */}
      {open && (
        <div className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-gv-white w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col"
            style={{ maxHeight: '90vh', animation: 'panelUp 0.35s ease' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cover */}
            <div className="relative h-52 flex-shrink-0">
              <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
              <button onClick={() => setOpen(false)}
                className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 text-lg font-bold">
                ←
              </button>
              <span className={`absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm ${categoryClass}`}>
                {post.category}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-7 py-7">
              <h2 className="font-playfair font-black text-2xl text-gv-ink leading-tight mb-3">{post.title}</h2>
              <div className="flex items-center gap-3 text-xs text-gv-muted mb-6 pb-5 border-b border-gv-cream-dark flex-wrap">
                <span>{post.author_avatar} <strong className="text-gv-ink">{post.author_name}</strong></span>
                <span>·</span><span>{date}</span>
                <span>·</span><span>{post.read_minutes} dakika</span>
              </div>
              <p className="text-gv-muted text-sm leading-relaxed mb-5 italic border-l-4 border-gv-orange pl-4">{post.excerpt}</p>
              <p className="text-gv-ink-light text-sm leading-loose">{post.body}</p>
              <div className="mt-10 p-5 bg-gv-cream rounded-2xl text-center">
                <div className="text-3xl mb-2">📖</div>
                <p className="text-sm text-gv-muted font-medium">Yazının devamı GastroVibe Dergi'de.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function BlogSection() {
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setPosts(d.posts || []))
      .catch(err => console.error('Blog yüklenemedi:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading || posts.length === 0) return null

  const [featured, ...rest] = posts

  return (
    <section className="px-12 py-20 bg-gv-white">
      <div className="flex justify-between items-end mb-11">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gv-orange mb-2">GastroVibe Dergi</p>
          <h2 className="font-playfair font-extrabold leading-tight tracking-tight text-gv-ink"
            style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)' }}>
            Lezzetin <em className="italic text-gv-orange">Arka Yüzü</em>
          </h2>
        </div>
        <a href="#" className="text-sm font-semibold text-gv-orange border-b-2 border-gv-orange pb-0.5 hover:opacity-70 whitespace-nowrap"
          style={{ textDecoration: 'none' }}>Tüm Yazılar →</a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featured && <BlogCard post={featured} featured />}
        {rest.slice(0, 2).map(p => <BlogCard key={p.id} post={p} />)}
      </div>
    </section>
  )
}
