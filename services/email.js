/**
 * services/email.js
 * Nodemailer tabanlı e-posta servisi
 *
 * .env'de şu değişkenleri tanımla:
 *   EMAIL_HOST=smtp.gmail.com
 *   EMAIL_PORT=587
 *   EMAIL_USER=senin@gmail.com
 *   EMAIL_PASS=uygulama-sifresi   ← Gmail App Password
 *   EMAIL_FROM="GastroVibe 🍽️ <noreply@gastrovibe.com>"
 *
 * Gmail App Password almak için:
 *   Google Hesabım → Güvenlik → 2FA açık → Uygulama Şifreleri
 *
 * EMAIL_* değişkenleri yoksa mail gönderilmez (sadece konsola yazılır).
 */
import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('⚠️  E-posta yapılandırması eksik (EMAIL_USER / EMAIL_PASS). Mailler yalnızca konsola yazılacak.')
    return null
  }

  transporter = nodemailer.createTransport({
    host:   EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(EMAIL_PORT || '587'),
    secure: false,
    auth:   { user: EMAIL_USER, pass: EMAIL_PASS },
  })

  return transporter
}

async function send(to, subject, html) {
  const t = getTransporter()
  if (!t) {
    console.log(`\n📧 [DEV-MAIL] TO: ${to}\n   SUBJECT: ${subject}\n`)
    return { dev: true }
  }
  return t.sendMail({
    from: process.env.EMAIL_FROM || '"GastroVibe 🍽️" <noreply@gastrovibe.com>',
    to, subject, html,
  })
}

/* ─────────────────────────────────────────────
   ŞABLONLAR
───────────────────────────────────────────── */

const base = (content) => `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { margin:0; padding:0; background:#F7F2EC; font-family:'Helvetica Neue',Arial,sans-serif; }
    .wrap { max-width:560px; margin:32px auto; background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 4px 30px rgba(0,0,0,.08); }
    .header { background:#1A4A3C; padding:32px 40px; }
    .logo { font-size:22px; font-weight:900; color:#fff; letter-spacing:-.5px; }
    .logo span { color:#C8602A; }
    .body { padding:36px 40px; color:#1C1A17; }
    h2 { margin:0 0 8px; font-size:22px; font-weight:800; }
    p { margin:0 0 14px; font-size:15px; line-height:1.6; color:#3D3830; }
    .card { background:#F7F2EC; border-radius:14px; padding:20px 24px; margin:20px 0; }
    .card-row { display:flex; justify-content:space-between; padding:5px 0; font-size:14px; color:#3D3830; }
    .card-row b { color:#1C1A17; }
    .btn { display:inline-block; background:#C8602A; color:#fff; text-decoration:none; font-weight:700; font-size:14px; padding:12px 28px; border-radius:50px; margin-top:8px; }
    .reason-box { background:#FEF3C7; border:1px solid #F59E0B; border-radius:12px; padding:16px 20px; margin:16px 0; }
    .reason-box p { margin:0; color:#92400E; font-size:14px; }
    .footer { padding:20px 40px 28px; text-align:center; font-size:12px; color:#8A7E72; border-top:1px solid #EDE6DA; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo">Gastro<span>Vibe</span></div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">GastroVibe · Türkiye'nin Deneyim Platformu<br>Bu e-posta otomatik gönderilmiştir.</div>
  </div>
</body>
</html>`

/* Rezervasyon onay maili */
export async function sendReservationConfirmation({ to, userName, restaurantName, date, time, partySize, note }) {
  const html = base(`
    <h2>Rezervasyonunuz Onaylandı ✅</h2>
    <p>Merhaba <b>${userName}</b>, rezervasyonunuz başarıyla oluşturuldu.</p>
    <div class="card">
      <div class="card-row"><span>🏠 Mekan</span><b>${restaurantName}</b></div>
      <div class="card-row"><span>📅 Tarih</span><b>${date}</b></div>
      <div class="card-row"><span>🕐 Saat</span><b>${time}</b></div>
      <div class="card-row"><span>👥 Kişi</span><b>${partySize} kişi</b></div>
      ${note ? `<div class="card-row"><span>📝 Not</span><b>${note}</b></div>` : ''}
    </div>
    <p>Güzel bir deneyim geçirmenizi dileriz. 🍽️</p>
  `)
  return send(to, `Rezervasyon Onaylandı — ${restaurantName}`, html)
}

/* İşletmeci iptal maili */
export async function sendReservationCancelledByOwner({ to, userName, restaurantName, date, time, reason }) {
  const html = base(`
    <h2>Rezervasyonunuz İptal Edildi ❌</h2>
    <p>Merhaba <b>${userName}</b>,</p>
    <p><b>${restaurantName}</b> için ${date} tarihli ${time} saatindeki rezervasyonunuz işletme tarafından iptal edilmiştir.</p>
    ${reason ? `
    <div class="reason-box">
      <p><b>İptal Sebebi:</b> ${reason}</p>
    </div>` : ''}
    <p>Bu konuda üzgünüz. GastroVibe üzerinden yeni bir rezervasyon oluşturabilirsiniz.</p>
    <a href="${process.env.APP_URL || 'http://localhost:5173'}/restaurants" class="btn">Yeni Rezervasyon Yap →</a>
  `)
  return send(to, `Rezervasyon İptal Edildi — ${restaurantName}`, html)
}

/* Müşteri kendi iptal maili */
export async function sendReservationCancelledByUser({ to, userName, restaurantName, date, time }) {
  const html = base(`
    <h2>İptal İşleminiz Tamamlandı</h2>
    <p>Merhaba <b>${userName}</b>, aşağıdaki rezervasyonunuzu iptal ettiğinizi onaylıyoruz.</p>
    <div class="card">
      <div class="card-row"><span>🏠 Mekan</span><b>${restaurantName}</b></div>
      <div class="card-row"><span>📅 Tarih</span><b>${date}</b></div>
      <div class="card-row"><span>🕐 Saat</span><b>${time}</b></div>
    </div>
    <p>Sizi tekrar görmekten memnuniyet duyarız. 🍽️</p>
    <a href="${process.env.APP_URL || 'http://localhost:5173'}/restaurants" class="btn">Yeni Mekan Keşfet →</a>
  `)
  return send(to, `Rezervasyon İptal Edildi — ${restaurantName}`, html)
}

/* Hoşgeldin maili */
export async function sendWelcomeEmail({ to, userName }) {
  const html = base(`
    <h2>GastroVibe'a Hoş Geldiniz! 🎉</h2>
    <p>Merhaba <b>${userName}</b>,</p>
    <p>Türkiye'nin en iyi deneyim odaklı restoran platformuna üye oldunuz. Artık yüzlerce seçkin mekanı keşfedebilir, rezervasyon yapabilir ve deneyimlerinizi paylaşabilirsiniz.</p>
    <a href="${process.env.APP_URL || 'http://localhost:5173'}/restaurants" class="btn">Mekanları Keşfet →</a>
  `)
  return send(to, 'GastroVibe\'e Hoş Geldiniz! 🍽️', html)
}
