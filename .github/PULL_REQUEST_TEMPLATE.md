## Contexto del PR
¿Qué problema o requerimiento resuelve este Pull Request?
- [Enlaza la tarea o issue aquí]

## Checklist Obligatorio de Merge (SPEC-PROCESS-MERGE-01)
*Lee cuidadosamente antes de marcar:*

- [ ] He revisado manualmente cada archivo para asegurar que no hay rutas o imports perdidos (Especialmente si usé `git checkout --theirs`).
- [ ] No usé `Out-File -Encoding UTF8` en PowerShell para restaurar archivos (si fue necesario, usé `git checkout <commit> -- <file>`).
- [ ] He ejecutado `npm run lint` localmente y **NO** hay errores de TypeScript / ESLint.
- [ ] He ejecutado `npm run dev` y he verificado **VISUALMENTE** en el navegador que el código funciona y la UI se ve correcta.
- [ ] Los conflictos de merge en `App.tsx` u otros archivos críticos de enrutamiento/estado global fueron resueltos **manualmente** y probados.
- [ ] No he expuesto secretos, API Keys ni información sensible en este código (logs, alertas, UI).

## Pruebas Adicionales
*(Opcional) Detalla aquí si se requiere alguna prueba especial o qué flujos de QA deben revisarse.*
