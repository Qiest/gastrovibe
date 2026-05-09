/**
 * db/init.js — v4.0 (Vercel Uyumlu)
 *
 * DEĞİŞEN 3 ŞEY:
 *  1. locateFile  → WASM'ı process.cwd() üzerinden bulur (Vercel'de /var/task)
 *  2. DB_PATH     → Vercel'de /tmp/gastrovibe.db, lokalde proje kökü
 *  3. persist()   → /tmp dizini yoksa mkdirSync ile oluşturur
 */
import { createRequire }                                      from 'module'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { fileURLToPath }                                      from 'url'
import path                                                   from 'path'
import bcrypt                                                 from 'bcryptjs'

const require   = createRequire(import.meta.url)
const initSqlJs = require('sql.js')
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/* ─── Ortam algılama ───────────────────────────────────────── */
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV)

const DB_PATH = IS_VERCEL
  ? '/tmp/gastrovibe.db'
  : path.join(__dirname, '..', 'gastrovibe.db')

/* ─── WASM locateFile ──────────────────────────────────────── *
 *  Vercel'de __dirname çoğunlukla /var/task/db, ama
 *  process.cwd() her zaman /var/task'tır → en güvenli yol.
 *  Birden fazla aday denenir; bulunan ilki kullanılır.
 * ─────────────────────────────────────────────────────────── */
function wasmLocator(filename) {
  const candidates = [
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', filename),
    path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', filename),
    `/var/task/node_modules/sql.js/dist/${filename}`,
  ]
  for (const p of candidates) {
    if (existsSync(p)) { console.log(`   WASM: ${p} ✅`); return p }
  }
  console.error(`   ❌ WASM bulunamadı:\n   ${candidates.join('\n   ')}`)
  return candidates[0]
}

let db = null, SQL = null

