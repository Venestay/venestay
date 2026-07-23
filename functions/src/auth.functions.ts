import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db } from './config/db';
import * as crypto from 'crypto';
import twilio from 'twilio';
import { z } from 'zod';

// Internal idempotency function
export async function recalculateKycPhase(userId: string): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  const user = await userRef.get();
  const data = user.data();

  // Legacy: si ya tenía KYC documental aprobado, no pisar
  if (data?.kycStatus === 'VERIFIED') {
    await userRef.update({ kycPhase: 1, canBook: true });
    return;
  }

  const signals = data?.trustSignals;
  const profile = data?.profile;

  // Fase 1
  const phase1 =
    signals?.emailVerified === true &&
    signals?.whatsappVerified === true &&
    !!data?.displayName && data.displayName.trim().split(' ').length >= 2 &&
    !!data?.photoURL &&
    (profile?.birthDateVerified === true || !!profile?.birthDate) &&
    ((profile?.bio?.length ?? 0) >= 20 || (data?.bio?.length ?? 0) >= 20);

  // Fase 2 (se evalúa solo si Fase 1 cumplida)
  const phase2 = phase1 && signals?.paymentNameMatchStatus === 'MATCHED';

  // Fase 3
  const phase3 = phase2 && signals?.vouchingStatus === 'VOUCHED';

  const kycPhase = phase3 ? 3 : phase2 ? 2 : phase1 ? 1 : 0;

  await userRef.update({
    kycPhase,
    canBook: kycPhase >= 1,
  });
}

export const updateProfile = functions.https.onCall(
  async (data: { displayName?: string; bio?: string; birthDate?: string; photoURL?: string }, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    
    const uid = context.auth.uid;
    const updates: Record<string, unknown> = {};
    const profileUpdates: Record<string, unknown> = {};

    if (data.displayName !== undefined) {
      if (data.displayName.trim().split(' ').length < 2 || data.displayName.length > 60) {
         throw new functions.https.HttpsError('invalid-argument', 'El nombre debe tener al menos 2 palabras y máximo 60 caracteres.');
      }
      updates.displayName = data.displayName;
    }

    if (data.bio !== undefined) {
      if (data.bio.length < 20 || data.bio.length > 500) {
        throw new functions.https.HttpsError('invalid-argument', 'La descripción debe tener entre 20 y 500 caracteres.');
      }
      profileUpdates.bio = data.bio;
    }
    
    if (data.photoURL !== undefined) {
      updates.photoURL = data.photoURL;
    }

    if (data.birthDate !== undefined) {
      const bDate = new Date(data.birthDate);
      const ageDifMs = Date.now() - bDate.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 18) {
        throw new functions.https.HttpsError('out-of-range', 'too-young');
      }
      profileUpdates.birthDate = data.birthDate;
      profileUpdates.birthDateVerified = true;
    }

    const userRef = db.collection('users').doc(uid);
    if (Object.keys(profileUpdates).length > 0) {
       // Workaround for deep merge in firestore update
       const userDoc = await userRef.get();
       const currentProfile = userDoc.data()?.profile || {};
       updates.profile = { ...currentProfile, ...profileUpdates };
    }
    
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      await userRef.set(updates, { merge: true });
      await recalculateKycPhase(uid);
    }

    return { success: true };
  }
);

const sendOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'El número debe estar en formato internacional E.164 válido.'),
  channel: z.enum(['whatsapp', 'sms', 'auto']).optional().default('auto'),
});

