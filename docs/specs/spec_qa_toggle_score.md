## Spec: QA Toggle Trust Score

### Objetivo

Como presentador comercial de VeneStay, quiero que el botón "Generar 100% Score" funcione como un interruptor de doble estado (switch), de modo que al estar activo fuerce el puntaje de confianza al 100% (iluminado en dorado) y al estar apagado lo restablezca a 0% (desactivando las verificaciones), para demostrar interactivamente cómo reacciona la UI a la validación de identidad.

### Alcance

- **Incluye:**
  - Cambiar el botón "Generar 100% Score" a un estado persistente y reactivo basado en el estado actual de las verificaciones de identidad del perfil.
  - Si el usuario ya cuenta con un perfil verificado (Trust Score de 100%), el botón se muestra **iluminado en dorado** (`bg-brand-500 text-brand-navy`). Al pulsarlo, se apaga, restableciendo los campos a `false` o `NOT_STARTED` (fuerza Trust Score a 0%).
  - Si el usuario no está verificado (Trust Score < 100%), el botón se muestra en **estado apagado** (`border-white/20 text-gray-400 bg-brand-500/10`). Al pulsarlo, se enciende e inyecta la verificación completa de QA (fuerza Trust Score a 100%).
- **No incluye:**
  - Cambios persistentes en Firebase Production; es una utilidad de demostración para el demo anfitrión.

### UI / Maquetado

- **Estados visuales del botón:**
  - **Estado Activo (100%):** Borde dorado, fondo dorado (`bg-brand-500`) y texto oscuro (`text-brand-navy`). Ícono `Sparkles` visible y con animación suave.
  - **Estado Apagado:** Borde blanco semi-transparente (`border-white/25`), fondo sutil oscuro (`bg-white/5` o `bg-brand-500/5`), texto gris (`text-gray-400`).
- **Responsive:** Adaptable en móviles dentro de la barra de acciones del header del Pasaporte.

### Logica

- **Entradas:** Clic en el botón "Generar 100% Score / Reset".
- **Reglas de negocio:**
  - Determinar si el perfil actual ya cumple con las verificaciones de QA (p. ej., `isIdentityVerified` es true y `kycStatus` es `'VERIFIED'`).
  - **Acción Enciende (0% -> 100%):** Llama a `updateProfile` con:
    ```typescript
    {
      displayName: 'Anfitrión VeneStay',
      bio: 'Viajero verificado de VeneStay. Apasionado por conocer las hermosas playas de Lechería, explorar la gastronomía local y disfrutar de estancias de lujo de forma segura y confiable.',
      selectedInterests: ['Playa', 'Lujo', 'Aventura'],
      languages: ['Español', 'Inglés'],
      location: 'Lechería, Anzoátegui',
      isEmailVerified: true,
      isPhoneVerified: true,
      isIdentityVerified: true,
      kycStatus: 'VERIFIED',
      notifications: { email: true, whatsapp: true, push: true },
      phoneNumber: '+58 414 1234567',
    }
    ```
  - **Acción Apaga (100% -> 0%):** Llama a `updateProfile` con:
    ```typescript
    {
      isEmailVerified: false,
      isPhoneVerified: false,
      isIdentityVerified: false,
      kycStatus: 'NOT_STARTED',
      notifications: { email: false, whatsapp: false, push: false },
    }
    ```

### Criterios de aceptacion (checklist)

- [ ] El botón se muestra iluminado en color dorado (`bg-brand-500 text-brand-navy`) si el perfil de QA con score 100% está activo.
- [ ] Al pulsar el botón dorado, el estado de verificación se apaga por completo, el Trust Score cae a 0% y el badge cambia a "Sin Verificar".
- [ ] Al pulsar el botón apagado, se enciende la verificación completa de QA, el Trust Score sube animadamente a 100% y el badge cambia a "Verificado".
- [ ] La perilla de la barra de progreso de Trust Score acompaña fielmente la animación de 0% a 100% y viceversa.

### Validacion tecnica

- [ ] `npm run lint` pasa.
- [ ] Prueba manual de alternancia en flujo principal.
