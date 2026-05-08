/**
 * routes/owner.js
 * ─────────────────────────────────────────────────────────────
 * GET    /api/owner/restaurant          → benim restoranım
 * POST   /api/owner/restaurant          → yeni restoran oluştur
 * PUT    /api/owner/restaurant/:id      → güncelle
 * GET    /api/owner/reservations        → restorana gelen rezervasyonlar
 * PATCH  /api/owner/reservations/:id    → rezervasyon durumu güncelle
 * GET    /api/owner/stats               → istatistikler
 * GET    /api/owner/reviews             → restorana gelen yorumlar
 * ─────────────────────────────────────────────────────────────
 */
import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { get, all, run } from '../db/init.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
const isOwner = [requireAuth, requireRole('owner', 'admin')]

const PRICE_MAP = { 1:'₺', 2:'₺₺', 3:'₺₺₺', 4:'₺₺₺₺' }

function parseJson(val, fallback = []) {
  try { return typeof val === 'string' ? JSON.parse(val) : val } catch { return fallback }
}

function formatRest(r) {
  return { ...r, badges: parseJson(r.badges), features: parseJson(r.features), images: parseJson(r.images), hours: parseJson(r.hours, {}), price: PRICE_MAP[r.price_level] || '₺₺' }
}

const restRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('İsim 2-100 karakter olmalı.'),
  body('location').trim().notEmpty().withMessage('Konum zorunlu.'),
  body('district').trim().notEmpty().withMessage('İlçe zorunlu.'),
  body('city').trim().notEmpty().withMessage('Şehir zorunlu.'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Kısa açıklama 10-500 karakter.'),
  body('price_level').isInt({ min: 1, max: 4 }).withMessage('Fiyat seviyesi 1-4 arasında olmalı.'),
  body('capacity').isInt({ min: 1, max: 1000 }).withMessage('Kapasite 1-1000 arasında olmalı.'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('long_desc').optional().trim().isLength({ max: 2000 }),
]

function validate(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) { res.status(422).json({ error: errors.array()[0].msg }); return false }
  return true
}

// ─── GET /api/owner/restaurant ───────────────────────────────
router.get('/restaurant', ...isOwner, (req, res) => {
  const restaurants = all(
    'SELECT * FROM restaurants WHERE owner_id = ? ORDER BY created_at DESC',
    [req.user.id]
  )
  res.json({ restaurants: restaurants.map(formatRest) })
})

