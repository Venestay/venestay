# Especificación Técnica (v2.2.0): Listing Form Wizard (4 Pasos)

Esta especificación describe el diseño de la interfaz y validación lógica del formulario de publicación de propiedades (**Listing Form Wizard**) de **VeneStay**.

---

## 1. Objetivo del Módulo
Mitigar la tasa de abandono en la publicación de propiedades mediante un formulario fragmentado e interactivo que guía paso a paso al anfitrión, asegurando la consistencia e integridad de los datos descriptivos, geográficos y financieros de la propiedad.

---

## 2. Flujo del Wizard en 4 Pasos

### Paso 1: Información General y Reglas
*   **Campos:** Título, descripción de alto impacto, capacidad máxima, número de camas, baños y dormitorios.
*   **Selector de Reglas de la Casa (`HouseRulesSelector`):**
    *   Permitido fumar, mascotas, fiestas, niños.
    *   Ventana horaria estricta de Check-in y Check-out.
    *   Reglas adicionales (texto libre hasta 1000 caracteres).

### Paso 2: Galería de Ambientes (Upload Segmentado)
*   **Galería Segmentada (`EnvironmentGallery`):** Obligatorio subir al menos una imagen de portada. Permite cargar y etiquetar imágenes clasificadas por ambientes específicos:
    *   `AREA_SOCIAL`: Sala, cocina, comedor, terraza.
    *   `HABITACIONES`: Dormitorios y baños.
    *   `MUELLE_VISTAS`: Vistas al canal navegable, muelle privado o exteriores.
*   *Optimización:* Compresión local de imágenes en el cliente antes de subir a Storage para reducir consumo de datos móviles.

### Paso 3: Geolocalización Precisa
*   **Mapa Interactivo:** Selección visual de latitud y longitud mediante un marcador arrastrable (Drag & Drop) sobre Google Maps.
*   **Instrucciones de Acceso:** Texto específico para indicar los controles de acceso en urbanizaciones cerradas (ej. Casas Bote A, Isla Paraíso).

### Paso 4: Blindaje Financiero
*   **Precios:** Precio por noche y tarifa de limpieza básica (USD).
*   **Depósito de Seguridad (Fianza):** Toggle interactivo para activar la fianza. Al activarse, despliega el campo numérico del monto requerido.
*   **Políticas de Cancelación:** Flexible, Moderada, Estricta.
*   **Configuración de Cuentas Receptoras:** Datos bancarios nacionales e internacionales para liquidación manual de transferencias.

---

## 3. Esquema de Validación de Zod (dashboard.schema.ts)
El formulario aplica validación cruzada y super-refinamiento:
*   El piso de la propiedad no puede ser superior al total de pisos del edificio.
*   **Depósito Obligatorio:** Si `requiresDeposit` está activo, `depositAmount` se convierte en un campo obligatorio y debe ser mayor que cero.
