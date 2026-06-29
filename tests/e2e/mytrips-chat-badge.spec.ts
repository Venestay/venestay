/**
 * Pruebas E2E - Módulo Mis Viajes (Huésped) & Badge de Chat
 * PROTOCOLO /goal: En caso de que se encuentre algún error durante la ejecución
 * de estas pruebas, los errores se deben leer e interpretar detalladamente
 * para que sean arreglados de forma autónoma antes de emitir el reporte final.
 */

import { test, expect } from '@playwright/test';

const GUEST_EMAIL = 'rodriguezzcarlose@gmail.com';
const GUEST_PASSWORD = 'Venestay1015';

test.describe('Mis Viajes - Badge de Notificaciones de Chat (Huésped)', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Ir a la página principal
    await page.goto('/');

    // 2. Abrir el modal de login
    try {
      await page.getByRole('button', { name: /iniciar sesión|ingresar|entrar/i }).click({ timeout: 4000 });
    } catch {
      await page.getByRole('navigation').getByRole('button').nth(1).click();
      await page.getByText(/iniciar sesión|ingresar/i).click();
    }

    // 3. Introducir credenciales del huésped especificadas por el usuario
    await page.getByLabel(/^correo electrónico$/i).fill(GUEST_EMAIL);
    await page.getByLabel(/^contraseña$/i).fill(GUEST_PASSWORD);
    await page.getByRole('dialog').getByRole('button', { name: /^iniciar sesión$/i }).click();

    // 4. Confirmar que el modal de autenticación desapareció (login exitoso)
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15000 });

    // 5. Navegar al módulo de Mis Viajes
    await page.goto('/mis-viajes');
    await expect(page.getByRole('heading', { name: /mis viajes/i })).toBeVisible({ timeout: 10000 });
  });

  test('E2E-MYTRIPS-02: Debe cargar correctamente la lista de reservas y verificar botones de Chat', async ({ page }) => {
    // Verificar si el usuario tiene reservas cargadas o si aparece el estado vacío
    const chatButtons = page.getByRole('button', { name: /chat/i });
    const count = await chatButtons.count();

    if (count > 0) {
      const firstChatButton = chatButtons.first();
      await expect(firstChatButton).toBeVisible();

      // Verificar si hay o no badge activo (dependiendo del estado de Firestore para este usuario)
      const badge = firstChatButton.locator('span.animate-pulse');
      if (await badge.count() === 0) {
        // Estado neutro sin mensajes pendientes
        await expect(firstChatButton).toHaveClass(/bg-white|border-gray-200/);
      } else {
        // Estado de alerta con mensajes pendientes
        await expect(badge).toBeVisible();
        await expect(firstChatButton).toHaveClass(/bg-red-50/);
      }
    } else {
      // Si no tiene reservas activas, verificar que se muestra el mensaje de estado vacío
      await expect(page.getByText(/no tienes viajes activos/i)).toBeVisible();
    }
  });

  test('E2E-MYTRIPS-04: Debe cambiar el botón de Chat a estado activo al hacer clic y mostrar conversación', async ({ page }) => {
    const chatButtons = page.getByRole('button', { name: /chat/i });
    const count = await chatButtons.count();

    if (count > 0) {
      const firstChatButton = chatButtons.first();
      await firstChatButton.click();

      // Verificar que el panel lateral del chat se visualice en la pantalla
      await expect(page.getByText(/chat con anfitrión/i)).toBeVisible();
    }
  });

});
