# Informe de Impacto y Viabilidad: Implementación de Soft KYC (CNE)
**Rev. 2 — Auditoría técnica y de riesgo**

Este documento analiza el alcance, la dificultad técnica y el impacto en el proyecto de implementar el **KYC Suave (Soft KYC)** definido en `spec_soft_kyc_cne_future.md`.

---

## 1. Resumen Ejecutivo
El **Soft KYC** propone reemplazar o complementar el actual sistema de verificación manual (que requiere subir una foto del documento de identidad y revisión humana) por una verificación **automatizada, instantánea y sin fricción**. Se basa en cruzar la Cédula y Nombre Completo del usuario contra una base de datos (simulada por ahora) y otorgar un *Trust Score* inicial (45%) suficiente para reservar, reduciendo la barrera de entrada para nuevos huéspedes y quitando carga operativa a los administradores.

> [!CAUTION]
> **Veredicto de esta revisión:** la funcionalidad es viable y deseable, pero el informe original subestima dos riesgos de primer orden — **integridad de la escritura de seguridad** (quién puede setear `VERIFIED`) y **naturaleza sensible del dato cruzado** (registro electoral). Ambos se detallan en las secciones 4.1 y 4.2 y deben resolverse antes de tocar código, no durante.

## 2. Alcance en el Proyecto

El impacto de esta funcionalidad es transversal y afecta directamente la **conversión de usuarios**, la **operación del equipo de soporte** y el **mecanismo de pago (UCP 20/80)**:

- **Onboarding de Huéspedes:** La barrera para verificar identidad pasa de horas (esperar aprobación manual) a segundos.
- **Operaciones (Administradores):** Elimina casi por completo la necesidad de que los administradores revisen fotos de cédulas/pasaportes y aprueben/rechacen manualmente.
- **Seguridad (Trust Score):** Modifica el cálculo del Trust Score. El KYC actual otorga puntos por documento validado. El Soft KYC otorga un 45% automático (superando la barrera del 40% requerida para alquilar), pero delega la seguridad en la combinación de Email Verificado + Teléfono Verificado + Match de CNE.
- **Pagos (UCP 20/80):** *(Punto no cubierto en la versión original)* — confirmar si un Trust Score más bajo en promedio (45% vs. el score más alto que típicamente otorgaba el KYC manual con documento validado) afecta el monto del depósito inicial, límites de reserva, o el acceso a ciertos hosts/propiedades que exigen un trust score mínimo más alto. Si la lógica de negocio usa umbrales (`>= 40%`, `>= 70%`, etc.) en el módulo de pagos, debe auditarse antes del rollout.

---

## 3. Impacto y Dificultad Técnica

La dificultad global de implementación se estima como **MEDIA**, pero la dificultad de hacerlo **de forma segura** es **MEDIA-ALTA** debido a los puntos de la sección 4. Gran parte de la lógica backend ya está diseñada en la especificación, pero el frontend requiere una reingeniería del flujo actual.

### 💻 Impacto en el Frontend (Dificultad: Media-Alta)
El frontend requerirá la mayor cantidad de trabajo debido a que el flujo de experiencia de usuario (UX) cambia por completo.

* **Refactorización de Formularios:** Se deben eliminar/ocultar los componentes de subida de archivos (`Dropzone`, manejo de Storage) y crear un nuevo formulario simple con dos campos: **Cédula/ID** y **Nombre Completo**.
* **Gestión de Estados:** El flujo pasa de ser asíncrono-diferido (`NOT_SUBMITTED` ➔ `PENDING_REVIEW` ➔ `VERIFIED`) a ser asíncrono-instantáneo (`NOT_SUBMITTED` ➔ cargando ➔ `VERIFIED` o `FAILED`).
* **Tipado (`types/index.ts`):** Actualizar las interfaces `UserProfile` y crear `UserPassport` tal como indica la especificación, asegurando que TypeScript no rompa en otras partes de la app que esperan un `kycDocumentUrl`.
* **Panel de Administración:** El panel donde los admins ven las solicitudes de KYC pendientes quedará prácticamente obsoleto o requerirá adaptación para manejar los casos en que el "Soft KYC" falle y el usuario decida (como fallback) subir su documento físico.
* **Rate limiting visible en UI:** *(nuevo)* el formulario debe limitar reintentos (ver 4.3) y comunicar claramente al usuario por qué está bloqueado temporalmente, evitando que perciba el bloqueo como un bug.

