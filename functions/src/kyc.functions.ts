import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import {
  buildKYCApprovedEmailHTML,
  buildKYCRejectedEmailHTML
} from './templates/kyc-emails';

import { db, DATABASE_ID } from './config/db';

/**
 * Notificación a administradores
 */
async function notifyAdmins(payload: { title: string; body: string; data?: unknown }) {
  console.log('Admin Notification:', payload);
  await db.collection('adminNotifications').add({
    ...payload,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    read: false
  });
}

/**
 * Cloud Function: submitKYCDocument
 * Registra el documento de KYC y cambia el estado a PENDING_REVIEW
 */
export const submitKYCDocument = functions.https.onCall(
  async (data: { documentType: 'cedula' | 'pasaporte'; storageFileName: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    }

    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const user = snap.data();

      // Permitir UNVERIFIED (valor inicial de la BD) o NOT_SUBMITTED o REJECTED
      const currentStatus = user?.kycStatus || 'NOT_SUBMITTED';
      if (!['NOT_SUBMITTED', 'REJECTED', 'UNVERIFIED'].includes(currentStatus)) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `No se puede subir un documento en el estado actual: ${currentStatus}.`
        );
      }

      // Verificar que el archivo existe en Storage antes de registrar en Firestore
      const storagePath = `kyc/${uid}/${data.storageFileName}`;
      try {
        await admin.storage().bucket().file(storagePath).getMetadata();
      } catch {
        throw new functions.https.HttpsError('not-found', 'El archivo no se encontró en Storage.');
      }

      const historyEntry = {
        status: 'PENDING_REVIEW',
        timestamp: new Date().toISOString(),
        actorId: uid,
        actorRole: 'user',
      };

      tx.update(userRef, {
        kycStatus: 'PENDING_REVIEW',
        kycDocumentUrl: storagePath, // guardamos el path relativo
        kycDocumentType: data.documentType,
        isIdentityVerified: false,
        kycSubmittedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        kycStatusHistory: admin.firestore.FieldValue.arrayUnion(historyEntry),
      });
    });

    // Notificar a admins
    await notifyAdmins({
      title: 'Nueva verificación KYC pendiente',
      body: `El usuario ${uid} acaba de subir su documento de identidad.`,
      data: { type: 'kyc_pending', uid },
    });

    return { success: true };
  }
);

/**
 * Cloud Function: approveKYC
 * Aprueba el KYC del usuario y actualiza su Trust Score a +40 (máximo 100).
 */
export const approveKYC = functions.https.onCall(
  async (data: { targetUserId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    }

    const adminSnap = await db.collection('users').doc(context.auth.uid).get();
    if (adminSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Acción reservada para administradores.');
    }

    const userRef = db.collection('users').doc(data.targetUserId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const user = snap.data();
      if (user?.kycStatus !== 'PENDING_REVIEW') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `No se puede aprobar en el estado: ${user?.kycStatus || 'Desconocido'}`
        );
      }
      const newScore = Math.min(100, (user.trustScore ?? 0) + 40);
      const historyEntry = {
        status: 'VERIFIED',
        timestamp: new Date().toISOString(),
        actorId: context.auth!.uid,
        actorRole: 'admin',
      };
      tx.update(userRef, {
        kycStatus: 'VERIFIED',
        isIdentityVerified: true,
        trustScore: newScore,
        kycReviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        kycStatusHistory: admin.firestore.FieldValue.arrayUnion(historyEntry),
      });
    });
    return { success: true };
  }
);

/**
 * Cloud Function: rejectKYC
 * Rechaza el KYC con nota de rechazo y elimina el documento de Storage de forma segura.
 */
