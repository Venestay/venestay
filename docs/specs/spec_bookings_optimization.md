## Spec: Optimización del Módulo de Reservas (bookings/)

### Objetivo

Como huésped de VeneStay, quiero que las páginas y modales del flujo de reservas (`CheckoutPage`, `BookingSummaryModal` y `RescheduleRequestModal`) estén optimizados a nivel de rendimiento, modularidad de código y accesibilidad, para que mi experiencia sea fluida, segura, sin fugas de memoria y totalmente compatible con lectores de pantalla (cumpliendo con WCAG 2.2 AA).

---

### Alcance

- **Incluye:**
  - **Creación de `useCheckout.ts`:** Custom hook para extraer toda la lógica de negocio, suscripciones de Firestore (`onSnapshot`), subida y compresión de comprobantes de pago, comprobación de KYC/Pasaporte y cálculos financieros de `CheckoutPage.tsx`.
  - **Refactorización de `CheckoutPage.tsx`:** Reducir la complejidad visual del componente monolítico, delegando su estado y efectos al hook custom y manteniendo la fidelidad visual al 100%.
  - **Creación de `useBookingSummary.ts`:** Custom hook para gestionar la carga de los detalles de la propiedad, la llamada a Cloud Functions (`getProofSignedURL`) y la lógica de impresión en PDF en `BookingSummaryModal.tsx`.
  - **Refactorización de `BookingSummaryModal.tsx`:** Separar la lógica en el hook, aplicar `useFocusTrap` y mejorar roles y atributos ARIA.
  - **Mejora en `RescheduleRequestModal.tsx`:** Integrar `useFocusTrap` para asegurar que el foco del teclado se mantenga dentro del modal durante su uso.
  - **Verificación de Limpieza de Listeners:** Garantizar que todos los listeners (`onSnapshot`) realicen su limpieza (`return () => unsubscribe()`) para evitar fugas de memoria.

- **No incluye:**
  - Cambios de diseño estético o alteración de la paleta corporativa (Navy/Gold/White).
  - Cambios en las reglas de seguridad de Firestore/Storage (solo se optimiza el consumo cliente).

---

### UI / Maquetado

- **Compatibilidad WCAG 2.2 AA:**
  - Todos los modales (`BookingSummaryModal` y `RescheduleRequestModal`) deben implementar `useFocusTrap` y responder a la tecla `Escape` para cerrar.
  - Asignar atributos `role="dialog"` y `aria-modal="true"`.
  - Proporcionar etiquetas descriptivas claras como `aria-label="Cerrar modal"`.
  - El estado del botón de carga de comprobantes debe reflejar visualmente si está deshabilitado o cargando mediante spinners de estado y textos accesibles.

---

### Lógica y Flujo

1. **useCheckout Hook:**
   - **Entradas:** `bookingId` (de URL), `locationState`, `searchParams` y `user` context.
   - **Procesos:**
     - Suscripción en tiempo real a la reserva con `onSnapshot` si `bookingId` está presente. Retornar cleanup.
     - Obtención manual de datos del listing y del anfitrión (incluyendo tier de comisión y métodos de pago).
     - Validación del Pasaporte de confianza (`trustScore`) y estado de KYC del huésped.
     - Cálculo de tarifas con envolturas en `useMemo` para evitar recálculos excesivos.
     - Subida de comprobante comprimido a Storage.
     - Creación de registro de pago compatible con UCP y actualización de estado de la reserva.
   - **Salidas:** Estados (`booking`, `listing`, `loading`, `error`, `file`, `reference`, `rates`, `selectedMethod`, etc.) y callbacks (`handleSubmitPayment`, `handleDateChange`, `handleGuestsChange`, `processAndSetFile`, etc.).

2. **useBookingSummary Hook:**
   - **Entradas:** `booking` objeto e `isOpen` booleano.
   - **Procesos:**
     - Obtención asíncrona de los detalles de la propiedad (`listings` collection).
     - Llamada segura mediante `httpsCallable` a la Cloud Function `getProofSignedURL` para obtener el enlace temporal firmado del comprobante de pago.
   - **Salidas:** `listing`, `loading`, `error`, `proofSignedUrl`, `proofLoading`.

3. **useFocusTrap:**
   - Enlace correcto a las referencias de los contenedores de los modales para atrapar el tabulador.

---

### Criterios de aceptación (checklist)

#### SPEC-BOOKINGS-USE-CHECKOUT-HOOK
- [ ] La lógica y los efectos secundarios se trasladan a `src/features/bookings/hooks/useCheckout.ts`.
- [ ] La suscripción de Firestore (`onSnapshot`) tiene una limpieza explícita en el desmontaje (`return () => unsubscribe()`).
- [ ] Los cálculos financieros del checkout (BCV, desglose de depósito 20% y saldo 80%) se memorizan de forma limpia.
- [ ] El hook maneja con éxito las transiciones de KYC y Pasaporte, y delega a `localStorage` las copias de seguridad del borrador en caso de redirección.

#### SPEC-BOOKINGS-CHECKOUT-PAGE-REFACTOR
- [ ] `CheckoutPage.tsx` consume el hook `useCheckout` para toda su lógica.
- [ ] El archivo de la página se reduce de peso y complejidad visual (menos de 1000 líneas).
- [ ] No existen regresiones en el flujo de checkout, previsualización de imágenes ni subida de comprobantes.

#### SPEC-BOOKINGS-USE-BOOKING-SUMMARY-HOOK
- [ ] La lógica de llamadas a Firestore y Firebase Functions de `BookingSummaryModal.tsx` se abstrae en `src/features/bookings/hooks/useBookingSummary.ts`.
- [ ] El hook provee correctamente la url firmada del comprobante mediante la Cloud Function `getProofSignedURL`.

#### SPEC-BOOKINGS-SUMMARY-MODAL-REFACTOR
- [ ] El modal consume el hook `useBookingSummary`.
- [ ] Implementa `useFocusTrap` correctamente al estar abierto.
- [ ] Cuenta con los roles e identificadores semánticos ARIA correspondientes.

#### SPEC-BOOKINGS-FOCUS-TRAP-RESCHEDULE
- [ ] `RescheduleRequestModal.tsx` importa y utiliza el hook `useFocusTrap`.
- [ ] El foco se bloquea al abrir y se restaura al elemento anterior al cerrar el modal.

---

### Validación técnica

- [ ] `tsc --noEmit` ejecuta con código de salida 0.
- [ ] `npm run lint` pasa sin errores en los archivos editados.
- [ ] Verificación manual del flujo completo: creación de borrador, subida de comprobante, y visualización de resumen en móvil y desktop.
