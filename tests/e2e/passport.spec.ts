import { test, expect } from '@playwright/test';

test.describe('Pasaporte VeneStay', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Ir a la página principal
    await page.goto('/');

    // 2. Abrir el modal de login. 
    // NOTA: Ajusta este selector si el botón en tu NavBar se llama diferente ("Ingresar", icono de usuario, etc.)
    // Basado en el log, hay un botón de usuario en el header. Intentaremos con el texto:
    try {
      await page.getByRole('button', { name: /iniciar sesión|ingresar|entrar/i }).click({ timeout: 5000 });
    } catch (e) {
      // El navbar usa el tag <nav> (rol de navigation), y el botón del menú de usuario
      // no tiene texto, solo iconos (imágenes). Suele ser el segundo botón en la navegación.
      await page.getByRole('navigation').getByRole('button').nth(1).click();
      // Ahora sí hacemos clic en la opción de iniciar sesión en el menú desplegable
      await page.getByText(/iniciar sesión|ingresar/i).click();
    }

    // 3. Llenar credenciales desde variables de entorno
    const testEmail = process.env.E2E_TEST_EMAIL;
    const testPassword = process.env.E2E_TEST_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error('❌ Faltan las variables E2E_TEST_EMAIL o E2E_TEST_PASSWORD en el archivo .env.local');
    }

    await page.getByLabel(/^correo electrónico$/i).fill(testEmail);
    await page.getByLabel(/^contraseña$/i).fill(testPassword);
    
    // 4. Click en Iniciar sesión dentro del modal
    await page.getByRole('dialog').getByRole('button', { name: /^iniciar sesión$/i }).click();

    // 5. Esperar a que el modal desaparezca (indica que el login fue exitoso)
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15000 });
  });

  test('debe mostrar el pasaporte del usuario autenticado', async ({ page }) => {
    // Navegamos al pasaporte
    await page.goto('/mi-pasaporte');

    // Buscamos algo identificativo
    await expect(page.getByRole('heading', { name: /pasaporte/i })).toBeVisible({ timeout: 10000 });

    const scoreElement = page.getByText('Trust Score', { exact: true });
    await expect(scoreElement.first()).toBeVisible();

    // Validar existencia de elementos clave en el pasaporte actual
    const miembroElement = page.getByRole('heading', { name: /miembro/i });
    await expect(miembroElement.first()).toBeVisible();
    
    const publicProfileBtn = page.getByRole('button', { name: /vista pública/i });
    if (await publicProfileBtn.count() > 0) {
        await expect(publicProfileBtn).toBeVisible();
    }

    // 1. Motor Transaccional (Preferencia de Moneda)
    const radioUSD = page.getByRole('radio', { name: /USD/i });
    if (await radioUSD.count() > 0) {
      await expect(radioUSD).toBeVisible();
      await radioUSD.check({ force: true });
    }

    // 2. Perfil Público (Nombre y Biografía)
    const nameInput = page.getByRole('textbox', { name: /Ej. Carlos Zabala/i });
    if (await nameInput.count() > 0) {
      await expect(nameInput).toBeVisible();
      await nameInput.fill('Anfitrión VeneStay (E2E)');
    }

    const bioInput = page.getByRole('textbox', { name: /Cuéntale al mundo/i });
    if (await bioInput.count() > 0) {
      await expect(bioInput).toBeVisible();
      await bioInput.fill('Perfil generado automáticamente por pruebas de Playwright E2E.');
    }

    // 3. ADN de Viajero (Intereses VIP e Idiomas)
    const interesPlaya = page.getByRole('button', { name: /^Playa$/i });
    if (await interesPlaya.count() > 0) {
      await expect(interesPlaya).toBeVisible();
      await interesPlaya.click();
      await interesPlaya.click(); // Toggle again to not mess up profile
    }

    const idiomaIngles = page.getByRole('button', { name: /^Inglés$/i });
    if (await idiomaIngles.count() > 0) {
      await expect(idiomaIngles).toBeVisible();
      await idiomaIngles.click();
      await idiomaIngles.click(); 
    }

    // 4. Canales VIP (Notificaciones)
    const emailSwitch = page.getByRole('switch', { name: /Correo Electrónico/i });
    if (await emailSwitch.count() > 0) {
      await expect(emailSwitch).toBeVisible();
    }

    // 5. Guardar (Actualizar Pasaporte)
    const updateBtn = page.getByRole('button', { name: /Actualizar Pasaporte/i });
    if (await updateBtn.count() > 0) {
      await expect(updateBtn).toBeVisible();
      // Opcional: hacer click si queremos probar el guardado real
      // await updateBtn.click();
    }
  });
});
