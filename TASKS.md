# VeneStay - Registro de Tareas (TASKS.md) 📝

Este archivo sirve como el tablero Kanban oficial para el seguimiento de tareas técnicas del proyecto.

---

## ✅ Realizado
- [x] **Refactorización FSD**: Código organizado por dominios (`auth`, `bookings`, `listings`, `dashboard`, `profile`).
- [x] **Limpieza de App.tsx**: El punto de entrada ahora solo contiene la configuración de rutas y providers.
- [x] **Centralización de Servicios**: Abstracción de lógica de Firebase en `src/services/`.
- [x] **UI Kit Base**: Botones, modales e inputs adaptados al tema "Premium Dark".
- [x] **Reglas de Seguridad**: Despliegue de `firestore.rules` y `storage.rules` endurecidas.

---

## 🚧 En curso
- [ ] **Migración a Tipado Estricto**: Sustitución de `any` por interfaces específicas en `src/types/` y features.
- [ ] **Validación con Zod**: Aplicación de esquemas de validación en el formulario de creación de propiedades.
- [ ] **Sincronización de Checkout**: Asegurar que el estado del pago del 20% se refleje instantáneamente en el dashboard.

---

## ⏳ Pendiente (Backlog)
- [ ] **Componente Chat**: Migrar `src/components/Chat.tsx` a un módulo de feature (FSD).
- [ ] **Manejo de CORS**: Implementar configuración `gsutil` para evitar errores en carga de imágenes.
- [ ] **Notificaciones**: Sistema de feedback visual tras acciones exitosas (Sonner).
- [ ] **Optimización de Imágenes**: Integrar `browser-image-compression` en el flujo de subida del host.

---

## 🔍 Auditoría de "Puntos Ciegos" (Deuda Técnica e Inconsistencias)

Tras la revisión del repositorio, se han identificado los siguientes puntos que requieren atención inmediata:

1.  **Abuso de `any`**: Se detectaron más de 20 instancias de `any` en archivos críticos (ej: `CheckoutPage.tsx`, `Chat.tsx`, `types/index.ts`). Esto debilita la seguridad de tipos proporcionada por TypeScript.
2.  **Componentes Huérfanos**: `src/components/Chat.tsx` quedó fuera de la estructura de `features/` tras la migración. Debe integrarse siguiendo FSD.
3.  **Lógica en Vistas**: Algunas páginas (ej: `Home.tsx`) contienen lógica de filtrado que debería estar encapsulada en hooks dentro de la feature correspondientes (`listings/hooks`).
4.  **Inconsistencia en Timestamps**: El manejo de fechas de Firebase no es uniforme entre features, mezclando objetos `Date` con `any` (Timestamps).
5.  **Validación Incompleta**: Aunque `zod` está instalado, su uso es esporádico y no cubre todos los flujos de entrada de datos.

---
*Última actualización: 2026-05-03*
