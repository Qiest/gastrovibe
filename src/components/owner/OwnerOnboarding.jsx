/**
 * src/components/owner/OwnerOnboarding.jsx
 * ─────────────────────────────────────────────────────────────
 * İşletmeci kayıt + mekan oluşturma sihirbazı
 * 4 adım: 1-Hesap  2-Mekan Bilgileri  3-Deneyim & Etiketler  4-Medya & Yayın
 */
import { useState, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

// ─── Sabitler ─────────────────────────────────────────────────
const BADGE_OPTIONS = [
  { icon:'🌊', label:'Deniz Kenarı',  color:'blue',   group:'Manzara'  },
  { icon:'🌲', label:'Orman İçinde',  color:'green',  group:'Manzara'  },
  { icon:'🏔️', label:'Dağ Manzarası', color:'blue',   group:'Manzara'  },
  { icon:'🌅', label:'Gün Batımı',    color:'amber',  group:'Manzara'  },
  { icon:'🌿', label:'Bahçe',         color:'green',  group:'Manzara'  },
  { icon:'🕯️', label:'Romantik',      color:'amber',  group:'Ambiyans' },
  { icon:'👨‍👩‍👧', label:'Aile Dostu',   color:'green',  group:'Ambiyans' },
  { icon:'💼', label:'İş Yemeği',     color:'dark',   group:'Ambiyans' },
  { icon:'🎉', label:'Kutlama',       color:'orange', group:'Ambiyans' },
  { icon:'🌙', label:'Gece Hayatı',   color:'dark',   group:'Ambiyans' },
  { icon:'🎶', label:'Canlı Müzik',   color:'dark',   group:'Müzik'    },
  { icon:'🎸', label:'Rock / Pop',    color:'dark',   group:'Müzik'    },
  { icon:'🎷', label:'Caz',           color:'amber',  group:'Müzik'    },
  { icon:'🎻', label:'Fasıl',         color:'amber',  group:'Müzik'    },
  { icon:'🔇', label:'Müziksiz',      color:'dark',   group:'Müzik'    },
  { icon:'🔥', label:'Ocakbaşı',      color:'orange', group:'Mutfak'   },
  { icon:'🥩', label:'Et Uzmanlığı',  color:'dark',   group:'Mutfak'   },
  { icon:'🐟', label:'Deniz Ürünleri',color:'blue',   group:'Mutfak'   },
  { icon:'🌿', label:'Organik',       color:'green',  group:'Mutfak'   },
  { icon:'✨', label:'Fine Dining',   color:'orange', group:'Mutfak'   },
]

const FEATURE_OPTIONS = [
  'Açık Hava Terası','Vale Park','Vejetaryen Menü','Özel Davet',
  'Doğum Günü Organizasyonu','Şarap Eşleştirme','Tadım Menüsü',
  'Çocuk Dostu','Çocuk Oyun Alanı','Engelli Erişimi','Paket Servis',
  'Alkollü İçecek','Rezervasyon Önerilir','Şömine','Grup Masaları',
  'Özel Oda','Wi-Fi','Otopark','Vale',
]

const STEPS = [
  { n:1, label:'Hesabınız',    icon:'👤' },
  { n:2, label:'Mekan',        icon:'🏠' },
  { n:3, label:'Deneyim',      icon:'✨' },
  { n:4, label:'Medya & Yayın',icon:'📸' },
]

export default function OwnerOnboarding({ onClose, onSuccess }) {
  const { login, register, authFetch } = useAuth()
  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // ── Adım 1: Hesap ────────────────────────────────────────────
  const [account, setAccount] = useState({
    mode: 'register', // 'register' | 'login'
    name: '', email: '', password: '', showPw: false,
  })

  // ── Adım 2: Mekan ────────────────────────────────────────────
  const [place, setPlace] = useState({
    name:'', city:'Bursa', district:'', location:'',
    address:'', phone:'', price_level:2, capacity:50,
    description:'', long_desc:'',
    hours:{ 'Pzt-Cum':'12:00–23:00', 'Cmt-Paz':'11:00–00:00' },
  })

  // ── Adım 3: Deneyim ──────────────────────────────────────────
  const [experience, setExperience] = useState({
    badges:[], features:[],
  })

  // ── Adım 4: Medya ────────────────────────────────────────────
  const [media,      setMedia]      = useState({ images:[] })
  const [uploading,  setUploading]  = useState(false)
  const [dragOver,   setDragOver]   = useState(false)
  const fileRef = useRef(null)

  // ─────────────────────────────────────────────────────────────

  const setAcc = (k,v) => setAccount(a => ({...a, [k]:v}))
  const setPlc = (k,v) => setPlace(p   => ({...p, [k]:v}))

  const toggleBadge = (b) => {
    const has = experience.badges.find(x => x.label === b.label)
    if (has) setExperience(e => ({...e, badges: e.badges.filter(x => x.label !== b.label)}))
    else if (experience.badges.length < 6) setExperience(e => ({...e, badges:[...e.badges,b]}))
  }

  const toggleFeature = (f) => {
    setExperience(e => ({
      ...e,
      features: e.features.includes(f) ? e.features.filter(x=>x!==f) : [...e.features,f]
    }))
  }

  // ─── Upload ───────────────────────────────────────────────────
  const uploadFile = async (file) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif']
    if (!allowed.includes(file.type)) { setError('Sadece JPEG, PNG, WebP yüklenebilir.'); return }
    if (file.size > 5*1024*1024) { setError('Dosya 5MB\'dan küçük olmalı.'); return }

    setUploading(true); setError('')
    try {
      const fd = new FormData(); fd.append('image', file)
      const res  = await authFetch('/api/upload', { method:'POST', headers:{}, body:fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMedia(m => ({...m, images:[...m.images, { url:data.url, name:file.name }]}))
    } catch(e) { setError(e.message) } finally { setUploading(false) }
  }

  const handleFiles = (files) => { Array.from(files).slice(0, 8 - media.images.length).forEach(uploadFile) }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeImage = (url) => setMedia(m => ({...m, images: m.images.filter(i=>i.url!==url)}))

  // ─── Adım geçişleri ───────────────────────────────────────────
  const handleStep1 = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (account.mode === 'register') {
        await register(account.name, account.email, account.password, '🏪')
        // Rol owner olarak güncelle (backend bunu hallediyor register sonrası)
        await authFetch('/api/auth/set-owner', { method:'POST' }).catch(()=>{})
      } else {
        await login(account.email, account.password)
      }
      setStep(2)
    } catch(e) { setError(e.message) } finally { setLoading(false) }
  }

  const handleStep2 = (e) => {
    e.preventDefault()
    if (!place.name.trim() || !place.city.trim() || !place.district.trim()) {
      setError('Restoran adı, şehir ve ilçe zorunludur.'); return
    }
    if (place.description.length < 10) {
      setError('Kısa açıklama en az 10 karakter olmalı.'); return
    }
    setError(''); setStep(3)
  }

  const handleStep3 = (e) => {
    e.preventDefault()
    if (experience.badges.length === 0) {
      setError('En az 1 deneyim rozeti seçin.'); return
    }
    setError(''); setStep(4)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = {
        ...place,
        badges:   experience.badges,
        features: experience.features,
        images:   media.images.map(i => i.url),
      }
      const res  = await authFetch('/api/owner/restaurant', {
        method: 'POST',
        body:   JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSuccess?.()
    } catch(e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-gv-white rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col"
        style={{ maxWidth:680, maxHeight:'92vh', animation:'panelUp 0.3s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gv-emerald px-8 py-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="font-playfair font-black text-white text-2xl">
              Gastro<span className="text-gv-orange-light">Vibe</span>
              <span className="text-white/60 text-base font-normal ml-2">İşletme</span>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white text-xl">✕</button>
          </div>

          {/* Adım göstergesi */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${step >= s.n ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${step > s.n ? 'bg-green-400 text-white' : step === s.n ? 'bg-gv-orange text-white scale-110' : 'bg-white/20 text-white'}`}>
                    {step > s.n ? '✓' : s.icon}
                  </div>
                  <span className="text-white text-xs font-medium hidden sm:block">{s.label}</span>
                </div>
                {i < STEPS.length-1 && <div className={`flex-1 h-0.5 mx-2 ${step > s.n ? 'bg-green-400' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Form içeriği */}
        <div className="overflow-y-auto flex-1">
          {step === 1 && <Step1 account={account} setAcc={setAcc} onSubmit={handleStep1} loading={loading} error={error} />}
          {step === 2 && <Step2 place={place} setPlc={setPlc} onSubmit={handleStep2} onBack={()=>setStep(1)} error={error} />}
          {step === 3 && <Step3 experience={experience} onToggleBadge={toggleBadge} onToggleFeature={toggleFeature} onSubmit={handleStep3} onBack={()=>setStep(2)} error={error} />}
          {step === 4 && (
            <Step4
              media={media} uploading={uploading} dragOver={dragOver}
              onDrop={handleDrop} onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
              onFileSelect={e=>handleFiles(e.target.files)}
              onRemove={removeImage} fileRef={fileRef}
              onSubmit={handleSubmit} onBack={()=>setStep(3)}
              loading={loading} error={error}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Adım 1: Hesap ────────────────────────────────────────────
function Step1({ account, setAcc, onSubmit, loading, error }) {
  return (
    <form onSubmit={onSubmit} className="px-8 py-6 flex flex-col gap-5">
      <div>
        <h2 className="font-playfair text-2xl font-bold text-gv-ink">İşletme Hesabı</h2>
        <p className="text-gv-muted text-sm mt-1">Mevcut hesabınızla giriş yapın veya yeni işletmeci hesabı oluşturun.</p>
      </div>

      <div className="flex gap-2 bg-gv-cream rounded-xl p-1">
        {[['register','Yeni Hesap'],['login','Giriş Yap']].map(([v,l]) => (
          <button key={v} type="button" onClick={()=>setAcc('mode',v)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${account.mode===v ? 'bg-gv-white text-gv-ink shadow-sm' : 'text-gv-muted hover:text-gv-ink'}`}>
            {l}
          </button>
        ))}
      </div>

      {account.mode === 'register' && (
        <F label="Ad Soyad">
          <input required value={account.name} onChange={e=>setAcc('name',e.target.value)}
            className={IC} placeholder="Ahmet Yılmaz" minLength={2} maxLength={50} />
        </F>
      )}

      <F label="E-posta">
        <input type="email" required value={account.email} onChange={e=>setAcc('email',e.target.value)}
          className={IC} placeholder="isletme@email.com" />
      </F>

      <F label="Şifre">
        <div className="relative">
          <input type={account.showPw ? 'text':'password'} required value={account.password}
            onChange={e=>setAcc('password',e.target.value)}
            className={IC + ' pr-12'} placeholder={account.mode==='register' ? 'En az 6 karakter':'••••••••'}
            minLength={6} />
          <button type="button" onClick={()=>setAcc('showPw',!account.showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gv-muted hover:text-gv-ink text-lg">
            {account.showPw ? '🙈':'👁️'}
          </button>
        </div>
      </F>

      {error && <Err msg={error} />}

      <button type="submit" disabled={loading}
        className="w-full bg-gv-orange text-white font-bold py-3.5 rounded-xl hover:bg-gv-orange-dark disabled:opacity-60 transition-all hover:-translate-y-0.5">
        {loading ? '⋯ Lütfen bekleyin...' : 'Devam Et →'}
      </button>

      <p className="text-center text-xs text-gv-muted">
        Devam ederek <span className="underline cursor-pointer">Kullanım Koşulları</span>'nı kabul etmiş olursunuz.
      </p>
    </form>
  )
}

// ─── Adım 2: Mekan Bilgileri ──────────────────────────────────
function Step2({ place, setPlc, onSubmit, onBack, error }) {
  const addHour = () => setPlc('hours', {...place.hours, [`Gün ${Object.keys(place.hours).length+1}`]:''})
  const removeHour = (day) => { const h={...place.hours}; delete h[day]; setPlc('hours',h) }
  const updateHourKey = (oldDay, newDay) => {
    const h={}; Object.entries(place.hours).forEach(([k,v])=>{ h[k===oldDay?newDay:k]=v }); setPlc('hours',h)
  }

  return (
    <form onSubmit={onSubmit} className="px-8 py-6 flex flex-col gap-5">
      <div>
        <h2 className="font-playfair text-2xl font-bold text-gv-ink">Mekan Bilgileri</h2>
        <p className="text-gv-muted text-sm mt-1">Restoranınızın temel bilgilerini girin.</p>
      </div>

      <F label="Restoran Adı *">
        <input required value={place.name} onChange={e=>setPlc('name',e.target.value)}
          className={IC} placeholder="ör: Çınar Bahçe" maxLength={100} />
      </F>

      <div className="grid grid-cols-2 gap-3">
        <F label="Şehir *">
          <input required value={place.city} onChange={e=>setPlc('city',e.target.value)} className={IC} />
        </F>
        <F label="İlçe *">
          <input required value={place.district} onChange={e=>setPlc('district',e.target.value)} className={IC} placeholder="ör: Osmangazi" />
        </F>
      </div>

      <F label="Konum (kısa gösterim) *">
        <input required value={place.location} onChange={e=>setPlc('location',e.target.value)}
          className={IC} placeholder="ör: Mudanya, Bursa" />
      </F>

      <F label="Tam Adres">
        <input value={place.address} onChange={e=>setPlc('address',e.target.value)}
          className={IC} placeholder="Mahalle, Cadde, No..." />
      </F>

      <div className="grid grid-cols-2 gap-3">
        <F label="Telefon">
          <input value={place.phone} onChange={e=>setPlc('phone',e.target.value)}
            className={IC} placeholder="+90 224 ..." />
        </F>
        <F label="Kapasite (kişi) *">
          <input type="number" required min={1} max={1000} value={place.capacity}
            onChange={e=>setPlc('capacity',+e.target.value)} className={IC} />
        </F>
      </div>

      <F label="Fiyat Seviyesi *">
        <div className="grid grid-cols-4 gap-2">
          {[['₺','Uygun',1],['₺₺','Orta',2],['₺₺₺','Üst Segment',3],['₺₺₺₺','Lüks',4]].map(([sym,lbl,val]) => (
            <button key={val} type="button" onClick={()=>setPlc('price_level',val)}
              className={`py-3 rounded-xl text-center transition-all ${place.price_level===val ? 'bg-gv-orange text-white shadow-md scale-105' : 'bg-gv-cream text-gv-ink hover:bg-gv-cream-dark'}`}>
              <div className="font-bold text-sm">{sym}</div>
              <div className="text-[0.65rem] mt-0.5 opacity-80">{lbl}</div>
            </button>
          ))}
        </div>
      </F>

      <F label="Kısa Açıklama * (10-500 karakter)">
        <textarea required value={place.description} onChange={e=>setPlc('description',e.target.value)}
          rows={2} maxLength={500} className={IC+' resize-none'}
          placeholder="Mekanınızı bir-iki cümleyle tanıtın..." />
        <div className="text-right text-[0.7rem] text-gv-muted">{place.description.length}/500</div>
      </F>

      <F label="Detaylı Hikaye">
        <textarea value={place.long_desc} onChange={e=>setPlc('long_desc',e.target.value)}
          rows={4} maxLength={2000} className={IC+' resize-none'}
          placeholder="Mekanınızın kuruluş hikayesini, atmosferini, özel anlarını anlatın..." />
      </F>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gv-muted mb-3">Çalışma Saatleri</label>
        <div className="flex flex-col gap-2">
          {Object.entries(place.hours).map(([day, hrs]) => (
            <div key={day} className="flex gap-2 items-center">
              <input value={day} onChange={e=>updateHourKey(day,e.target.value)}
                className={IC+' w-28 flex-shrink-0 text-xs'} placeholder="Pzt-Cum" />
              <input value={hrs} onChange={e=>setPlc('hours',{...place.hours,[day]:e.target.value})}
                className={IC+' flex-1 text-xs'} placeholder="12:00–23:00" />
              <button type="button" onClick={()=>removeHour(day)} className="text-red-400 hover:text-red-600 text-lg flex-shrink-0">✕</button>
            </div>
          ))}
          <button type="button" onClick={addHour} className="text-xs font-bold text-gv-orange hover:underline self-start">+ Saat Ekle</button>
        </div>
      </div>

      {error && <Err msg={error} />}
      <NavButtons onBack={onBack} nextLabel="İleri →" />
    </form>
  )
}

// ─── Adım 3: Deneyim & Etiketler ─────────────────────────────
function Step3({ experience, onToggleBadge, onToggleFeature, onSubmit, onBack, error }) {
  const groups = [...new Set(BADGE_OPTIONS.map(b => b.group))]

  return (
    <form onSubmit={onSubmit} className="px-8 py-6 flex flex-col gap-6">
      <div>
        <h2 className="font-playfair text-2xl font-bold text-gv-ink">Deneyim & Etiketler</h2>
        <p className="text-gv-muted text-sm mt-1">Mekanınızı tanımlayan rozetleri seçin. Bu etiketler keşfedilmenizi kolaylaştırır.</p>
      </div>

      {groups.map(group => (
        <div key={group}>
          <p className="text-xs font-bold uppercase tracking-widest text-gv-muted mb-3">{group}</p>
          <div className="flex flex-wrap gap-2">
            {BADGE_OPTIONS.filter(b=>b.group===group).map(b => {
              const active = !!experience.badges.find(x=>x.label===b.label)
              return (
                <button key={b.label} type="button" onClick={()=>onToggleBadge(b)}
                  className={`text-sm font-semibold px-4 py-2 rounded-full border-2 transition-all ${active ? 'bg-gv-orange text-white border-gv-orange shadow-md scale-105' : 'border-gv-cream-dark text-gv-ink-light hover:border-gv-orange hover:text-gv-orange'}`}>
                  {b.icon} {b.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {experience.badges.length > 0 && (
        <div className="bg-gv-orange/8 rounded-2xl p-4">
          <p className="text-xs font-bold text-gv-orange mb-2">SEÇİLEN ROZETLER ({experience.badges.length}/6)</p>
          <div className="flex flex-wrap gap-2">
            {experience.badges.map(b => (
              <span key={b.label} className="bg-gv-orange text-white text-xs font-semibold px-3 py-1.5 rounded-full">{b.icon} {b.label}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gv-muted mb-3">Özellikler & İmkânlar</p>
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map(f => {
            const active = experience.features.includes(f)
            return (
              <button key={f} type="button" onClick={()=>onToggleFeature(f)}
                className={`text-xs font-semibold px-3 py-2 rounded-full border-2 transition-all ${active ? 'bg-gv-emerald text-white border-gv-emerald' : 'border-gv-cream-dark text-gv-ink-light hover:border-gv-emerald hover:text-gv-emerald'}`}>
                {active ? '✓ ':''}{f}
              </button>
            )
          })}
        </div>
      </div>

      {error && <Err msg={error} />}
      <NavButtons onBack={onBack} nextLabel="İleri →" />
    </form>
  )
}

// ─── Adım 4: Medya & Yayın ────────────────────────────────────
function Step4({ media, uploading, dragOver, onDrop, onDragOver, onDragLeave, onFileSelect, onRemove, fileRef, onSubmit, onBack, loading, error }) {
  return (
    <form onSubmit={onSubmit} className="px-8 py-6 flex flex-col gap-5">
      <div>
        <h2 className="font-playfair text-2xl font-bold text-gv-ink">Fotoğraflar</h2>
        <p className="text-gv-muted text-sm mt-1">Mekanınızı en iyi anlatan görselleri yükleyin. (Maks 8 fotoğraf, 5MB)</p>
      </div>

      {/* Drag & Drop Alanı */}
      <div
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
          ${dragOver ? 'border-gv-orange bg-gv-orange/5 scale-[1.02]' : 'border-gv-cream-dark hover:border-gv-orange hover:bg-gv-orange/3'}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="text-3xl animate-bounce">📤</div>
            <p className="text-sm font-medium text-gv-muted">Yükleniyor...</p>
          </div>
        ) : dragOver ? (
          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl">🎯</div>
            <p className="text-sm font-bold text-gv-orange">Bırakın!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl">📸</div>
            <p className="text-sm font-semibold text-gv-ink">Sürükle-Bırak veya tıklayın</p>
            <p className="text-xs text-gv-muted">JPEG, PNG, WebP · Maks 5MB · En fazla 8 fotoğraf</p>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileSelect} />

      {/* Yüklenen görseller */}
      {media.images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {media.images.map((img, i) => (
            <div key={img.url} className="relative group rounded-xl overflow-hidden aspect-square bg-gv-cream">
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
              {i === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gv-orange text-white text-[0.6rem] font-bold text-center py-1">
                  KAPAK
                </div>
              )}
              <button type="button" onClick={() => onRemove(img.url)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white text-xs items-center justify-center hidden group-hover:flex transition-all">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Özet */}
      <div className="bg-gv-cream rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-gv-muted mb-3">Başvuru Özeti</p>
        <div className="flex flex-col gap-2">
          <SummaryRow icon="🍽️" label="Restoranınız" value={`— `} />
          <SummaryRow icon="📸" label="Fotoğraf"     value={`${media.images.length} adet`} />
          <SummaryRow icon="⏱️" label="Onay süreci"  value="1-2 iş günü" />
          <SummaryRow icon="📧" label="Bildirim"      value="E-posta ile haber alırsınız" />
        </div>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
          ⏳ Başvurunuz GastroVibe ekibince incelendikten sonra yayına alınacak.
        </div>
      </div>

      {error && <Err msg={error} />}
      <NavButtons onBack={onBack} nextLabel={loading ? '⋯ Gönderiliyor...' : '🚀 Başvuruyu Gönder'} loading={loading} />
    </form>
  )
}

// ─── Küçük yardımcı bileşenler ────────────────────────────────
const IC = 'w-full bg-gv-cream border-2 border-transparent focus:border-gv-orange rounded-xl px-4 py-2.5 text-sm outline-none transition-colors text-gv-ink'

function F({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gv-ink-light mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Err({ msg }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex gap-2">
      <span>⚠️</span><span>{msg}</span>
    </div>
  )
}

function NavButtons({ onBack, nextLabel, loading }) {
  return (
    <div className="flex gap-3 pt-2">
      {onBack && (
        <button type="button" onClick={onBack}
          className="px-6 py-3 rounded-xl border-2 border-gv-cream-dark text-gv-muted font-semibold text-sm hover:border-gv-ink hover:text-gv-ink transition-all">
          ← Geri
        </button>
      )}
      <button type="submit" disabled={loading}
        className="flex-1 py-3 rounded-xl bg-gv-orange text-white font-bold text-sm hover:bg-gv-orange-dark disabled:opacity-60 transition-all hover:-translate-y-0.5">
        {nextLabel}
      </button>
    </div>
  )
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gv-muted">{icon} {label}</span>
      <span className="font-semibold text-gv-ink">{value}</span>
    </div>
  )
}
