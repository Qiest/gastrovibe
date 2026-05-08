import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json())

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

/* ── DB ── */
try {
  const { initDb } = await import('./db/init.js')
  await initDb()
  console.log('✅ DB hazır')
} catch (err) {
  console.error('❌ DB başlatılamadı:', err.message)
  process.exit(1)
}

/* ── ROUTES ── */
const { default: authRoutes        } = await import('./routes/auth.js')
const { default: restaurantRoutes  } = await import('./routes/restaurants.js')
const { default: reservationRoutes } = await import('./routes/reservations.js')
const { default: favoriteRoutes    } = await import('./routes/favorites.js')
const { default: reviewRoutes      } = await import('./routes/reviews.js')
const { default: blogRoutes        } = await import('./routes/blog.js')
const { default: chatRoutes        } = await import('./routes/chat.js')
const { default: ownerRoutes       } = await import('./routes/owner.js')
const { default: adminRoutes       } = await import('./routes/admin.js')
const { default: uploadRoutes      } = await import('./routes/upload.js')

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

app.get('/api/health', (_, res) => res.json({ status: 'ok' }))
app.use('/api/*', (req, res) => res.status(404).json({ error: `Bulunamadı: ${req.path}` }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n🍽️  GastroVibe API  →  http://localhost:${PORT}`)
  console.log(`   AI: ${process.env.ANTHROPIC_API_KEY ? '✅ Aktif' : '⚠️  Mock mod'}`)
  console.log(`\n   👤 demo@gastrovibe.com  / demo1234`)
  console.log(`   🏪 owner@gastrovibe.com / owner1234`)
  console.log(`   👑 admin@gastrovibe.com / admin1234\n`)
})
