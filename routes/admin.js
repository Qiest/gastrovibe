/**
 * routes/admin.js
 * GET   /api/admin/restaurants          → tüm restoranlar (status filtresi)
 * PATCH /api/admin/restaurants/:id      → onayla / reddet
 * GET   /api/admin/users                → tüm kullanıcılar
 * PATCH /api/admin/users/:id/role       → rol değiştir
 * GET   /api/admin/stats                → platform istatistikleri
 */
import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { get, all, run } from '../db/init.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router  = Router()
const isAdmin = [requireAuth, requireRole('admin')]

function parseJson(val, fallback = []) {
  try { return typeof val === 'string' ? JSON.parse(val) : val } catch { return fallback }
}

// ─── GET /api/admin/restaurants ───────────────────────────────
router.get('/restaurants', ...isAdmin, (req, res) => {
  const { status } = req.query
  let sql = `
    SELECT r.*, u.name as owner_name, u.email as owner_email
    FROM restaurants r LEFT JOIN users u ON u.id = r.owner_id
  `
  const params = []
  if (status) { sql += ' WHERE r.status = ?'; params.push(status) }
  sql += ' ORDER BY r.created_at DESC'

  const restaurants = all(sql, params).map(r => ({
    ...r,
    badges:   parseJson(r.badges),
    features: parseJson(r.features),
    images:   parseJson(r.images),
    hours:    parseJson(r.hours, {}),
  }))
  res.json({ restaurants })
})

// ─── PATCH /api/admin/restaurants/:id ────────────────────────
router.patch('/restaurants/:id', ...isAdmin, [
  body('status').isIn(['approved','rejected','pending']).withMessage('Geçersiz durum.'),
  body('rejection_reason').optional().trim().isLength({ max: 300 }),
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg })

  const id = parseInt(req.params.id)
  const restaurant = get('SELECT * FROM restaurants WHERE id = ?', [id])
  if (!restaurant) return res.status(404).json({ error: 'Restoran bulunamadı.' })

  const { status, rejection_reason } = req.body

  if (status === 'approved') {
    run('UPDATE restaurants SET status = ? WHERE id = ?', ['approved', id])
    res.json({ message: `✅ "${restaurant.name}" onaylandı ve yayına alındı.` })
  } else if (status === 'rejected') {
    run('UPDATE restaurants SET status = ? WHERE id = ?', ['rejected', id])
    res.json({ message: `❌ "${restaurant.name}" reddedildi.`, reason: rejection_reason })
  } else {
    run('UPDATE restaurants SET status = ? WHERE id = ?', ['pending', id])
    res.json({ message: 'Durum güncellendi.' })
  }
})

// ─── GET /api/admin/users ─────────────────────────────────────
router.get('/users', ...isAdmin, (req, res) => {
  const users = all('SELECT id, name, email, avatar, role, created_at FROM users ORDER BY created_at DESC')
  res.json({ users })
})

// ─── PATCH /api/admin/users/:id/role ─────────────────────────
router.patch('/users/:id/role', ...isAdmin, [
  body('role').isIn(['user','owner','admin']).withMessage('Geçersiz rol.'),
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg })

  const id   = parseInt(req.params.id)
  const user = get('SELECT id, name FROM users WHERE id = ?', [id])
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' })

  run('UPDATE users SET role = ? WHERE id = ?', [req.body.role, id])
  res.json({ message: `${user.name} rolü "${req.body.role}" olarak güncellendi.` })
})

// ─── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', ...isAdmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  res.json({
    users:               get('SELECT COUNT(*) as c FROM users').c,
    owners:              get("SELECT COUNT(*) as c FROM users WHERE role='owner'").c,
    restaurants_total:   get('SELECT COUNT(*) as c FROM restaurants').c,
    restaurants_pending: get("SELECT COUNT(*) as c FROM restaurants WHERE status='pending'").c,
    restaurants_approved:get("SELECT COUNT(*) as c FROM restaurants WHERE status='approved'").c,
    reservations_total:  get('SELECT COUNT(*) as c FROM reservations').c,
    reservations_today:  get('SELECT COUNT(*) as c FROM reservations WHERE date=?', [today]).c,
    reviews_total:       get('SELECT COUNT(*) as c FROM reviews').c,
  })
})

export default router
