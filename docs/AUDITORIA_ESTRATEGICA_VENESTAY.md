# Auditoría Estratégica y Roadmap de VeneStay

> **Documento interno — División de Ingeniería de IA, Antigravity**
> Versión: v1.0.0 · Última actualización: 18 de mayo de 2026
> Alcance: Beta de Lechería (Julio 2026)

---

## 1. Resumen Ejecutivo

VeneStay es un marketplace de alquileres con una base arquitectónica sólida y decisiones de diseño bien fundamentadas. El stack elegido (React 19 + TypeScript 5 + Vite 6 + Firebase) es el correcto para un lanzamiento beta ágil. Sin embargo, la velocidad de desarrollo dejó abiertos algunos riesgos operacionales que deben cerrarse antes de exponer el producto a usuarios reales.

Este documento consolida el análisis técnico completo del proyecto, identifica los riesgos por severidad y propone un roadmap priorizado por impacto negativo potencial, no por esfuerzo técnico.

| Dimensión | Estado |
| :--- | :---: |
| Arquitectura general | ✅ Sólida |
| Seguridad de base de datos | ✅ Bien diseñada |
| Quality gates (CI) | ✅ Completos |
| Accesibilidad (WCAG 2.2 AA) | ✅ Exigida |
| Lógica financiera del lado cliente | ⚠️ Revisar antes del lanzamiento |
| Persistencia sensible en `localStorage` | ⚠️ Auditar contenido |
| Concurrencia de reservas en Firestore | ⚠️ Planificar antes de producción |
| Observabilidad en producción | ❌ No mencionada |
| Tests de integración en flujos de pago | ❌ No incluidos |

---

## 2. Análisis de Arquitectura

VeneStay implementa una versión ágil de **Feature-Sliced Design (FSD-lite)**, con el código fuente segregado en cuatro capas que evitan dependencias circulares y facilitan el trabajo paralelo entre equipos.

```
src/pages          →  Capa de Presentación (rutas, lazy loads)
src/features       →  Capa de Módulos (lógica de negocio por dominio)
src/services       →  Capa de Servicios (abstracción de infraestructura)
src/infra          →  Capa de Datos (Firebase SDK, esquemas Zod)
```

### Fortalezas identificadas

**Separación de responsabilidades.** La capa de servicios actúa como un *anti-corruption layer* frente a Firebase. Si en el futuro se decide migrar a otro proveedor de base de datos, el impacto queda aislado en `src/services/` sin tocar la lógica visual ni de negocio.

**Seguridad en tres capas.** El proyecto aplica control de acceso en todos los niveles del stack:

- `firestore.rules` — control de identidad a nivel de servidor (solo el propietario puede modificar sus datos).
- `storage.rules` — restricciones de tipo y tamaño para archivos subidos (imagen < 5MB, documentos KYC privados bajo `/kyc/{uid}/`).
- `dashboard.schema.ts` — validación Zod que impide inyección de tipos incorrectos antes de que los datos lleguen a Firestore.

**Quality gates obligatorios.** Los tres gates de CI (`tsc --noEmit`, `eslint .`, WCAG 2.2 AA) aseguran que ningún build con errores de tipado, hooks huérfanos o elementos inaccesibles llegue a producción. El gate de accesibilidad es especialmente valioso y poco común en proyectos de esta etapa.

---

## 3. Riesgos Identificados por Severidad

### 🔴 Críticos — Deben resolverse antes del lanzamiento

#### R-01: Lógica financiera ejecutándose en el cliente

`CheckoutPage.tsx` integra el cálculo del tipo de cambio y las comisiones UCP directamente en el frontend. Un usuario avanzado puede interceptar las llamadas o manipular el DOM para alterar los montos antes de que lleguen a Firestore. Las reglas financieras deben validarse en el servidor.

**Impacto potencial:** pérdida financiera directa para VeneStay o para los anfitriones.
**Solución recomendada:** migrar el cálculo y la validación de montos a Cloud Functions, exponiendo un endpoint que reciba los parámetros de la reserva y devuelva el monto final calculado en servidor antes de ejecutar la transacción.

#### R-02: Datos sensibles en `localStorage`

`usePassportForm.ts` sincroniza datos del Pasaporte VeneStay a `localStorage` de forma reactiva. No está documentado exactamente qué campos persisten. Si alguno incluye información de identidad, Trust Score calculado o referencias a documentos KYC, esos datos quedan expuestos a scripts de terceros (XSS) y no se borran al cerrar sesión por defecto.

