# Documentación Técnica - VeneStay

Esta documentación proporciona una visión técnica detallada del proyecto **VeneStay**, un sistema de alquileres vacacionales en Venezuela. Está diseñada para que cualquier desarrollador pueda entender rápidamente la arquitectura, las herramientas y las metodologías utilizadas.

---

## 1. Stack Tecnológico y Lenguajes

### Lenguajes de Programación

- **TypeScript**: Utilizado en todo el proyecto (Frontend y lógica de negocio) para garantizar seguridad de tipos y mejorar la mantenibilidad.
- **HTML5 & CSS3**: Estructura base y estilos personalizados a través de Tailwind.

### Frontend (Framework y Herramientas)

- **React 19**: Framework principal para la interfaz de usuario. Se utilizan componentes funcionales y Hooks.
- **Vite**: Herramienta de construcción (build tool) que proporciona un entorno de desarrollo rápido y optimizado.
- **Tailwind CSS v4**: Utilizado para el diseño visual mediante clases de utilidad, permitiendo un desarrollo de UI ágil y coherente.
- **Motion (framer-motion)**: Para animaciones suaves y transiciones de estado.
- **Lucide React**: Librería de iconos vectoriales.

### Backend y Servicios (Firebase)

- **Firebase Authentication**: Gestión de usuarios (Logins, registro, perfiles).
- **Firestore**: Base de datos NoSQL orientada a documentos para almacenar propiedades, reservas y mensajes.
- **Firebase Storage**: Almacenamiento de imágenes de propiedades y fotos de perfil.

### APIs de Terceros

- **Google Maps API**: Utilizada para la visualización de la ubicación de las propiedades y la selección de coordenadas en el dashboard de administración.
- **Gemini API (Google AI)**: Utilizada para funcionalidades de inteligencia artificial a través del SDK `@google/genai`.

---

## 2. Diagnóstico: Error en Carga de Imágenes

Se ha identificado que la carga de imágenes puede fallar por las siguientes razones:

1.  **CORS (Cross-Origin Resource Sharing)**: Es el motivo más probable del error `storage/retry-limit-exceeded`. Google Cloud Storage bloquea peticiones de dominios distintos por defecto.
    - **Solución**: Debes usar la terminal de Google Cloud (o localmente con `gsutil`) para configurar CORS.
    - Crea un archivo `cors.json`: `[{"origin": ["*"], "method": ["GET", "POST", "PUT", "DELETE"], "maxAgeSeconds": 3600}]`
    - Ejecuta: `gsutil cors set cors.json gs://gen-lang-client-0727178605.firebasestorage.app`
2.  **Timeout / Red Inestable**: El error `Max retry time for operation exceeded` indica que el SDK se rindió tras varios intentos.
    - **Solución Aplicada**: Se incrementó el `maxUploadRetryTime` a 120 segundos en `firebase.ts` y se añadió una lógica de reintento manual (3 intentos con delay exponencial) en `AdminDashboard.tsx`.
3.  **Storage Rules**: Es vital que las reglas de almacenamiento estén desplegadas y permitan escritura.
4.  **Manejo de Blobs**: Se ha asegurado que el `contentType` se pase correctamente tras la compresión.

---

## 3. Estructura del Proyecto

```text
/
├── src/
│   ├── components/       # Componentes de UI reutilizables
│   ├── services/         # Lógica de interacción con APIs (Firebase, Gemini)
│   ├── App.tsx           # Punto de entrada principal y Router
│   ├── index.css         # Configuración global de estilos (Tailwind)
│   └── main.tsx          # Inicialización de React
├── public/               # Activos estáticos
├── firebase-blueprint.json # Estructura de datos de Firestore
├── firestore.rules       # Reglas de seguridad de la base de datos
└── package.json          # Dependencias y scripts
```

---

## 3. Metodologías y Patrones

### Integración de Firebase

- **Patrón Provider**: Se utiliza para manejar el estado de autenticación y la disponibilidad de Firebase en toda la aplicación.
- **Tiempo Real (onSnapshot)**: Implementado para que el dashboard de administración, los chats y el estado de las propiedades se actualicen instantáneamente sin recargar la página.

### Gestión de Imágenes

- **Compresión y Optimización**: Se utiliza `browser-image-compression` antes de subir fotos a Storage para optimizar el rendimiento. Se ha ajustado la calidad (0.75) y el peso máximo (0.6MB) para asegurar cargas rápidas sin perder detalle visual.
- **Caché en Navegador**: Todas las imágenes subidas a Firebase Storage cuentan con la cabecera `Cache-Control: public,max-age=31536000`, permitiendo que el navegador las guarde localmente por 1 año y evite recargas innecesarias.
- **Immutabilidad de Rutas**: Las imágenes se almacenan con identificadores únicos basados en el ID del usuario y marcas de tiempo.

