import { test } from '@playwright/test';
test.describe('Diagnóstico E2E: Registro de Cuenta y Errores Posteriores', () => {
  test('DIAG-01: Intento de registro con rodriguezz_carlose@hotmail.com', async ({ page }) => {
    const consoleLogs: string[] = [];
    const networkErrors: string[] = [];
    const networkResponses: string[] = [];

    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('response', async (res) => {
      const url = res.url();
      const status = res.status();
      if (url.includes('identitytoolkit') || url.includes('cloudfunctions') || url.includes('sendCustomVerificationEmail') || status >= 400) {
        let body = '';
        try {
          body = await res.text();
        } catch {
          body = '[no body]';
        }
        networkResponses.push(`URL: ${url} | STATUS: ${status} | BODY: ${body.slice(0, 300)}`);
        if (status >= 400) {
          networkErrors.push(`${status} ${url} - ${body.slice(0, 200)}`);
        }
      }
    });

    await page.goto('/');

    try {
      await page.getByRole('button', { name: /iniciar sesión|ingresar|entrar/i }).click({ timeout: 4000 });
    } catch {
      await page.getByRole('navigation').getByRole('button').nth(1).click();
      await page.getByText(/iniciar sesión|ingresar/i).click();
    }

    // Switch to Register mode by clicking "Regístrate"
    const regBtn = page.getByRole('button', { name: /regístrate/i });
    await regBtn.click();

    // Fill form with exact email and password
    await page.getByLabel(/^nombre completo$/i).fill('Carlos Rodríguez');
    await page.getByLabel(/^correo electrónico$/i).fill('rodriguezz_carlose@hotmail.com');
    await page.getByLabel(/^contraseña$/i).fill('Venestay2026');

    console.log('Submitting register form for rodriguezz_carlose@hotmail.com...');
    await page.getByRole('button', { name: /^crear cuenta$/i }).click();

    // Wait 6 seconds to capture network responses and UI feedback
    await page.waitForTimeout(6000);

    console.log('=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    console.log('=== NETWORK RESPONSES ===');
    networkResponses.forEach(res => console.log(res));

    // Check what error message appears on UI
    const generalError = await page.locator('.bg-red-50, [class*="red"]').textContent().catch(() => null);
    console.log('=== UI GENERAL ERROR ===', generalError);
  });

  test('DIAG-02: Intento de registro con nuevo email único para capturar error de envío de verificación', async ({ page }) => {
    const consoleLogs: string[] = [];
    const networkResponses: string[] = [];

    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('response', async (res) => {
      const url = res.url();
      const status = res.status();
      if (url.includes('identitytoolkit') || url.includes('cloudfunctions') || url.includes('sendCustomVerificationEmail') || status >= 400) {
        let body = '';
        try {
          body = await res.text();
        } catch {
          body = '[no body]';
        }
        networkResponses.push(`URL: ${url} | STATUS: ${status} | BODY: ${body.slice(0, 300)}`);
      }
    });

    await page.goto('/');

    try {
      await page.getByRole('button', { name: /iniciar sesión|ingresar|entrar/i }).click({ timeout: 4000 });
    } catch {
      await page.getByRole('navigation').getByRole('button').nth(1).click();
      await page.getByText(/iniciar sesión|ingresar/i).click();
    }

    const regBtn = page.getByRole('button', { name: /regístrate/i });
    await regBtn.click();

    const uniqueEmail = `rodriguezz_carlose_${Date.now()}@hotmail.com`;
    await page.getByLabel(/^nombre completo$/i).fill('Carlos Rodríguez Test');
    await page.getByLabel(/^correo electrónico$/i).fill(uniqueEmail);
    await page.getByLabel(/^contraseña$/i).fill('Venestay2026');

    console.log(`Submitting register form for unique email ${uniqueEmail}...`);
    await page.getByRole('button', { name: /^crear cuenta$/i }).click();

    await page.waitForTimeout(8000);

    console.log('=== DIAG-02 CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    console.log('=== DIAG-02 NETWORK RESPONSES ===');
    networkResponses.forEach(res => console.log(res));

    const generalError = await page.locator('.bg-red-50, [class*="red"]').textContent().catch(() => null);
    console.log('=== DIAG-02 UI GENERAL ERROR ===', generalError);
  });
});