**Impacto potencial:** vulnerabilidad de privacidad, incumplimiento de normativas de protección de datos.
**Solución recomendada:** auditar campo por campo qué se persiste. Solo guardar en `localStorage` preferencias de UI y estado de navegación no sensible. Todo dato de identidad debe vivir exclusivamente en Firestore bajo las reglas de acceso existentes.

#### R-03: Credenciales QA documentadas en documento compartible

La cuenta `anfitrionvenestay@venestay.com` —con acceso unificado a roles de Huésped, Anfitrión y Administrador— está documentada en el mismo archivo que se comparte con auditores externos. Si este documento se filtra, esa cuenta queda completamente expuesta.

**Impacto potencial:** acceso no autorizado a datos de todos los usuarios y transacciones.
**Solución recomendada:** rotar las credenciales inmediatamente y separar el documento de arquitectura (público para auditores) del documento operacional (privado, con credenciales, acceso restringido al equipo interno).

---

### 🟡 Importantes — Resolver antes de la beta pública

#### R-04: Riesgo de doble booking por concurrencia en Firestore

Firestore limita a **1 escritura por segundo por documento**. Si dos usuarios intentan reservar el mismo alojamiento de forma simultánea, el sistema puede confirmar ambas reservas sobre el mismo bloque de fechas.

**Impacto potencial:** doble booking, destrucción de confianza del usuario en el marketplace.
**Solución recomendada:** implementar transacciones atómicas de Firestore (`runTransaction`) sobre el documento del listado, o un sistema de bloqueo optimista que verifique la disponibilidad dentro de la misma transacción que ejecuta la reserva. Para alta carga, considerar una Cloud Function con lógica de cola.

#### R-05: Ausencia de tests de integración en flujos de pago

Los quality gates actuales cubren tipado, linting y accesibilidad, pero no incluyen tests de integración sobre `booking-service.ts` ni sobre el flujo completo de checkout. Los bugs financieros en producción son los más costosos de revertir y los más dañinos para la reputación del producto.

**Impacto potencial:** errores silenciosos en cálculo de montos, comisiones o bloqueo de fechas que llegan a usuarios reales.
**Solución recomendada:** añadir un cuarto quality gate de tests de integración (Vitest + Firebase Emulator Suite) que cubra al menos: reserva exitosa, reserva con fechas solapadas, pago con tipo de cambio variable y cancelación.

#### R-06: QA insuficiente en dispositivos móviles reales

El servidor de desarrollo escucha en `0.0.0.0` para facilitar pruebas en red local, pero el uso móvil en el mercado objetivo (Venezuela y LATAM) es dominante. Los componentes más propensos a romperse en pantallas pequeñas son `ListingDetail.tsx` (galería + panel sticky de reserva) y `CheckoutPage.tsx` (formulario multi-campo).

**Impacto potencial:** tasa de abandono alta en el flujo de conversión principal.
**Solución recomendada:** establecer una suite de QA en dispositivos físicos reales (no solo emuladores) que cubra los flujos de reserva completos antes de la beta de Lechería.

#### R-07: Mezcla de información pública y privada en el documento técnico

El reporte de arquitectura actual combina información estructural (apta para auditores externos) con credenciales operacionales (solo para el equipo interno). Esta mezcla viola el principio de mínimo privilegio en la gestión documental.

**Solución recomendada:** dividir en dos documentos con controles de acceso distintos: `ARQUITECTURA_PUBLICA.md` (este documento, sin credenciales) y `OPS_PRIVADO.md` (credenciales, accesos, configuraciones de entorno, solo accesible al equipo core).

---

### 🟢 Mejoras estratégicas — Post-beta

#### M-01: Observabilidad y monitoreo de errores en producción

El stack no menciona ninguna herramienta de monitoreo de errores (Sentry, Datadog, Firebase Crashlytics). En beta, los errores llegan por reporte manual del usuario, lo que implica que la mayoría nunca se reportan.

**Solución recomendada:** integrar Sentry con el proyecto React para captura automática de excepciones no manejadas, breadcrumbs de navegación y contexto de usuario. Configurar alertas para errores en el flujo de checkout específicamente.

#### M-02: Onboarding guiado para anfitriones

`ListingForm.tsx` coordina cuatro pasos asincrónicos (General, Gallery, Map, Payments). La tasa de abandono en formularios multi-step sin indicadores de progreso claros es históricamente alta. El primer anfitrión que no puede publicar su propiedad es una oportunidad perdida irrecuperable en la etapa de adopción temprana.

**Solución recomendada:** añadir indicadores de progreso persistentes, validación inline paso a paso (no solo al submit), y guardado automático del borrador para que el anfitrión pueda retomar la publicación sin perder datos.