### Mapas y Geolocalización

- **Optimización de Recursos**: Se utiliza una configuración centralizada (`lib/maps.ts`) para cargar las librerías necesarias (`places`, `geometry`) de forma eficiente, evitando cargas duplicadas.
- **Estética Específica**: Se aplican estilos personalizados al mapa para ocultar puntos de interés innecesarios (negocios, transporte público), enfocando la atención del usuario únicamente en la ubicación de la propiedad.
- **Manejo de Errores Robustos**: Se ha implementado una detección proactiva de errores de carga (como el `ApiProjectMapError`) proporcionando información clara al usuario sobre problemas de configuración en la consola de Google Cloud.

### Seguridad (Zero-Trust)

- **Reglas de Firestore**: Se han implementado reglas estrictas que validan:
  - Identidad (solo el autor puede editar su contenido).
  - Integridad (validación de tipos de datos y campos requeridos).
  - Relación (validación de que una reserva pertenece a una propiedad válida).
- **Validación de Datos**: Cada tipo de documento tiene una función `isValid[Entity]` en las reglas de seguridad.

### UI/UX y Estrategia de Rendimiento

- **Diseño Adaptativo**: Mobile-first mediante Tailwind v4. Los componentes críticos (Dashboard, Detalle, Checkout) se transforman en vistas full-screen en dispositivos móviles para maximizar el espacio táctil.
- **Micro-interacciones**: Uso de `motion` para feedbacks visuales. Se han implementado gestos de **swiping** (deslizamiento) en galerías de imágenes para mejorar la navegación táctil.
- **Skeleton Loaders**: Arquitectura de carga predictiva mediante componentes de Skeleton que mantienen la jerarquía visual mientras se descargan datos de Firestore, optimizando la UX en conexiones móviles lentas.
- **Estrategia In-Place**: Los formularios de configuración de pagos ahora se despliegan dentro del contenedor actual mediante transiciones de deslizamiento, evitando el uso excesivo de modales anidados que suelen fallar en pantallas pequeñas.

### Inteligencia Artificial (Gemini API)

- **Modelos**: Uso de `@google/genai` para funcionalidades inteligentes (como generación de descripciones o insights de reserva si aplica).

---

## 4. Guía para el Desarrollador

### Comandos Principales

- `npm install`: Instala todas las dependencias.
- `npm run dev`: Inicia el servidor de desarrollo en el puerto 3000.
- `npm run build`: Genera el bundle de producción en la carpeta `/dist`.
- `npm run lint`: Ejecuta el verificador de tipos de TypeScript.

### Variables de Entorno

El proyecto utiliza un sistema de configuración inyectado por el entorno de Google AI Studio. Para integraciones locales, revisa el archivo `.env.example` y configura las claves de Firebase.

---

## 5. Notas Importantes

- **Portabilidad**: La aplicación está configurada para correr tras un proxy Nginx en el puerto 3000.
- **Base de Datos**: La estructura `firebase-blueprint.json` sirve como referencia técnica de los modelos de datos, pero la lógica reside en los componentes y hooks de React.

---

## 6. Alcance Funcional y Fase Actual

### ¿Qué hace VeneStay?

VeneStay es una plataforma de alquileres vacacionales premium que permite a los usuarios buscar, reservar y pagar estadías en Venezuela mediante un sistema P2P. Sus pilares son:

1. **Descubrimiento**: Filtros inteligentes por ciudad y categorías.
2. **Reserva**: Flujo de calendario y gestión de huéspedes integrado (con protección contra fugas relacionales).
3. **Pagos P2P Dinámicos (Anticipo 20%)**: Soporte para Zelle, Binance y Pago Móvil. El sistema procesa estrictamente el pago inicial del 20% (Anticipo) para asegurar reservas. El restante (80%) se liquida offline directamente entre el anfitrión y el viajero.
4. **Seguridad**: Verificación manual de pagos, perfil de host protegido contra exposición PII, y reglas de acceso Zero-Trust en firestore endurecidas.

### Fase de Desarrollo: **MVP Final / Optimización & Estabilidad (V0.9.0)**

El proyecto se encuentra en una etapa de **madurez funcional alta**.

- **Backend**: Estructura de datos consolidada. Reglas Firestore ultra-seguras (Validaciones "Anti-Update-Gap", protección `guests`, etc.).
- **Frontend**: Optimización móvil total con gestos táctiles y layouts adaptativos extremos.
- **UX**: Implementación de Skeleton Loaders y estados de carga refinados.
- **Checkout**: Flujo de pago P2P optimizado con "Tap-to-copy", banners de _VeneStay Protection_ con desglose transparente (Anticipo 20% platform fee y saldo 80%), y validaciones de referencia robustas.
