# Informe Técnico y de Diseño: Evolución del Modal "Mis Viajes"
**VeneStay v2.3.0+ — UX Frictionless & Distribución de Espacio de Alta Frecuencia**
*División de Ingeniería de IA — Antigravity · Mayo 2026*

---

## 1. Diagnóstico de la Experiencia de Usuario Actual

El modal `MyTrips.tsx` actual renderiza todas las reservas en un formato de grilla de dos columnas (`grid-cols-2`). Aunque es funcional, genera importantes puntos de fricción visual y operativa a medida que la actividad del usuario aumenta:

### 1.1 Fricciones Críticas Identificadas:
1. **Sobrecarga de Información:** Las reservas canceladas, rechazadas o históricas compiten directamente en peso visual y espacio con la reserva activa. Esto distrae al usuario de la acción prioritaria (pagar o chatear).
2. **Capacidades Limitadas de Carga:** El modal actualmente solo permite ingresar un número de referencia textual (`paymentRef`), obligando al usuario a navegar a la página de checkout si desea adjuntar la imagen física de su comprobante de pago.
3. **Falta de Trazabilidad y Orden:** Al ordenarse de manera cronológica simple, no existe una distinción clara entre lo que requiere atención inmediata del huésped y lo que ya es parte de su historial.

---

## 2. Propuesta de Evolución: Flujo Focalizado en la Reserva Activa

Proponemos una reestructuración completa del modal utilizando **patrones avanzados de composición React** y directivas estéticas de **diseño premium (Navy & Gold)**:

```
┌───────────────────────────────────────────────────────────┐
│                       MIS VIAJES                          │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  [ Tarjeta Prominente de Reserva Activa ]                 │
│  - Info de Propiedad, Fechas, Huéspedes                   │
│  - Estatus Destacado: PAGO PENDIENTE                      │
│  - Zona de Carga Interactiva (File selector + Clipboard)  │
│  - Input de Referencia + Botón Enviar Comprobante         │
│                                                           │
├───────────────────────────────────────────────────────────┤
│  ▶ Ver Historial de Viajes (3)      [Sección Colapsable]  │
└───────────────────────────────────────────────────────────┘
```

### 💡 Evolución A: Foco en la Reserva Activa (Active-First Layout)
* El modal detectará dinámicamente cuál es la reserva activa más relevante (en estados `PENDING_PAYMENT`, `PENDING_APPROVAL` o `AWAITING_VERIFICATION`).
* Esta reserva ocupará **el 100% del ancho del modal** en una gran tarjeta destacada con tipografía moderna, bordes redondeados pronunciados y sombreado premium.
* Si no hay ninguna activa, se muestra un estado vacío elegante incentivando a explorar estancias.

### 💡 Evolución B: Pasarela de Carga Completa In-Situ (Full In-Modal Uploader)
* Incorporar un componente de carga de comprobantes robusto **dentro del modal**, duplicando y optimizando el comportamiento del CheckoutPage:
  * **Carga de Archivo:** Selector interactivo de imágenes (`image/jpeg`, `image/png`).
  * **Pegado Inteligente (Clipboard Paste):** Permitir pegar capturas de pantalla de la banca móvil directamente en el modal (Ctrl+V) con compresión automática a menos de 800KB para optimizar la carga del Storage.
  * **Referencia Digital:** Input para ingresar la referencia del banco, unificando el comprobante visual y el dato numérico.

### 💡 Evolución C: Historial Inteligente Colapsable (Collapsible History Accordion)
* Las reservas en estados terminales (`CONFIRMED` en el pasado, `CANCELLED`, `REJECTED`) se agruparán en un acordeón retráctil en la parte inferior del modal bajo el título **"Historial de Viajes"**.
* Por defecto estará cerrado. Al expandirse, mostrará tarjetas ultra-compactas en formato lista para no saturar la vista.

---

## 3. Plan de Arquitectura e Implementación FSD-lite

### 3.1 Servicios y Utilidades Compartidos
* **Compresión:** Utilizaremos la librería `browser-image-compression` importada dinámicamente en `MyTrips.tsx` para mantener bajos los tiempos de carga y el bundle-size.
* **Storage e Inserción Firestore:** La carga del archivo se hará bajo la ruta `bookings/{bookingId}/payments/{fileName}` en Firebase Storage. Posteriormente se actualizará la transacción en la subcolección `payments` de Firestore, asegurando consistencia transaccional e indexación.

### 3.2 Estados en `MyTrips.tsx`:
* `file`: Imagen del comprobante seleccionada o pegada (`File | null`).
* `previewUrl`: URL local para previsualización inmediata de la imagen (`string | null`).
* `paymentRef`: Referencia del banco (`string`).
* `isHistoryExpanded`: Estado de visibilidad del acordeón del historial (`boolean`).

---

## 4. Criterios de Aceptación (DoD)

* [ ] **CA-1:** El modal muestra únicamente la reserva activa/actual en la sección superior principal.
* [ ] **CA-2:** Las reservas históricas o canceladas se desplazan al acordeón "Historial de Viajes" y se ocultan por defecto.
* [ ] **CA-3:** Se incluye un selector de archivos de imagen y soporte de Ctrl+V (paste) directo en el modal de viajes.
* [ ] **CA-4:** Las imágenes cargadas se comprimen automáticamente a menos de 800KB antes de subirse a Firebase Storage.
* [ ] **CA-5:** Al hacer clic en "Subir Comprobante", la reserva cambia su estatus a `AWAITING_VERIFICATION` en tiempo real y el modal se actualiza sin recargas.
* [ ] **CA-6:** La validación estática de TypeScript y ESLint pasa limpia.