// ─── POST /api/owner/restaurant ──────────────────────────────
router.post('/restaurant', ...isOwner, restRules, (req, res) => {
  if (!validate(req, res)) return

  const {
    name, location, district, city, description, long_desc,
    price_level, capacity, phone, address,
    hours = {}, images = [], badges = [], features = [],
  } = req.body

  // Bir owner'ın en fazla 3 restoranı olabilir
  const count = get('SELECT COUNT(*) as c FROM restaurants WHERE owner_id = ?', [req.user.id]).c
  if (count >= 3) return res.status(400).json({ error: 'En fazla 3 restoran ekleyebilirsiniz.' })

  const { lastInsertRowid } = run(
    `INSERT INTO restaurants
      (owner_id, name, location, district, city, description, long_desc,
       price_level, capacity, phone, address, hours, images, badges, features, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      req.user.id, name.trim(), location.trim(), district.trim(), city.trim(),
      description.trim(), long_desc?.trim() || null,
      parseInt(price_level), parseInt(capacity),
      phone?.trim() || null, address?.trim() || null,
      JSON.stringify(hours), JSON.stringify(images),
      JSON.stringify(badges), JSON.stringify(features),
      'pending',
    ]
  )

  const restaurant = get('SELECT * FROM restaurants WHERE id = ?', [lastInsertRowid])
  res.status(201).json({
    restaurant: formatRest(restaurant),
    message: '🎉 Restoranınız oluşturuldu! Admin onayından sonra yayınlanacak.',
  })
})

// ─── PUT /api/owner/restaurant/:id ───────────────────────────
router.put('/restaurant/:id', ...isOwner, restRules, (req, res) => {
  if (!validate(req, res)) return

  const id = parseInt(req.params.id)
  const existing = get('SELECT * FROM restaurants WHERE id = ? AND owner_id = ?', [id, req.user.id])
  if (!existing) return res.status(404).json({ error: 'Restoran bulunamadı.' })

  const {
    name, location, district, city, description, long_desc,
    price_level, capacity, phone, address,
    hours, images, badges, features,
  } = req.body

  run(
    `UPDATE restaurants SET
      name=?, location=?, district=?, city=?, description=?, long_desc=?,
      price_level=?, capacity=?, phone=?, address=?,
      hours=?, images=?, badges=?, features=?,
      status='pending'
     WHERE id=?`,
    [
      name.trim(), location.trim(), district.trim(), city.trim(),
      description.trim(), long_desc?.trim() || null,
      parseInt(price_level), parseInt(capacity),
      phone?.trim() || null, address?.trim() || null,
      JSON.stringify(hours || {}), JSON.stringify(images || []),
      JSON.stringify(badges || []), JSON.stringify(features || []),
      id,
    ]
  )

  const updated = get('SELECT * FROM restaurants WHERE id = ?', [id])
  res.json({
    restaurant: formatRest(updated),
    message: 'Değişiklikler kaydedildi. Admin onayından sonra yayınlanacak.',
  })
})

// ─── GET /api/owner/reservations ─────────────────────────────
router.get('/reservations', ...isOwner, (req, res) => {
  const { status, date } = req.query

  // owner'ın restoran ID'leri
  const restIds = all('SELECT id FROM restaurants WHERE owner_id = ?', [req.user.id]).map(r => r.id)
  if (restIds.length === 0) return res.json({ reservations: [] })

  let sql = `
    SELECT rv.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar,
           rs.name as restaurant_name
    FROM reservations rv
    JOIN users u ON u.id = rv.user_id
    JOIN restaurants rs ON rs.id = rv.restaurant_id
    WHERE rv.restaurant_id IN (${restIds.join(',')})
  `
  const params = []
  if (status) { sql += ' AND rv.status = ?'; params.push(status) }
  if (date)   { sql += ' AND rv.date = ?';   params.push(date) }
  sql += ' ORDER BY rv.date DESC, rv.time DESC'

  res.json({ reservations: all(sql, params) })
})

// ─── PATCH /api/owner/reservations/:id ───────────────────────
router.patch('/reservations/:id', ...isOwner, [
  body('status').isIn(['confirmed','cancelled','completed']).withMessage('Geçersiz durum.'),
], (req, res) => {
  if (!validate(req, res)) return

  const id = parseInt(req.params.id)
  const restIds = all('SELECT id FROM restaurants WHERE owner_id = ?', [req.user.id]).map(r => r.id)

  const reservation = get(`SELECT * FROM reservations WHERE id = ? AND restaurant_id IN (${restIds.join(',') || '0'})`, [id])
  if (!reservation) return res.status(404).json({ error: 'Rezervasyon bulunamadı.' })

  run('UPDATE reservations SET status = ? WHERE id = ?', [req.body.status, id])
  res.json({ message: 'Rezervasyon güncellendi.' })
})

// ─── GET /api/owner/stats ─────────────────────────────────────
router.get('/stats', ...isOwner, (req, res) => {
  const restIds = all('SELECT id FROM restaurants WHERE owner_id = ?', [req.user.id]).map(r => r.id)
  if (restIds.length === 0) return res.json({ totalReservations: 0, pendingReservations: 0, totalReviews: 0, avgRating: 0, todayReservations: 0 })

  const idList = restIds.join(',')
  const today = new Date().toISOString().split('T')[0]

  const total   = get(`SELECT COUNT(*) as c FROM reservations WHERE restaurant_id IN (${idList}) AND status != 'cancelled'`).c
  const pending = get(`SELECT COUNT(*) as c FROM reservations WHERE restaurant_id IN (${idList}) AND status = 'confirmed' AND date >= ?`, [today]).c
  const todayR  = get(`SELECT COUNT(*) as c FROM reservations WHERE restaurant_id IN (${idList}) AND date = ? AND status = 'confirmed'`, [today]).c
  const revRow  = get(`SELECT COUNT(*) as c, AVG(rating) as avg FROM reviews WHERE restaurant_id IN (${idList})`)
  const favs    = get(`SELECT COUNT(*) as c FROM favorites WHERE restaurant_id IN (${idList})`).c

  res.json({
    totalReservations: total,
    pendingReservations: pending,
    todayReservations: todayR,
    totalReviews: revRow.c,
    avgRating: revRow.avg ? Math.round(revRow.avg * 10) / 10 : 0,
    totalFavorites: favs,
    restaurants: restIds.length,
  })
})

// ─── GET /api/owner/reviews ───────────────────────────────────
router.get('/reviews', ...isOwner, (req, res) => {
  const restIds = all('SELECT id FROM restaurants WHERE owner_id = ?', [req.user.id]).map(r => r.id)
  if (restIds.length === 0) return res.json({ reviews: [] })

  const reviews = all(
    `SELECT rv.*, rs.name as restaurant_name
     FROM reviews rv JOIN restaurants rs ON rs.id = rv.restaurant_id
     WHERE rv.restaurant_id IN (${restIds.join(',')})
     ORDER BY rv.created_at DESC LIMIT 50`,
    []
  )
  res.json({ reviews })
})

export default router
