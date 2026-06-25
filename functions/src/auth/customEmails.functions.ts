import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createTransporter } from '../lib/mailer';
import { buildEmailVerificationHTML, buildPasswordResetHTML } from '../templates/auth-emails';

export const sendCustomVerificationEmail = functions
  .runWith({ secrets: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'] })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Debes estar autenticado.');
    }
    if (data.email !== context.auth.token.email) {
      throw new functions.https.HttpsError('permission-denied', 'Email no coincide con tu cuenta.');
    }

    try {
      const baseUrl = data.appBaseUrl || process.env.ACTION_CODE_URL || 'https://venestay.com';
      const firebaseLink = await admin.auth().generateEmailVerificationLink(data.email, {
        url: baseUrl,
      });
      const actionLink = firebaseLink.replace(
        /https:\/\/.*\.firebaseapp\.com\/__\/auth\/action/,
        `${baseUrl}/auth/action`
      );

      const html = buildEmailVerificationHTML(data.displayName || 'Huésped', actionLink);
      
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"VeneStay" <${process.env.SMTP_USER?.trim() || 'info@venestay.com'}>`,
        to: data.email,
        subject: 'Verifica tu correo — VeneStay',
        html,
        text: `Hola ${data.displayName || 'Huésped'}, verifica tu correo en el siguiente enlace: ${actionLink}`
      });
      return { success: true };
    } catch (error) {
      functions.logger.error('Error enviando correo de verificación:', error);
      throw new functions.https.HttpsError('internal', 'No se pudo enviar el correo de verificación.');
    }
  });

export const sendCustomPasswordResetEmail = functions
  .runWith({ secrets: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'] })
  .https.onCall(async (data, _context) => {
    const email = (data.email as string).toLowerCase().trim();

    try {
      const baseUrl = data.appBaseUrl || process.env.ACTION_CODE_URL || 'https://venestay.com';
      const firebaseLink = await admin.auth().generatePasswordResetLink(email, {
        url: baseUrl,
      });
      const actionLink = firebaseLink.replace(
        /https:\/\/.*\.firebaseapp\.com\/__\/auth\/action/,
        `${baseUrl}/auth/action`
      );

      const html = buildPasswordResetHTML(data.displayName || 'Usuario', actionLink);
      
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"VeneStay" <${process.env.SMTP_USER?.trim() || 'info@venestay.com'}>`,
        to: email,
        subject: 'Restablece tu contraseña — VeneStay',
        html,
        text: `Hola ${data.displayName || 'Usuario'}, restablece tu contraseña en el siguiente enlace: ${actionLink}`
      });
    } catch (error) {
      functions.logger.warn('sendCustomPasswordResetEmail: email no encontrado o error SMTP', { email, error });
    }
    return { success: true };
  });
