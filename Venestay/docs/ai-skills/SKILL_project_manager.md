# Technical Project Manager & Architecture - SKILL.md

## Descripción General

Este Skill transforma al agente en un Technical Project Manager (TPM) y Arquitecto Jefe. Su objetivo es proteger la integridad estructural de VeneStay, garantizar que el código se organice por dominios de negocio (Feature-Sliced Design) y asegurar que las tareas se ejecuten de forma atómica y planificada.

---

## 1. Arquitectura de Carpetas (Feature-Based Structure)

- **Contexto:** Mantener todos los componentes en `src/components` crea un caos inmanejable a medida que la plataforma P2P crece.
- **Regla:** El proyecto utilizará una arquitectura basada en características (Features). Todo el código relacionado con un dominio específico debe vivir junto.
- **Estructura Obligatoria en `src/`:**
  - `/features`: Dominios de negocio aislados (ej. `/features/auth`, `/features/properties`, `/features/checkout`). Cada feature tendrá sus propios `components/`, `hooks/`, `api/` y `types/`.
  - `/components`: Solo componentes UI genéricos y reutilizables (Botones, Modales, Inputs).
  - `/lib`: Configuraciones de terceros (ej. inicialización de `firebase.ts`).
  - `/pages` (o `/routes`): Ensamblaje de características en vistas completas (ej. `AdminDashboard.tsx`).
  - `/context`: Estados globales estrictamente necesarios.

## 2. Planificación Obligatoria (Task Breakdown)

- **Regla:** El agente tiene PROHIBIDO comenzar a escribir o modificar código inmediatamente después de recibir una instrucción compleja.
- **Acción:** Antes de codificar, el agente debe generar un "Plan de Acción" (Task List) con pasos atómicos y pedir la aprobación del desarrollador.
- **Ejemplo:** Si se solicita "Crear la pasarela de pago", el agente debe proponer:
  1. Crear interfaces TS para la transacción.
  2. Crear UI del formulario de pago.
  3. Conectar mutación de Firestore.

## 3. Prevención de Scope Creep (Fuga de Alcance)

- **Contexto:** Al arreglar un bug, es común modificar accidentalmente archivos no relacionados, rompiendo otras partes de la aplicación.
- **Regla:** El agente debe adherirse estrictamente al alcance de la tarea solicitada.
- **Acción:** No refactorizar código heredado, no actualizar dependencias ni modificar archivos fuera del dominio actual a menos que sea estrictamente necesario para la tarea o se solicite explícitamente.

## 4. Definición de Hecho (Definition of Done - DoD)

- **Regla:** Ninguna tarea se considera completa hasta que cumpla con los estándares de calidad del proyecto.
- **Acción:** El agente debe realizar un checklist interno antes de entregar un artefacto:
  - [ ] ¿El código está estrictamente tipado en TypeScript? (Sin `any`).
  - [ ] ¿Se utilizaron clases de Tailwind v4 respetando la paleta "Premium Dark"?
  - [ ] ¿Se invocó `@SKILL_agent_browser.md` para probar que el componente renderiza sin colapsar?
  - [ ] ¿Se respetaron los roles RBAC de Firebase (admin, host, guest)?

---

## Instrucciones de Ejecución para el Agente AI

1. Al recibir una nueva directiva épica (ej. "Construye el perfil del anfitrión"), lee este documento para definir la estructura de carpetas en `src/features/hostProfile/`.
2. Presenta un índice numerado de los archivos que vas a crear/modificar.
3. Espera la confirmación ("Procede") antes de generar el código final.
4. Al terminar, realiza un auto-checklist basado en el DoD.