### ⚙️ Impacto en el Backend (Dificultad: Media — revisado de Baja-Media)
El backend tiene un camino más claro gracias a que la Cloud Function ya está especificada, pero la superficie de seguridad es mayor de lo que sugiere el informe original.

* **Cloud Functions (`kyc.functions.ts`):**
  * Implementar la función `verifyCivilIdentity`.
  * *Desafío:* Decidir el futuro de las funciones actuales (`submitKYCDocument`, `approveKYC`, `rejectKYC`). ¿Se eliminan o quedan como fallback para usuarios extranjeros que no están en el CNE?
  * *(nuevo)* `verifyCivilIdentity` debe ser la **única** vía de escritura de `kycStatus`, `cneMatchStatus` y el delta de `trustScore` resultante — consistente con el patrón ya establecido en VeneStay de que toda escritura de campos de seguridad pasa por Cloud Functions vía Admin SDK, nunca desde el cliente.
* **Reglas de Seguridad (`firestore.rules`):**
  * Actualizar las reglas para proteger los nuevos campos (`kycType`, `cneMatchStatus`, `passport`, etc.) impidiendo que un usuario malicioso se auto-asigne el estado `VERIFIED`.
  * *(nuevo)* Las reglas deben denegar explícitamente cualquier escritura del cliente a `cneMatchStatus`, `kycStatus` y `trustScore`, incluso en `update` parciales — un fallo común es proteger la creación del documento pero no los `update`s posteriores.
* **Integración de Datos:**
  * A corto plazo: Usar el diccionario mock (`CNE_MOCK_REGISTRY`) propuesto en la especificación. Dificultad casi nula.
  * A futuro: Conectar con una API real del CNE o un scraper. Dificultad alta y requiere manejo de errores robusto (caídas del servidor del CNE, timeouts, etc.).
* **Rate limiting / Anti-abuso:** *(nuevo, ver 4.3)* — implementar límite de intentos por IP/usuario/hora en `verifyCivilIdentity`, antes de pasar a producción con datos reales del CNE.

---

## 4. Riesgos y Consideraciones (Alertas)

### 4.1 — Integridad de la escritura del Trust Score *(elevado a riesgo crítico)*

> [!CAUTION]
> **Escritura de campos de seguridad — debe ir solo por Cloud Function**
> El informe original menciona "proteger los nuevos campos" como una tarea de reglas de Firestore, pero no lo marca como bloqueante. Dado que `trustScore` y `kycStatus` son campos que ya el proyecto trata como sensibles (ver convención existente: solo Admin SDK puede escribirlos), este punto debe tratarse como **criterio de aceptación obligatorio**, no como ítem de checklist genérico. Un fallo aquí permite a un usuario auto-otorgarse `VERIFIED` y el 45% de Trust Score sin pasar por `verifyCivilIdentity`.

### 4.2 — Naturaleza sensible del dato cruzado *(no cubierto en el original)*

> [!WARNING]
> **Cruce contra registro electoral (CNE)**
> A diferencia de validar un documento subido por el propio usuario, cruzar Cédula + Nombre contra una base derivada del Consejo Nacional Electoral implica procesar un dato vinculado al registro electoral de una persona. Aunque el cruce solo confirma *coincidencia* (no expone afiliación política ni centro de votación), conviene:
> - Documentar explícitamente qué campos del registro mock/real se consultan y cuáles se descartan inmediatamente después del match.
> - No almacenar el resultado crudo de la consulta al CNE en Firestore — solo el booleano/estado de match (`cneMatchStatus`), nunca el payload completo de la fuente.
> - Si en el futuro se conecta a una fuente real (scraper o API), validar los términos de uso de esa fuente antes de integrarla a producción.

### 4.3 — Riesgo de enumeración / fuerza bruta *(no cubierto en el original)*

> [!WARNING]
> **Oráculo de verificación instantánea**
> Un formulario que responde "MATCH / NO MATCH" de forma instantánea ante Cédula + Nombre es, por diseño, un oráculo que permite enumerar combinaciones válidas si no se limita. Esto es un riesgo nuevo que no existía con el flujo manual (donde un admin humano revisaba cada caso). Mitigación mínima antes de producción:
> - Rate limit por IP y por usuario autenticado en `verifyCivilIdentity` (ej. 5 intentos / hora).
> - Backoff incremental tras intentos fallidos consecutivos.
> - Logging de intentos fallidos para detectar patrones de scraping.

