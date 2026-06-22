## Spec: Host Quick Replies (Mensajes Rápidos de Validación)

### Objetivo

Como **Anfitrión**, quiero **tener botones con mensajes predefinidos en la vista de solicitudes de reserva** para **hacer preguntas clave de seguridad y validación al huésped con un solo clic, mitigando la falta de KYC duro y acelerando el proceso de aprobación.**

### Alcance

- **Incluye:** 
  - UI de "Quick Replies" (botones de sugerencia) en el panel de detalles de la solicitud de reserva o dentro del chat.
  - Al menos 3 plantillas predefinidas enfocadas en seguridad y validación de comportamiento (ej. motivo de viaje, confirmación de identidades, lectura de reglas).
  - Al hacer clic, el mensaje se inserta en el input del chat para permitir edición antes de enviar.
- **No incluye:** 
  - Respuestas automáticas gestionadas por IA.
  - Creación o personalización de plantillas por parte del anfitrión en esta fase (solo plantillas hardcodeadas por la plataforma).

### UI / Maquetado

- **Estados visuales esperados:** 
  - **Default:** Botones estilo "píldora" (pill buttons) ubicados de forma sutil encima del input del chat.
  - **Hover/Active:** Cambio de color leve (brand-navy o brand-gold) para indicar interactividad.
- **Responsive esperado:** 
  - **Mobile:** Scroll horizontal (`flex-row overflow-x-auto scrollbar-none`) para no ocupar demasiado espacio vertical al abrir el teclado.
  - **Desktop:** Fila de botones u opciones en grid.
- **Accesibilidad mínima:** 
  - Textos descriptivos (`aria-label` si el botón usa un icono).
  - Foco visible al usar teclado (Tab).

### Lógica

- **Entradas:** 
  - Clic en el botón del mensaje rápido.
  - Nuevo prop en el componente `Chat.tsx`: `isHost?: boolean`.
- **Reglas de negocio:** 
  - **Visibilidad:** Los botones solo deben mostrarse si `isHost === true` y hay pocas interacciones (`messages.length < 5`).
  - **Fuente de Datos:** Las plantillas predefinidas vivirán en un archivo de constantes `src/lib/quick-replies.ts`.
- **Salidas esperadas:** 
  - El texto de la plantilla reemplaza cualquier texto existente en la caja del chat (no se envía automáticamente).
- **Casos borde:** 
  - El anfitrión ya escribió algo en la caja de texto: la acción de Quick Reply **reemplaza** el texto actual para evitar empalmes extraños.

### Criterios de aceptación (checklist)

- [ ] Los botones de "Respuestas Rápidas" son visibles para el anfitrión en el área del chat (solo si `isHost` es true y `messages.length < 5`).
- [ ] Existen al menos 3 plantillas en `src/lib/quick-replies.ts` orientadas a Behavioral Vetting (ej: "¿Motivo de su viaje?", "¿Han leído las reglas?", "¿Quiénes te acompañan?").
- [ ] Al hacer clic en un botón, el texto reemplaza el contenido del input del chat sin enviarse inmediatamente.
- [ ] La UI en móviles usa `overflow-x-auto` para permitir el desplazamiento horizontal suave.

### Validación técnica

- [ ] `npm run lint` pasa sin advertencias.
- [ ] Prueba manual: entrar como anfitrión, visualizar los botones, inyectar el texto, y enviarlo correctamente al huésped.
