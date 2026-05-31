# Reporte de Diagnóstico y Contexto de Handoff: Error de Permisos en Firestore Commit

**Fecha:** 2026-05-31  
**Sprint:** S04-C — Ciclo de Expiración, Rechazo & Aseguramiento de Calidad (Cierre)  
**Módulo Bloqueado:** Formulario Inline de Reserva (`DirectRequestForm.tsx`)  
**Error P0:** `permission-denied` (FirebaseError) en Commit RPC de creación de reserva.

---

## 1. Estado de la Situación y Acciones Realizadas

Este documento ha sido generado para transferir el contexto completo a cualquier agente entrante que deba continuar la depuración. El estado actual de las tareas es el siguiente:

1. **Corrección Sintáctica de Reglas:** 
   * Se reemplazaron todos los usos de la sintaxis inválida `is number` en `c:\VeneStay\firestore.rules` por validaciones de tipo numérico válidas en Firestore V2: `(is int || is float)` o `is int`.
   * Los campos actualizados fueron `totalAmount`, `guests`, `amounts.total` y `rating`.
2. **Despliegue Exitoso en la Nube:**
   * Las nuevas reglas fueron desplegadas en producción/cloud mediante las herramientas de MCP Firebase (`firebase_deploy` completado con éxito al 100%).
3. **Verificación Estática Local:**
   * Se ejecutó el script de validación local `node scripts/run-validation.cjs --gates G5,G6`. Ambas auditorías estáticas (Firestore y Storage) pasaron con éxito (`PASS`).
4. **Memoria de Agente Configurada:**
   * `docs/ai_harness/MEMORY_HOT.md` ha sido actualizado a estado `FALLO` y el módulo se encuentra formalmente en estado `BLOQUEADO` para activar las salvaguardas del pipeline SDD.

A pesar de estas correcciones estructurales correctas, la aplicación sigue arrojando un error de **`permission-denied`** en la consola del navegador al intentar completar la solicitud de reserva directa ("Request to Book").

---

## 2. Tres Hipótesis Avanzadas de Causa Raíz

Dado que las reglas sintácticas están limpias y desplegadas, el agente entrante debe centrarse exclusivamente en depurar las siguientes incoherencias lógicas o de flujo de datos:

### Hipótesis 1: Inconsistencia de Identidad del Huésped (`guestId` vs `request.auth.uid`)
* **Contexto:** La regla `isValidBooking` en `firestore.rules` exige imperativamente:
  ```javascript
  data.guestId == request.auth.uid
  ```
* **Causa del Fallo:** Si en la sesión del navegador se está probando el flujo con una cuenta que no coincide exactamente con el ID enviado en el payload (`guestId: "4CiU76lL4GT165OQga6ydCLHF0u2"`), Firestore abortará el Commit.
* **Acción para el Agente:** 
  1. Verificar qué UID de usuario está autenticado actualmente en la consola de Firebase Auth durante la prueba.
  2. Depurar el payload generado en `requestBookingDirectly` (en `booking-service.ts`) para asegurar que el `guestId` proviene dinámicamente de `auth.currentUser.uid` y no de un valor mockeado o desactualizado.

### Hipótesis 2: Mismatch en el Tipado de Fechas del Servidor (`serverTimestamp()`)
* **Contexto:** La transacción atómica en `booking-service.ts` envía los campos:
  ```typescript
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ```
* **Causa del Fallo:** Aunque `isValidBooking` en `firestore.rules` no valida explícitamente estos timestamps, la falta de una aserción de tipo para `createdAt` (por ejemplo, `data.createdAt is timestamp`) o una validación de campos permitidos en `isValidBooking` podría estar chocando con otras restricciones de esquemas globales.
* **Acción para el Agente:** Revisar si el motor de reglas en la nube requiere especificar que `createdAt` y `updatedAt` son de tipo `timestamp` o si el envío de un marcador del servidor está interfiriendo con la validación de objetos planos en el motor de reglas.

### Hipótesis 3: Fallo en la Consulta Transaccional de Disponibilidad
* **Contexto:** Antes de escribir la reserva, la transacción ejecuta una lectura para validar que las fechas estén libres:
  ```typescript
  const bookingsQuery = query(
    collection(db, 'bookings'),
    where('listingId', '==', listingId),
    where('status', 'in', ['CONFIRMED', 'AWAITING_VERIFICATION', 'PENDING_APPROVAL', 'PENDING_PAYMENT'])
  );
  const querySnapshot = await getDocs(bookingsQuery);
  ```
* **Causa del Fallo:** Firestore exige que cualquier consulta que se ejecute en el cliente debe estar completamente autorizada por las reglas de seguridad. La regla `allow list` pública para reservas:
  ```javascript
  allow list: if resource.data.status in ['PENDING_PAYMENT', 'AWAITING_VERIFICATION', 'CONFIRMED', 'PENDING_APPROVAL'];
  ```
  Si por alguna razón la query del cliente pide datos que chocan con las reglas de filtrado (o si el usuario logueado no tiene permisos para listar ciertos estados), Firestore abortará de inmediato con un error de permisos antes de llegar a la escritura.
* **Acción para el Agente:** Comprobar si al desactivar temporalmente la lectura de disponibilidad dentro del código (o al simplificar la consulta) el commit se realiza con éxito, lo que aislaría el error a un problema de consulta (List Query Violation).

---

## 3. Instrucciones de Handoff para el Agente Entrante

Para reanudar la depuración de manera eficiente, el agente entrante debe realizar los siguientes pasos de lectura obligatoria:

1. **Cargar Memoria Activa:** Leer `docs/ai_harness/MEMORY_HOT.md` para declarar el contexto.
2. **Revisar Historial de Decisiones:** Leer `docs/plans/planning_report.md` y `docs/ai_harness/handoff_diagnostic_report.md`.
3. **Analizar Entorno Local vs Producción:** Ejecutar el emulador de Firestore local para depurar los mensajes detallados de denegación de reglas (`firebase emulators:start`).
4. **Verificación de Seguridad:** Ejecutar `node scripts/run-validation.cjs --gates G5` después de cualquier propuesta de cambio para asegurar que el validador estático siga en verde.
