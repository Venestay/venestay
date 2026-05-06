# Documentación Técnica - VeneStay

Esta documentación proporciona una visión técnica detallada del proyecto **VeneStay**, un sistema de alquileres vacacionales premium en Venezuela. Está diseñada para que cualquier desarrollador pueda entender rápidamente la arquitectura, las herramientas y las metodologías utilizadas.

---

## 1. Stack Tecnológico

### Core & Frontend

- **React 19**: Framework principal para la interfaz de usuario, utilizando componentes funcionales y Hooks.
- **TypeScript**: Utilizado en todo el proyecto para garantizar seguridad de tipos y mejorar la mantenibilidad.
- **Vite**: Herramienta de construcción (build tool) para un entorno de desarrollo rápido y optimizado.
- **Tailwind CSS v4**: Motor de estilos de última generación para un diseño visual ágil y coherente.
- **Motion (framer-motion)**: Para animaciones fluidas y transiciones de estado premium.
- **Lucide React**: Librería de iconos vectoriales consistente.
- **Identidad & Trust**: Centralizar reglas de validación de identidad para anfitriones "Verificados".
- **Marketing Analytics**: Configurar trazas de eventos para medir el impacto de los Nudges conductuales.
- **Estándar de Evidencia**: Cada cambio visual debe ser validado por el `Reality Auditor` con screenshots.
- **Sonner**: Sistema de notificaciones (toasts) elegante.

### Backend & Servicios (Firebase)

- **Firebase Authentication**: Gestión de identidades y sesiones de usuario.
- **Firestore**: Base de datos NoSQL para persistencia de propiedades, reservas, perfiles y mensajes.
- **Firebase Storage**: Almacenamiento optimizado para imágenes de propiedades y documentos.

### APIs de Terceros

- **Google Maps API**: Visualización geoespacial, autocompletado de direcciones y selección de coordenadas.
- **Gemini API (Google AI)**: Integración de IA para análisis y generación de contenido inteligente.

---

## 2. Arquitectura: Feature-Sliced Design (FSD)

VeneStay implementa una arquitectura **Feature-Sliced Design (FSD)** adaptada, lo que permite una separación de responsabilidades clara y una escalabilidad robusta. El código se organiza por dominios de negocio en lugar de solo por tipos de archivos técnicos.

### Capas Principales

- **Shared**: Recursos transversales (UI kit, hooks globales, utilidades, servicios base).
- **Features**: Módulos funcionales que contienen lógica de negocio e interacción del usuario.
- **Pages**: Composiciones de nivel superior que representan las rutas de la aplicación.

---

## 3. Estructura del Proyecto

```text
├── src/                  # Código fuente de la aplicación
│   ├── assets/           # Imágenes, fuentes y archivos estáticos
│   ├── components/       # UI Kit compartido (Botones, Inputs, Modales)
│   ├── constants/        # Enums y constantes globales (e.g. Tasas BCV)
│   ├── features/         # Dominios funcionales (FSD)
│   ├── hooks/            # Hooks de React compartidos
│   ├── lib/              # Configuraciones de SDKs (Firebase, Google Maps)
│   ├── pages/            # Vistas principales y rutas
│   ├── services/         # Servicios de API centralizados
│   ├── types/            # Definiciones de TypeScript e interfaces
│   ├── utils/            # Funciones de ayuda (Fechas, Monedas)
│   ├── App.tsx           # Router principal y Providers
│   └── main.tsx          # Punto de entrada
├── docs/                 # Documentación técnica y estratégica
│   ├── ai-skills/        # Ecosistema de Inteligencia Agente (Skills)
│   ├── TASKS.md          # Registro de tareas técnicas
│   └── TECHNICAL_DOC.md  # Este archivo
├── public/               # Activos servidos directamente
├── firestore.rules       # Reglas de seguridad de base de datos
├── storage.rules         # Reglas de seguridad de almacenamiento
├── package.json          # Dependencias y scripts
└── tsconfig.json         # Configuración de TypeScript
```

---

## 4. Metodologías y Patrones

### Integración de Firebase

- **Patrón de Servicio**: La lógica de Firebase (CRUD) está abstraída en `src/services/` para evitar acoplamiento en los componentes.
- **Sincronización en Tiempo Real**: Uso intensivo de `onSnapshot` para chats, estados de reserva y disponibilidad instantánea.

### Gestión de Imágenes y Rendimiento