#### M-03: Estrategia de costos de Firestore a escala

Firebase Firestore cobra por operación (lectura, escritura, borrado), no por usuario. Si el feed de propiedades consulta sin paginación agresiva, o si el Trust Score se recalcula en cada carga de perfil en lugar de cachearse, los costos pueden multiplicarse antes de que el negocio tenga ingresos que los soporten.

**Solución recomendada:** auditar los patrones de lectura más frecuentes (feed de propiedades, perfil de usuario, disponibilidad de calendario) e implementar caché local con `React Query` o `SWR` para reducir lecturas redundantes a Firestore. Documentar un umbral de costo mensual que active la evaluación de migración parcial.

#### M-04: Plan de migración off-Firebase a mediano plazo

La arquitectura con capa de servicios aislada (`src/services/`) es el momento ideal para documentar una estrategia de salida de Firebase. A escala de marketplace maduro, los costos de Firestore por lectura y las limitaciones de consultas complejas (joins, agregaciones) pueden volverse restricciones de negocio. Tener el plan antes de necesitarlo evita migraciones de emergencia.

**Solución recomendada:** documentar en `src/services/README.md` los contratos de interfaz de cada servicio, de forma que cualquier implementación futura (PostgreSQL, PlanetScale, Supabase) pueda sustituir Firebase sin modificar la capa de features.

---

## 4. Roadmap de Implementación

La priorización sigue el criterio de **impacto negativo potencial**, no de esfuerzo técnico. Los ítems de Fase 1 no son necesariamente los más difíciles, pero son los únicos que pueden comprometer la viabilidad legal y financiera del producto antes del lanzamiento.

### Fase 1 — Bloqueantes (Semanas 1–2, antes del 1 de junio)

| # | Tarea | Responsable sugerido | Esfuerzo estimado |
| :--- | :--- | :--- | :--- |
| 1 | Migrar cálculo financiero a Cloud Functions | Backend lead | 3–5 días |
| 2 | Auditar y limpiar `localStorage` en `usePassportForm.ts` | Frontend lead | 1 día |
| 3 | Rotar credenciales QA y separar documentación | DevOps / PM | 4 horas |

### Fase 2 — Estabilidad (Semanas 3–5, antes del 15 de junio)

| # | Tarea | Responsable sugerido | Esfuerzo estimado |
| :--- | :--- | :--- | :--- |
| 4 | Implementar transacciones atómicas en `booking-service.ts` | Backend lead | 2–3 días |
| 5 | Añadir suite de tests de integración (checkout + reservas) | QA / Full-stack | 4–6 días |
| 6 | QA completo en dispositivos móviles físicos | QA lead | 3 días |
| 7 | Separar documento técnico en público y privado | PM / Tech Lead | 2 horas |

### Fase 3 — Escala (Julio en adelante, post-beta)

| # | Tarea | Responsable sugerido | Esfuerzo estimado |
| :--- | :--- | :--- | :--- |
| 8 | Integrar Sentry para monitoreo de errores en producción | DevOps | 1 día |
| 9 | Rediseñar UX del onboarding de anfitriones | Frontend + Design | 1 semana |
| 10 | Auditar costos de Firestore e implementar caché | Full-stack | 3–4 días |
| 11 | Documentar plan de migración off-Firebase | Tech Lead | 2 días |

---

## 5. Observación Transversal: Costos de Lectura en Firebase

Firebase tiene una característica que debe estar presente en toda decisión de arquitectura futura: **los costos escalan por operación, no por usuario activo**. Cada lectura de Firestore tiene precio unitario. Los patrones de riesgo más comunes en marketplaces son:

- Feed de propiedades sin paginación (N lecturas por visita al home).
- Trust Score recalculado en cada carga de perfil en lugar de cachearse con TTL.
- Disponibilidad de calendario consultada sin debounce en el selector de fechas.

Revisar estos tres patrones antes del lanzamiento puede representar una diferencia de 10x en el costo operacional mensual durante los primeros meses de adopción.

---

## 6. Conclusión

VeneStay tiene la arquitectura correcta para escalar. La separación en capas, la seguridad en tres niveles y los quality gates obligatorios son decisiones que la mayoría de los proyectos en etapa beta no tienen. El trabajo restante no es rediseñar nada: es cerrar los riesgos operacionales que la velocidad de desarrollo naturalmente dejó abiertos, y hacerlo en el orden correcto antes de que usuarios reales empiecen a mover dinero en la plataforma.

---

*Elaborado por la División de Ingeniería de IA de Antigravity*
*Documento clasificado como: Uso Interno — Equipo de Ingeniería*
