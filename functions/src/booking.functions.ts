import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  buildConfirmationEmailHTML,
  buildBookingRequestEmailHTML,
  buildPaymentInstructionsEmailHTML,
  buildPaymentSubmittedEmailHTML,
  buildRejectionEmailHTML
} from './templates/booking-emails';

const db = admin.firestore();



/**
 * CRON JOB: Mitigación del "Soft-Block Zombie"
 * Se ejecuta cada 15 minutos para buscar reservas en PENDING_PAYMENT
 * cuyo paymentExpiresAt haya pasado, y las cancela para liberar el calendario.
 */
export const cronCancelExpiredBookings = functions.pubsub.schedule('every 15 minutes').onRun(async () => {
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
 * TRIGGER: Nueva solicitud de reserva
 * Envía un correo electrónico al anfitrión cuando se crea una reserva en PENDING_APPROVAL.
 */
export const onBookingCreated = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    const bookingId = context.params.bookingId;

    if (booking.status === 'PENDING_APPROVAL') {
      try {
        const hostSnap = await db.collection('users').doc(booking.ownerId).get();
        const host = hostSnap.data();

        if (host && host.email) {
          const listingSnap = await db.collection('listings').doc(booking.listingId).get();
          const listing = listingSnap.data();

          await db.collection('mail').add({
            to: host.email,
            message: {
              subject: `Nueva solicitud de reserva para ${listing?.title || 'tu propiedad'} — VeneStay`,
              html: buildBookingRequestEmailHTML(booking, host, listing || {}),
            },
          });
          console.log(`Booking request email queued successfully for host of booking ${bookingId}`);
        }
      } catch (err) {
        console.error('Error queueing booking request email:', err);
      }
    }
  });

