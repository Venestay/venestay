# PRD: Normalización de Ciudades y Filtros (Bug Fix)

## 🎯 Objetivo
Resolver el error de funcionamiento donde las propiedades nuevas de Lechería no aparecen en el filtro principal debido a inconsistencias en la acentuación ("Lechería" vs "Lecheria").

## 🛠️ Problema Técnico
-   **Inconsistencia en Tipos:** El tipo `City` permite ambos valores.
-   **Inconsistencia en UI:** El `Navbar` usa "Lecheria" mientras que el `ListingForm` usa "Lechería".
-   **Filtro Estricto:** `Home.tsx` realiza una comparación estricta (`===`), lo que causa que los registros no coincidan.

## 📋 Requerimientos
1.  **Estandarización:** Todas las referencias internas y visuales deben usar la forma gramaticalmente correcta: **Lechería**.
2.  **Robustez del Filtro:** El motor de filtrado debe ser insensible a acentos y mayúsculas para prevenir futuros errores de data entry.
3.  **Migración Silenciosa:** El sistema debe manejar registros antiguos que puedan tener la versión sin acento.

## ⚙️ Especificaciones Técnicas
-   **Filtro:** Implementar una función `normalizeString` que elimine acentos y convierta a minúsculas antes de comparar.
-   **Tipos:** Limpiar el tipo `City` para evitar duplicados.
-   **UI:** Actualizar `Navbar.tsx` y `ListingForm.tsx` para usar la lista única.

## ✅ Métricas de Éxito
-   Al filtrar por "Lechería" en el index, aparecen todas las propiedades cuya ciudad sea "Lechería" o "Lecheria".
-   Nuevas propiedades se guardan siempre como "Lechería".
