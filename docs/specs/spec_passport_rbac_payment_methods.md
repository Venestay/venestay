# Spec: passport-rbac-payment-methods (Control de Acceso RBAC en Mi Pasaporte)

**Módulo:** `src/features/auth/components/ProfileSettings.tsx` / `TransactionalEngine.tsx`  
**Nodo Activo:** 2 — Planner (Diseño Atómico)  
**Fecha:** Julio 2026  
**Sprint:** S05 — Admin Tools & Maintenance  
**Estado:** Verificada contra código real (QA Gate ✅ — 3 correcciones aplicadas)

---

## 1. Objetivo

Como Administrador / Arquitecto de VeneStay, quiero restringir la visualización y gestión de los "Métodos de Pago VIP" en Mi Pasaporte (`ProfileSettings`) únicamente a los usuarios que operan con rol de Anfitrión (`host`) o Administrador (`admin`), para evitar que las cuentas con rol Huésped (`user`) vean campos bancarios irrelevantes para su experiencia de reserva.

---

## 2. Alcance

### Incluye
- Condicionar la renderización de la sección del Motor Transaccional / Métodos de Pago VIP en `ProfileSettings.tsx` al rol del usuario:
  ```tsx
  const canManagePaymentMethods = profile?.role === 'host' || profile?.role === 'admin';
  ```
- Ocultar la sección de métodos de cobro y su botón de vinculación para cuentas con rol de huésped (`role === 'user'`).
- Mantener intactas las demás secciones del pasaporte (Identidad, Reputación/Trust Score, Idiomas, Intereses y Canales VIP de notificación) para todos los roles.

### No incluye
- Modificar el modelo de base de datos de Firestore ni eliminar la propiedad `paymentMethods` de los documentos `users/{uid}`.
- Modificar la lógica de fallback o enriquecimiento en `useCheckout.ts` (dado que el Checkout consulta `users/{listing.hostId}`, el cual pertenece a un usuario que ya opera con rol de anfitrión).

---

## 3. Justificación de Negocio (Modelo P2P 20/80)

1. **Cuentas Huésped (`user`):** En el modelo P2P, el huésped es el emisor del pago (paga el 20% inicial de reserva y el 80% en check-in). El huésped no cobra ni recibe dinero de la plataforma ni de otros usuarios, por lo que solicitarle o mostrarle un módulo de cuentas receptoras (Zelle, Binance Pay, Pago Móvil) introduce fricción y confusión innecesaria.
2. **Cuentas Anfitrión (`host` | `admin`):** El anfitrión es el receptor de fondos. Su pasaporte actúa como "Billetero Maestro Verificado", permitiendo que al publicar nuevas propiedades en Lechería o gestionar sus reservas, sus métodos de cobro se enriquezcan y apliquen como fallback en el Checkout.
3. **Transición de Rol (`user` $\rightarrow$ `host`):** Si un usuario registrado originalmente como huésped publica un alojamiento o cambia su rol a anfitrión (`profile.role = 'host'`), automáticamente se habilitará la sección de Métodos de Pago VIP en su Pasaporte.

---

## 4. UI / Maquetado

> **Estructura real de secciones en `ProfileSettings.tsx` (verificada):**
> - `Sección 1` → `TransactionalEngine` (Motor Transaccional + Moneda + Métodos de Pago VIP)
> - `Sección 2` → `SecuritySection` (KYC, teléfono, email)
> - `Sección 3` → `PublicProfile` (nombre, bio)
> - `CTA Submit` → Botón Actualizar Pasaporte
> - `Sección 4` → `TravelerDNA` (Idiomas e Intereses)
> - `Sección 5` → `NotificationChannels` (Canales VIP)

### ⚠️ Decisión de Diseño Requerida (Alcance del Ocultamiento)

`TransactionalEngine` agrupa dos subsecciones distintas:
1. **Selector de Moneda (`USD / VES`):** Útil para AMBOS roles (el huésped quiere ver precios en su divisa).
2. **Métodos de Pago VIP (cuentas Zelle, Binance, etc.):** Exclusivo del anfitrión receptor de fondos.

**Opción A (Recomendada — Granular):** Dejar visible solo el selector de moneda para huéspedes y ocultar únicamente la subsección de métodos de cobro dentro de `TransactionalEngine`. Requiere pasar la prop `showPaymentMethods={isHostOrAdmin}` al componente.

**Opción B (Simple — MVP):** Ocultar `TransactionalEngine` completo para huéspedes. El selector de moneda se integraría en otro lugar si se requiere en el futuro.

- **Estados visuales esperados según rol:**
  - **Rol Huésped (`profile?.role === 'user'` o indefinido):** Si se aplica Opción B, la Sección 1 (Motor Transaccional) no se renderiza. La vista del Pasaporte arranca directamente en `SecuritySection`.
  - **Rol Anfitrión / Admin (`profile?.role === 'host' || profile?.role === 'admin'`):** La vista renderiza normalmente `TransactionalEngine` completo, permitiendo ver y gestionar cuentas vinculadas.
- **Responsive & Accesibilidad:** Mantiene la consistencia de tarjetas (`passport-section`) y espaciado existente.

---

## 5. Lógica e Implementación

### Entradas
- Objeto de perfil activo del usuario: `profile: UserProfile | null` (que incluye la propiedad `role: UserRole`).

### Reglas de negocio en `ProfileSettings.tsx`
Evaluación constante reactiva dentro del componente principal:
```tsx
const isHostOrAdmin = profile?.role === 'host' || profile?.role === 'admin';
```

En la **Sección 1** del JSX (`ProfileSettings.tsx:L274`), el bloque actual es:
```tsx
{/* Sección 1 — Motor Transaccional */}
<div className="passport-section passport-section--d1">
  <TransactionalEngine
    profile={profile}
    currency={currency}
    setCurrency={setCurrency}
    onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
    onRemovePaymentMethod={handleRemovePaymentMethod}
  />
</div>
```

**Cambio para aplicar (Opción B — Ocultamiento total para huéspedes):**
```tsx
{/* Sección 1 — Motor Transaccional (solo Anfitriones y Admins) */}
{isHostOrAdmin && (
  <div className="passport-section passport-section--d1">
    <TransactionalEngine
      profile={profile}
      currency={currency}
      setCurrency={setCurrency}
      onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
      onRemovePaymentMethod={handleRemovePaymentMethod}
    />
  </div>
)}
```

> **Nota:** La constante `isHostOrAdmin` se define al inicio del componente, después de destructurar `usePassportForm`:
> ```tsx
> const isHostOrAdmin = profile?.role === 'host' || profile?.role === 'admin';
> ```

---

## 6. Criterios de Aceptación (DoD Checklist)

- [ ] Un usuario en sesión con rol `user` no ve ni puede interactuar con el contenedor de "Métodos de Pago VIP" en Mi Pasaporte.
- [ ] Un usuario con rol `host` o `admin` puede ver, añadir y eliminar sus métodos de cobro tal como lo hace hoy.
- [ ] Si la cuenta de un usuario cambia su rol de `user` a `host`, la sección transaccional aparece en tiempo real sin requerir recargar la página (`subscribeToProfile` / reactividad de React).
- [ ] Verificación técnica exitosa mediante `npm run lint` sin advertencias ni errores en TypeScript.
- [ ] Verificación visual en el navegador (`npm run dev`) sin regresiones en el formulario ni en la validación de `usePassportForm`.
