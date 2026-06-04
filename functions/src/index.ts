import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * CRON JOB: Mitigación del "Soft-Block Zombie"
 * Se ejecuta cada 15 minutos para buscar reservas en PENDING_PAYMENT
 * cuyo paymentExpiresAt haya pasado, y las cancela para liberar el calendario.
 */
export const cronCancelExpiredBookings = functions.pubsub.schedule('every 15 minutes').onRun(async (context) => {
  const now = new Date().toISOString();
  
  const snapshot = await db.collection('bookings')
    .where('status', '==', 'PENDING_PAYMENT')
    .where('paymentExpiresAt', '<', now)
    .get();

  if (snapshot.empty) {
    console.log('No expired bookings found.');
    return null;
  }

  const batch = db.batch();
  
  snapshot.docs.forEach(docSnap => {
    const bookingRef = docSnap.ref;
    const bookingData = docSnap.data();

    // 1. Update Booking Status to CANCELLED
    batch.update(bookingRef, {
      status: 'CANCELLED',
      cancellationReason: 'El tiempo límite para subir el comprobante de pago ha expirado.',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        status: 'CANCELLED',
        timestamp: new Date().toISOString(),
        actorId: 'system',
        actorName: 'Sistema VeneStay',
        note: 'Auto-cancelado por expiración del TTL de pago (Soft-Block Zombie prevention).'
      })
    });

    // 2. Inject system message to notify guest
    const messageRef = db.collection('messages').doc();
    batch.set(messageRef, {
      bookingId: docSnap.id,
      senderId: 'system',
      senderName: 'Sistema VeneStay',
      text: '⚠️ Tu reserva ha sido cancelada porque el tiempo límite (24 horas) para enviar el comprobante de pago ha expirado.',
      type: 'text',
      status: 'sent',
      createdAt: new Date().toISOString()
    });
  });

  await batch.commit();
  console.log(`Cancelled ${snapshot.docs.length} expired bookings.`);
  return null;
});

/**
 * TRIGGER: Message Injection Segura
 * En lugar de que el cliente inyecte mensajes como "SYSTEM", 
 * este trigger escucha los cambios de estado en las reservas 
 * y genera los mensajes automáticos correspondientes, garantizando seguridad.
 */
export const onBookingStateChanged = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const bookingId = context.params.bookingId;

    if (before.status === after.status) {
      return null; // El estado no cambió
    }

    let systemText = '';

    switch (after.status) {
      case 'PENDING_PAYMENT':
        systemText = `📢 SOLICITUD APROBADA POR EL ANFITRIÓN\n\nMensaje:\n"${after.hostResponseNote || ''}"\n\nMétodo de Pago Habilitado:\n${after.paymentInstructions || 'N/A'}\n\nPor favor, ingresa a 'Mis Viajes' para subir tu comprobante de pago de inmediato.`;
        break;
      case 'AWAITING_VERIFICATION':
        systemText = `El huésped ha subido el comprobante de pago (Ref: ${after.paymentReference || 'N/A'}).\nPor favor, verifica la transacción para confirmar la reserva.`;
        break;
      case 'CONFIRMED':
        systemText = `🎉 ¡Reserva Confirmada! El pago ha sido verificado y las fechas están aseguradas.`;
        break;
      case 'REJECTED':
        systemText = `❌ La solicitud ha sido rechazada o cancelada.\nRazón: ${after.rejectionReason || 'No especificada'}`;
        break;
    }

    if (!systemText) return null;

    // Generar el mensaje de sistema
    await db.collection('messages').add({
      bookingId: bookingId,
      senderId: 'system',
      senderName: 'Sistema VeneStay',
      text: systemText,
      type: 'text',
      status: 'sent',
      createdAt: new Date().toISOString()
    });

    return null;
  });

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
      } catch (err) {
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

