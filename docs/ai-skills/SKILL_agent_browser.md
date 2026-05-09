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

## 5. Pruebas Específicas: Dashboard & Ingesta (v2.2)

1. **Transiciones y Rendimiento:** Al probar el Admin Dashboard, verifica que el cambio entre pestañas (Reservas, Propiedades, Perfil) sea fluido (animado por Framer Motion) y sin bloqueos de renderizado (gracias a `useMemo`).
2. **Consistencia Visual:** Asegúrate de que las tarjetas de propiedades y las `StatsCards` mantengan una estética limpia y armónica con el resto de la web (fondo claro, jerarquía clara en botones como "Editar" y "Eliminar").
3. **Validación del Stepper (Listing Form):** Al abrir el formulario de nueva propiedad, valida la navegación secuencial (Paso a Paso). Confirma que la UI previene avances si faltan datos obligatorios y que la subida de imágenes muestra feedback de carga.

## ⚠️ 6. Protocolo Anti-Bucle (Timing y Animaciones)

- **Problema Conocido:** El agente tiende a atraparse en bucles infinitos si toma una captura de pantalla *durante* una transición de Framer Motion (ej. al cambiar de pestaña), asumiendo erróneamente que el clic falló porque la UI antigua aún es visible.
- **Solución Obligatoria:** Tras cada acción que dispare una transición de estado o modal (ej. clics en pestañas, abrir formularios), el agente **debe usar una espera explícita** (`wait` o `sleep` de al menos 2-3 segundos) ANTES de evaluar el resultado visual o tomar capturas. 
- Si una prueba falla dos veces por el mismo selector o estado visual, el agente debe abortar la secuencia en lugar de insistir, y reportar el fallo al usuario.

---

## 🧪 Escenario de Prueba: Conflicto de Reservas (Soft-Block)

Para validar la lógica de la v2.5 sin caer en bucles de fechas:

1. **Fase 1: El Bloqueador Suave (Huésped A)**
   - Login -> Seleccionar Propiedad -> Checkout.
   - Subir comprobante (`receipt-upload`).
   - **Validación:** Confirmar que el estado cambia a `AWAITING_VERIFICATION`.

2. **Fase 2: La Transparencia (Huésped B)**
   - Cambiar de usuario (Logout/Login) -> Misma Propiedad.
   - **Auditoría Visual:** El calendario **debe** mostrar los días seleccionados por A con el estilo `bg-amber-50/80` y el borde punteado.
   - Seleccionar esas mismas fechas -> Ir a Checkout.
   - **Auditoría UX:** El componente **debe** renderizar el banner de "Alta Demanda" (ID sugerido: `soft-block-conflict-warning`).

3. **Fase 3: El Arbitraje (Anfitrión)**
   - Login Anfitrión -> Dashboard -> Reservas.
   - **Auditoría de Datos:** Ambas reservas deben aparecer.
   - **Validación Final:** Verificar la presencia del badge rojo "Solapamiento de Fechas" en ambas tarjetas de reserva.

**⚠️ Nota Anti-Bucle:** No intentes interactuar con el calendario mediante clics de píxeles si hay animaciones activas. Espera a que el `AnimatePresence` termine su ciclo de 500ms.

---
*Última actualización: 09 de Mayo de 2026 (Unificación v2.2 - Fase de Pruebas y Prevención Anti-Bucle)*
