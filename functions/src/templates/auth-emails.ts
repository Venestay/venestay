import { buildEmailWrapper } from './email-layout';

export function buildEmailVerificationHTML(displayName: string, actionLink: string): string {
  const content = `
    <h1 class="title">Verifica tu correo electrónico</h1>
    <p class="text">
      Hola ${displayName},<br><br>
      Gracias por registrarte en VeneStay. Para mantener la seguridad de nuestra comunidad y activar tu Pasaporte VeneStay, necesitamos verificar tu dirección de correo electrónico.
    </p>
    <div class="button-container">
      <a href="${actionLink}" class="btn-primary" style="color: #0B1120;">Verificar mi correo</a>
    </div>
    <p class="text" style="margin-top: 24px; font-size: 12px; color: #64748b;">
      Si no creaste una cuenta en VeneStay, puedes ignorar este correo de forma segura.
    </p>
  `;
  return buildEmailWrapper('Verifica tu correo electrónico', content);
}

export function buildPasswordResetHTML(displayName: string, actionLink: string): string {
  const content = `
    <h1 class="title">Restablece tu contraseña</h1>
    <p class="text">
      Hola ${displayName},<br><br>
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en VeneStay. Haz clic en el botón a continuación para crear una nueva contraseña.
    </p>
    <div class="button-container">
      <a href="${actionLink}" class="btn-primary" style="color: #0B1120;">Restablecer contraseña</a>
    </div>
    <p class="text" style="margin-top: 24px; font-size: 12px; color: #64748b;">
      Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña actual seguirá siendo válida.
    </p>
  `;
  return buildEmailWrapper('Restablece tu contraseña', content);
}
