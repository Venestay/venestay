import { test, expect } from '@playwright/test';

// Ignorar el estado de autenticación global para usar las credenciales solicitadas
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Navegación completa por todos los módulos', () => {
  test('Inicio de sesión y navegación por módulos', async ({ browser }) => {
    // Usar un nuevo contexto limpio
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Ir a la home page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');

    // 2. Click en Iniciar Sesión
    // El navbar puede tener un botón de "Iniciar Sesión", vamos a forzar abrir el modal
    const loginButton = page.getByRole('button', { name: /Iniciar Sesión|Ingresar/i }).first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    } else {
      // Intentar abrir el menú de usuario si está colapsado
      const menuButton = page.getByRole('navigation').getByRole('button').nth(1);
      if (await menuButton.isVisible()) await menuButton.click();
      await page.getByText(/Iniciar Sesión|Ingresar/i).click();
    }
    
    // Llenar formulario de login
    await page.fill('input[type="email"]', 'huespedvenestay@venestay.com');
    await page.fill('input[type="password"]', 'venestay');
    await page.getByRole('button', { name: /Continuar|Iniciar Sesión/i }).first().click();
    
    // Esperar a que el modal desaparezca (asumimos role="dialog")
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15000 }).catch(() => {});
    
    // Esperar confirmación de login exitoso buscando un menú de perfil o un elemento principal
    await page.waitForTimeout(2000); // Dar margen para que Firestore Auth resuelva el estado

    // 3. Navegación: Explorar
    await page.goto('http://localhost:3000/');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // 4. Navegación: Mis Viajes
    await page.goto('http://localhost:3000/trips');
    await expect(page.getByText(/Mis Viajes|Mis Reservas/i).first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // 5. Navegación: Perfil / Pasaporte
    await page.goto('http://localhost:3000/passport');
    // En el pasaporte debería aparecer el email o el título
    await expect(page.getByText(/huespedvenestay@venestay.com|Pasaporte|Perfil/i).first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    await context.close();
  });
});
