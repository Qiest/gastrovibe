import { Router } from 'express'
import { get, all } from '../db/init.js'
import { optionalAuth } from '../middleware/auth.js'

const router    = Router()
const PRICE_MAP = { 1:'₺', 2:'₺₺', 3:'₺₺₺', 4:'₺₺₺₺' }

function parseJson(val, fallback = []) {
  try { return typeof val === 'string' ? JSON.parse(val) : val } catch { return fallback }
}

function format(r, userId) {
  const isFav = userId
    ? !!get('SELECT 1 FROM favorites WHERE user_id=? AND restaurant_id=?', [userId, r.id])
    : false
  return {
    ...r,
    badges:      parseJson(r.badges),
    features:    parseJson(r.features),
    images:      parseJson(r.images),
    hours:       parseJson(r.hours, {}),
    price:       PRICE_MAP[r.price_level] || '₺₺',
    is_favorited: isFav,
  }
}

// GET /api/restaurants
router.get('/', optionalAuth, (req, res) => {
  const { search, city, price, badge, featured } = req.query
  let sql    = "SELECT * FROM restaurants WHERE status='approved'"
  const params = []
  if (search)   { sql += ' AND (name LIKE ? OR description LIKE ? OR location LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`) }
  if (city)     { sql += ' AND city=?';         params.push(city)    }
  if (price)    { sql += ' AND price_level=?';  params.push(+price)  }
  if (badge)    { sql += ' AND badges LIKE ?';  params.push(`%${badge}%`) }
  if (featured) { sql += ' AND is_featured=1' }
  sql += ' ORDER BY rating DESC'
  res.json({ restaurants: all(sql, params).map(r => format(r, req.user?.id)) })
})

// GET /api/restaurants/:id
router.get('/:id', optionalAuth, (req, res) => {
  const r = get("SELECT * FROM restaurants WHERE id=? AND status='approved'", [req.params.id])
  if (!r) return res.status(404).json({ error: 'Mekan bulunamadı.' })
  const reviews = all('SELECT * FROM reviews WHERE restaurant_id=? ORDER BY created_at DESC LIMIT 20', [r.id])
  res.json({ restaurant: format(r, req.user?.id), reviews })
})

export default router
