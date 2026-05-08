import { Link } from 'react-router-dom'
import { useGlobalToast } from '../App'

const LINKS = {
  'Keşfet':   [
    { label: 'Bursa',        to: '/restaurants?city=Bursa'    },
    { label: 'İstanbul',     to: '/restaurants?city=İstanbul' },
    { label: 'Tüm Mekanlar', to: '/restaurants'               },
  ],
  'Platform': [
    { label: 'Nasıl Çalışır?', soon: true },
    { label: 'Mekan Ekle',     soon: true },
    { label: 'GastroPass',     soon: true },
  ],
  'Şirket':   [
    { label: 'Hakkımızda', soon: true },
    { label: 'Blog',       soon: true },
    { label: 'İletişim',   soon: true },
  ],
}

export default function Footer() {
  const { info } = useGlobalToast()

  return (
    <footer className="bg-gv-ink text-gv-white">
      <div className="px-12 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <Link to="/" className="font-playfair text-2xl font-black tracking-tight text-white" style={{ textDecoration: 'none' }}>
            Gastro<span className="text-gv-orange">Vibe</span>
          </Link>
          <p className="text-white/50 text-sm leading-relaxed mt-4 max-w-xs">
            Türkiye'nin en iyi deneyim odaklı restoran keşif platformu.
          </p>
          <div className="flex gap-3 mt-6">
            {['𝕏','in','📸'].map(s => (
              <button key={s}
                onClick={() => info('Sosyal medya sayfaları yakında! 🚀')}
                className="w-9 h-9 rounded-full border border-white/20 text-white/60 text-sm flex items-center justify-center hover:border-gv-orange hover:text-gv-orange transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>

        {Object.entries(LINKS).map(([title, links]) => (
          <div key={title}>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-5">{title}</h4>
            <ul className="flex flex-col gap-3">
              {links.map(link => (
                <li key={link.label}>
                  {link.soon ? (
                    <button
                      onClick={() => info(`${link.label} yakında aktif! 🚀`)}
                      className="text-sm text-white/70 hover:text-gv-orange transition-colors duration-200 text-left">
                      {link.label}
                    </button>
                  ) : (
                    <Link to={link.to}
                      className="text-sm text-white/70 hover:text-gv-orange transition-colors duration-200"
                      style={{ textDecoration: 'none' }}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="px-12 py-5 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-white/40 text-xs">© 2025 GastroVibe. Tüm hakları saklıdır.</span>
        <div className="flex gap-6">
          {['Gizlilik', 'Kullanım Şartları', 'Çerezler'].map(l => (
            <button key={l}
              onClick={() => info(`${l} sayfası yakında! 🔒`)}
              className="text-xs text-white/40 hover:text-white/70 transition-colors">
              {l}
            </button>
          ))}
        </div>
      </div>
    </footer>
  )
}
