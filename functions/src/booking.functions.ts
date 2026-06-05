import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

interface EmailBooking {
  totalAmount?: number;
  paymentReference?: string;
  startDate?: string;
  endDate?: string;
  guests?: number;
}

interface EmailGuest {
  displayName?: string;
}

interface EmailListing {
  title?: string;
  manualAddress?: string;
  location?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

function buildConfirmationEmailHTML(
  booking: EmailBooking,
  guest: EmailGuest,
  listing: EmailListing
): string {
  const total = booking.totalAmount || 0;
  const deposit = (total * 0.2).toFixed(2);
  const remaining = (total * 0.8).toFixed(2);
  
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5; }
      .header { background: #0B1120; color: #ffffff; padding: 24px 32px; }
      .header-logo { color: #C5A059; font-size: 20px; font-weight: bold; }
      .header-sub { color: rgba(255,255,255,0.6); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }
      .body { padding: 32px; }
      .title { font-size: 22px; font-weight: bold; color: #0B1120; margin-bottom: 4px; }
      .subtitle { font-size: 14px; color: #666; margin-bottom: 24px; }
      .section { border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; }
      .section-label { font-size: 10px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin-bottom: 8px; }
      .row { display: flex; justify-content: space-between; font-size: 14px; color: #333; padding: 4px 0; }
      .amount-highlight { color: #C5A059; font-weight: bold; }
      .footer { background: #f9f9f9; padding: 20px 32px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #e5e5e5; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-logo">VeneStay</div>
        <div class="header-sub">Alquileres Premium · Lechería</div>
      </div>
      <div class="body">
        <div class="title">¡Tu estadía está confirmada! 🎉</div>
        <div class="subtitle">Hola ${guest.displayName || 'Huésped'}, todo está listo para tu viaje.</div>
 
        <div class="section">
          <div class="section-label">Propiedad</div>
          <div class="row"><span><strong>${listing.title || 'Propiedad'}</strong></span></div>
          <div class="row"><span>📍 ${listing.manualAddress || listing.location || 'Dirección no especificada'}</span></div>
        </div>
 
        <div class="section">
          <div class="section-label">Fechas</div>
          <div class="row">
            <span>Check-in</span>
            <span>${formatDate(booking.startDate)} · ${listing.checkInTime || '14:00'}</span>
          </div>
          <div class="row">
            <span>Check-out</span>
            <span>${formatDate(booking.endDate)} · ${listing.checkOutTime || '11:00'}</span>
          </div>
          <div class="row">
            <span>Huéspedes</span>
            <span>${booking.guests || 1} viajero(s)</span>
          </div>
        </div>
 
        <div class="section">
          <div class="section-label">Resumen de pago</div>
          <div class="row">
            <span>Garantía pagada (20%)</span>
            <span class="amount-highlight">✓ $${deposit}</span>
          </div>
          <div class="row">
            <span>Saldo al llegar (80%)</span>
            <span>$${remaining}</span>
          </div>
          <div class="row">
            <span>Ref. comprobante</span>
            <span>${booking.paymentReference || '—'}</span>
          </div>
        </div>
      </div>
      <div class="footer">
        VeneStay · Lechería, Venezuela · venestay.app<br>
        Este correo es una confirmación automática. No respondas a este email.
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * CRON JOB: Mitigación del "Soft-Block Zombie"
 * Se ejecuta cada 15 minutos para buscar reservas en PENDING_PAYMENT
 * cuyo paymentExpiresAt haya pasado, y las cancela para liberar el calendario.
 */
export const cronCancelExpiredBookings = functions.pubsub.schedule('every 15 minutes').onRun(async (_context) => {
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
 * TRIGGER: Message Injection Segura
 * En este trigger escuchamos los cambios de estado en las reservas 
 * y generamos los mensajes automáticos correspondientes.
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
