import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import {
  buildConfirmationEmailHTML,
  buildBookingRequestEmailHTML,
  buildPaymentInstructionsEmailHTML,
  buildPaymentSubmittedEmailHTML,
  buildRejectionEmailHTML,
  buildReviewRequestEmailHTML
} from './templates/booking-emails';
import { buildBookingConfirmationPDF } from './templates/booking-pdf';
import { buildChatMessageEmailHTML } from './templates/chat-emails';

import { db, DATABASE_ID } from './config/db';




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
 * CRON JOB: Autocompletado de estadías finalizadas
 * Se ejecuta diariamente a las 06:00 AM (Caracas) para buscar reservas CONFIRMED
 * cuya fecha de fin (endDate) haya pasado, y transiciona su estado a COMPLETED.
 */
export const cronCompleteBookings = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('America/Caracas')
  .onRun(async () => {
    const today = new Date().toISOString().split('T')[0];

    const snapshot = await db.collection('bookings')
      .where('status', '==', 'CONFIRMED')
      .where('endDate', '<', today)
      .get();

    if (snapshot.empty) {
      console.log('No completed bookings to update.');
      return null;
    }

    const batch = db.batch();

    snapshot.docs.forEach(docSnap => {
      batch.update(docSnap.ref, {
        status: 'COMPLETED',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        statusHistory: admin.firestore.FieldValue.arrayUnion({
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          actorId: 'system',
          actorName: 'Sistema VeneStay',
          note: 'Estadía finalizada automáticamente por el sistema.'
        })
      });
    });

    await batch.commit();
    console.log(`${snapshot.docs.length} reservas marcadas como COMPLETED.`);
    return null;
  });

/**
 * TRIGGER v2: Nueva solicitud de reserva
 * Envía un correo electrónico al anfitrión cuando se crea una reserva en PENDING_APPROVAL.
 */
export const onBookingCreated = onDocumentCreated(
  { document: 'bookings/{bookingId}', database: DATABASE_ID },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const booking = snap.data();
    const bookingId = event.params.bookingId;

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
  }
);

/**
 * TRIGGER v2: Message Injection Segura y Alertas de Correo
 * En este trigger escuchamos los cambios de estado en las reservas 
 * y generamos los mensajes automáticos y notificaciones correspondientes.
 */
