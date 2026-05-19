## Spec: Checkout Collapsible Chat Redesign

### Objetivo

Como huésped en el proceso de checkout de VeneStay, quiero que el chat con el anfitrión esté colapsado por defecto y accesible mediante una pestaña lateral flotante con un aviso dorado parpadeante, para que el formulario de pago ocupe todo el tamaño útil de la pantalla (100%) evitando ruidos visuales, y pueda desplegarse a demanda.

### Alcance

- **Incluye:**
  - Rediseñar la columna de pago (`65%` original) para ocupar el **100% de la pantalla** en desktop, con un ancho máximo de contenedor centrado y premium (`max-w-5xl mx-auto`) para una legibilidad excelente.
  - Ocultar la barra lateral fija del chat a la derecha en desktop.
  - Crear una **Pestaña de Activación Flotante** fijada en el lateral derecho de la pantalla (`fixed right-0 top-1/3 z-50`):
    - Diseño elegante y compacto: Fondo azul marino, borde redondeado a la izquierda (`rounded-l-2xl`), ícono de chat (`MessageSquare`) y un indicador luminoso circular **dorado parpadeante** (`bg-brand-500 animate-pulse` con sombra glow).
  - Crear un **Drawer Desplegable (Slide-over Panel)** desde la derecha en desktop para mostrar el chat completo:
    - Ancho optimizado: `w-[400px]` o `w-full max-w-md`.
    - Animado usando `AnimatePresence` y Framer Motion (`motion/react`) para un deslizamiento fluido desde `x: '100%'` a `x: 0`.
    - Encabezado con foto y nombre del anfitrión, estado "Soporte Inmediato", y botón de cerrar (`X`).
  - Sincronizar el estado del chat entre móviles y desktop (el botón móvil existente ahora activa el mismo Drawer premium).

### UI / Maquetado

- **Pestaña Flotante:**
  - Pequeño bloque rectangular en el borde derecho: `fixed right-0 top-1/3 z-40 bg-brand-navy text-white py-4 px-3 rounded-l-2xl cursor-pointer shadow-2xl transition-all duration-300 hover:-translate-x-1 border border-brand-500/20`.
  - Icono `MessageSquare` en color dorado.
  - Círculo de notificación dorado con brillo glow pulsante (`shadow-[0_0_10px_#c5a059]`).
- **Drawer Desplegable (Chat):**
  - Panel lateral de altura completa: `fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-white z-[100] border-l border-gray-100 flex flex-col shadow-2xl`.
  - Animación suave de entrada/salida tipo slide.
  - Fondo semi-transparente oscuro opcional de respaldo (*backdrop overlay*) con desenfoque de fondo (`backdrop-blur-sm bg-brand-navy/20`).

### Logica

- **Entradas:** Clic en la pestaña flotante, clic en el botón de cerrar (`X`), clic en el botón móvil de soporte.
- **Variables de Estado:**
  - `isChatOpen`: Boolean para controlar la visibilidad del chat (Drawer).
- **Flujo:**
  - Al pulsar la pestaña o el botón de soporte, se setea `isChatOpen` en `true`.
  - El Drawer se renderiza en un portal o superposición fluida con `AnimatePresence`.
  - Al hacer clic en el botón de cerrar (`X`) o en el backdrop oscuro, se setea `isChatOpen` en `false`.

### Criterios de aceptacion (checklist)

- [ ] El checkout ocupa el 100% del ancho (centrado en `max-w-5xl`) sin columnas fijas en desktop.
- [ ] La pestaña flotante "Chat con Anfitrión" se renderiza en el lateral derecho de la pantalla con el indicador dorado parpadeando suavemente.
- [ ] Al dar clic en la pestaña flotante, el chat se despliega desde la derecha como un Drawer fluido con un backdrop oscuro.
- [ ] El Drawer cuenta con un botón "X" para cerrarse correctamente.
- [ ] La interacción conserva el 100% de la funcionalidad del chat de Firebase original.
- [ ] En pantallas móviles, el botón sticky inferior abre el mismo chat con su animación.

### Validacion tecnica

- [ ] `npm run lint` pasa.
- [ ] Prueba manual de apertura, cierre e intercambio de mensajes.
