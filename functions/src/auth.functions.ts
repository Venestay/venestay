import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db } from './config/db';
import * as crypto from 'crypto';

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

export const sendWhatsAppOTP = functions.https.onCall(
  async (data: { phoneNumber: string }, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    const uid = context.auth.uid;
    
    // Generate 6 digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await db.collection('otpCodes').doc(uid).set({
      codeHash,
      phoneNumber: data.phoneNumber,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      attempts: 0
    });

    // Stub para el usuario en desarrollo local, opción sencilla y open source
    functions.logger.info(`[STUB] OTP Code for ${data.phoneNumber} is: ${code}`);

    return { success: true, message: "Código enviado. Revisa la consola o logs de Firebase." };
  }
);

export const confirmWhatsAppOTP = functions.https.onCall(
  async (data: { phoneNumber: string; code: string }, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    const uid = context.auth.uid;

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
    if (inputHash !== otpData.codeHash || otpData.phoneNumber !== data.phoneNumber) {
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
        whatsappNumber: data.phoneNumber,
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
