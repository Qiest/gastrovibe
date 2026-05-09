/**
 * api/index.js
 * Vercel Serverless Function — Express uygulamasını sarmalayan handler.
 *
 * Vercel bu dosyayı "/api/*" isteklerine yönlendirir.
 * Lokal geliştirmede bu dosya kullanılmaz; normal `server.js` çalışır.
 */
import 'dotenv/config'
import express   from 'express'
import cors      from 'cors'
import path      from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(cors({
  origin: process.env.APP_URL || true,
  credentials: true,
}))
app.use(express.json())

// Uploaded images (Vercel'de /tmp altında tutulur)
app.use('/uploads', express.static(path.join('/tmp', 'uploads')))

/* ── DB ── */
try {
  const { initDb } = await import('../db/init.js')
  await initDb()
  console.log('✅ DB (Vercel) hazır')
} catch (err) {
  console.error('❌ DB başlatılamadı:', err.message)
  // Vercel'de crash yerine 503 döndür
  app.use((_, res) => res.status(503).json({ error: 'Veritabanı başlatılamadı. Lütfen daha sonra tekrar deneyin.' }))
}

/* ── ROUTES ── */
const { default: authRoutes        } = await import('../routes/auth.js')
const { default: restaurantRoutes  } = await import('../routes/restaurants.js')
const { default: reservationRoutes } = await import('../routes/reservations.js')
const { default: favoriteRoutes    } = await import('../routes/favorites.js')
const { default: reviewRoutes      } = await import('../routes/reviews.js')
const { default: blogRoutes        } = await import('../routes/blog.js')
const { default: chatRoutes        } = await import('../routes/chat.js')
const { default: ownerRoutes       } = await import('../routes/owner.js')
const { default: adminRoutes       } = await import('../routes/admin.js')
const { default: uploadRoutes      } = await import('../routes/upload.js')

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

// Global error handler — JSON parse hatalarını önler
app.use((err, req, res, _next) => {
  console.error('Express Hatası:', err.message)
  res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' })
})

export default app
