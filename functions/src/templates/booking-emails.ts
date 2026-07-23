// functions/src/templates/booking-emails.ts
import { buildEmailWrapper, APP_BASE_URL_PRODUCTION } from './email-layout';

export interface EmailBooking {
  id?: string;
  totalAmount?: number;
  paymentReference?: string;
  startDate?: string;
  endDate?: string;
  guests?: number;
  guestName?: string;
  guestMessage?: string;
  hostResponseNote?: string;
  paymentInstructions?: string;
  proofUrl?: string;
  rejectionReason?: string;
  /** URL base del frontend de origen. Inyectada por booking-service al crear la reserva. */
  appBaseUrl?: string;
}

export interface EmailGuest {
  displayName?: string;
  email?: string;
}

export interface EmailListing {
  title?: string;
  manualAddress?: string;
  location?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

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

export function buildConfirmationEmailHTML(
  booking: EmailBooking,
  guest: EmailGuest,
  listing: EmailListing
): string {
  const total = booking.totalAmount || 0;
  const deposit = (total * 0.2).toFixed(2);
  const remaining = (total * 0.8).toFixed(2);
  
  const content = `
    <div class="title">¡Tu estadía está confirmada! 🎉</div>
    <div class="subtitle" style="font-size: 14px; color: #666; margin-bottom: 24px;">Hola ${guest.displayName || 'Huésped'}, todo está listo para tu viaje.</div>
 
    <div class="details-box" style="background-color: #ffffff; border: 1px solid #e5e5e5; padding: 16px 20px;">
      <div class="details-title" style="color: #999;">Propiedad</div>
      <div class="row" style="border-bottom: none; padding: 0;"><span><strong>${listing.title || 'Propiedad'}</strong></span></div>
      <div class="row" style="border-bottom: none; padding: 0; margin-top: 4px;"><span>📍 ${listing.manualAddress || listing.location || 'Dirección no especificada'}</span></div>
    </div>
 
    <div class="details-box" style="background-color: #ffffff; border: 1px solid #e5e5e5; padding: 16px 20px;">
      <div class="details-title" style="color: #999;">Fechas</div>
      <div class="row" style="border-bottom: none; padding: 4px 0;">
        <span class="row-label" style="font-weight: normal; color: #333;">Check-in</span>
        <span class="row-value" style="font-weight: normal; color: #333;">${formatDate(booking.startDate || '')} · ${listing.checkInTime || '14:00'}</span>
      </div>
      <div class="row" style="border-bottom: none; padding: 4px 0;">
        <span class="row-label" style="font-weight: normal; color: #333;">Check-out</span>
        <span class="row-value" style="font-weight: normal; color: #333;">${formatDate(booking.endDate || '')} · ${listing.checkOutTime || '11:00'}</span>
      </div>
      <div class="row" style="border-bottom: none; padding: 4px 0;">
        <span class="row-label" style="font-weight: normal; color: #333;">Huéspedes</span>
        <span class="row-value" style="font-weight: normal; color: #333;">${booking.guests || 1} viajero(s)</span>
      </div>
    </div>
 
    <div class="details-box" style="background-color: #ffffff; border: 1px solid #e5e5e5; padding: 16px 20px;">
      <div class="details-title" style="color: #999;">Resumen de pago</div>
      <div class="row" style="border-bottom: none; padding: 4px 0;">
        <span class="row-label" style="font-weight: normal; color: #333;">Garantía pagada (20%)</span>
        <span class="row-value" style="color: #C5A059; font-weight: bold;">✓ $${deposit}</span>
      </div>
      <div class="row" style="border-bottom: none; padding: 4px 0;">
        <span class="row-label" style="font-weight: normal; color: #333;">Saldo al llegar (80%)</span>
        <span class="row-value" style="font-weight: normal; color: #333;">$${remaining}</span>
      </div>
      <div class="row" style="border-bottom: none; padding: 4px 0;">
        <span class="row-label" style="font-weight: normal; color: #333;">Ref. comprobante</span>
        <span class="row-value" style="font-weight: normal; color: #333;">${booking.paymentReference || '—'}</span>
      </div>
    </div>
  `;

  return buildEmailWrapper('¡Tu estadía está confirmada!', content);
}

export function buildBookingRequestEmailHTML(
  booking: EmailBooking,
  host: EmailGuest,
  listing: EmailListing
): string {
  const total = booking.totalAmount || 0;
  const deposit = (total * 0.2).toFixed(2);
  const baseUrl = booking.appBaseUrl || APP_BASE_URL_PRODUCTION;
  
  const content = `
    <div class="title">¡Nueva solicitud de reserva! 📬</div>
    <div class="text">Hola ${host.displayName || 'Anfitrión'}, has recibido una nueva solicitud para tu propiedad. Recuerda que tienes 24 horas para responder antes de que expire automáticamente.</div>
    
    <div class="details-box">
      <div class="details-title">Detalles del Viaje</div>
      <div class="row">
        <span class="row-label">Propiedad</span>
        <span class="row-value">${listing.title || 'Propiedad'}</span>
      </div>
      <div class="row">
        <span class="row-label">Huésped</span>
        <span class="row-value">${booking.guestName || 'Huésped'}</span>
      </div>
      <div class="row">
        <span class="row-label">Fechas</span>
        <span class="row-value">${formatDate(booking.startDate || '')} al ${formatDate(booking.endDate || '')}</span>
      </div>
      <div class="row">
        <span class="row-label">Huéspedes</span>
        <span class="row-value">${booking.guests || 1} viajero(s)</span>
      </div>
      <div class="row">
        <span class="row-label">Pago Total</span>
        <span class="row-value">$${total.toFixed(2)}</span>
      </div>
      <div class="row">
        <span class="row-label">Garantía UCP (20%)</span>
        <span class="row-value" style="color: #C5A059;">$${deposit}</span>
      </div>
    </div>

    ${booking.guestMessage ? `
    <div class="details-title" style="margin-top: 24px; margin-bottom: 8px;">Mensaje del Huésped</div>
    <div class="note-box">
      "${booking.guestMessage}"
    </div>
    ` : ''}

    <div class="button-container">
      <a href="${baseUrl}/dashboard" class="btn-primary">Verificar Solicitud</a>
    </div>
  `;
  
  return buildEmailWrapper('Nueva solicitud de reserva', content);
}

export function buildPaymentInstructionsEmailHTML(
  booking: EmailBooking,
  guest: EmailGuest,
  listing: EmailListing
): string {
  const total = booking.totalAmount || 0;
  const deposit = (total * 0.2).toFixed(2);
  const remaining = (total * 0.8).toFixed(2);
  const baseUrl = booking.appBaseUrl || APP_BASE_URL_PRODUCTION;
  
  const content = `
    <div class="title">¡Tu solicitud ha sido aprobada! 🌟</div>
    <div class="text">Hola ${guest.displayName || 'Huésped'}, el anfitrión ha aprobado tu solicitud de reserva para <strong>${listing.title || 'Propiedad'}</strong>. Para asegurar tu estadía, debes realizar el pago del anticipo de garantía (20%) y subir el comprobante en las próximas 24 horas.</div>

    ${booking.hostResponseNote ? `
    <div class="details-title">Mensaje del Anfitrión</div>
    <div class="note-box">
      "${booking.hostResponseNote}"
    </div>
    ` : ''}

    <div class="details-box">
      <div class="details-title">Resumen Financiero</div>
      <div class="row">
        <span class="row-label">Monto de Garantía a Pagar (20%)</span>
        <span class="row-value" style="color: #C5A059; font-size: 15px;">$${deposit}</span>
      </div>
      <div class="row">
        <span class="row-label">Saldo a pagar en el Check-in (80%)</span>
        <span class="row-value">$${remaining}</span>
      </div>
      <div class="row">
        <span class="row-label">Total de la Estadía</span>
        <span class="row-value">$${total.toFixed(2)}</span>
      </div>
    </div>

    <div class="details-box" style="background-color: #fafaf9; border: 1px solid #f5f5f4;">
      <div class="details-title" style="color: #0B1120;">Instrucciones de Pago</div>
      <div style="font-size: 13px; color: #44403c; white-space: pre-line; line-height: 1.6; font-weight: 500;">
        ${booking.paymentInstructions || 'No se especificaron instrucciones.'}
      </div>
    </div>

    <div class="alert-box">
      <strong>⚠️ Atención:</strong> Tienes un límite de 24 horas a partir del recibo de este correo para subir tu comprobante de pago en la sección "Mis Viajes". De lo contrario, la solicitud expirará automáticamente y el calendario será liberado.
    </div>

    <div class="button-container">
      <a href="${baseUrl}/checkout/${booking.id}" class="btn-primary">Asegurar mi Estadía</a>
    </div>
  `;
  
  return buildEmailWrapper('¡Tu solicitud ha sido aprobada!', content);
}

export function buildPaymentSubmittedEmailHTML(
  booking: EmailBooking,
  host: EmailGuest,
  listing: EmailListing
): string {
  const total = booking.totalAmount || 0;
  const deposit = (total * 0.2).toFixed(2);
  const baseUrl = booking.appBaseUrl || APP_BASE_URL_PRODUCTION;
  
  const content = `
    <div class="title">¡Comprobante de pago recibido! 💳</div>
    <div class="text">Hola ${host.displayName || 'Anfitrión'}, el huésped <strong>${booking.guestName || 'Huésped'}</strong> ha subido el comprobante de pago para asegurar su estadía en <strong>${listing.title || 'Propiedad'}</strong>. Por favor, verifica la transferencia bancaria o pago móvil a la brevedad para confirmar la reserva.</div>

    <div class="details-box">
      <div class="details-title">Detalles del Pago Recibido</div>
      <div class="row">
        <span class="row-label">Reserva Referencia</span>
        <span class="row-value">${booking.id ? booking.id.toUpperCase().slice(0, 8) : '—'}</span>
      </div>
      <div class="row">
        <span class="row-label">Monto de la Garantía (20%)</span>
        <span class="row-value" style="color: #C5A059;">$${deposit}</span>
      </div>
      <div class="row">
        <span class="row-label">Referencia de Pago</span>
        <span class="row-value" style="font-family: monospace; font-size: 14px;">${booking.paymentReference || '—'}</span>
      </div>
      <div class="row">
        <span class="row-label">Fechas del Viaje</span>
        <span class="row-value">${formatDate(booking.startDate || '')} al ${formatDate(booking.endDate || '')}</span>
      </div>
    </div>

    ${booking.proofUrl ? `
    <div class="button-container" style="margin-bottom: 16px;">
      <a href="${booking.proofUrl}" class="btn-primary" style="background-color: #0B1120; color: #ffffff !important; border: 1px solid #C5A059;">Ver Imagen del Comprobante</a>
    </div>
    ` : ''}

    <div class="button-container">
      <a href="${baseUrl}/dashboard" class="btn-primary">Validar Pago en Dashboard</a>
    </div>
  `;
  
  return buildEmailWrapper('¡Comprobante de pago recibido!', content);
}

export function buildRejectionEmailHTML(
  booking: EmailBooking,
  guest: EmailGuest,
  listing: EmailListing
): string {
  const baseUrl = booking.appBaseUrl || APP_BASE_URL_PRODUCTION;

  const content = `
    <div class="title">Actualización sobre tu solicitud de reserva ✉️</div>
    <div class="text">Hola ${guest.displayName || 'Huésped'}, lamentamos informarte que tu solicitud de reserva para <strong>${listing.title || 'Propiedad'}</strong> no ha podido ser procesada o fue declinada por el anfitrión.</div>

    ${booking.rejectionReason ? `
    <div class="details-title" style="color: #ef4444;">Motivo del Rechazo</div>
    <div class="note-box">
      "${booking.rejectionReason}"
    </div>
    ` : ''}

    <div class="details-box">
      <div class="details-title">Datos de la Solicitud Reclamada</div>
      <div class="row">
        <span class="row-label">Propiedad</span>
        <span class="row-value">${listing.title || 'Propiedad'}</span>
      </div>
      <div class="row">
        <span class="row-label">Fechas del Viaje</span>
        <span class="row-value">${formatDate(booking.startDate || '')} al ${formatDate(booking.endDate || '')}</span>
      </div>
    </div>

    <div class="text" style="text-align: center; font-weight: bold; margin-top: 32px;">
      ¡No te preocupes! Tenemos más alojamientos excepcionales disponibles para ti en Lechería.
    </div>

    <div class="button-container">
      <a href="${baseUrl}/" class="btn-primary">Explorar Alojamientos</a>
    </div>
  `;
  
  return buildEmailWrapper('Actualización sobre tu reserva', content);
}

export function buildReviewRequestEmailHTML(
  booking: EmailBooking,
  guest: EmailGuest,
  listing: EmailListing,
  sessionId: string
): string {
  const baseUrl = booking.appBaseUrl || APP_BASE_URL_PRODUCTION;
  const targetListingId = (booking as any).listingId || (booking as any).propertyId || '';
  const reviewUrl = `${baseUrl}/listing/${targetListingId}?review=${sessionId}`;

  const content = `
    <div class="title">¿Cómo estuvo tu estadía? ⭐</div>
    <div class="subtitle" style="font-size: 14px; color: #666; margin-bottom: 24px;">Hola ${guest.displayName || 'Huésped'}, tu estadía en <strong>${listing.title || 'VeneStay'}</strong> ha finalizado. Tu opinión ayuda a otros viajeros.</div>
    
    <div class="details-box" style="background-color: #ffffff; border: 1px solid #e5e5e5; padding: 16px 20px;">
      <div class="details-title" style="color: #999;">Tu estadía</div>
      <div class="row" style="border-bottom: none; padding: 4px 0;">
        <span class="row-label" style="font-weight: normal; color: #333;">Propiedad</span>
        <span class="row-value" style="font-weight: bold; color: #333;">${listing.title || '—'}</span>
      </div>
      <div class="row" style="border-bottom: none; padding: 4px 0;">
        <span class="row-label" style="font-weight: normal; color: #333;">Fechas</span>
        <span class="row-value" style="font-weight: normal; color: #333;">${formatDate(booking.startDate || '')} al ${formatDate(booking.endDate || '')}</span>
      </div>
    </div>
    
    <div class="button-container" style="text-align: center; margin-top: 24px;">
      <a href="${reviewUrl}" class="btn-primary" style="background-color: #C5A059; color: #0b1120; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block;">Evaluar mi Estadía</a>
    </div>
    
    <div class="text" style="font-size: 12px; color: #999; text-align: center; margin-top: 16px;">
      Este enlace es válido por 30 días.
    </div>
  `;
  return buildEmailWrapper('Déjanos tu reseña', content);
}
