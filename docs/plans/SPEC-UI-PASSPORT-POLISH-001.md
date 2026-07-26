# SPEC-UI-PASSPORT-POLISH-001

## Spec Atómica: Remoción de Métodos de Pago & Polish UI en Mi Pasaporte

> **Generada por:** Nodo 2 — Planner (Spec Architect)
> **Fecha:** 2026-07-26
> **Sprint:** S05 — Admin Tools & Maintenance
> **Prioridad:** P1
> **Estado:** ESPERANDO APROBACIÓN DEL USUARIO

---

### Contexto

En el módulo *Mi Pasaporte*, la sección "Motor Transaccional / Métodos de Pago VIP" ya no debe estar presente. Se requiere eliminar completamente esta sección de la vista de Pasaporte (`ProfileSettings.tsx`) y aplicar las mejoras de calidad visual (UI Polish) y corrección de deudas técnicas en el resto del módulo.

---

### Alcance

**Incluye:**

- **Eliminación de Métodos de Pago en Pasaporte**:
  - Remover el renderizado de `<TransactionalEngine />` en `ProfileSettings.tsx`.
  - Limpiar imports y manejadores obsoletos de métodos de pago en `ProfileSettings.tsx` (`isPaymentModalOpen`, `handleRemovePaymentMethod`, `PaymentMethodModal`).
- **Polish UI & Corrección de Badge en Perfil**:
  - **`UserProfileSetup.tsx`**: Condicionalizar el badge `<BadgeCheck /> Anfitrión Verificado` para que solo renderice si el usuario tiene `profileData?.role === 'host'`.
  - **`UserProfileSetup.tsx`**: Reemplazar `group-hover:animate-bounce` en el icono `<Save>` del botón por una micro-interacción sutil: `group-hover:rotate-[-8deg] group-hover:scale-110 transition-transform duration-200`.
  - **`TravelerDNA.tsx`**: Mejorar el subtítulo a: `"Personaliza tus preferencias para que el sistema te muestre el alojamiento ideal."`

**No incluye:**

- Cambios en las reglas de seguridad de Firestore ni en Cloud Functions.
- Cambios en el flujo de Checkout 20/80 ni en `MyTrips.tsx`.

---

### Archivos Afectados

| Archivo | Capa FSD | Tipo de cambio |
| :--- | :--- | :--- |
| `src/features/auth/components/ProfileSettings.tsx` | `features/auth/components` | **MODIFICAR** (Remover `TransactionalEngine` y modal de pago) |
| `src/features/auth/components/UserProfileSetup.tsx` | `features/auth/components` | **MODIFICAR** (Condicionalizar badge Anfitrión + anim Save) |
| `src/features/auth/components/passport/TravelerDNA.tsx` | `features/auth/components/passport` | **MODIFICAR** (Actualizar subtítulo) |

---

### Criterios de Aceptación (QA Gate)

- [ ] **CA-1**: `ProfileSettings.tsx` ya no renderiza la sección "Motor Transaccional" ni el componente `TransactionalEngine`.
- [ ] **CA-2**: El badge "Anfitrión Verificado" en `UserProfileSetup.tsx` solo se muestra cuando `profileData?.role === 'host'`.
- [ ] **CA-3**: El icono `<Save>` en el botón guardar de `UserProfileSetup.tsx` no usa `animate-bounce`; usa animación `rotate-[-8deg] scale-110`.
- [ ] **CA-4**: `TravelerDNA.tsx` muestra el subtítulo actualizado y legible.
- [ ] **CA-5**: `npx tsc --noEmit` pasa con **0 errores de TypeScript**.
- [ ] **CA-6**: `npm run lint` pasa sin errores severos.

---

### Validación Técnica

- `npx tsc --noEmit`
- `npm run lint`
- Verificación manual en `localhost:3000/pasaporte`
