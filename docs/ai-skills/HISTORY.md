# 📜 Error Ledger & History — VeneStay

Este archivo registra las fallas detectadas por las Quality Gates y las lecciones aprendidas para asegurar el cumplimiento del Protocolo Master Orchestrator v2.1.

---

## [06-MAY-2026] - REPORTE DE INCIDENCIA:

**Contexto:** Restauración Forense y Refactorización de `ListingDetail.tsx`.

**Error Detectado:** `Unexpected token, expected "," (160:5)` — Llave de cierre `};` huérfana en el bloque de `useEffect`.

**Lección de IA:** "No debo realizar reemplazos masivos de bloques estructurales (como hooks con cleanup) sin verificar manualmente el balance de llaves y la integridad de la firma del componente".

**Regla Preventiva:** "Antes de cada `replace_file_content` en componentes de más de 500 líneas, realizar un `view_file` del bloque exacto [StartLine, EndLine] para confirmar el contexto de cierre".

---

## [06-MAY-2026] - REPORTE DE INCIDENCIA:

**Contexto:** Operación de Limpieza de Workspace.

**Error Detectado:** `Reversión Accidental de Git` — Pérdida de cambios locales no commiteados de la sesión v0.9.5.

**Lección de IA:** "Un comando destructivo como `git checkout -- .` nunca debe ejecutarse basándose en la asunción de que el estado local es irrelevante, especialmente tras un cambio de contexto de sesión".

**Regla Preventiva:** "Queda prohibido el uso de `git checkout -- .` o `git reset --hard` sin un `git stash` previo o una verificación explícita de cambios 'dirty' con `git status`".

---
