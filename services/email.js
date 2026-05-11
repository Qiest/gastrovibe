/**
 * services/email.js
 * (Geçici olarak devre dışı bırakıldı - Vercel çökmesini önlemek için)
 */

export const sendEmail = async (to, subject, text) => {
  console.log(`✉️ Mail simüle edildi -> Kime: ${to} | Konu: ${subject}`);
  // Sistem mail atmış gibi davranıp yoluna devam edecek, asla çökmeyecek.
  return true;
};

// Eğer başka fonksiyonlar (sendWelcomeEmail vb.) varsa, onları da böyle boş döndürebilirsin:
export const sendWelcomeEmail = async (email, name) => {
  console.log(`✉️ Hoş geldin maili simüle edildi -> ${email}`);
  return true;
};