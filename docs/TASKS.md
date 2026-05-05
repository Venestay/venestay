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
- [/] **Validación con Zod**: Aplicación de esquemas de validación en el formulario de creación de propiedades.
- [ ] **Sincronización de Checkout (UCP)**: Asegurar que el estado del pago del 20% siga el protocolo UCP en Firestore.
- [ ] **Nudges de Conversión**: Implementar disparadores de comportamiento en el flujo de reserva (B=MAP).
- [ ] **Auditoría de Realidad**: Captura de evidencia visual para el flujo de Mobile Checkout.

---

## ⏳ Pendiente (Backlog)
- [ ] **Componente Chat**: Migrar `src/components/Chat.tsx` a un módulo de feature (FSD).
- [ ] **Manejo de CORS**: Implementar configuración `gsutil` para evitar errores en carga de imágenes.
- [ ] **Notificaciones**: Sistema de feedback visual tras acciones exitosas (Sonner).
- [ ] **Optimización de Imágenes**: Integrar `browser-image-compression` en el flujo de subida del host.
- [ ] **Whimsy Injector**: Añadir animaciones de éxito y deleite en la confirmación de reserva.

---

## 🔍 Auditoría de Inteligencia Agente (Puntos Ciegos)

1.  **Identidad & Trust**: Centralizar reglas de validación de identidad para anfitriones "Verificados".
2.  **Marketing Analytics**: Configurar trazas de eventos para medir el impacto de los Nudges conductuales.
3.  **Estándar de Evidencia**: Cada cambio visual debe ser validado por el `Reality Auditor` con screenshots.
4.  **Inconsistencia en Timestamps**: El manejo de fechas de Firebase no es uniforme entre features, mezclando objetos `Date` con `any` (Timestamps).
5.  **Validación Incompleta**: Aunque `zod` está instalado, su uso es esporádico y no cubre todos los flujos de entrada de datos.

---
*Última actualización: 2026-05-05 (Agentic Update)*
