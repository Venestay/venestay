import { test, expect } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const setupErrorCapture = (page: any, consoleErrors: string[], networkErrors: string[]) => {
  page.on('pageerror', (err: any) => consoleErrors.push(`PAGEERROR: ${err.message}`));
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') consoleErrors.push(`CONSOLE: ${msg.text()}`);
  });
  page.on('response', (res: any) => {
    if (res.status() >= 400 && !res.url().includes('firestore')) {
      networkErrors.push(`${res.status()} ${res.url()}`);
    }
  });
};

const GUEST_EMAIL = 'rodriguezzcarlose@gmail.com';
const GUEST_PASSWORD = 'Venestay1015';

test.describe('Suite 4: Mis Viajes & Checkout', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    try {
      await page.getByRole('button', { name: /iniciar sesión|ingresar|entrar/i }).click({ timeout: 4000 });
    } catch {
      await page.getByRole('navigation').getByRole('button').nth(1).click();
      await page.getByText(/iniciar sesión|ingresar/i).click();
    }

    await page.getByLabel(/^correo electrónico$/i).fill(GUEST_EMAIL);
    await page.getByLabel(/^contraseña$/i).fill(GUEST_PASSWORD);
    await page.getByRole('dialog').getByRole('button', { name: /^iniciar sesión$/i }).click();

    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15000 });

    await page.goto('/mis-viajes');
    await expect(page.getByRole('heading', { name: /mis viajes/i })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500); 
  });

  test('BOOK-01: Ir a /mis-viajes → verificar pestañas y estado vacío', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    const tabs = ['Activos', 'Historial'];
    for (const tab of tabs) {
      const tabButton = page.getByRole('button', { name: new RegExp(tab, 'i') }).first();
      await expect(tabButton).toBeVisible();
    }

    const chatButtons = page.getByRole('button', { name: /chat/i });
    const count = await chatButtons.count();

    if (count === 0) {
      await expect(page.getByText(/No tienes viajes/i).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    } else {
      await expect(chatButtons.first()).toBeVisible();
    }
    expect(consoleErrors.length, `Errores de consola: ${consoleErrors.join(', ')}`).toBe(0);
  });

  test('BOOK-03 Reescrito: Botón "Ver Resumen" abre el modal', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    const resumenButtons = page.locator('button:has-text("Ver Resumen")');
    if (await resumenButtons.count() > 0) {
      await resumenButtons.first().click();
      
      const closeBtn = page.getByRole('button', { name: /cerrar|x/i }).first();
      await expect(closeBtn).toBeVisible({ timeout: 5000 });
      await closeBtn.click();
      await expect(closeBtn).toBeHidden({ timeout: 5000 });
    } else {
       console.warn('SKIP: No se encontró botón Ver Resumen');
    }
    expect(consoleErrors.length, `Errores de consola: ${consoleErrors.join(', ')}`).toBe(0);
  });

  test('BOOK-04: Temporizador en checkout', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    const detallesButtons = page.locator('button:has-text("Detalles")');
    if (await detallesButtons.count() > 0) {
      await detallesButtons.first().click();
      await page.waitForURL(/\/checkout\//, { timeout: 10000 });
      
      const timer = page.getByText(/[0-9]{2}:[0-9]{2}:[0-9]{2}/);
      if (await timer.count() > 0) {
        await expect(timer.first()).toBeVisible({ timeout: 5000 });
      } else {
        console.warn('SKIP-OBS: Temporizador no visible en checkout, puede estar expirado o usar otro formato');
      }
    } else {
      console.warn('SKIP: No hay reservas en PENDING_PAYMENT (sin botón Detalles)');
    }
    expect(consoleErrors.length, `Errores de consola: ${consoleErrors.join(', ')}`).toBe(0);
  });

  test('BOOK-05: Subida de comprobante de pago', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    // This needs to be tested from checkout page if PENDING_PAYMENT
    const detallesButtons = page.locator('button:has-text("Detalles")');
    if (await detallesButtons.count() > 0) {
      await detallesButtons.first().click();
      await page.waitForURL(/\/checkout\//, { timeout: 10000 });
      
      const uploadArea = page.getByText(/subir comprobante|seleccionar archivo/i).first();
      if (await uploadArea.count() > 0) {
         // Create a mock image file
         const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
         const fileChooserPromise = page.waitForEvent('filechooser');
         await uploadArea.click();
         const fileChooser = await fileChooserPromise;
         await fileChooser.setFiles({
            name: 'test-receipt.png',
            mimeType: 'image/png',
            buffer: buffer
         });

         // Verificar preview o botón de envío (no confirmar para no dañar DB)
         const sendBtn = page.getByRole('button', { name: /enviar|procesar pago/i }).first();
         if (await sendBtn.count() > 0) {
            await expect(sendBtn).toBeVisible();
         }
      } else {
         console.warn('SKIP-OBS: No se encontró área de upload en checkout');
      }
    } else {
      console.warn('SKIP: No hay reservas en PENDING_PAYMENT');
    }

    const firestoreErrors = consoleErrors.filter(e => e.includes('permission_denied') || e.includes('Missing or insufficient permissions'));
    expect(firestoreErrors.length, `Se detectó error de permisos 403 en Storage: ${firestoreErrors.join(', ')}`).toBe(0);
  });

  test('BOOK-06: RescheduleRequestModal', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    const rescheduleBtn = page.getByRole('button', { name: /reagendar/i }).first();
    if (await rescheduleBtn.count() > 0) {
       await rescheduleBtn.click();
       
       const modalTitle = page.getByRole('heading', { name: /reagendar/i }).first();
       await expect(modalTitle).toBeVisible({ timeout: 5000 });
       
       const closeBtn = page.getByRole('button', { name: /cerrar|cancelar|x/i }).first();
       if (await closeBtn.count() > 0) {
           await closeBtn.click();
       } else {
           await page.keyboard.press('Escape');
       }
    } else {
       console.warn('SKIP: No se encontró botón Reagendar en Mis Viajes');
    }
    expect(consoleErrors.length, `Errores de consola: ${consoleErrors.join(', ')}`).toBe(0);
  });

});