### 4.4 — Falsos Positivos y Fricción

> [!WARNING]
> **Falsos Positivos y Fricción**
> La lógica de cruce de nombres (`normalize` y `includes`) puede fallar si el usuario tiene múltiples nombres y el registro del CNE tiene un formato distinto. Esto generaría un estado `FAILED` injusto, bloqueando al usuario.

### 4.5 — Estrategia Híbrida (Recomendada)

> [!TIP]
> **Estrategia Híbrida (Recomendada)**
> No se debe eliminar el flujo de subida de documentos actual. El Soft KYC (CNE) debe ser el **Camino Feliz (Opción A)**. Si el Soft KYC falla (ej: extranjero sin cédula, o error tipográfico), el sistema debe ofrecer automáticamente la **Opción B**: "Sube una foto de tu pasaporte/cédula para revisión manual".

### 4.6 — Transición de Base de Datos

> [!CAUTION]
> **Transición de Base de Datos**
> Al implementar esto, existirán en Firestore usuarios con el KYC "viejo" (con URL de imagen) y usuarios con el KYC "nuevo" (objeto `passport` sin imagen). El frontend debe poder leer ambos formatos sin romperse (backward compatibility).

### 4.7 — Despliegue sin mecanismo de reversión *(no cubierto en el original)*

> [!WARNING]
> **Falta de feature flag**
> El plan de acción original es lineal y no contempla un interruptor de apagado rápido. Si `CNE_MOCK_REGISTRY` (o, a futuro, la fuente real) falla en producción y empieza a rechazar usuarios legítimos en masa, el equipo necesita poder desactivar el Soft KYC y volver al flujo manual sin un despliegue de emergencia. Se recomienda un flag remoto (Remote Config o documento de configuración en Firestore) que controle si `verifyCivilIdentity` está activa.

---

## 5. Plan de Acción Sugerido (Revisado)

Si se decide proceder con la implementación, el orden recomendado — con los gates de seguridad ahora explícitos — es:

1. **Reglas y Tipos:** Actualizar `firestore.rules` (incluyendo denegación explícita de `update` del cliente sobre `kycStatus`/`cneMatchStatus`/`trustScore`) y `types/index.ts`.
2. **Cloud Functions:** Desplegar `verifyCivilIdentity` con datos Mock, incluyendo rate limiting desde el día uno (no como mejora posterior).
3. **Feature Flag:** Implementar el interruptor remoto de activación/desactivación antes de exponer el formulario al usuario final.
4. **Frontend (Híbrido):** Crear el componente `<SoftKYCForm>` y conectarlo a la nueva function. Si falla, mostrar el componente actual de subida de archivos como plan de respaldo.
5. **Auditoría de Pagos:** Verificar que los umbrales de Trust Score usados en el flujo UCP 20/80 siguen siendo coherentes con el nuevo 45% automático.
6. **Pruebas:** Validar con usuarios de prueba que el Trust Score suba correctamente, que el rate limit funcione, y que las reglas de Firestore bloqueen escrituras directas desde el cliente.

---

## 6. Criterios de Aceptación

| # | Criterio | Verificación |
|---|----------|---------------|
| AC-01 | `kycStatus`, `cneMatchStatus` y `trustScore` solo pueden ser escritos por `verifyCivilIdentity` (Admin SDK) | Test de Firestore rules: intento de `update` directo desde cliente debe fallar |
| AC-02 | `verifyCivilIdentity` tiene rate limiting activo | Test: 6º intento en la misma hora es rechazado |
| AC-03 | El payload crudo de la fuente CNE no se persiste en Firestore | Revisión de código de `verifyCivilIdentity` |
| AC-04 | Existe un feature flag para desactivar Soft KYC sin deploy | Verificación manual: togglear flag desactiva el formulario en runtime |
| AC-05 | Usuarios con KYC "viejo" (URL de imagen) siguen renderizando correctamente en perfil/admin | Prueba con cuenta de usuario legacy |
| AC-06 | Fallback a subida manual se activa automáticamente ante `FAILED` | Prueba E2E con cédula que no matchea |
| AC-07 | Umbrales de Trust Score en el flujo de pago UCP 20/80 siguen siendo válidos con el nuevo 45% base | Revisión cruzada con el módulo de pagos |
