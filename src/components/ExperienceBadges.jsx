import { useState } from 'react'
import { experienceBadges } from '../data/restaurants'

export default function ExperienceBadges() {
  const [active, setActive] = useState(null)

  return (
    <section className="py-16 px-12">
      <div className="flex justify-between items-end mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gv-orange mb-2">Deneyime Göre Keşfet</p>
          <h2 className="font-playfair font-extrabold leading-tight tracking-tight text-gv-ink"
            style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>
            Ne Hissettirmeli?
          </h2>
        </div>
        <a href="#" className="text-sm font-semibold text-gv-orange border-b-2 border-gv-orange pb-0.5 hover:opacity-70 transition-opacity"
          style={{ textDecoration: 'none' }}>
          Tümünü Gör
        </a>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {experienceBadges.map(b => (
          <button
            key={b.label}
            onClick={() => setActive(active === b.label ? null : b.label)}
            className={`bg-gv-white rounded-2xl py-6 px-4 text-center transition-all duration-200 border-2
              ${active === b.label
                ? 'border-gv-orange shadow-card -translate-y-1'
                : 'border-transparent hover:border-gv-orange hover:shadow-card hover:-translate-y-0.5'
              }`}
          >
            <span className="text-3xl block mb-2">{b.icon}</span>
            <span className="text-[0.75rem] font-semibold text-gv-ink-light leading-tight">{b.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
