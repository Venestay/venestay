# Convenciones del Proyecto VeneStay

Este documento describe los estándares de codificación, arquitectura y convenciones para el proyecto VeneStay.

## 1. Arquitectura: Feature-Sliced Design (FSD)
El proyecto sigue una arquitectura FSD refinada. El código se organiza en módulos según el dominio de negocio.

### Estructura de una Característica (`src/features/[nombre-feature]/`)
- `/components`: Componentes de UI específicos de la característica.
- `/hooks`: Hooks personalizados de React específicos de la característica.
- `/api`: (Opcional) Llamadas a la API o servicios específicos de la característica.
- `/types`: Definiciones de TypeScript para la característica.

## 2. Convenciones de Nomenclatura
- **Componentes**: `PascalCase.tsx` (ej. `ListingCard.tsx`)
- **Hooks**: `kebab-case.ts/tsx` (ej. `use-auth.tsx`)
- **Servicios/Utilidades/Otros**: `kebab-case.ts` (ej. `auth-service.ts`)
- **Carpetas**: `kebab-case` (ej. `listing-detail`)

## 3. Stack Tecnológico
- **Framework**: React 19 + Vite
- **Estilos**: Tailwind CSS v4 + Framer Motion (motion/react)
- **Gestión de Estado**: React Context (Auth), TanStack Query (Próximamente)
- **Validación**: Zod
- **Backend**: Firebase (Firestore, Auth, Storage)

## 4. Estándares de Codificación
- **Importaciones**: Usa el alias `@/` para importaciones absolutas desde el directorio `src/`.
- **Firebase**: Evita llamadas directas a Firebase en componentes de UI. Usa los servicios centralizados en `src/services/`.
- **Tipos**: Usa tipos centralizados en `src/types/index.ts` para interfaces globales, y tipos específicos de características en sus respectivas carpetas.
- **Tipado Estricto**: Asegúrate de que todas las props y parámetros de funciones estén estrictamente tipados.
- **Tipado de Componentes**: Queda prohibido el uso de props booleanos para alternar estilos mayores. Se debe seguir la arquitectura de variantes definida en `SKILL_composition.md`.
- **Integridad Zod**: Todo input numérico procesado (especialmente UCP 20/80) debe utilizar coerción según el estándar en las referencias de Zod.
- **Eficiencia Dinámica**: Componentes de alto peso (Mapas, Gráficos) deben usar `React.lazy` siguiendo las mejores prácticas de React.

## 5. Reglas Agénticas y UI/UX
- **Tema**: Estética "Premium Dark".
- **Psicología Primero**: Cada elemento de la UI debe alinearse con `SKILL_marketing_psychology.md` (ej. indicadores de escasez, prueba social).
- **Verificación de Realidad**: Cada cambio requiere **Evidencia Visual** (capturas de pantalla) según se define en `SKILL_reality_auditor.md`.
- **Whimsy**: Usa micro-animaciones sutiles para el feedback y así reducir la ansiedad del usuario.
- **Rendimiento**: Usa `lazy` y `Suspense` para componentes pesados.

## 6. Puertas de Calidad (Condiciones No-Go)
Las siguientes condiciones deben cumplirse antes de que cualquier tarea se considere completa:
1. **Compilación**: `npx tsc --noEmit` debe pasar sin errores.
2. **Linting**: `npm run lint` debe pasar sin advertencias en Shared o Features.
3. **Evidencia**: El `Reality Auditor` debe proporcionar evidencia visual (capturas de pantalla/descripciones).
4. **Seguridad**: Los cambios en los pagos deben cumplir estrictamente con `UCPTransactionPayload`.
