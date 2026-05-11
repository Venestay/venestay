# AGENTS.md - Spec Driven Dev Basico (VeneStay)

Este documento define como trabajar con especificaciones pequenas y claras para avanzar en desarrollo, maquetado UI y logica sin romper el flujo del proyecto.

## 1) Contexto del proyecto

- Stack: React 19 + TypeScript + Vite.
- Entrada principal: `App.tsx`.
- Componentes UI: `components/`.
- Datos mock: `constants.tsx`.
- Tipos de dominio: `types.ts`.
- Validacion minima: `npm run lint` (TypeScript no emit).

## 1.1 Principios de arquitectura (obligatorios)

- Toda logica de negocio/UI state debe vivir en custom hooks (`useXxx`), no dentro del JSX del componente.
- Toda integracion externa (APIs, Firebase, SDKs) debe encapsularse en `services/`.
- Organizar el codigo por features (modulos funcionales), no por tipo tecnico global.

## 2) Objetivo de trabajo (SDD)

Antes de tocar codigo, toda tarea debe tener una mini especificacion que responda:

- Que problema de usuario resolvemos.
- Que comportamiento esperado debe ocurrir.
- Como validamos que quedo bien.

Si no existe esta mini spec, no se implementa.

## 3) Formato minimo de especificacion

Usar este bloque para cada tarea:

```md
## Spec: <nombre-corto>

### Objetivo

Como <tipo de usuario>, quiero <accion> para <beneficio>.

### Alcance

- Incluye:
- No incluye:

### UI / Maquetado

- Estados visuales esperados (default, loading, vacio, error, exito).
- Responsive esperado (mobile y desktop).
- Accesibilidad minima (labels, foco visible, texto legible).

### Logica

- Entradas:
- Reglas de negocio:
- Salidas esperadas:
- Casos borde:

### Criterios de aceptacion (checklist)

- [ ]
- [ ]
- [ ]

### Validacion tecnica

- [ ] `npm run lint` pasa.
- [ ] Prueba manual en flujo principal.
```

## 4) Flujo recomendado por tarea

1. Definir spec corta (10-20 lineas).
2. Maquetar primero estados visuales clave.
3. Implementar logica y enlazar eventos.
4. Validar criterios de aceptacion uno por uno.
5. Correr `npm run lint`.
6. Hacer ajuste final de texto/UX.

## 5) Reglas por area

### 5.1 UI / Maquetado

- Reutilizar componentes existentes antes de crear nuevos.
- Evitar estilos inline complejos; mantener consistencia de clases.
- Todo componente nuevo debe contemplar estado vacio y estado cargando (si aplica).
- Los componentes deben enfocarse en presentacion; la logica se consume desde hooks.

### 5.2 Logica

- Tipar siempre entradas/salidas con `types.ts` o tipos locales claros.
- Implementar la logica en custom hooks por feature (ejemplo: `useListingsFilter`, `useBookingFlow`).
- Evitar mezclar reglas de negocio grandes dentro de JSX; el componente solo orquesta.
- Mantener calculos derivados con `useMemo` cuando aporte claridad/rendimiento.

### 5.3 Datos

- Si es mock, actualizar `constants.tsx` sin romper contrato de `Listing` y otros tipos.
- Si cambia el modelo de datos, actualizar tipo + usos + criterios de aceptacion.

### 5.4 Integraciones (services)

- Toda llamada a integraciones debe pasar por `services/` (ejemplo: `services/geminiService.ts`, `services/firebaseService.ts`).
- No llamar SDKs directamente desde componentes o vistas.
- Cada service debe exponer funciones tipadas, pequenas y testeables.

### 5.5 Arquitectura por features

- Estructura objetivo sugerida:

```txt
features/
  listings/
    components/
    hooks/
    services/
    types.ts
  booking/
    components/
    hooks/
    services/
    types.ts
shared/
  components/
  hooks/
  utils/
services/
```

- Cada feature define su propio flujo de UI + logica + servicios internos.
- `shared/` solo para piezas realmente reutilizables entre features.

## 6) Definicion de Done (DoD)

Una tarea se considera terminada si:

- La spec esta escrita y actualizada.
- Se cumplen todos los criterios de aceptacion.
- No hay errores de TypeScript (`npm run lint`).
- El flujo manual principal funciona sin regresiones visibles.
- Se realizo revision breve de seguridad (seccion 6.1).

## 6.1 Revision breve de seguridad (obligatoria)

Antes de cerrar cualquier tarea, validar:

- No se hardcodean API keys, tokens, secretos o credenciales en codigo, commits o docs.
- Ningun secreto se imprime en consola (`console.log`) ni se expone en UI, errores o alerts.
- Variables sensibles van en `.env` y nunca en archivos versionados (excepto `.env.example` sin valores reales).
- Integraciones se consumen via `services/` con manejo de errores que no filtre informacion sensible.
- Si se detecta una exposicion, la tarea se considera bloqueada hasta corregirla.

## 7) Plantillas rapidas de tareas comunes

### 7.1 Nueva seccion visual

- Objetivo: mostrar contenido nuevo sin afectar filtros ni navegacion.
- Minimo: estado default + responsive + estilo consistente.
- Validacion: renderiza en mobile/desktop y no rompe `App.tsx`.

### 7.2 Cambio de filtro o busqueda

- Objetivo: mejorar precision de resultados.
- Minimo: regla clara de filtrado + caso sin resultados + texto UX.
- Validacion: buscar por titulo/ubicacion/ciudad mantiene comportamiento esperado.

### 7.3 Cambio en detalle de alojamiento

- Objetivo: enriquecer informacion del modal/detalle.
- Minimo: datos tipados + estado visual estable + accion principal intacta.
- Validacion: abrir/cerrar detalle y reservar sigue funcionando.

## 8) Convenciones de entrega

En cada PR o entrega interna incluir:

- Resumen breve (que cambio).
- Spec usada (copiada o enlazada).
- Checklist de aceptacion marcada.
- Riesgos o deuda tecnica detectada.

---

Este `AGENTS.md` es intencionalmente basico. Si el proyecto crece, siguiente paso recomendado: agregar seccion de testing (unitario/e2e) y manejo formal de errores/telemetria.
