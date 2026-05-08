/**
 * routes/chat.js
 */
import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { all } from '../db/init.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Çok fazla mesaj gönderdiniz. 1 dakika sonra tekrar deneyin.' },
})

const SYSTEM_PROMPT = `Sen GastroVibe'ın Gastro Asistanısın. Türkiye'deki restoranlar hakkında kısa, samimi ve yardımsever önerilerde bulunuyorsun.

KURAL:
- Her zaman Türkçe yaz.
- Kısa ve sıcak ol (maks 2-3 cümle açıklama).
- Mutlaka "MEKANLAR:" bölümüyle bitir. Tam olarak şu formatta:

MEKANLAR:
- İsim: [tam restoran adı] | Konum: [lokasyon] | Fiyat: [₺, ₺₺, ₺₺₺ veya ₺₺₺₺] | Rozetler: [badge1, badge2] | Emoji: [1 emoji]

Eğer bilmiyorsan veya spesifik bir mekan yoksa yine de 2-3 öneri üret.
Sadece restoranlar hakkında konuş. Başka konulara girme.`

function parseMekanlar(text) {
  const lines = text.split('\n').filter(l => l.trim().startsWith('-'))
  return lines.map(line => {
    const extract = (key) => {
      const match = line.match(new RegExp(`${key}:\\s*([^|]+)`))
      return match ? match[1].trim() : ''
    }
    const badgeStr = extract('Rozetler')
    return {
      name:     extract('İsim'),
      location: extract('Konum'),
      price:    extract('Fiyat'),
      emoji:    extract('Emoji') || '🍽️',
      badges:   badgeStr ? badgeStr.split(',').map(b => b.trim()).filter(Boolean) : [],
    }
  }).filter(r => r.name)
}

const MOCK_RESTAURANTS = [
  { name: 'Çınar Bahçe',   location: 'Mudanya, Bursa', price: '₺₺₺', emoji: '🌲', badges: ['Orman İçinde','Canlı Müzik'] },
  { name: 'Liman 1924',    location: 'Mudanya, Bursa', price: '₺₺',  emoji: '🌊', badges: ['Deniz Kenarı','Taze Balık']  },
  { name: 'Toprak Bistro', location: 'Nilüfer, Bursa', price: '₺₺₺', emoji: '✨', badges: ['Modern Anadolu','Caz Geceleri'] },
]

router.post('/', chatLimiter, optionalAuth, [
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Mesaj 1-500 karakter arasında olmalı.'),
  body('history').optional().isArray({ max: 20 }),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg })

  const { message, history = [] } = req.body

  // DB'deki restoranları context olarak ekle (cuisine_type yok, description kullanıyoruz)
  const dbRestaurants = all('SELECT name, location, price_level, badges, description FROM restaurants ORDER BY rating DESC')
  const restaurantContext = dbRestaurants.map(r => {
    const badges = typeof r.badges === 'string' ? JSON.parse(r.badges) : []
    return `- ${r.name} (${r.location}) | ${['₺','₺₺','₺₺₺','₺₺₺₺'][r.price_level-1]} | ${badges.map(b => b.label).join(', ')}`
  }).join('\n')

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({
      message: 'Harika seçim! Bursa\'nın bu üç efsanevi mekanına mutlaka bakmalısınız:',
      restaurants: MOCK_RESTAURANTS,
    })
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemWithContext = `${SYSTEM_PROMPT}\n\nMevcut mekanlar:\n${restaurantContext}`
    const messages = [
      ...history.slice(-10),
      { role: 'user', content: message },
    ]

    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system:     systemWithContext,
      messages,
    })

    const aiText        = response.content[0].text
    const mekanlarIndex = aiText.indexOf('MEKANLAR:')
    const visibleText   = mekanlarIndex > -1 ? aiText.slice(0, mekanlarIndex).trim() : aiText.trim()
    const restaurants   = mekanlarIndex > -1 ? parseMekanlar(aiText.slice(mekanlarIndex)) : []

    res.json({ message: visibleText, restaurants })
  } catch (err) {
    console.error('AI hatası:', err.message)
    res.json({
      message: 'Şu an AI bağlantısında sorun var, ama şu önerilere bakabilirsiniz:',
      restaurants: MOCK_RESTAURANTS,
    })
  }
})

export default router
