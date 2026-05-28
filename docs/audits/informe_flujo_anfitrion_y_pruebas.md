# Informe de Flujo del Anfitrión y Plan de Pruebas de Chat (`bookingMode === 'request'`)

Este documento detalla la recepción de solicitudes e interacción del lado del anfitrión en el proyecto **VeneStay**, describiendo los módulos involucrados y el plan paso a paso para realizar pruebas integrales de conversación en el sistema local.

---

## 1. Módulos y Flujo del Anfitrión

La gestión de las solicitudes de reserva por parte del anfitrión se centraliza en el **Panel de Administración (Dashboard)**.

### A. Módulo del Dashboard
* **Archivo principal:** `src/features/dashboard/components/AdminDashboard.tsx`
  * Escucha reactivamente los cambios en la colección de Firestore `bookings` filtrando según los permisos (muestra todas si es Administrador o únicamente las pertenecientes al anfitrión/propietario de la propiedad).

### B. Lista de Reservas (`BookingList`)
* **Archivo de interfaz:** `src/features/dashboard/components/BookingList.tsx`
  * Cuando una reserva está en estado `PENDING_APPROVAL` (producido por el Checkout asíncrono), el anfitrión visualiza dos elementos clave en su tarjeta:

1. **Mensaje de Presentación del Huésped:**
   Se renderiza dinámicamente una sección de color ámbar con el mensaje de presentación que el huésped ingresó en el checkout:
   ```tsx
   {booking.guestMessage && (
     <div className="relative mt-2 rounded-2xl bg-amber-50/40 border border-amber-100 p-3 text-xs text-brand-navy">
       <p className="font-semibold text-[9px] uppercase tracking-wider text-amber-700 mb-1">
         Presentación del huésped:
       </p>
       <p className="italic text-gray-600 font-medium">
         "{booking.guestMessage}"
       </p>
     </div>
   )}
   ```

2. **Panel Quirúrgico de Aprobación/Rechazo:**
   Se habilitan botones de acción directa en la tarjeta de reserva para **Aprobar Solicitud** o **Rechazar**:
   ```tsx
   {booking.status === 'PENDING_APPROVAL' && (
     <div className="flex flex-col gap-3">
       <div className="flex gap-3">
         <button
           onClick={() => {
             const nextStatus = (booking.proofUrl || booking.paymentReference) ? 'AWAITING_VERIFICATION' : 'CONFIRMED';
             handleUpdateStatus(booking, nextStatus, 'Solicitud de reserva aprobada por el anfitrión.');
           }}
           className="flex-grow transform rounded-2xl bg-emerald-500 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-95"
         >
           Aprobar Solicitud
         </button>
         <button onClick={() => setBookingToReject(booking)} ...>
           Rechazar
         </button>
       </div>
     </div>
   )}
   ```

---

## 2. Sistema de Chat Integrado (`FloatingChat`)

El Dashboard del anfitrión integra mensajería en tiempo real usando Firestore:
* Al presionar el botón de **Mensajería** (`MessageSquare`) al lado de la reserva, se activa el estado `activeChatId` y `activeChatBooking`.
* Esto despliega el componente flotante `<FloatingChat />` configurado con los datos de la reserva:
  ```tsx
  {activeChatId && activeChatBooking && (
    <FloatingChat
      isOpen={true}
      bookingId={activeChatId}
      listingTitle={activeChatBooking.listingTitle}
      senderId={user?.uid || 'admin'}
      senderName={user?.displayName || 'Admin'}
      recipientName={activeChatBooking.guestName || 'Huésped'}
      onClose={() => {
        setActiveChatId(null);
        setActiveChatBooking(null);
      }}
    />
  )}
  ```

---

## 3. Plan Paso a Paso para Pruebas de Conversación (E2E)

Para realizar una demostración o validación manual del flujo completo de mensajes y aprobación en el entorno de desarrollo:

### Paso 1: Preparación del Entorno
1. Abre dos navegadores diferentes (ej. Google Chrome y Mozilla Firefox, o una pestaña estándar y una ventana de incógnito) para manejar dos sesiones de Firebase independientes sin interferencias de cookies.

### Paso 2: Cuentas de Prueba
* **Navegador A (Huésped):** Inicia sesión con una cuenta de usuario final.
* **Navegador B (Anfitrión / Propietario):** Inicia sesión con la cuenta dueña de la propiedad que vas a probar.

### Paso 3: Configurar Propiedad de Prueba
1. Asegúrate de tener una propiedad publicada con el campo `bookingMode` configurado como `"request"`.
2. Asigna el `hostId` de esta propiedad al UID de la cuenta activa en el **Navegador B** (Anfitrión).

### Paso 4: Creación de la Solicitud (Huésped - Navegador A)
1. Busca la propiedad en el mapa o lista e inicia el proceso de reserva seleccionando fechas disponibles.
2. Haz clic en **"Solicitar Reserva"**.
3. En el checkout, redacta un mensaje descriptivo en el cuadro de texto y confirma el envío.

### Paso 5: Gestión y Conversación (Anfitrión - Navegador B)
1. Accede al panel de administración `/admin` o `/dashboard`.
2. En la pestaña de **Reservas**, ubica la solicitud entrante (marcada como *"Solicitud Pendiente"*).
3. Confirma la visualización exacta del mensaje de presentación redactado por el huésped.
4. Presiona el botón de chat en la tarjeta de reserva para abrir la ventana emergente de chat.
5. Envía un mensaje de prueba al huésped.
6. Cambia al **Navegador A** (Huésped), abre la sección de mensajes/reserva y responde la conversación en tiempo real.
