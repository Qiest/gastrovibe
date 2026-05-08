const STATS = [
  { number: '2.400+', label: 'Seçkin Mekan' },
  { number: '18',     label: 'Büyükşehir'   },
  { number: '94K',    label: 'Mutlu Misafir' },
  { number: '4.8★',   label: 'Ortalama Puan' },
]

export default function StatsBar() {
  return (
    <div className="flex justify-center items-center gap-20 py-7 bg-gv-emerald flex-wrap">
      {STATS.map((s, i) => (
        <div key={s.label} className="flex items-center gap-20">
          <div className="text-center">
            <span className="font-playfair text-3xl font-bold text-gv-white block">{s.number}</span>
            <span className="text-[0.75rem] font-medium uppercase tracking-widest text-white/50">{s.label}</span>
          </div>
          {i < STATS.length - 1 && (
            <div className="w-px h-11 bg-white/15" />
          )}
        </div>
      ))}
    </div>
  )
}
