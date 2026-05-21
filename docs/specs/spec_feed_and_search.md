# Especificación Técnica (v2.2.0): Feed de Propiedades y Búsqueda Multidimensional

Esta especificación describe el diseño de la interfaz de usuario, lógica de negocio y arquitectura de datos para el **Feed de Propiedades** y el sistema de **Búsqueda Multidimensional** en el ecosistema de **VeneStay**.

---

## 1. Objetivo del Módulo
Permitir a los huéspedes de alta gama buscar, filtrar y ubicar alojamientos premium en Lechería basándose no solo en criterios estándar de precio y capacidad, sino en la disponibilidad de servicios de infraestructura críticos en Venezuela.

---

## 2. Parámetros de Infraestructura Premium (Filtros Clave)
El feed de propiedades implementa filtros de alto rendimiento para evaluar la resiliencia de la propiedad:
*   **Soporte Eléctrico (`powerSupply`):**
    *   `FULL`: Planta eléctrica total (100% de la propiedad, incluyendo aire acondicionado central).
    *   `PARTIAL`: Planta eléctrica parcial (solo iluminación y tomacorrientes esenciales).
    *   `NONE`: Sin planta eléctrica.
*   **Soporte Hídrico (`waterSupply`):**
    *   `TANK`: Tanque de agua de gran capacidad (reserva para varios días).
    *   `WELL`: Pozo profundo de agua dulce.
    *   `NONE`: Sin soporte hídrico.
*   **Facilidades Náuticas (`nauticalDock`):**
    *   `true`: Muelle privado apto para el atraque de embarcaciones (lanchas, yates).
    *   `false`: Sin muelle.
*   **Seguridad del Complejo (`securityLevel`):**
    *   `ARMED_24_7`: Vigilancia armada las 24 horas y control de acceso estricto.
    *   `STANDARD`: Vigilancia estándar o conserjería.

---

## 3. Modelo de Datos de Búsqueda (TypeScript)
```typescript
export interface SearchFilters {
  city: 'Caracas' | 'Margarita' | 'Falcon' | 'Lechería' | 'Maracaibo' | 'Puerto La Cruz';
  priceRange: { min: number; max: number };
  guestsCount: number;
  
  // Atributos de Infraestructura
  powerSupply?: 'FULL' | 'PARTIAL' | 'NONE';
  waterSupply?: 'TANK' | 'WELL' | 'NONE';
  nauticalDock?: boolean;
  securityLevel?: 'ARMED_24_7' | 'STANDARD';
}
```

---

## 4. UI/UX y Optimización de Rendimiento
*   **Google Maps SDK Integrado:** Carga diferida de mapas e interactividad dinámica.
*   **Marker Clustering:** Agrupamiento inteligente de marcadores geográficos en zonas de alta densidad (como Casas Bote y canales de Lechería) para evitar sobrecarga visual y cognitiva.
*   **Lazy Loading:** Tarjetas de propiedad cargadas dinámicamente según scroll (scroll infinito) manteniendo un rendimiento estable a 60 FPS.
