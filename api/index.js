/**
 * api/index.js
 * Vercel Serverless Function — Express uygulamasını sarmalayan handler.
 */
import 'dotenv/config'
import express   from 'express'
import cors      from 'cors'
import path      from 'path'
import { fileURLToPath } from 'url'

// 1. KLASİK STATİK IMPORTLAR (Vercel'in kilitlenmesini engeller)
import authRoutes        from '../routes/auth.js'
import restaurantRoutes  from '../routes/restaurants.js'
import reservationRoutes from '../routes/reservations.js'
import favoriteRoutes    from '../routes/favorites.js'
import reviewRoutes      from '../routes/reviews.js'
import blogRoutes        from '../routes/blog.js'
import chatRoutes        from '../routes/chat.js'
import ownerRoutes       from '../routes/owner.js'
import adminRoutes       from '../routes/admin.js'
import uploadRoutes      from '../routes/upload.js'

import { initDb } from '../db/init.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(cors({
  origin: process.env.APP_URL || true,
  credentials: true,
}))
app.use(express.json())

// Uploaded images (Vercel'de /tmp altında tutulur)
app.use('/uploads', express.static(path.join('/tmp', 'uploads')))

/* ── DB BAŞLATMA (Arka planda asenkron çalışır, Vercel'i bekletip patlatmaz) ── */
initDb()
  .then(() => console.log('✅ DB (Turso/Vercel) hazır'))
  .catch((err) => console.error('❌ DB başlatılamadı:', err.message))

/* ── ROUTES ── */
app.use('/api/auth',         authRoutes)
app.use('/api/restaurants',  restaurantRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/favorites',    favoriteRoutes)
app.use('/api/reviews',      reviewRoutes)
app.use('/api/blog',         blogRoutes)
app.use('/api/chat',         chatRoutes)
app.use('/api/owner',        ownerRoutes)
app.use('/api/admin',        adminRoutes)
app.use('/api/upload',       uploadRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok', env: 'vercel' }))

// 404 fallback for unknown /api/* paths
app.use('/api/*', (req, res) => res.status(404).json({ error: `Endpoint bulunamadı: ${req.path}` }))

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Express Hatası:', err.message)
  res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' })
})

export default app