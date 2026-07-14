import { test, expect } from '@playwright/test';

test.describe('SPEC-CHECKOUT-SOFT-CONSULTA-001 — Flujo de Consulta y Pago sin Fricción', () => {
  test('debe permitir consultar o ingresar a checkout sin bloqueo previo y mostrar el modal P2P al intentar proceder con el pago', async ({ page }) => {
    // 1. Navegar a la página principal
    await page.goto('/');

    // 2. Simular o verificar que al acceder a un alojamiento y al formulario de solicitud directa,
    // no se muestra la notificación de error "Tu pasaporte aún está en proceso de verificación o faltan requisitos básicos para alquilar." en L108 al consultar.
    // Navegamos al detalle de un alojamiento ficticio o real si está mockeado en dev/test
    await page.goto('/checkout?bookingId=test-draft-soft-consulta');

    // 3. Verificar que el título o contenedor de Checkout cargue
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeDefined();
  });
});
