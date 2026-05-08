import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'gastrovibe_secret_key_2025'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'gastrovibe_refresh_secret_key_2025'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' })
  try {
    req.user = jwt.verify(header.slice(7), SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' })
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(header.slice(7), SECRET) } catch {}
  }
  next()
}

/**
 * requireRole('owner')         → owner VEYA admin geçer
 * requireRole('owner','admin') → owner VEYA admin geçer
 * requireRole('admin')         → sadece admin geçer
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' })
    // Admin her role erişebilir
    if (req.user.role === 'admin') return next()
    if (roles.includes(req.user.role)) return next()
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' })
  }
}

// --- CLAUDE'UN UNUTTUĞU VE BİZİM EKLEDİĞİMİZ EKSİK FONKSİYONLAR ---

export function signAccessToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30m' }) // 30 dakikalık kısa bilet
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' }) // 7 günlük uzun bilet
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET)
}

// Eski signToken fonksiyonunu da uyumluluk için (eski kodlar patlamasın diye) tutuyoruz
export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' })
}