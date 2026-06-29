import { test as setup, expect } from '@playwright/test';
import path from 'path';

const GUEST_FILE = 'tests/.auth/guest.json';
const GUEST_EMAIL = 'rodriguezzcarlose@gmail.com';
const GUEST_PASSWORD = 'Venestay1015';

setup('Autenticar como huésped', async ({ page }) => {
  // 1. Ir a la página principal
  await page.goto('/');

  // 2. Abrir el modal de login
  try {
    await page.getByRole('button', { name: /iniciar sesión|ingresar|entrar/i }).click({ timeout: 4000 });
  } catch {
    await page.getByRole('navigation').getByRole('button').nth(1).click();
    await page.getByText(/iniciar sesión|ingresar/i).click();
  }

  // 3. Introducir credenciales
  await page.getByLabel(/^correo electrónico$/i).fill(GUEST_EMAIL);
  await page.getByLabel(/^contraseña$/i).fill(GUEST_PASSWORD);
  await page.getByRole('dialog').getByRole('button', { name: /^iniciar sesión$/i }).click();

  // 4. Esperar a que el login finalice (modal desaparece)
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15000 });
  
  // Opcional: Esperar a que algún elemento de usuario aparezca para confirmar
  await expect(page.getByRole('button', { name: /menú de usuario/i })).toBeVisible({ timeout: 10000 }).catch(() => {});

  // 5. Guardar estado de la sesión
  await page.context().storageState({ path: GUEST_FILE });
});
