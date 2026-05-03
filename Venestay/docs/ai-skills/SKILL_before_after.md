# Vercel Before and After (Visual Regression) - SKILL.md

## Descripción General

Este Skill previene regresiones visuales (CSS/Tailwind) obligando a realizar una comparación gráfica del componente antes y después de aplicar cambios estructurales o de estilo.

---

## 1. Captura de Estado Base

- **Regla:** Antes de modificar clases de Tailwind en componentes de alto impacto visual (Hero Section, PropertyCard, Navbars), se debe registrar el estado actual.
- **Acción:** Tomar una captura de pantalla del componente renderizado en el navegador local.

## 2. Verificación de Contraste y Layout

- **Regla:** Los cambios no deben alterar el espaciado interno (padding/margin) de manera que rompan la simetría de la cuadrícula (Grid/Flexbox) o disminuyan la legibilidad.
- **Acción:** Comparar la captura posterior a la modificación para asegurar que los elementos secundarios (ej. insignias de Escasez o Estrellas) no se superponen ni generan Layout Shifts.

---

## Instrucciones de Ejecución para el Agente AI

1. Antes de refactorizar la UI, toma una captura del estado inicial.
2. Aplica los cambios solicitados (ej. optimización de CRO, cambio de paleta).
3. Toma una captura final y realiza un análisis comparativo para garantizar que se respetan las reglas de diseño premium de la plataforma.
