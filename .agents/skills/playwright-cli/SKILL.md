---
name: playwright-cli
description: "Herramienta y skill para la ejecución y creación de pruebas End-to-End (E2E) en el entorno local utilizando Playwright."
---

# Playwright CLI Skill

Esta skill se utiliza para la creación, ejecución y mantenimiento de pruebas End-to-End (E2E) y pruebas de integración utilizando el framework Playwright.

## Cuándo usar esta skill
- Cuando el Quality Gate (Nodo 4) requiera validar flujos visuales completos en navegadores reales.
- Cuando el usuario solicite crear o ejecutar pruebas locales (localhost) que involucren interacción de UI.
- Para verificar regresiones visuales o funcionales complejas que Vitest no puede cubrir.

## Comandos Principales
- **Ejecutar pruebas:** `npx playwright test`
- **Ejecutar pruebas en UI mode:** `npx playwright test --ui`
- **Generar código de prueba (Codegen):** `npx playwright codegen localhost:3000`
- **Instalar navegadores:** `npx playwright install`

## Reglas de Implementación en VeneStay
1. **Entorno Local:** Playwright está estrictamente destinado a pruebas contra el entorno de desarrollo local (`http://localhost:3000`).
2. **Archivos de Prueba:** Deben ubicarse en un directorio dedicado `tests/e2e/` o junto a la feature con sufijo `.spec.ts`.
3. **Selectores:** Priorizar atributos accesibles y `data-testid` para asegurar la estabilidad de las pruebas.
4. **Manejo de Autenticación:** Utilizar los comandos de setup de Playwright para inyectar cookies/tokens o utilizar el emulador de Firebase Auth.

> **Nota del Pipeline SDD:** Ninguna prueba E2E reemplaza los criterios de aceptación del Planner, sino que son la evidencia técnica de que el QA Gate ha sido superado localmente.