export const sendWhatsAppOTP = functions
  .runWith({ secrets: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER', 'TWILIO_CONTENT_SID'] })
  .https.onCall(async (data: { phoneNumber: string; channel?: 'whatsapp' | 'sms' | 'auto' }, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    
    const parsed = sendOtpSchema.safeParse(data);
    if (!parsed.success) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        parsed.error.issues[0]?.message ?? 'Número de teléfono inválido.'
      );
    }

    const { phoneNumber, channel } = parsed.data;
    const uid = context.auth.uid;

    let normalizedPhone = phoneNumber.trim();
    if (/^\+54[1-8]\d{9}$/.test(normalizedPhone)) {
      normalizedPhone = normalizedPhone.replace(/^\+54/, '+549');
    }

    const existingOtp = await db.collection('otpCodes').doc(uid).get();
    if (existingOtp.exists) {
      const existingData = existingOtp.data()!;
      if (existingData.createdAt) {
        const elapsedSeconds = (Date.now() - existingData.createdAt.toDate().getTime()) / 1000;
        if (elapsedSeconds < 60) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            `Ya enviamos un código recientemente. Espera ${Math.ceil(60 - elapsedSeconds)} segundos antes de solicitar otro.`
          );
        }
      } else if (existingData.expiresAt) {
        // Fallback para registros previos a este cambio (donde expiresAt era createdAt + 10 min)
        const nineMinutesFromNow = new Date(Date.now() + 9 * 60 * 1000);
        if (existingData.expiresAt.toDate() > nineMinutesFromNow) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            'Ya enviamos un código recientemente. Espera 1 minuto antes de solicitar otro.'
          );
        }
      }
    }

    // Generate 6 digit OTP securely
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await db.collection('otpCodes').doc(uid).set({
      codeHash,
      phoneNumber: normalizedPhone,
      createdAt: admin.firestore.Timestamp.now(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      attempts: 0
    });

    let channelUsed: 'whatsapp' | 'sms' = 'whatsapp';
    let messageResult = '';

    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
      const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
      const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER?.trim() || '+15559525528';
      const contentSid = process.env.TWILIO_CONTENT_SID?.trim();
      const smsNumber = process.env.TWILIO_SMS_NUMBER?.trim() || '+14177645823';

      const client = twilio(accountSid, authToken);
      const cleanTo = normalizedPhone.replace(/^whatsapp:/i, '').trim();

      // Si se pidió explícitamente SMS o auto
      if (channel === 'sms' || channel === 'auto') {
        await client.messages.create({
          from: smsNumber,
          to: cleanTo,
          body: `Tu código de verificación para VeneStay es: ${code}. No lo compartas con nadie. Vence en 10 minutos.`,
        });
        channelUsed = 'sms';
        messageResult = 'Código enviado por SMS convencional.';
      } else {
        // Intentar WhatsApp (solo si se pide explícitamente)
        const cleanFrom = whatsappNumber.replace(/^whatsapp:/i, '').trim();
        const baseOptions = {
          from: `whatsapp:${cleanFrom}`,
          to: `whatsapp:${cleanTo}`,
        };

        try {
          let waMsg;
          if (contentSid) {
            waMsg = await client.messages.create({
              ...baseOptions,
              contentSid: contentSid,
              contentVariables: JSON.stringify({ '1': code }),
            });
          } else {
            waMsg = await client.messages.create({
              ...baseOptions,
              body: `Tu código de verificación para VeneStay es: ${code}. No lo compartas con nadie. Vence en 10 minutos.`,
            });
          }

          // Inspeccionar entrega asíncrona tras 1.5 segundos para capturar rechazos de plantilla de Meta (63112 / 63016)
          await new Promise(r => setTimeout(r, 1500));
          const checked = await client.messages(waMsg.sid).fetch();
          if (checked.status === 'failed' || checked.status === 'undelivered') {
            throw { code: checked.errorCode, message: checked.errorMessage || `WhatsApp falló asíncronamente (código ${checked.errorCode})` };
          }

          channelUsed = 'whatsapp';
          messageResult = 'Código enviado correctamente a WhatsApp.';
        } catch (waError: unknown) {
          const waErr = waError as { code?: number; message?: string };
          functions.logger.warn('[Twilio] Falló envío por WhatsApp, aplicando fallback automático a SMS', {
            code: waErr.code,
            message: waErr.message,
            to: cleanTo,
          });

          // Fallback resiliente a SMS
          await client.messages.create({
            from: smsNumber,
            to: cleanTo,
            body: `Tu código de verificación para VeneStay es: ${code}. No lo compartas con nadie. Vence en 10 minutos.`,
          });
          channelUsed = 'sms';
          messageResult = 'Código enviado por SMS convencional (fallback automático al no poder entregar por WhatsApp).';
        }
      }
    } catch (error: unknown) {
      await db.collection('otpCodes').doc(uid).delete().catch(() => {});
      const twilioError = error as { code?: number; message?: string };
      functions.logger.error('[Twilio] Error al enviar OTP por todos los canales', {
        code: twilioError.code,
        message: twilioError.message,
        to: normalizedPhone,
      });
      throw new functions.https.HttpsError(
        'aborted',
        'No se pudo enviar el mensaje de verificación (ni por WhatsApp ni por SMS). Verifica el número ingresado.'
      );
    }

    return { success: true, message: messageResult, channelUsed };
  });

export const confirmWhatsAppOTP = functions.https.onCall(
  async (data: { phoneNumber: string; code: string }, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    const uid = context.auth.uid;

    let normalizedPhone = data.phoneNumber.trim();
    if (/^\+54[1-8]\d{9}$/.test(normalizedPhone)) {
      normalizedPhone = normalizedPhone.replace(/^\+54/, '+549');
    }

    const otpDocRef = db.collection('otpCodes').doc(uid);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
       throw new functions.https.HttpsError('not-found', 'No hay un código OTP pendiente.');
    }

    const otpData = otpDoc.data()!;
    if (otpData.attempts >= 3) {
       await otpDocRef.delete();
       throw new functions.https.HttpsError('resource-exhausted', 'Demasiados intentos. Solicita un nuevo código.');
    }

    if (otpData.expiresAt.toDate() < new Date()) {
       await otpDocRef.delete();
       throw new functions.https.HttpsError('deadline-exceeded', 'El código ha expirado.');
    }

    const inputHash = crypto.createHash('sha256').update(data.code).digest('hex');
    if (inputHash !== otpData.codeHash || otpData.phoneNumber !== normalizedPhone) {
       await otpDocRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
       throw new functions.https.HttpsError('invalid-argument', 'Código incorrecto.');
    }

    // Success!
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const currentTrustSignals = userDoc.data()?.trustSignals || {};

    await userRef.set({
      trustSignals: {
        ...currentTrustSignals,
        whatsappVerified: true,
        whatsappNumber: normalizedPhone,
        whatsappVerifiedAt: new Date().toISOString()
      }
    }, { merge: true });

    await otpDocRef.delete();
    await recalculateKycPhase(uid);

    return { success: true };
  }
);

export const syncEmailVerification = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    const uid = context.auth.uid;
    const userRecord = await admin.auth().getUser(uid);
    
    if (userRecord.emailVerified) {
       const userRef = db.collection('users').doc(uid);
       const userDoc = await userRef.get();
       const currentTrustSignals = userDoc.data()?.trustSignals || {};
       
       await userRef.set({
         isEmailVerified: true,
         trustSignals: {
           ...currentTrustSignals,
           emailVerified: true
         }
       }, { merge: true });
       await recalculateKycPhase(uid);
       return { success: true, verified: true };
    }
    return { success: true, verified: false };
  }
);
