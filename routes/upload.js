/**
 * routes/upload.js
 * POST /api/upload          → tek fotoğraf yükle
 * GET  /api/upload/mine     → benim yüklediklerim
 * DELETE /api/upload/:id    → sil
 */
import { Router } from 'express'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import path from 'path'
import { get, all, run } from '../db/init.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const require   = createRequire(import.meta.url)
const multer    = require('multer')
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')

if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase()
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, name)
  },
})

const fileFilter = (_, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (allowed.includes(file.mimetype)) cb(null, true)
  else cb(new Error('Sadece JPEG, PNG, WebP ve GIF yüklenebilir.'))
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

const router = Router()

// POST /api/upload
router.post('/', requireAuth, requireRole('owner', 'admin'), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya seçilmedi.' })

  const url = `/uploads/${req.file.filename}`
  const { lastInsertRowid } = run(
    `INSERT INTO uploads (owner_id, filename, original, mimetype, size, url) VALUES (?,?,?,?,?,?)`,
    [req.user.id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, url]
  )

  res.status(201).json({
    id:       lastInsertRowid,
    url,
    filename: req.file.filename,
    original: req.file.originalname,
    size:     req.file.size,
  })
})

// GET /api/upload/mine
router.get('/mine', requireAuth, requireRole('owner', 'admin'), (req, res) => {
  const uploads = all('SELECT * FROM uploads WHERE owner_id = ? ORDER BY created_at DESC', [req.user.id])
  res.json({ uploads })
})

// DELETE /api/upload/:id
router.delete('/:id', requireAuth, requireRole('owner', 'admin'), (req, res) => {
  const upload = get('SELECT * FROM uploads WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id])
  if (!upload) return res.status(404).json({ error: 'Dosya bulunamadı.' })

  const filePath = path.join(UPLOAD_DIR, upload.filename)
  try { unlinkSync(filePath) } catch {}

  run('DELETE FROM uploads WHERE id = ?', [req.params.id])
  res.json({ message: 'Dosya silindi.' })
})

export default router
