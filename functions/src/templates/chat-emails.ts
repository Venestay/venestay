// functions/src/templates/chat-emails.ts
// SPEC-CHAT-EMAIL-NOTIFICATION-PRESENCE-001
import { buildEmailWrapper, APP_BASE_URL_PRODUCTION } from './email-layout';

export interface ChatEmailContext {
  senderName: string;
  messageText: string;
  bookingId: string;
  listingTitle: string;
  recipientName: string;
  /** URL base de la app (para el deep link). Fallback a produccion. */
  appBaseUrl?: string;
}

/**
 * Genera el HTML del email de notificacion de nuevo mensaje en el chat.
 * Solo se envia para el PRIMER mensaje de texto del remitente en el hilo
 * y cuando el destinatario esta offline (onlineAt > 60s).
 */
export function buildChatMessageEmailHTML(ctx: ChatEmailContext): string {
  const base = ctx.appBaseUrl || APP_BASE_URL_PRODUCTION;
  const chatUrl = `${base}/mis-viajes?booking=${ctx.bookingId}&tab=chat`;

  const content = `
    <div class="title">Tienes un nuevo mensaje</div>
    <div class="text">
      Hola <strong>${ctx.recipientName}</strong>, <strong>${ctx.senderName}</strong> te ha enviado un mensaje
      relacionado con tu reserva en <strong>${ctx.listingTitle}</strong>.
    </div>

    <div class="details-box">
      <div class="details-title">Mensaje recibido</div>
      <div style="background: #f8fafc; border-left: 4px solid #C5A059; border-radius: 8px; padding: 14px 16px; font-size: 14px; color: #334155; line-height: 1.6; font-style: italic;">
        &ldquo;${ctx.messageText}&rdquo;
      </div>
      <div style="margin-top: 12px; font-size: 12px; color: #94a3b8;">
        &mdash; ${ctx.senderName}
      </div>
    </div>

    <div class="note-box">
      Recuerda que VeneStay protege tu privacidad. Nunca compartas datos personales fuera de la plataforma.
    </div>

    <div class="button-container">
      <a href="${chatUrl}" class="btn-primary">Responder en VeneStay</a>
    </div>
  `;

  return buildEmailWrapper('Nuevo mensaje &mdash; VeneStay', content);
}
