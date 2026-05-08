/**
 * routes/auth.js  v3.1
 * — /set-owner  → mevcut kullanıcıyı owner yapar
 */
import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import { get, run } from '../db/init.js'
import { requireAuth, signAccessToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: 'Çok fazla deneme. 15 dakika sonra tekrar deneyin.' },
  standardHeaders: true, legacyHeaders: false,
})

const registerRules = [
  body('name').trim().isLength({ min:2, max:50 }).withMessage('Ad 2-50 karakter olmalı.'),
  body('email').isEmail().normalizeEmail().withMessage('Geçerli e-posta girin.'),
  body('password').isLength({ min:6 }).withMessage('Şifre en az 6 karakter.'),
]
const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
]

function validate(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) { res.status(422).json({ error: errors.array()[0].msg, fields: errors.array() }); return null }
  return true
}

function safeUser(u) { const { password, ...safe } = u; return safe }

function makeTokens(user) {
  const accessToken  = signAccessToken({ id:user.id, email:user.email, name:user.name, role:user.role, avatar:user.avatar })
  const refreshToken = signRefreshToken({ id:user.id })
  return { accessToken, refreshToken }
}

// POST /api/auth/register
router.post('/register', authLimiter, registerRules, (req, res) => {
  if (!validate(req, res)) return
  const { name, email, password, avatar = '👤' } = req.body
  const existing = get('SELECT id FROM users WHERE email = ?', [email])
  if (existing) return res.status(409).json({ error: 'Bu e-posta zaten kullanılıyor.' })

  const ALLOWED_AVATARS = ['👤','🍽️','👨‍🍳','🥂','🌮','🍣','🥩','🌿','🏪']
  const safeAvatar = ALLOWED_AVATARS.includes(avatar) ? avatar : '👤'
  const hash = bcrypt.hashSync(password, 12)

  const { lastInsertRowid } = run(
    `INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)`,
    [name.trim(), email, hash, safeAvatar]
  )
  const user = get('SELECT * FROM users WHERE id = ?', [lastInsertRowid])
  const { accessToken, refreshToken } = makeTokens(user)
  res.status(201).json({ user: safeUser(user), token: accessToken, refreshToken })
})

// POST /api/auth/login
router.post('/login', authLimiter, loginRules, (req, res) => {
  const { email, password } = req.body
  const user = get('SELECT * FROM users WHERE email = ?', [email])
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'E-posta veya şifre hatalı.' })
  const { accessToken, refreshToken } = makeTokens(user)
  res.json({ user: safeUser(user), token: accessToken, refreshToken })
})

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token gerekli.' })
  try {
    const payload = verifyRefreshToken(refreshToken)
    const user    = get('SELECT * FROM users WHERE id = ?', [payload.id])
    if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı.' })
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = makeTokens(user)
    res.json({ token: newAccessToken, refreshToken: newRefreshToken })
  } catch {
    res.status(401).json({ error: 'Geçersiz refresh token.' })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = get('SELECT * FROM users WHERE id = ?', [req.user.id])
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' })
  res.json({ user: safeUser(user) })
})

// POST /api/auth/logout
router.post('/logout', requireAuth, (_, res) => res.json({ message: 'Çıkış yapıldı.' }))

// POST /api/auth/set-owner  — mevcut kullanıcıyı owner yap
router.post('/set-owner', requireAuth, (req, res) => {
  const user = get('SELECT * FROM users WHERE id = ?', [req.user.id])
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' })
  if (user.role === 'admin') return res.json({ message: 'Admin zaten tüm yetkilere sahip.' })

  run('UPDATE users SET role = ?, avatar = ? WHERE id = ?', ['owner', '🏪', req.user.id])
  const updated = get('SELECT * FROM users WHERE id = ?', [req.user.id])
  const { accessToken, refreshToken } = makeTokens(updated)
  res.json({ user: safeUser(updated), token: accessToken, refreshToken, message: 'İşletmeci hesabınız aktifleştirildi.' })
})

export default router
