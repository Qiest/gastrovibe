/**
 * routes/reservations.js
 * POST   /api/reservations              → oluştur + onay maili
 * GET    /api/reservations/mine         → kullanıcının rezervasyonları
 * DELETE /api/reservations/:id          → kullanıcı kendi iptali + mail
 * POST   /api/reservations/:id/cancel   → işletmeci iptali + sebep + mail
 */
import { Router } from 'express'
import { get, all, run } from '../db/init.js'
import { requireAuth } from '../middleware/auth.js'
import {
  sendReservationConfirmation,
  sendReservationCancelledByOwner,
  sendReservationCancelledByUser,
} from '../services/email.js'

const router = Router()

function parseImages(raw) {
  try { return JSON.parse(raw) } catch { return [] }
}

/* ── POST /api/reservations ─────────────────────────────── */
router.post('/', requireAuth, async (req, res) => {
  // DÜZELTME 1: phone verisini req.body'den çekiyoruz
  const { restaurant_id, date, time, party_size, note, phone } = req.body
  
  if (!restaurant_id || !date || !time || !party_size)
    return res.status(400).json({ error: 'Tüm alanlar zorunlu.' })

  const reservDate = new Date(date)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  if (reservDate < today)
    return res.status(400).json({ error: 'Geçmiş bir tarih seçilemez.' })

  const restaurant = get('SELECT id, name FROM restaurants WHERE id=?', [restaurant_id])
  if (!restaurant) return res.status(404).json({ error: 'Mekan bulunamadı.' })

  const dup = get(
    "SELECT id FROM reservations WHERE user_id=? AND restaurant_id=? AND date=? AND time=? AND status!='cancelled'",
    [req.user.id, restaurant_id, date, time]
  )
  if (dup) return res.status(409).json({ error: 'Bu tarih ve saatte zaten rezervasyonunuz var.' })

  // DÜZELTME 2: Telefon numarasını notun başına şık bir şekilde ekliyoruz
  const finalNote = phone ? `📞 Tel: ${phone} | 📝 Not: ${note || '-'}` : note || null;

  const result = run(
    'INSERT INTO reservations (user_id, restaurant_id, date, time, party_size, note) VALUES (?,?,?,?,?,?)',
    [req.user.id, restaurant_id, date, time, parseInt(party_size), finalNote]
  )

  const reservation = get(`
    SELECT rv.*, rs.name as restaurant_name, rs.images as restaurant_images, rs.location
    FROM reservations rv JOIN restaurants rs ON rs.id = rv.restaurant_id
    WHERE rv.id = ?
  `, [result.lastInsertRowid])

  const imgs = parseImages(reservation.restaurant_images)
  reservation.image_url = imgs[0] || null

  // Onay maili (non-blocking)
  const user = get('SELECT email, name FROM users WHERE id=?', [req.user.id])
  sendReservationConfirmation({
    to: user.email, userName: user.name, restaurantName: restaurant.name,
    date, time, partySize: party_size, note: note || '',
  }).catch(e => console.error('Onay maili hatası:', e.message))

  res.status(201).json({ reservation, message: `${restaurant.name} için rezervasyonunuz oluşturuldu!` })
})

/* ── GET /api/reservations/mine ─────────────────────────── */
router.get('/mine', requireAuth, (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const reservations = all(`
    SELECT rv.*, rs.name as restaurant_name, rs.images as restaurant_images,
           rs.location, rs.price_level
    FROM reservations rv
    JOIN restaurants rs ON rs.id = rv.restaurant_id
    WHERE rv.user_id = ?
    ORDER BY rv.date DESC, rv.time DESC
  `, [req.user.id]).map(r => {
    r.image_url   = parseImages(r.restaurant_images)[0] || null
    r.is_upcoming = r.date >= today && r.status === 'confirmed'
    return r
  })
  res.json({ reservations })
})

/* ── DELETE /api/reservations/:id  (kullanıcı kendi iptali) */
router.delete('/:id', requireAuth, async (req, res) => {
  const rv = get(`
    SELECT rv.*, rs.name as restaurant_name,
           u.email as user_email, u.name as user_name
    FROM reservations rv
    JOIN restaurants rs ON rs.id = rv.restaurant_id
    JOIN users u ON u.id = rv.user_id
    WHERE rv.id=? AND rv.user_id=?
  `, [req.params.id, req.user.id])

  if (!rv)                       return res.status(404).json({ error: 'Rezervasyon bulunamadı.' })
  if (rv.status === 'cancelled') return res.status(400).json({ error: 'Zaten iptal edilmiş.' })

  run("UPDATE reservations SET status='cancelled' WHERE id=?", [req.params.id])

  sendReservationCancelledByUser({
    to: rv.user_email, userName: rv.user_name,
    restaurantName: rv.restaurant_name, date: rv.date, time: rv.time,
  }).catch(e => console.error('İptal maili hatası:', e.message))

  res.json({ message: 'Rezervasyon iptal edildi.' })
})

/* ── POST /api/reservations/:id/cancel  (işletmeci iptali) ─ */
router.post('/:id/cancel', requireAuth, async (req, res) => {
  const { reason = '' } = req.body

  const rv = get(`
    SELECT rv.*, rs.name as restaurant_name, rs.owner_id,
           u.email as user_email, u.name as user_name
    FROM reservations rv
    JOIN restaurants rs ON rs.id = rv.restaurant_id
    JOIN users u ON u.id = rv.user_id
    WHERE rv.id=?
  `, [req.params.id])

  if (!rv) return res.status(404).json({ error: 'Rezervasyon bulunamadı.' })

  const allowed = rv.owner_id === req.user.id || req.user.role === 'admin'
  if (!allowed) return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' })
  if (rv.status === 'cancelled') return res.status(400).json({ error: 'Zaten iptal edilmiş.' })

  const cancelNote = reason
    ? `[İPTAL SEBEBİ: ${reason}]`
    : '[İşletmeci tarafından iptal edildi]'

  run("UPDATE reservations SET status='cancelled', note=? WHERE id=?", [cancelNote, req.params.id])

  sendReservationCancelledByOwner({
    to: rv.user_email, userName: rv.user_name,
    restaurantName: rv.restaurant_name, date: rv.date, time: rv.time,
    reason: reason || null,
  }).catch(e => console.error('İptal maili hatası:', e.message))

  res.json({ message: `İptal edildi. ${rv.user_email} adresine bildirim gönderildi.` })
})

export default router