export const onBookingStateChanged = onDocumentUpdated(
  { document: 'bookings/{bookingId}', database: DATABASE_ID },
  async (event) => {
    if (!event.data) return null;
    const before = event.data.before.data();
    const after = event.data.after.data();
    const bookingId = event.params.bookingId;

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
            // Flag marcado DESPUÉS del mail.add exitoso (fix idempotencia + base de datos)
            await db.collection('bookings').doc(bookingId).update({
              paymentInstructionsEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
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
          // Flag marcado DESPUÉS del mail.add exitoso (fix idempotencia + base de datos)
          await db.collection('bookings').doc(bookingId).update({
            paymentSubmittedEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
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
        try {
          // Obtener datos del huésped
          const guestSnap = await db.collection('users').doc(after.guestId).get();
          const guest = guestSnap.data();

          if (guest && guest.email) {
            // Obtener datos del listing
            const listingSnap = await db.collection('listings').doc(after.listingId).get();
            const listing = listingSnap.data();

            // Generar PDF
            const attachments = [];
            try {
              const pdfBuffer = await buildBookingConfirmationPDF(after, guest, listing || {});
              attachments.push({
                filename: `VeneStay-Reserva-${(bookingId || '').slice(0, 8).toUpperCase()}.pdf`,
                content: pdfBuffer.toString('base64'),
                encoding: 'base64',
                contentType: 'application/pdf',
              });
            } catch (pdfErr) {
              console.error('Error generando PDF de confirmación:', pdfErr);
              // Continuamos sin PDF si falla la generación, para que al menos llegue el correo
            }

            // Escribir en la colección mail
            await db.collection('mail').add({
              to: guest.email,
              message: {
                subject: `Confirmación de tu estadía en ${listing?.title || 'VeneStay'} — VeneStay`,
                html: buildConfirmationEmailHTML(after, guest, listing || {}),
                attachments: attachments.length > 0 ? attachments : undefined,
              },
            });
            // Flag marcado DESPUÉS del mail.add exitoso (fix idempotencia + base de datos)
            await db.collection('bookings').doc(bookingId).update({
              confirmationEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
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
            // Flag marcado DESPUÉS del mail.add exitoso (fix idempotencia + base de datos)
            await db.collection('bookings').doc(bookingId).update({
              rejectionEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Rejection email queued successfully for booking ${bookingId}`);
          }
        } catch (err) {
          console.error('Error queueing rejection email:', err);
        }
      }
    }

    // Transición a COMPLETED: Generar ReviewSession y enviar email de invitación
    if (after.status === 'COMPLETED' && before.status !== 'COMPLETED') {
      if (!after.reviewSessionCreatedAt) {
        try {
          const existingSession = await db.collection('reviewSessions')
            .where('bookingId', '==', bookingId)
            .limit(1)
            .get();

          if (existingSession.empty) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            const sessionRef = await db.collection('reviewSessions').add({
              bookingId,
              guestId: after.guestId,
              propertyId: after.listingId,
              status: 'PENDING',
              ucpVerified: true,
              expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            const guestSnap = await db.collection('users').doc(after.guestId).get();
            const guest = guestSnap.data();
            const listingSnap = await db.collection('listings').doc(after.listingId).get();
            const listing = listingSnap.data();

            if (guest?.email) {
              await db.collection('mail').add({
                to: guest.email,
                message: {
                  subject: `¿Cómo estuvo tu estadía en ${listing?.title || 'VeneStay'}? ⭐`,
                  html: buildReviewRequestEmailHTML(after, guest, listing || {}, sessionRef.id),
                },
              });
            }

            await db.collection('messages').add({
              bookingId,
              senderId: 'system',
              senderName: 'Sistema VeneStay',
              text: '🌟 ¡Esperamos que hayas disfrutado tu estadía! Te hemos enviado un correo y habilitado el formulario para dejar tu reseña.',
              type: 'text',
              status: 'sent',
              createdAt: new Date().toISOString(),
            });

            await db.collection('bookings').doc(bookingId).update({
              reviewSessionCreatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Review session ${sessionRef.id} and email queued for booking ${bookingId}`);
          }
        } catch (err) {
          console.error('Error generating review session for completed booking:', err);
        }
      }
    }

    return null;
  }
);

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

/**
 * TRIGGER v2: Notificación por email al recibir el primer mensaje en el chat.
 * SPEC-CHAT-EMAIL-NOTIFICATION-PRESENCE-001
 *
 * Reglas de envío:
 *  1. Solo mensajes de tipo 'text' (no imágenes, no mensajes del sistema).
 *  2. Solo si es el PRIMER mensaje de texto del remitente en ese hilo (anti-spam).
 *  3. Solo si el destinatario está OFFLINE (onlineAt > 60 segundos antes del momento actual).
 *  4. Marca emailNotified: true en el mensaje para evitar re-envíos.
 */
export const onChatMessageCreated = onDocumentCreated(
  { document: 'messages/{messageId}', database: DATABASE_ID },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const message = snap.data();
    const messageId = event.params.messageId;

    // Regla 1: Solo mensajes de texto de usuarios reales
    if (message.type !== 'text' || message.senderId === 'system') {
      console.log(`[onChatMessageCreated] Skipping non-text or system message: ${messageId}`);
      return;
    }

    if (!message.text || !message.bookingId) {
      console.log(`[onChatMessageCreated] Missing text or bookingId on message: ${messageId}`);
      return;
    }

    const bookingId: string = message.bookingId;
    const senderId: string = message.senderId;

    // Regla 2: Anti-spam — verificar si es el PRIMER mensaje de texto de este remitente en el hilo
    const previousMessagesSnap = await db.collection('messages')
      .where('bookingId', '==', bookingId)
      .where('senderId', '==', senderId)
      .where('type', '==', 'text')
      .get();

    // El mensaje actual ya fue creado, así que si hay más de 1 doc, no es el primero
    if (previousMessagesSnap.size > 1) {
      console.log(`[onChatMessageCreated] Not first message from sender ${senderId} in booking ${bookingId}. Skipping.`);
      return;
    }

    // Obtener datos del booking
    const bookingSnap = await db.collection('bookings').doc(bookingId).get();
    if (!bookingSnap.exists) {
      console.warn(`[onChatMessageCreated] Booking ${bookingId} not found.`);
      return;
    }
    const booking = bookingSnap.data()!;

    // Determinar el destinatario según quién envió
    let recipientId: string;
    if (senderId === booking.guestId) {
      recipientId = booking.ownerId;
    } else if (senderId === booking.ownerId) {
      recipientId = booking.guestId;
    } else {
      console.warn(`[onChatMessageCreated] Sender ${senderId} is neither guest nor owner of booking ${bookingId}.`);
      return;
    }

    // Regla 3: Verificar presencia — si el destinatario está online (<60s), no enviar email
    const recipientSnap = await db.collection('users').doc(recipientId).get();
    if (!recipientSnap.exists) {
      console.warn(`[onChatMessageCreated] Recipient user ${recipientId} not found.`);
      return;
    }
    const recipient = recipientSnap.data()!;

    if (recipient.onlineAt) {
      const onlineAtMs: number = typeof recipient.onlineAt.toMillis === 'function'
        ? recipient.onlineAt.toMillis()
        : new Date(recipient.onlineAt).getTime();
      const nowMs = Date.now();
      const secondsSinceOnline = (nowMs - onlineAtMs) / 1000;

      if (secondsSinceOnline < 60) {
        console.log(`[onChatMessageCreated] Recipient ${recipientId} is online (${secondsSinceOnline.toFixed(1)}s ago). No email sent.`);
        return;
      }
    }

    // Obtener datos del listing para el título
    const listingSnap = await db.collection('listings').doc(booking.listingId).get();
    const listing = listingSnap.data();
    const listingTitle = listing?.title || 'la propiedad';

    const senderSnap = await db.collection('users').doc(senderId).get();
    const senderData = senderSnap.data();
    const senderName: string = senderData?.displayName || message.senderName || 'Alguien';

    const recipientEmail: string = recipient.email;
    const recipientName: string = recipient.displayName || 'Usuario';

    if (!recipientEmail) {
      console.warn(`[onChatMessageCreated] Recipient ${recipientId} has no email. Skipping notification.`);
      return;
    }

    // Enviar email via Firebase Extension (colección 'mail')
    try {
      await db.collection('mail').add({
        to: recipientEmail,
        message: {
          subject: `💬 ${senderName} te ha enviado un mensaje — VeneStay`,
          html: buildChatMessageEmailHTML({
            senderName,
            recipientName,
            messageText: message.text,
            bookingId,
            listingTitle,
            appBaseUrl: booking.appBaseUrl,
          }),
        },
      });

      // Marcar el mensaje como notificado (anti-duplicado)
      await snap.ref.update({ emailNotified: true });

      console.log(`[onChatMessageCreated] Email sent to ${recipientEmail} for booking ${bookingId}. Message: ${messageId}`);
    } catch (err) {
      console.error('[onChatMessageCreated] Error sending chat notification email:', err);
    }
  }
);

