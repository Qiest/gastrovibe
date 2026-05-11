export const sendWelcomeEmail = async () => true;
export const sendReservationConfirmation = async () => true;
export const sendReservationCancelledByUser = async () => true;
export const sendReservationCancelledByOwner = async () => true;
export const sendStatusUpdateEmail = async () => true;

export default {
  sendWelcomeEmail,
  sendReservationConfirmation,
  sendReservationCancelledByUser,
  sendReservationCancelledByOwner,
  sendStatusUpdateEmail
};