/* ─── persist ──────────────────────────────────────────────── */
function persist() {
  const dir = path.dirname(DB_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(DB_PATH, Buffer.from(db.export()))
}

/* ─── initDb ────────────────────────────────────────────────── */
export async function initDb() {
  if (db) return db

  SQL = await initSqlJs({ locateFile: wasmLocator })

  if (existsSync(DB_PATH)) {
    db = new SQL.Database(readFileSync(DB_PATH))
    console.log(`   DB:  ${IS_VERCEL ? '/tmp/gastrovibe.db' : 'gastrovibe.db'} yüklendi ✅`)
    migrate()
  } else {
    db = new SQL.Database()
    console.log(`   DB:  Yeni veritabanı oluşturuluyor...`)
    initSchema()
    seedIfEmpty()
    persist()
  }
  return db
}

export function getDb() {
  if (!db) throw new Error('DB henüz başlatılmadı. initDb() çağırın.')
  return db
}

/* ─── Query yardımcıları ────────────────────────────────────── */
export function all(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

export function get(sql, params = []) { return all(sql, params)[0] ?? null }

export function run(sql, params = []) {
  db.run(sql, params)
  const meta = db.exec('SELECT last_insert_rowid() as id, changes() as c')[0]
  const row  = meta
    ? { lastInsertRowid: meta.values[0][0], changes: meta.values[0][1] }
    : { lastInsertRowid: null, changes: 0 }
  persist()
  return row
}

export function exec(sql) { db.exec(sql); persist() }

/* ─── Migration ─────────────────────────────────────────────── */
function migrate() {
  const safeAdd = (t, col, def) => { try { db.exec(`ALTER TABLE ${t} ADD COLUMN ${col} ${def}`) } catch {} }
  safeAdd('users',       'role',     "TEXT DEFAULT 'user'")
  safeAdd('users',       'phone',    'TEXT')
  safeAdd('restaurants', 'owner_id', 'INTEGER REFERENCES users(id) ON DELETE SET NULL')
  safeAdd('restaurants', 'status',   "TEXT DEFAULT 'approved'")
  safeAdd('restaurants', 'capacity', 'INTEGER DEFAULT 50')
  safeAdd('restaurants', 'long_desc','TEXT')
  safeAdd('restaurants', 'phone',    'TEXT')
  safeAdd('restaurants', 'address',  'TEXT')
  safeAdd('restaurants', 'hours',    "TEXT DEFAULT '{}'")
  safeAdd('restaurants', 'features', "TEXT DEFAULT '[]'")
  db.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      filename TEXT NOT NULL, original TEXT NOT NULL, mimetype TEXT NOT NULL,
      size INTEGER NOT NULL, url TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
    );
  `)
  db.exec(`UPDATE restaurants SET status='approved' WHERE status IS NULL`)
  persist()
  console.log('   DB:  Migrasyon ✅')
}

/* ─── Şema ──────────────────────────────────────────────────── */
function initSchema() {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      avatar TEXT DEFAULT '👤', role TEXT DEFAULT 'user', phone TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL, location TEXT NOT NULL, district TEXT NOT NULL, city TEXT NOT NULL,
      price_level INTEGER DEFAULT 2, rating REAL DEFAULT 4.5, review_count INTEGER DEFAULT 0,
      description TEXT, long_desc TEXT, phone TEXT, address TEXT,
      hours TEXT DEFAULT '{}', images TEXT DEFAULT '[]', badges TEXT DEFAULT '[]', features TEXT DEFAULT '[]',
      is_featured INTEGER DEFAULT 0, status TEXT DEFAULT 'pending', capacity INTEGER DEFAULT 50,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL, author_avatar TEXT DEFAULT '👤',
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      text TEXT NOT NULL, visit_type TEXT DEFAULT 'Çift',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      date TEXT NOT NULL, time TEXT NOT NULL, party_size INTEGER NOT NULL DEFAULT 2,
      note TEXT, status TEXT DEFAULT 'confirmed',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, restaurant_id)
    );
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL, excerpt TEXT NOT NULL, body TEXT NOT NULL,
      cover_url TEXT NOT NULL, category TEXT NOT NULL, author_name TEXT NOT NULL,
      author_avatar TEXT DEFAULT '✍️', read_minutes INTEGER DEFAULT 4,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      filename TEXT NOT NULL, original TEXT NOT NULL, mimetype TEXT NOT NULL,
      size INTEGER NOT NULL, url TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

/* ─── Seed ──────────────────────────────────────────────────── */
function seedIfEmpty() {
  if (get('SELECT COUNT(*) as c FROM restaurants').c > 0) return
  console.log('🌱 Seed başlıyor...')

  const rests = [
    { name:'Çınar Bahçe',     location:'Mudanya, Bursa',   district:'Mudanya',   city:'Bursa', price_level:3, rating:4.9, review_count:284, status:'approved', capacity:80,  description:'Çam ormanları arasında şelalenin sesiyle eşsiz akşam yemeği.',           long_desc:'Bursa\'nın Mudanya ilçesinde Marmara kıyısına nazır çam ormanları arasına gizlenmiş Çınar Bahçe 1992\'den bu yana unutulmaz anlar yaşatıyor.', phone:'+90 224 541 22 10', address:'Orman Mah. Çam Sk. No:4 Mudanya/Bursa', hours:JSON.stringify({'Pzt-Per':'12:00–23:00','Cum-Paz':'11:00–00:00'}), images:JSON.stringify(['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=85','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=85']), badges:JSON.stringify([{icon:'🌲',label:'Orman İçinde',color:'green'},{icon:'🎶',label:'Canlı Müzik',color:'dark'},{icon:'🚗',label:'Vale',color:'orange'}]), features:JSON.stringify(['Açık Hava Terası','Vale Park','Vejetaryen Menü']), is_featured:1 },
    { name:'Liman 1924',      location:'Mudanya, Bursa',   district:'Mudanya',   city:'Bursa', price_level:2, rating:4.7, review_count:412, status:'approved', capacity:60,  description:'Uludağ manzarasıyla efsanevi balık sofrası.',                            long_desc:'1924\'te Rum balıkçıların kurduğu kahveden dönüşen Liman dördüncü kuşak tarafından işletiliyor.', phone:'+90 224 544 00 24', address:'Liman Cad. No:1 Mudanya/Bursa', hours:JSON.stringify({'Her Gün':'11:30–23:30'}), images:JSON.stringify(['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=85']), badges:JSON.stringify([{icon:'🌊',label:'Deniz Kenarı',color:'blue'},{icon:'🐟',label:'Taze Balık',color:'dark'}]), features:JSON.stringify(['Deniz Terası','Günlük Menü']), is_featured:1 },
    { name:'Toprak Bistro',   location:'Nilüfer, Bursa',   district:'Nilüfer',   city:'Bursa', price_level:3, rating:4.8, review_count:176, status:'approved', capacity:45,  description:'Haftalık caz geceleri ve çağdaş Anadolu lezzetleri.',                    long_desc:'Modern Anadolu mutfağını uluslararası tekniklerle harmanlayan yaratıcı bir mutfak.', phone:'+90 224 452 33 10', address:'Beşevler Mah. Atatürk Cad. No:78 Nilüfer/Bursa', hours:JSON.stringify({'Pzt-Cum':'12:00–23:30','Cmt-Paz':'11:00–00:00'}), images:JSON.stringify(['https://images.unsplash.com/photo-1550966871-3ed3cbe818b5?w=1200&q=85']), badges:JSON.stringify([{icon:'✨',label:'Modern Anadolu',color:'orange'},{icon:'🎶',label:'Caz Geceleri',color:'dark'}]), features:JSON.stringify(['Tadım Menüsü','Canlı Müzik']), is_featured:1 },
    { name:'Köşk 1890',       location:'Osmangazi, Bursa', district:'Osmangazi', city:'Bursa', price_level:4, rating:4.9, review_count:98,  status:'approved', capacity:30,  description:'Osmanlı dönemi tarihi köşkte Fransız-Türk füzyon mutfağı.',              long_desc:'1890 yılında inşa edilen Osmanlı köşkü en prestijli fine dining adresine ev sahipliği yapıyor.', phone:'+90 224 223 18 90', address:'Çekirge Mah. Köşk Sok. No:1 Osmangazi/Bursa', hours:JSON.stringify({'Sal-Paz':'19:00–00:00','Pzt':'Kapalı'}), images:JSON.stringify(['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85']), badges:JSON.stringify([{icon:'🏛️',label:'Tarihi Yapı',color:'dark'},{icon:'🍷',label:'Şarap',color:'amber'}]), features:JSON.stringify(['Fine Dining','Şarap Mahzeni']), is_featured:0 },
    { name:'Zeytinlik Sofra', location:'Gemlik, Bursa',    district:'Gemlik',    city:'Bursa', price_level:2, rating:4.6, review_count:203, status:'approved', capacity:55,  description:'Zeytin bahçeleri içinde organik Ege mutfağı.',                           long_desc:'Gemlik\'in zeytinliklerinin ortasında tarladan sofraya konsepti.', phone:'+90 224 512 44 55', address:'Zeytin Bahçeleri Mevkii No:12 Gemlik/Bursa', hours:JSON.stringify({'Her Gün':'10:00–22:00'}), images:JSON.stringify(['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=85']), badges:JSON.stringify([{icon:'🌿',label:'Organik',color:'green'}]), features:JSON.stringify(['Organik','Bahçe Terası']), is_featured:0 },
    { name:'Ateş Çukuru',     location:'Yıldırım, Bursa',  district:'Yıldırım',  city:'Bursa', price_level:3, rating:4.7, review_count:318, status:'approved', capacity:70,  description:'Bursa mangal kültürünü modern atmosferle buluşturan en iyi ocakbaşı.',  long_desc:'Açık ateş üzerinde pişen etler duman kokusu ve sıcak ambiyans.', phone:'+90 224 361 55 66', address:'Millet Cad. No:45 Yıldırım/Bursa', hours:JSON.stringify({'Her Gün':'12:00–23:00'}), images:JSON.stringify(['https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&q=85']), badges:JSON.stringify([{icon:'🔥',label:'Ocakbaşı',color:'orange'}]), features:JSON.stringify(['Açık Mangal']), is_featured:0 },
    { name:'Sera Kahvaltı',   location:'Osmangazi, Bursa', district:'Osmangazi', city:'Bursa', price_level:2, rating:4.8, review_count:445, status:'approved', capacity:50,  description:'Cam sera içinde organik kır kahvaltısı.',                                long_desc:'Güneş ışığını süzen cam seranın içinde organik kahvaltı deneyimi.', phone:'+90 224 224 77 88', address:'Heykel Mah. Gül Sok. No:3 Osmangazi/Bursa', hours:JSON.stringify({'Her Gün':'08:00–15:00'}), images:JSON.stringify(['https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=1200&q=85']), badges:JSON.stringify([{icon:'🌸',label:'Cam Sera',color:'green'}]), features:JSON.stringify(['Organik','Çocuk Dostu']), is_featured:0 },
    { name:'Kanatlar Meyhane',location:'Osmangazi, Bursa', district:'Osmangazi', city:'Bursa', price_level:2, rating:4.5, review_count:267, status:'approved', capacity:65,  description:'Geleneksel meyhane kültürü ve canlı fasıl müziği.',                      long_desc:'Fasıl gecelerinde tüm masaların dolduğu geleneksel meyhane.', phone:'+90 224 221 99 00', address:'Kapalı Çarşı Arkası No:14 Osmangazi/Bursa', hours:JSON.stringify({'Pzt-Per':'17:00–01:00','Cum-Paz':'16:00–02:00'}), images:JSON.stringify(['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85']), badges:JSON.stringify([{icon:'🎶',label:'Fasıl',color:'dark'}]), features:JSON.stringify(['Canlı Fasıl','Zengin Meze']), is_featured:0 },
    { name:'Uludağ Zirvesi',  location:'Uludağ, Bursa',   district:'Osmangazi', city:'Bursa', price_level:4, rating:4.9, review_count:121, status:'approved', capacity:25,  description:'2.543 metrede karın üstünde eşsiz manzarayla akşam yemeği.',            long_desc:'Yalnızca Kasım-Mart arası açık sezonluk fine dining.', phone:'+90 224 285 20 20', address:'Uludağ Yolu Büyük Otel Yanı Bursa', hours:JSON.stringify({'Kas-Mar':'12:00–23:00','Diğer':'Kapalı'}), images:JSON.stringify(['https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=85']), badges:JSON.stringify([{icon:'🌅',label:'Dağ Manzarası',color:'blue'}]), features:JSON.stringify(['Panoramik Manzara','Şömine']), is_featured:0 },
    { name:'Boğaz Balık',     location:'Mudanya, Bursa',   district:'Mudanya',   city:'Bursa', price_level:3, rating:4.6, review_count:189, status:'approved', capacity:40,  description:'Marmara\'nın taze balıkları ve günlük menüsüyle Mudanya favorisi.',       long_desc:'Her sabah tekneden gelen taze balık günlük menüyü belirliyor.', phone:'+90 224 544 11 22', address:'Balık Hali Karşısı No:5 Mudanya/Bursa', hours:JSON.stringify({'Her Gün':'12:00–23:00'}), images:JSON.stringify(['https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=85']), badges:JSON.stringify([{icon:'🌊',label:'Deniz Kenarı',color:'blue'}]), features:JSON.stringify(['Günlük Menü','Deniz Terası']), is_featured:0 },
  ]

  for (const r of rests) {
    run(`INSERT INTO restaurants (name,location,district,city,price_level,rating,review_count,description,long_desc,phone,address,hours,images,badges,features,is_featured,status,capacity) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [r.name,r.location,r.district,r.city,r.price_level,r.rating,r.review_count,r.description,r.long_desc,r.phone,r.address,r.hours,r.images,r.badges,r.features,r.is_featured,r.status,r.capacity])
  }

  for (const [rid,name,av,rating,text,vt] of [
    [1,'Elif T.','👩',5,'Şelale sesi eşliğinde akşam yemeği — büyülü bir deneyimdi.','Çift'],
    [1,'Mert K.','🧔',5,'Doğum günü kutlamasını burada yaptık, muhteşemdi.','Aile'],
    [2,'Cansu Y.','👩',5,'Balıklar inanılmaz tazeydi. Uludağ manzarası ayrı.','Çift'],
    [3,'Selin A.','👩',5,'Tadım menüsüyle dört saat masada kaldık.','Çift'],
    [4,'Aylin Ç.','👩',5,'Teklifi burada aldım. Ömür boyu unutamam.','Çift'],
  ]) {
    run(`INSERT INTO reviews (restaurant_id,author_name,author_avatar,rating,text,visit_type) VALUES (?,?,?,?,?,?)`,
      [rid,name,av,rating,text,vt])
  }

  for (const [title,slug,excerpt,body,cover_url,category,author_name,author_avatar,read_minutes] of [
    ["Bursa'nın 5 Gizli Lokantası",'bursa-gizli-lokantalar',"Turistlerin bilmediği sır mekanlar.",'Bursa hep İskender ve kestane şekeriyle anılır. Ama şehrin arka sokaklarında bambaşka bir mutfak hayatı var.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80','Keşif','Selin Çelik','✍️',5],
    ["Ambiyans mı, Yemek mi?",'ambiyans-ve-yemek',"GastroVibe tam da bu çıkmazı çözmek için doğdu.",'Bir restoranı yargılarken ne kadar karmaşık bir değerlendirme yaptığımızın farkında değiliz.','https://images.unsplash.com/photo-1550966871-3ed3cbe818b5?w=900&q=80','Dergi','Mert Yılmaz','📝',4],
    ["Mudanya'da Bir Hafta Sonu",'mudanya-hafta-sonu',"Bursa'dan 40 dakika, bambaşka bir dünya.",'Cumartesi sabahı erken kalkıp Mudanya\'ya gitmek bir ritüele dönüştü.','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=80','Rehber','Aylin Kaya','🗺️',6],
    ["Şef Soruyor: En Önemli Şey?",'sef-roportaj',"Beş şefe aynı soruyu sorduk.",'İlk şef hammadde dedi. İkinci tutku. Üçüncü sabır...','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80','Röportaj','Kerem Arslan','👨‍🍳',7],
  ]) {
    run(`INSERT INTO blog_posts (title,slug,excerpt,body,cover_url,category,author_name,author_avatar,read_minutes) VALUES (?,?,?,?,?,?,?,?,?)`,
      [title,slug,excerpt,body,cover_url,category,author_name,author_avatar,read_minutes])
  }

  run(`INSERT OR IGNORE INTO users (name,email,password,avatar,role) VALUES (?,?,?,?,?)`,['Demo Kullanıcı','demo@gastrovibe.com', bcrypt.hashSync('demo1234',10), '🍽️','user'])
  run(`INSERT OR IGNORE INTO users (name,email,password,avatar,role) VALUES (?,?,?,?,?)`,['Admin',         'admin@gastrovibe.com',bcrypt.hashSync('admin1234',10),'👑','admin'])
  run(`INSERT OR IGNORE INTO users (name,email,password,avatar,role) VALUES (?,?,?,?,?)`,['Demo Sahip',    'owner@gastrovibe.com',bcrypt.hashSync('owner1234',10),'🏪','owner'])

  console.log('✅ Seed: 10 restoran · 5 yorum · 4 blog · 3 kullanıcı')
}