export const rejectKYC = functions.https.onCall(
  async (data: { targetUserId: string; note: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    }
    if (!data.note || data.note.trim().length < 10) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'El motivo del rechazo es obligatorio (mínimo 10 caracteres).'
      );
    }

    const adminSnap = await db.collection('users').doc(context.auth.uid).get();
    if (adminSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Acción reservada para administradores.');
    }

    const userRef = db.collection('users').doc(data.targetUserId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const user = snap.data();
      if (user?.kycStatus !== 'PENDING_REVIEW') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `No se puede rechazar en el estado: ${user?.kycStatus || 'Desconocido'}`
        );
      }
      if (user.kycDocumentUrl) {
        await admin.storage().bucket().file(user.kycDocumentUrl).delete().catch((err) => {
          console.error(`Error deleting storage file ${user.kycDocumentUrl}:`, err);
        });
      }
      const historyEntry = {
        status: 'REJECTED',
        timestamp: new Date().toISOString(),
        actorId: context.auth!.uid,
        actorRole: 'admin',
        note: data.note,
      };
      tx.update(userRef, {
        kycStatus: 'REJECTED',
        isIdentityVerified: false,
        kycDocumentUrl: admin.firestore.FieldValue.delete(),
        kycRejectionNote: data.note,
        kycReviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        kycStatusHistory: admin.firestore.FieldValue.arrayUnion(historyEntry),
      });
    });
    return { success: true };
  }
);

/**
 * Cloud Function: getKYCDocumentSignedURL
 * Genera una URL firmada de lectura temporal (30 min) para el documento de identidad de un usuario.
 */
export const getKYCDocumentSignedURL = functions.https.onCall(
  async (data: { targetUserId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    }

    const adminSnap = await db.collection('users').doc(context.auth.uid).get();
    if (adminSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Acción reservada para administradores.');
    }

    if (!data.targetUserId) {
      throw new functions.https.HttpsError('invalid-argument', 'El parámetro targetUserId es requerido.');
    }

    const userSnap = await db.collection('users').doc(data.targetUserId).get();
    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Usuario no encontrado.');
    }

    const user = userSnap.data();
    if (!user || !user.kycDocumentUrl) {
      throw new functions.https.HttpsError('not-found', 'Este usuario no tiene un documento KYC cargado.');
    }

    try {
      let filePath = user.kycDocumentUrl;
      if (filePath.startsWith('gs://')) {
        filePath = filePath.replace(/gs:\/\/[^/]+\//, '');
      }

      const bucket = admin.storage().bucket();
      const fileRef = bucket.file(filePath);

      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 30 * 60 * 1000, // 30 minutos
      });

      return { signedUrl };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Error generating KYC signed URL:', err);
      throw new functions.https.HttpsError('internal', 'Error al generar la URL firmada de KYC: ' + errMsg);
    }
  }
);

/**
 * TRIGGER v2: Actualización de estado KYC
 * Envía un correo electrónico al usuario cuando su KYC es verificado o rechazado.
 */
export const onKYCStatusChanged = onDocumentUpdated(
  { document: 'users/{uid}', database: DATABASE_ID },
  async (event) => {
    if (!event.data) return null;
    const before = event.data.before.data();
    const after = event.data.after.data();
    const uid = event.params.uid;

    if (before.kycStatus === after.kycStatus) {
      return null; // El estado de KYC no cambió
    }

    // Aprobado
    if (after.kycStatus === 'VERIFIED' && before.kycStatus !== 'VERIFIED') {
      if (!after.kycVerificationEmailSentAt) {
        try {
          if (after.email) {
            await db.collection('mail').add({
              to: after.email,
              message: {
                subject: '¡Tu Pasaporte VeneStay ha sido verificado! 🛡️ — VeneStay',
                html: buildKYCApprovedEmailHTML(after),
              },
            });
            // Flag marcado DESPUÉS del mail.add exitoso (fix idempotencia + base de datos)
            await db.collection('users').doc(uid).update({
              kycVerificationEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`KYC verification approval email queued successfully for user ${uid}`);
          }
        } catch (err) {
          console.error('Error queueing KYC verification email:', err);
        }
      }
    }

    // Rechazado
    if (after.kycStatus === 'REJECTED' && before.kycStatus !== 'REJECTED') {
      if (!after.kycRejectionEmailSentAt) {
        try {
          if (after.email) {
            await db.collection('mail').add({
              to: after.email,
              message: {
                subject: 'Actualización sobre tu verificación de identidad — VeneStay',
                html: buildKYCRejectedEmailHTML(after, after.kycRejectionNote || 'El documento subido no es legible o es inválido.'),
              },
            });
            // Flag marcado DESPUÉS del mail.add exitoso (fix idempotencia + base de datos)
            await db.collection('users').doc(uid).update({
              kycRejectionEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`KYC rejection email queued successfully for user ${uid}`);
          }
        } catch (err) {
          console.error('Error queueing KYC rejection email:', err);
        }
      }
    }

    return null;
  }
);
