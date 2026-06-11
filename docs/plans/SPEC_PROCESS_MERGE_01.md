# SPEC-PROCESS-MERGE-01: Checklist Obligatorio de Merge & QA

## Objetivo
Establecer un proceso estricto para evitar regresiones, bugs de formato de archivo y código roto en la rama `qa` y `main`, garantizando la estabilidad del código base antes de cualquier despliegue.

## Origen
Este proceso surge de múltiples incidentes donde se inyectaron errores críticos (rutas rotas por `git checkout --theirs`, archivos corruptos con codificación inválida UTF-8 mediante PowerShell `Out-File`, y merges automáticos en archivos clave de enrutamiento).

## Políticas Obligatorias

Todo desarrollador o agente de AI trabajando en el proyecto debe completar la siguiente checklist **ANTES** de ejecutar un merge o push a `qa` o `main`.

### Checklist (El mismo integrado en el PULL_REQUEST_TEMPLATE)

1. **Revisión Manual de Resoluciones:** Si se usó `git checkout --theirs` para forzar un archivo, es obligatorio revisar los imports perdidos y rutas rotas de forma manual.
2. **Cero PowerShell Out-File:** Está estrictamente prohibido usar el comando `Out-File -Encoding UTF8` de PowerShell para restaurar archivos de código. Si se necesita restaurar un archivo al estado anterior, se DEBE usar `git checkout <commit> -- <file>`.
3. **Validación Estática:** Es mandatorio ejecutar `npm run lint` localmente. Si hay un solo warning o error, el push está bloqueado hasta resolverse.
4. **Validación Visual/Funcional:** Es mandatorio ejecutar `npm run dev` y hacer el recorrido funcional en el navegador local para validar la vista que se acaba de alterar.
5. **Merge Manual en Archivos Core:** Si existe un conflicto en `App.tsx` u otro archivo global de enrutamiento o layout, la resolución no debe ser automatizada y debe ser auditada manualmente.
6. **Seguridad:** Confirmar que no haya secretos expuestos, contraseñas quemadas en el código, ni variables de entorno expuestas mediante logs o alertas UI.

## Consecuencias
El incumplimiento de esta especificación resulta en un ticket clasificado como P0 y se considerará una regresión del flujo de desarrollo de SDD.
