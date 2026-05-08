import { Router } from 'express'
import { get, all, run } from '../db/init.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', requireAuth, (req, res) => {
  const { restaurant_id, rating, text, visit_type = 'Genel' } = req.body
  if (!restaurant_id || !rating || !text?.trim())
    return res.status(400).json({ error: 'Restoran, puan ve yorum zorunlu.' })
  if (rating < 1 || rating > 5)
    return res.status(400).json({ error: 'Puan 1–5 arasında olmalı.' })

  const rest = get('SELECT id FROM restaurants WHERE id=?', [restaurant_id])
  if (!rest) return res.status(404).json({ error: 'Restoran bulunamadı.' })

  const dup = get('SELECT id FROM reviews WHERE restaurant_id=? AND user_id=?', [restaurant_id, req.user.id])
  if (dup) return res.status(409).json({ error: 'Bu mekan için zaten yorum yaptınız.' })

  const user   = get('SELECT name, avatar FROM users WHERE id=?', [req.user.id])
  const result = run(
    'INSERT INTO reviews (restaurant_id, user_id, author_name, author_avatar, rating, text, visit_type) VALUES (?,?,?,?,?,?,?)',
    [restaurant_id, req.user.id, user.name, user.avatar || '👤', +rating, text.trim(), visit_type]
  )

  const { avg, cnt } = get('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE restaurant_id=?', [restaurant_id])
  run('UPDATE restaurants SET rating=ROUND(?,1), review_count=? WHERE id=?', [avg, cnt, restaurant_id])

  const review = get('SELECT * FROM reviews WHERE id=?', [result.lastInsertRowid])
  res.status(201).json({ review })
})

export default router
