# Vercel Building Components - SKILL.md

## Descripción General

Este Skill establece los estándares arquitectónicos para la creación y organización de componentes de la interfaz de usuario, garantizando accesibilidad nativa y encapsulamiento.

---

## 1. Estructura de Archivos (Colocación)

- **Regla:** Los componentes no deben ser archivos aislados si requieren estilos específicos, tipos de TypeScript o pruebas.
- **Acción:** Agrupar componentes por dominio o característica (Feature-based folder structure) en lugar de separar todos los archivos por tipo (hooks, components, utils) indiscriminadamente.

## 2. Accesibilidad (a11y) Obligatoria

- **Regla:** Todo componente interactivo (botones, modales, inputs) debe ser accesible para lectores de pantalla y navegación por teclado.
- **Acción:** Incluir atributos `aria-*` adecuados, gestionar el foco al abrir/cerrar modales y usar elementos HTML semánticos en lugar de simples `<div>` con eventos `onClick`.

## 3. Interfaces Claras (TypeScript)

- **Regla:** Todo componente debe exportar su interfaz de propiedades (`Props`).
- **Acción:** Documentar cada prop con JSDoc breve si su propósito no es inmediatamente obvio, limitando la dependencia de objetos de configuración masivos.
