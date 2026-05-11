import nodemailer from 'nodemailer';

// Müşteriye hoş geldin maili
export const sendWelcomeEmail = async (to, name) => {
  console.log(`[Email Mock] Hoş geldin maili gönderildi -> ${to}`);
  return true;
};

// Rezervasyon onay maili
export const sendReservationConfirmation = async (to, name, details) => {
  console.log(`[Email Mock] Rezervasyon onayı gönderildi -> ${to}`);
  return true;
};

// Müşteri tarafından rezervasyon iptali
export const sendReservationCancelledByUser = async (to, name, details) => {
  console.log(`[Email Mock] Müşteri iptal maili gönderildi -> ${to}`);
  return true;
};

// İŞLETME tarafından rezervasyon iptali (Hata veren asıl fonksiyon)
export const sendReservationCancelledByOwner = async (to, name, details) => {
  console.log(`[Email Mock] İşletme iptal maili gönderildi -> ${to}`);
  return true;
};

// Şifre sıfırlama veya diğer olası bildirimler
export const sendStatusUpdateEmail = async (to, name, details) => {
  console.log(`[Email Mock] Durum güncelleme maili gönderildi -> ${to}`);
  return true;
};

export default {
  sendWelcomeEmail,
  sendReservationConfirmation,
  sendReservationCancelledByUser,
  sendReservationCancelledByOwner,
  sendStatusUpdateEmail
};