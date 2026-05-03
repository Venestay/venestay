# Vercel React Composition Patterns - SKILL.md

## Descripción General

Este documento define las directrices maestras (Skill) de Vercel enfocadas en la arquitectura de la interfaz de usuario (UI). El objetivo es construir componentes de React altamente escalables, mantenibles y limpios mediante el uso de patrones de composición, evitando componentes monolíticos y frágiles.

---

## 1. Evitar la Proliferación de Props Booleanas (Avoid Boolean Props)

- **Contexto:** A medida que un componente crece, los desarrolladores tienden a añadir múltiples propiedades booleanas (`isPrimary`, `isLarge`, `hasIcon`, `isDisabled`) creando componentes difíciles de leer y con cientos de combinaciones imposibles.
- **Regla:** Utiliza una propiedad de variante explícita (`variant`, `size`) o divide el componente si cumple funciones completamente distintas.
- **Acción:** Refactoriza las props booleanas en _Enums_ o _Strings_.
- **Ejemplo Correcto:**
  ```tsx
  // MAL: <Button isPrimary isLarge />
  // BIEN: <Button variant="primary" size="large" />
  ```
