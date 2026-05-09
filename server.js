import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// api/index.js'deki app'i al
const { default: app } = await import('./api/index.js')

// Lokal: uploads klasörünü statik sun
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Lokal: Vite build çıktısını sun (npm run preview için)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n🍽️  GastroVibe API  →  http://localhost:${PORT}`)
  console.log(`   AI: ${process.env.ANTHROPIC_API_KEY ? '✅ Aktif' : '⚠️  Mock mod'}`)
  console.log(`\n   👤 demo@gastrovibe.com  / demo1234`)
  console.log(`   🏪 owner@gastrovibe.com / owner1234`)
  console.log(`   👑 admin@gastrovibe.com / admin1234\n`)
})
