import { Router } from 'express'
import { get, all, run } from '../db/init.js'
import { requireAuth } from '../middleware/auth.js'

const router    = Router()
const PRICE_MAP = { 1:'₺', 2:'₺₺', 3:'₺₺₺', 4:'₺₺₺₺' }

router.post('/:restaurantId', requireAuth, (req, res) => {
  const { restaurantId } = req.params
  const existing = get('SELECT id FROM favorites WHERE user_id=? AND restaurant_id=?', [req.user.id, restaurantId])
  if (existing) {
    run('DELETE FROM favorites WHERE user_id=? AND restaurant_id=?', [req.user.id, restaurantId])
    return res.json({ favorited: false, message: 'Favorilerden çıkarıldı.' })
  }
  run('INSERT INTO favorites (user_id, restaurant_id) VALUES (?,?)', [req.user.id, restaurantId])
  res.json({ favorited: true, message: 'Favorilere eklendi ❤️' })
})

router.get('/mine', requireAuth, (req, res) => {
  const favorites = all(`
    SELECT rs.*, f.created_at as favorited_at
    FROM favorites f JOIN restaurants rs ON rs.id = f.restaurant_id
    WHERE f.user_id=? ORDER BY f.created_at DESC
  `, [req.user.id]).map(r => {
    let badges = r.badges; try { badges = JSON.parse(r.badges) } catch {}
    let images = []; try { images = JSON.parse(r.images) } catch {}
    return { ...r, badges, images, price: PRICE_MAP[r.price_level] || '₺₺', image_url: images[0] || null, is_favorited: true }
  })
  res.json({ favorites })
})

export default router
