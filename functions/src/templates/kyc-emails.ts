// functions/src/templates/kyc-emails.ts
import { buildEmailWrapper, APP_BASE_URL_PRODUCTION } from './email-layout';

export interface KYCUserData {
  displayName?: string;
  email?: string;
  trustScore?: number;
}

/**
 * Email enviado al usuario cuando su Pasaporte VeneStay es aprobado.
 * @param user - Datos del usuario verificado.
 * @param baseUrl - URL base del entorno del frontend (fallback: producción venestay.com).
 *                  Los triggers de KYC son iniciados desde el panel admin, por lo que
 *                  no hay un appBaseUrl en el documento — se usa APP_BASE_URL_PRODUCTION.
 */
export function buildKYCApprovedEmailHTML(user: KYCUserData, baseUrl: string = APP_BASE_URL_PRODUCTION): string {
  const score = user.trustScore || 40;
  const content = `
    <div class="title">¡Tu Pasaporte VeneStay ha sido verificado! 🛡️</div>
    <div class="text">Hola ${user.displayName || 'Usuario'}, nos complace informarte que nuestro equipo de auditoría ha verificado exitosamente tu documento de identidad (Pasaporte/Cédula).</div>

    <div class="details-box">
      <div class="details-title">Actualización del Perfil</div>
      <div class="row">
        <span class="row-label">Estado de Identidad</span>
        <span class="row-value" style="color: #10b981;">VERIFICADO ✓</span>
      </div>
      <div class="row">
        <span class="row-label">Nivel de Confianza (Trust Score)</span>
        <span class="row-value" style="color: #C5A059;">${score}%</span>
      </div>
    </div>

    <div class="text" style="font-weight: 600;">
      Con tu perfil verificado, ahora cumples con los estándares de seguridad necesarios y estás habilitado para realizar reservas en nuestra plataforma de forma directa.
    </div>

    <div class="button-container">
      <a href="${baseUrl}/" class="btn-primary">Comenzar a Explorar</a>
    </div>
  `;

  return buildEmailWrapper('¡Tu Pasaporte VeneStay ha sido verificado!', content);
}

/**
 * Email enviado al usuario cuando su Pasaporte VeneStay es rechazado.
 * @param user - Datos del usuario.
 * @param note - Motivo del rechazo.
 * @param baseUrl - URL base del entorno del frontend (fallback: producción venestay.com).
 */
export function buildKYCRejectedEmailHTML(user: KYCUserData, note: string, baseUrl: string = APP_BASE_URL_PRODUCTION): string {
  const content = `
    <div class="title">Actualización sobre tu verificación de identidad ⚠️</div>
    <div class="text">Hola ${user.displayName || 'Usuario'}, lamentablemente no hemos podido verificar tu documento de identidad debido a que no cumple con nuestros requerimientos de legibilidad o validez.</div>

    <div class="details-title" style="color: #ef4444;">Motivo del Rechazo</div>
    <div class="alert-box">
      "${note}"
    </div>

    <div class="text" style="font-weight: 600; margin-top: 24px;">
      Por favor, inicia sesión en la plataforma e ingresa a "Mi Pasaporte" para volver a subir una foto clara y legible de tu documento (Cédula de Identidad o Pasaporte).
    </div>

    <div class="button-container">
      <a href="${baseUrl}/mi-pasaporte" class="btn-primary" style="background-color: #0B1120; color: #ffffff !important; border: 1px solid #C5A059;">Volver a Subir Documento</a>
    </div>
  `;

  return buildEmailWrapper('Actualización sobre tu verificación de identidad', content);
}
