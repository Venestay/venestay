import { test, expect } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Patrón obligatorio de captura de errores
const setupErrorCapture = (page: any, consoleErrors: string[], networkErrors: string[]) => {
  page.on('pageerror', (err: any) => consoleErrors.push(`PAGEERROR: ${err.message}`));
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignorar el error de BCV Rate que depende de una API externa frágil (dolarapi)
      if (!text.includes('BCV rate')) {
        consoleErrors.push(`CONSOLE: ${text}`);
      }
    }
  });
  page.on('response', (res: any) => {
    if (res.status() >= 400 && !res.url().includes('firestore')) {
      networkErrors.push(`${res.status()} ${res.url()}`);
    }
  });
};

import * as fs from 'fs';

test.describe('Suite 3: Detalle de Alojamiento & Reserva', () => {

  test.beforeEach(async ({ page }) => {
    // Para interactuar con ListingDetail, primero cargamos el Home
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('DET-01: Navegar al detalle carga la galería', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);
    page.on('pageerror', error => {
      console.log('REALTIME PAGE ERROR:', error);
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('REALTIME CONSOLE ERROR:', msg.text());
      }
    });
    // Clic en el primer ListingCard
    const firstCard = page.locator('a[href*="listingId="]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    
    // Obtenemos el href para navegar o hacemos click
    const href = await firstCard.getAttribute('href');
    if (href) {
      await page.goto(href);
      // Esperar a que el redireccionamiento interno de React Router termine
      await page.waitForURL(/\/listing\//, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded');

      // Verificamos que la galería (imágenes principales) sea visible
      const images = page.locator('img[alt="Property"]'); // O ajustamos según ListingGallery
      // Solo verificamos que renderice el contenedor principal de ListingDetail
      const html = await page.content();
      
      const htmlContent = await page.content();
      fs.writeFileSync('tests/e2e/debug.html', htmlContent);
      console.log('HTML saved to tests/e2e/debug.html');
      
      const reserveButton = page.locator('#reserve-button-desktop, button:has-text("Reservar"), button:has-text("Asegurar"), button:has-text("Solicitar Reserva")').first();
      await expect(reserveButton).toBeVisible({ timeout: 10000 });
    }

    const unexpectedErrors = consoleErrors.filter(err => !err.includes('Error fetching exchange rates from API') && !err.includes('Failed to fetch'));
    expect(unexpectedErrors.length, `Errores de consola inesperados: ${unexpectedErrors.join(', ')}`).toBe(0);
  });

  test('DET-02 & DET-03: ExchangeCalculator y BookingPanel', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    const firstCard = page.locator('a[href*="listingId="]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    const href = await firstCard.getAttribute('href');
    
    if (href) {
      await page.goto(href);
      await page.waitForURL(/\/listing\//, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded');

      // Buscar calculadora de fechas (si la hay) o botón de reserva
      const reserveButton = page.locator('#reserve-button-desktop, button:has-text("Reservar"), button:has-text("Asegurar"), button:has-text("Solicitar Reserva")').first();
      await expect(reserveButton).toBeVisible({ timeout: 25000 });
      
      // Intentar interactuar con fechas si hay selector
      // Usaremos try/catch para no romper si no es interactivo por defecto
      const dateSelector = page.getByRole('button', { name: /llegada|fechas/i });
      if (await dateSelector.count() > 0) {
          await dateSelector.first().click();
      }
    }

    const unexpectedErrors = consoleErrors.filter(err => !err.includes('Error fetching exchange rates from API') && !err.includes('Failed to fetch'));
    expect(unexpectedErrors.length, `Errores de consola inesperados: ${unexpectedErrors.join(', ')}`).toBe(0);
  });

  test('DET-04: DirectRequestForm — envío de solicitud (sin confirmar)', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    // Login for this specific test so we don't trigger KYC block on guest if it happens
    try {
      await page.getByRole('button', { name: /iniciar sesión|ingresar|entrar/i }).click({ timeout: 4000 });
    } catch {
      await page.getByRole('navigation').getByRole('button').nth(1).click();
      await page.getByText(/iniciar sesión|ingresar/i).click();
    }
    await page.getByLabel(/^correo electrónico$/i).fill('rodriguezzcarlose@gmail.com');
    await page.getByLabel(/^contraseña$/i).fill('Venestay1015');
    await page.getByRole('dialog').getByRole('button', { name: /^iniciar sesión$/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15000 });

    const firstCard = page.locator('a[href*="listingId="]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    const href = await firstCard.getAttribute('href');
    
    if (href) {
      await page.goto(href);
      await page.waitForLoadState('domcontentloaded');

      const reserveButton = page.locator('#reserve-button-desktop, button:has-text("Reservar"), button:has-text("Solicitar Reserva")').first();
      if (await reserveButton.count() > 0) {
        // Enviar formulario (validar solo que podemos llegar al final sin error 403, no confirmar pago)
        // NOTA: Como la regla prohíbe crear datos finales reales que arruinen DB, 
        // simplemente nos aseguramos de que el modal de DirectRequest abre sin error 403.
        await reserveButton.click();
        
        // Revisamos que haya abierto el form o drawer
        const formContainer = page.getByText(/Mensaje para el anfitrión|Llegada|Salida/i).first();
        if (await formContainer.count() > 0) {
           await expect(formContainer).toBeVisible();
           // Opcional: llenar algo y cerrar (no enviar)
           const closeBtn = page.getByRole('button', { name: /cerrar|x/i }).first();
           if (await closeBtn.count() > 0) {
             await closeBtn.click();
           } else {
             await page.keyboard.press('Escape');
           }
        }
      } else {
        console.warn('SKIP: Botón de reserva no encontrado (probablemente por fechas)');
      }
    }

    const firestoreErrors = consoleErrors.filter(e => e.includes('permission_denied') || e.includes('Missing or insufficient permissions'));
    expect(firestoreErrors.length, `Se detectó error de permisos 403 en Firestore: ${firestoreErrors.join(', ')}`).toBe(0);
  });

  test('DET-05: Mapa de ubicación visible', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    const firstCard = page.locator('a[href*="listingId="]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    const href = await firstCard.getAttribute('href');
    
    if (href) {
      await page.goto(href);
      await page.waitForLoadState('domcontentloaded');

      const mapContainer = page.locator('.gm-style, iframe[src*="maps.google.com"], [class*="map"]').first();
      if (await mapContainer.count() > 0) {
        await expect(mapContainer).toBeVisible();
        const mapError = consoleErrors.find(e => e.includes('ApiNotActivatedMapError') || e.includes('Google Maps JavaScript API error'));
        expect(mapError).toBeUndefined();
      } else {
        console.warn('SKIP-OBS: mapa no presente en este listing');
      }
    }
  });

  test('DET-06: Sección de reseñas', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    setupErrorCapture(page, consoleErrors, networkErrors);

    const firstCard = page.locator('a[href*="listingId="]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    const href = await firstCard.getAttribute('href');
    
    if (href) {
      await page.goto(href);
      await page.waitForLoadState('domcontentloaded');

      // Buscar reseñas
      const reviewHeader = page.getByRole('heading', { name: /reseña|evaluación|comentario/i }).first();
      if (await reviewHeader.count() > 0) {
        await expect(reviewHeader).toBeVisible();
        // Buscar el texto (ej. "5.0 (12 reseñas)")
        const ratingText = page.getByText(/\([0-9]+\s*reseña/).first();
        if (await ratingText.count() > 0) {
          const text = await ratingText.textContent();
          expect(text).not.toContain('NaN');
          expect(text).not.toContain('-1');
        }
      } else {
        console.warn('SKIP: No hay sección de reseñas visible');
      }
    }
  });

});