- [ ] **Optimización de Imágenes**: Integrar `browser-image-compression` en el flujo de subida del host.
- [ ] **Whimsy Injector**: Añadir animaciones de éxito y deleite en la confirmación de reserva.
- **Carga Predictiva**: Implementación de **Skeleton Loaders** para mantener la jerarquía visual durante la descarga de datos.
- **In-Place UI**: Los flujos complejos (como pagos P2P) ocurren dentro del flujo actual para evitar la fatiga por modales en móviles.

### Seguridad (Zero-Trust)

- **Validación Estricta**: Las reglas de Firestore validan tipos de datos, propiedad del autor y candados temporales (no se pueden editar fechas después del pago).
- **Protección PII**: Los datos sensibles de contacto solo se revelan una vez que la reserva está confirmada y el anticipo validado.

### Diseño de Interfaz

- **Mobile-First**: Optimización para dispositivos táctiles con áreas de contacto >44px y gestos de deslizamiento (swiping).
- **Estética Premium**: Paleta de colores "Dark Premium" utilizando variables CSS. El color de acento oficial para elementos de marca y confianza es el dorado `#b8914d`.

---

## 5. Guía para el Desarrollador

### Comandos Principales

- `npm install`: Instala dependencias.
- `npm run dev`: Servidor de desarrollo (Vite).
- `npm run build`: Genera bundle de producción en `/dist`.
- `npm run lint`: Verificación de tipos y linting.
- `npm run format`: Formatea el código con Prettier.

### Convenciones de Código

- **Alias de Importación**: Usar `@/` para rutas absolutas desde `src/`.
- **Componentes**: PascalCase para archivos y nombres.
- **Estándares**: Documentados detalladamente en `docs/ai-skills/SKILL_coding_conventions.md`.
- **Integridad Estructural**: En componentes extensos (>500 líneas), se debe mantener un rigor extremo en el balance de hooks y closures. Cualquier refactorización masiva debe ser validada mediante el protocolo de "Doble Candado" (Sincronización SSoT + TSC Gate).

---

## 6. Troubleshooting y Configuración

### Configuración de CORS en Firebase Storage

Si las imágenes fallan al cargar (Error 403/CORS), se debe configurar el bucket de Google Cloud:

1. Crea un archivo `cors.json`:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "POST", "PUT", "DELETE"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
2. Ejecuta: `gsutil cors set cors.json gs://tu-proyecto.appspot.com`

### Errores de Google Maps

Si ves `ApiProjectMapError`:

1. Verifica que la **Maps JavaScript API** esté habilitada en Google Cloud Console.
2. Asegúrate de que la API Key no tenga restricciones que bloqueen el dominio actual.

---

## 7. Alcance Funcional (v0.9.5)

VeneStay es una plataforma P2P adaptada al mercado venezolano:

1. **Descubrimiento**: Búsqueda inteligente por destino y filtros premium.
2. **Reservas**: Flujo de calendario con protección contra solapamientos.
3. **Pagos Dinámicos**: Sistema de anticipo del 20% para asegurar estancias, con liquidación del 80% offline. Soporte para **Zelle, Binance Pay y Pago Móvil** con tasa BCV automática.
4. **Validación**: Dashboard para anfitriones con verificación manual de comprobantes de pago.

---

## 8. Arquitectura Agente-Nativa y Protocolo UCP

VeneStay está diseñado para ser operado y optimizado por agentes de IA mediante un sistema de habilidades (Skills) especializadas.

### Universal Commerce Protocol (UCP)
Implementamos el estándar **UCP** para asegurar que cada transacción (especialmente el modelo 20/80) sea transparente y verificable.
- **Protocolo de Pago**: Sincronización del estado del pago del 20% bajo el estándar UCP.
- **Nudges de Conversión**: Implementación de disparadores de comportamiento (B=MAP).
- **Auditoría de Realidad**: Validación de flujos críticos mediante evidencia visual inmutable.
- **Sesión de Checkout**: Cada reserva genera un objeto `CheckoutSession` que desglosa el depósito y el saldo offline.
- **Trazabilidad**: Uso de metadatos de auditoría en Firestore para cada cambio de estado.

### Ecosistema de Agentes
El desarrollo se rige por especialidades documentadas en `docs/ai-skills/`:
- **Marketing Psychology**: Optimización de conversión basada en modelos mentales.
- **Reality Auditor**: Validación estricta basada en evidencia visual.
- **Trust Architect**: Infraestructura Zero-Trust para pagos P2P.
- **Agile Planner**: Priorización basada en el framework RICE.