/**
 * TRIGGER: Message Injection Segura y Alertas de Correo
 * En este trigger escuchamos los cambios de estado en las reservas 
 * y generamos los mensajes automáticos y notificaciones correspondientes.
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

    // Inyectar mensaje en Firestore
    if (systemText) {
      await db.collection('messages').add({
        bookingId: bookingId,
        senderId: 'system',
        senderName: 'Sistema VeneStay',
        text: systemText,
        type: 'text',
        status: 'sent',
        createdAt: new Date().toISOString()
      });
    }

    // Correo automático al cambiar a PENDING_PAYMENT
    if (after.status === 'PENDING_PAYMENT' && before.status !== 'PENDING_PAYMENT') {
      if (!after.paymentInstructionsEmailSentAt) {
        await change.after.ref.update({
          paymentInstructionsEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
        });
        try {
          const guestSnap = await db.collection('users').doc(after.guestId).get();
          const guest = guestSnap.data();
          if (guest && guest.email) {
            const listingSnap = await db.collection('listings').doc(after.listingId).get();
            const listing = listingSnap.data();
            await db.collection('mail').add({
              to: guest.email,
              message: {
                subject: `Tu solicitud para ${listing?.title || 'VeneStay'} fue aprobada — Procede al pago`,
                html: buildPaymentInstructionsEmailHTML(after, guest, listing || {}),
              },
            });
            console.log(`Payment instructions email queued successfully for booking ${bookingId}`);
          }
        } catch (err) {
          console.error('Error queueing payment instructions email:', err);
        }
      }
    }

    // Correo automático al cambiar a AWAITING_VERIFICATION (Pago subido)
    if (after.status === 'AWAITING_VERIFICATION' && before.status !== 'AWAITING_VERIFICATION') {
      if (!after.paymentSubmittedEmailSentAt) {
        await change.after.ref.update({
          paymentSubmittedEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
        });
        try {
          let hostEmail = '';
          let hostDisplayName = 'Anfitrión';
          const ownerId = after.ownerId;

          if (ownerId && ownerId.includes('@')) {
            hostEmail = ownerId;
            hostDisplayName = ownerId.split('@')[0];
          } else {
            const hostSnap = await db.collection('users').doc(ownerId).get();
            const host = hostSnap.data();
            if (host && host.email) {
              hostEmail = host.email;
              hostDisplayName = host.displayName || 'Anfitrión';
            }
          }

          if (!hostEmail) {
            console.warn(`Host email not found for ownerId: ${ownerId}. Falling back to default test host email.`);
            hostEmail = 'anfitrionvenestay@venestay.com';
            hostDisplayName = 'Anfitrión VeneStay';
          }

          const listingSnap = await db.collection('listings').doc(after.listingId).get();
          const listing = listingSnap.data();

          await db.collection('mail').add({
            to: hostEmail,
            message: {
              subject: `Pago subido por el huésped para ${listing?.title || 'VeneStay'} — Verificación requerida`,
              html: buildPaymentSubmittedEmailHTML(after, { displayName: hostDisplayName, email: hostEmail }, listing || {}),
            },
          });
          console.log(`Payment submitted email queued successfully for booking ${bookingId}`);
        } catch (err) {
          console.error('Error queueing payment submitted email:', err);
        }
      }
    }

    // Correo automático al confirmar con guard de idempotencia
    if (after.status === 'CONFIRMED' && before.status !== 'CONFIRMED') {
      if (!after.confirmationEmailSentAt) {
        // Marcar como enviado inmediatamente para evitar reentradas
        await change.after.ref.update({
          confirmationEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
        });

        try {
          // Obtener datos del huésped
          const guestSnap = await db.collection('users').doc(after.guestId).get();
          const guest = guestSnap.data();

          if (guest && guest.email) {
            // Obtener datos del listing
            const listingSnap = await db.collection('listings').doc(after.listingId).get();
            const listing = listingSnap.data();

            // Escribir en la colección mail
            await db.collection('mail').add({
              to: guest.email,
              message: {
                subject: `Confirmación de tu estadía en ${listing?.title || 'VeneStay'} — VeneStay`,
                html: buildConfirmationEmailHTML(after, guest, listing || {}),
              },
            });
            console.log(`Confirmation email queued successfully for booking ${bookingId}`);
          }
        } catch (err) {
          console.error('Error queueing confirmation email:', err);
        }
      }
    }

    // Correo automático al cambiar a REJECTED
    if (after.status === 'REJECTED' && before.status !== 'REJECTED') {
      if (!after.rejectionEmailSentAt) {
        await change.after.ref.update({
          rejectionEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
        });
        try {
          const guestSnap = await db.collection('users').doc(after.guestId).get();
          const guest = guestSnap.data();
          if (guest && guest.email) {
            const listingSnap = await db.collection('listings').doc(after.listingId).get();
            const listing = listingSnap.data();
            await db.collection('mail').add({
              to: guest.email,
              message: {
                subject: `Actualización de tu solicitud para ${listing?.title || 'VeneStay'}`,
                html: buildRejectionEmailHTML(after, guest, listing || {}),
              },
            });
            console.log(`Rejection email queued successfully for booking ${bookingId}`);
          }
        } catch (err) {
          console.error('Error queueing rejection email:', err);
        }
      }
    }

    return null;
  });

/**
 * Cloud Function: getProofSignedURL
 * Genera una URL firmada de lectura para el comprobante de pago de una reserva.
 */
export const getProofSignedURL = functions.https.onCall(
  async (data: { bookingId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    }

    if (!data.bookingId) {
      throw new functions.https.HttpsError('invalid-argument', 'El parámetro bookingId es requerido.');
    }

    const bookingSnap = await db.collection('bookings').doc(data.bookingId).get();
    if (!bookingSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Reserva no encontrada.');
    }

    const booking = bookingSnap.data();
    if (!booking) {
      throw new functions.https.HttpsError('internal', 'Datos de la reserva corruptos.');
    }

    // Solo el huésped o el anfitrión pueden obtener la URL
    const isParticipant =
      context.auth.uid === booking.guestId ||
      context.auth.uid === booking.ownerId;

    if (!isParticipant) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permiso para ver esta reserva.');
    }

    if (!booking.proofUrl) {
      throw new functions.https.HttpsError('not-found', 'Esta reserva no tiene un comprobante de pago cargado.');
    }

    try {
      let filePath = booking.proofUrl;
      if (filePath.startsWith('gs://')) {
        const withoutGs = filePath.replace(/gs:\/\/[^/]+\//, '');
        filePath = withoutGs;
      } else if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return { signedUrl: booking.proofUrl };
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
      console.error('Error generating signed URL:', err);
      throw new functions.https.HttpsError('internal', 'Error al generar la URL firmada: ' + errMsg);
    }
  }
);
