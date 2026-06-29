## SPEC ATÓMICA — 27 Jun 2026

**ID:** SPEC-QA-SECURITY-01
**Sprint:** S00
**Prioridad:** P0 (Crítica de Seguridad)

### Contexto
Se requiere cerrar una vulnerabilidad crítica en `firestore.rules` que permite listar datos privados de reservas sin autenticación, y ejecutar un lote estructurado de pruebas manuales (QA) para flujos bloqueados en la automatización a fin de validar la integridad operativa.

### Alcance
- **Capa FSD:** Infra / Seguridad / QA
- **Archivo afectado:** `firestore.rules`, y ejecución QA manual (sin código de app UI)
- **Función / Componente:** Bloque `match /bookings/{bookingId}`
- **Tipo de cambio:** MODIFICAR (firestore.rules) y VALIDAR (QA manual)

### Qué debe hacer
1. **Parche de Seguridad:** Modificar la regla de lectura (`allow list`) en la colección `/bookings` dentro de `firestore.rules`. Solo debe permitir listar reservas donde el usuario que consulta sea estrictamente el huésped (`guestId`) o el anfitrión (`ownerId`), además del Administrador.
2. **Ejecución de QA Manual (por QA/Tester):**
   - **Prueba 1 (Seguridad P0):** Consultar Firebase directamente sin sesión y validar que listar `/bookings` retorna error HTTP 403 (Permiso Denegado).
   - **Prueba 2 (Wizard Propiedad):** Recorrer los 4 pasos del formulario `/publicar-espacio` llenando todos los campos requeridos, subiendo al menos 1 imagen real, y publicando. Validar que la propiedad se guarde.
   - **Prueba 3 (Reserva y Admin):** Hacer una reserva, ver el temporizador en `/checkout/:id`. Luego el Admin (o Anfitrión) debe aprobarla o rechazarla (indicando un motivo), validando que el estado cambie a `CONFIRMED` o `REJECTED` correspondientemente.
   - **Prueba 4 (KYC Loop):** Con cuenta nueva, intentar reservar → Aparece KYCRequiredModal → Subir IDs → El Admin lo aprueba → El huésped puede continuar a Checkout.

### Qué NO debe hacer (límites)
- No crear índices secundarios ni endpoints Cloud Functions nuevos en esta tarea para los calendarios públicos (si el calendario se rompe al bloquear las reservas, eso se gestionará en una spec FSD separada para `listingAvailability`).
- No modificar lógica de componentes React. La corrección se hace exclusivamente en la capa de reglas de Firestore.

### Tipos requeridos
```typescript
// No aplica. Corrección en reglas Firebase.
```

### Schema Zod requerido
```typescript
// No aplica.
```

### Criterios de aceptación (QA Gate los verificará)
- [ ] CA-1: Se modificó la regla `allow list` en `firestore.rules` para exigir `isSignedIn()` y coincidencia del `auth.uid` con `guestId` o `ownerId`.
- [ ] CA-2: `firestore.rules` tiene sintaxis válida y despliega correctamente en emulador o proyecto.
- [ ] CA-3: Intento de lectura anónima sobre `bookings` resulta en error 403.
- [ ] CA-4: Un usuario autenticado solo puede listar SUS reservas, no las del resto.
- [ ] CA-5: Todas las pruebas manuales (Wizard, Pago, Admin y KYC) fueron ejecutadas satisfactoriamente por el tester y sin errores 403.

### Dependencias
- Requiere: Haber detectado la brecha en el REPORTE_AUDITORIA_FASE2_RESULTADOS.md (Completado).
- Bloquea: Cualquier lanzamiento a Producción o QA que contenga el calendario público de alojamientos.
