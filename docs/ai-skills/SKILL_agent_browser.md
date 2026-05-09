# 🌐 SKILL: Automatización del Navegador Agéntico (Harness v2.2)

Este Skill otorga la capacidad de realizar pruebas End-to-End (E2E) interactuando con el DOM real de VeneStay. Bajo el flujo v2.2, el navegador no es solo una herramienta de visualización, sino el instrumento principal de la **Quality Gate 2 (Reality Auditor)**.

---

## 1. Validación de Flujos Críticos (E2E)

- **Regla:** Ningún cambio en componentes interactivos (`CheckoutPage.tsx`, `AdminDashboard.tsx`) debe darse por finalizado sin una navegación real exitosa.
- **Protocolo de Credenciales:** El agente **debe** verificar o solicitar las credenciales de prueba (`host`, `guest`, `admin`) antes de iniciar el flujo para evitar loops de autenticación.
- **Acción:** Levantar el servidor, loguearse y ejecutar la secuencia de clics.

## 2. Auditoría de "Reality" (Anti-Fantasía)

- **Regla:** El agente no debe asumir el éxito por la falta de errores en consola.
- **Verificación de Lazy Loading:** Al probar componentes con `React.lazy`, el agente debe confirmar que el `Suspense` (Skeleton Loader) se muestra y que el componente final renderiza correctamente tras la carga del bundle.
- **Verificación del DOM:** Leer el DOM tras cada interacción para confirmar que los datos (ej. montos del 20/80) coinciden con el esquema de Zod esperado.

## 3. Gestión de Recursos y Evidencia

- **Regla (Disk Cleanup):** Tras cada sesión de pruebas intensiva, el agente debe limpiar el directorio de capturas (`.system_generated/click_feedback/`) para evitar bloqueos por falta de espacio en disco.
## 1. Interacción Robusta (Selector-First)
- **Regla de Hierro:** Prohibido el uso de coordenadas de píxeles (`click_browser_pixel`) para botones críticos como "Reservar" o "Pagar". Las resoluciones variables (4K vs 1080p) causan fallos de "Out of Bounds".
- **Protocolo:** Debes usar siempre selectores CSS precisos (`#id`, `.class`). Si un elemento no tiene ID, usa `run_javascript` para buscar el texto del botón y disparar el `.click()` directamente.
- **Evidencia Visual:** Capturar momentos clave (específicamente errores de validación o estados finales) para el reporte del Reality Auditor.

---

## 🛠️ Instrucciones de Ejecución v2.2

1. **Preparación:** Verifica que el servidor `localhost:3000` esté arriba y las credenciales estén listas.
2. **Navegación:** No intentes navegar a rutas protegidas sin sesión; sigue el flujo real de login (Navbar -> AuthModal -> Login).
4. **Cierre:** Si hay un fallo de clic o selector, aborta inmediatamente, consulta el código fuente y corrige el selector antes de reintentar.

## 📍 Catálogo de IDs Agénticos (VeneStay)
Usa estos selectores para una navegación 100% estable:
- `reserve-button-desktop`: Botón principal de reserva en detalle de propiedad.
- `reserve-button-mobile`: Botón de reserva en versión móvil.
- `checkout-stay-trigger`: Abre el calendario en el checkout.
- `checkout-guests-trigger`: Abre el selector de huéspedes en el checkout.
- `reference-input`: Campo para el número de referencia de pago.
- `payment-submit-button-desktop`: Botón final de envío de pago.
- `receipt-upload`: Input (oculto) para subir el comprobante.
- `bypass-maps-btn`: Botón de contingencia para forzar ubicación en Lechería.

## 🏁 Protocolo de Auditoría Financiera (VeneStay)

1. **Evitar Bucle de Fechas:** No intentes seleccionar fechas al azar en el calendario. Busca fechas futuras claras (colores vibrantes, no grises) o usa las fechas predeterminadas si ya están en la URL.
2. **Inspección de Payload:** Antes de finalizar un pago, usa `run_javascript` para interceptar o verificar si el objeto `financials` existe en el estado de React o si se está enviando correctamente en las llamadas a Firebase.
3. **Sidebar Audit:** El sidebar derecho en el Checkout es tu "Verdad Financiera". Verifica que el desglose (Anticipo 20% / Saldo 80%) sea matemáticamente exacto según el Total.
4. **Manejo de Auth:** Si el checkout pide login, usa el flujo de `AuthModal`. No intentes saltar validaciones de seguridad o el sistema te bloqueará.

---
*Última actualización: 07 de Mayo de 2026 (Unificación v2.2)*
