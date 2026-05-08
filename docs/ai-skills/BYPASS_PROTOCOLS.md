# 🧪 Protocolos de Bypass (Entorno de Pruebas v2.2)

Este documento registra las soluciones temporales implementadas para permitir el avance del desarrollo cuando servicios de terceros (APIs) no están disponibles.

## 📍 Google Maps Bypass
- **Problema:** La API de Google Maps no carga o falta facturación, bloqueando el guardado de propiedades al no poder seleccionar coordenadas y provocando el error 'La ubicación es obligatoria'.
- **Solución:** 
  1. El campo `location` en `dashboard.schema.ts` se hizo opcional.
  2. Botón "Forzar Ubicación (Bypass)" en `ListingForm.tsx`.
- **Efecto:** Establece automáticamente las coordenadas de Lechería (`10.2167`, `-67.95`) y el texto de ubicación como `Lechería (Bypass)` en el estado del formulario.
- **Uso:** Hacer clic en el botón dentro del área del mapa (cuando el Skeleton esté activo).

---
**Nota para Agentes:** Estas funciones son estrictamente para pruebas. Deben ser eliminadas o condicionadas a `process.env.NODE_ENV === 'development'` antes de un despliegue a producción.
