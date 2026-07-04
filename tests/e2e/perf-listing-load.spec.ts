import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface PerfResult {
  iteration: number;
  listingUrl: string;
  routingTimeMs: number;
  galleryRenderTimeMs: number;
  interactiveTimeMs: number;
  totalLoadTimeMs: number;
  slowestResources: { name: string; duration: number; type: string }[];
}

test.describe('PERF-01: Auditoría de Tiempo de Carga de Listing desde Home', () => {
  test('Medir tiempo de carga, renderizado y respuesta en transición Home -> Listing', async ({ page }) => {
    const results: PerfResult[] = [];
    const iterations = 3;

    // Capturar recursos lentos desde el navegador
    const captureSlowResources = async () => {
      return await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return resources
          .map(r => ({
            name: r.name.split('/').pop()?.split('?')[0]?.slice(0, 40) || r.name.slice(0, 40),
            duration: Math.round(r.duration),
            type: r.initiatorType || 'other',
          }))
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5);
      });
    };

    for (let i = 1; i <= iterations; i++) {
      console.log(`\n--- [Iteración ${i}/${iterations}] Iniciando medición ---`);
      
      // 1. Cargar Home
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Esperar a que las tarjetas estén visibles
      const cards = page.locator('a[href*="/listing/"], a[href*="listingId="]');
      await expect(cards.first()).toBeVisible({ timeout: 15000 });
      
      // Tomar una tarjeta diferente en cada iteración si es posible (0, 1, 2...)
      const cardIndex = Math.min(i - 1, (await cards.count()) - 1);
      const targetCard = cards.nth(cardIndex);
      const href = await targetCard.getAttribute('href') || '';

      console.log(`Haciendo clic en tarjeta #${cardIndex}: ${href}`);

      // Iniciar cronómetro al iniciar la navegación hacia el listing
      const startTime = Date.now();
      await page.goto(href);

      // Hito 1: Cambio de URL (Routing de React Router / Redirección)
      await page.waitForURL(/\/listing\//, { timeout: 15000 });
      const routingTimeMs = Date.now() - startTime;

      // Hito 2: Renderizado del título e imágenes principales (Galería)
      const galleryOrTitle = page.locator('h1, img[alt="Property"], .grid img').first();
      await expect(galleryOrTitle).toBeVisible({ timeout: 15000 });
      const galleryRenderTimeMs = Date.now() - startTime;

      // Hito 3: TTI (Time to Interactive) - Botón de reserva y panel listos
      const reserveButton = page.locator('#reserve-button-desktop, button:has-text("Reservar"), button:has-text("Asegurar"), button:has-text("Solicitar Reserva")').first();
      await expect(reserveButton).toBeVisible({ timeout: 20000 });
      const interactiveTimeMs = Date.now() - startTime;

      // Esperar estabilidad de red/DOM breve para capturar métricas de recursos
      await page.waitForTimeout(1000);
      const slowestResources = await captureSlowResources();

      const result: PerfResult = {
        iteration: i,
        listingUrl: href,
        routingTimeMs,
        galleryRenderTimeMs,
        interactiveTimeMs,
        totalLoadTimeMs: interactiveTimeMs,
        slowestResources
      };

      console.log(`[Resultado Iteración ${i}]:`, JSON.stringify(result, null, 2));
      results.push(result);
    }

    // Calcular promedios
    const avgRouting = Math.round(results.reduce((acc, r) => acc + r.routingTimeMs, 0) / iterations);
    const avgGallery = Math.round(results.reduce((acc, r) => acc + r.galleryRenderTimeMs, 0) / iterations);
    const avgInteractive = Math.round(results.reduce((acc, r) => acc + r.interactiveTimeMs, 0) / iterations);

    console.log(`\n==================================================`);
    console.log(`REPORTE FINAL DE RENDIMIENTO (PROMEDIO DE ${iterations} ITERACIONES)`);
    console.log(`==================================================`);
    console.log(`- Tiempo de Enrutamiento (React Router): ${avgRouting} ms`);
    console.log(`- Tiempo de Primer Renderizado (Título/Galería): ${avgGallery} ms`);
    console.log(`- Tiempo hasta Interactividad (Panel Reserva): ${avgInteractive} ms`);
    console.log(`==================================================`);

    // Guardar reporte en archivo JSON y Markdown para análisis
    const reportDir = path.resolve('docs/reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(path.join(reportDir, 'perf_listing_load.json'), JSON.stringify({
      timestamp: new Date().toISOString(),
      averages: { avgRouting, avgGallery, avgInteractive },
      iterations: results
    }, null, 2));

    expect(avgInteractive, `El tiempo promedio de interactividad (${avgInteractive}ms) supera el límite aceptable de 5000ms`).toBeLessThan(5000);
  });
});
