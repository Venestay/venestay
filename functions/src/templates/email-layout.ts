// functions/src/templates/email-layout.ts

/**
 * Dominio de producción oficial de VeneStay.
 * Usado como fallback cuando booking.appBaseUrl no está disponible
 * (e.g. triggers de KYC iniciados desde el panel de admin).
 */
export const APP_BASE_URL_PRODUCTION = 'https://venestay.com';

/**
 * Layout / Wrapper común para todos los correos electrónicos de VeneStay.
 * Define la estructura HTML responsiva, tipografía, estilos CSS del sistema de diseño premium,
 * cabecera Navy con logo Oro, pie de página oficial de VeneStay y un contenedor centrado.
 */
export function buildEmailWrapper(title: string, contentHtml: string): string {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: Arial, sans-serif; background-color: #f5f7fa; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8ecef; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
      .header { background-color: #0B1120; color: #ffffff; padding: 32px; text-align: center; }
      .header-logo { color: #C5A059; font-size: 24px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
      .header-sub { color: #94a3b8; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 6px; font-weight: bold; }
      .body { padding: 40px 32px; color: #334155; line-height: 1.6; }
      .title { font-size: 20px; font-weight: 800; color: #0B1120; margin-top: 0; margin-bottom: 8px; }
      .text { font-size: 14px; color: #475569; margin-bottom: 24px; }
      .details-box { background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
      .details-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #C5A059; margin-bottom: 12px; }
      .row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
      .row:last-child { border-bottom: none; }
      .row-label { color: #64748b; font-weight: 600; }
      .row-value { color: #0f172a; font-weight: 700; text-align: right; }
      .button-container { text-align: center; margin: 32px 0 12px 0; }
      .btn-primary { display: inline-block; background-color: #C5A059; color: #0B1120 !important; font-size: 12px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 4px 10px rgba(197, 160, 89, 0.2); }
      .note-box { background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #C5A059; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; color: #78350f; font-style: italic; }
      .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      .alert-box { background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; color: #991b1b; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-logo">VeneStay</div>
        <div class="header-sub">Alquileres Premium · Lechería</div>
      </div>
      <div class="body">
        ${contentHtml}
      </div>
      <div class="footer">
        VeneStay · Lechería, Venezuela · venestay.com<br>
        Este correo es una notificación automática. Por favor no respondas directamente.
      </div>
    </div>
  </body>
  </html>
  `;
}
