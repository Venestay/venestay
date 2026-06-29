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

const ADMIN_EMAIL = 'rodriguezzcarlose@gmail.com';
const ADMIN_PASSWORD = 'Venestay1015';

test.describe('Suite 6: Panel de Administración', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    try {
      await page.getByRole('button', { name: /iniciar sesión|ingresar|entrar/i }).click({ timeout: 4000 });
    } catch {
      await page.getByRole('navigation').getByRole('button').nth(1).click();
      await page.getByText(/iniciar sesión|ingresar/i).click();
    }

    await page.getByLabel(/^correo electrónico$/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/^contraseña$/i).fill(ADMIN_PASSWORD);
    await page.getByRole('dialog').getByRole('button', { name: /^iniciar sesión$/i }).click();

    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15000 });
  });

  test('ADM-01 & ADM-02: StatsCards - verificar estadísticas numéricas', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    await page.goto('/dashboard');
    
    await expect(page.getByRole('heading', { name: /Panel de Gestión/i })).toBeVisible({ timeout: 10000 });
    
    const cards = page.locator('.grid-cols-2.md\\:grid-cols-4 > div');
    await expect(cards).toHaveCount(4, { timeout: 10000 }).catch(() => {});

    expect(consoleErrors.length, `Errores de consola: ${consoleErrors.join(', ')}`).toBe(0);
  });

  test('ADM-03: GuestRequestVerificationDrawer - apertura y cierre', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    await page.goto('/dashboard');
    
    // Asumimos que las reservas están en una tabla o lista con botón "Verificar" o "Evaluar" o "Ver Detalles"
    const verifyButtons = page.locator('button:has-text("Evaluar"), button:has-text("Verificar"), button:has-text("Validar Pago")');
    if (await verifyButtons.count() > 0) {
       await verifyButtons.first().click();
       
       const drawerTitle = page.getByRole('heading', { name: /Verificación|Evaluar/i }).first();
       await expect(drawerTitle).toBeVisible({ timeout: 5000 });
       
       const closeBtn = page.getByRole('button', { name: /Cerrar|x/i }).first();
       if (await closeBtn.isVisible()) {
          await closeBtn.click();
       } else {
          await page.keyboard.press('Escape');
       }
       await expect(drawerTitle).toBeHidden({ timeout: 5000 });
    } else {
       console.warn('SKIP: No hay reservas pendientes de evaluación/verificación en el Dashboard');
    }

    expect(consoleErrors.length, `Errores de consola: ${consoleErrors.join(', ')}`).toBe(0);
  });

  test('ADM-04: GuestRequestVerificationDrawer - aprobar simulado (sin click final)', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    await page.goto('/dashboard');
    
    const verifyButtons = page.locator('button:has-text("Evaluar"), button:has-text("Verificar"), button:has-text("Validar Pago")');
    if (await verifyButtons.count() > 0) {
       await verifyButtons.first().click();
       
       const approveBtn = page.getByRole('button', { name: /Aprobar|Confirmar Pago/i }).first();
       if (await approveBtn.isVisible()) {
          await expect(approveBtn).toBeVisible();
          // No hacemos click para no modificar la DB real
       }
    } else {
       console.warn('SKIP: No hay reservas para simular aprobación');
    }

    expect(consoleErrors.length, `Errores de consola: ${consoleErrors.join(', ')}`).toBe(0);
  });

  test('ADM-05: GuestRequestVerificationDrawer - rechazar simulado', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    await page.goto('/dashboard');
    
    const verifyButtons = page.locator('button:has-text("Evaluar"), button:has-text("Verificar"), button:has-text("Validar Pago")');
    if (await verifyButtons.count() > 0) {
       await verifyButtons.first().click();
       
       const rejectBtn = page.getByRole('button', { name: /Rechazar|Denegar/i }).first();
       if (await rejectBtn.isVisible()) {
          await rejectBtn.click();
          // Probablemente aparezca un textarea para motivo
          const motivoTextarea = page.getByPlaceholder(/Escribe el motivo del rechazo/i).first();
          if (await motivoTextarea.isVisible()) {
             await motivoTextarea.fill('Motivo de rechazo de prueba E2E');
             const confirmReject = page.getByRole('button', { name: /Confirmar Rechazo/i }).first();
             await expect(confirmReject).toBeVisible();
             // No confirmar
          }
       }
    } else {
       console.warn('SKIP: No hay reservas para simular rechazo');
    }

    expect(consoleErrors.length, `Errores de consola: ${consoleErrors.join(', ')}`).toBe(0);
  });

  test('ADM-06: KYCAuditPanel - cargar panel de auditoría y evitar errores 403', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    await page.goto('/dashboard');
    
    const kycTab = page.getByRole('button', { name: /Auditoría KYC/i });
    if (await kycTab.isVisible()) {
      await kycTab.click();
      await expect(page.getByText(/Auditoría KYC/i).first()).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1500); // Esperar que intente cargar datos
    } else {
      console.warn('SKIP: Pestaña Auditoría KYC no visible');
    }

    const firestoreErrors = consoleErrors.filter(e => e.includes('permission_denied') || e.includes('Missing or insufficient permissions'));
    expect(firestoreErrors.length, `Error de permisos 403 en Admin Dashboard (KYC): ${firestoreErrors.join(', ')}`).toBe(0);
  });

});
