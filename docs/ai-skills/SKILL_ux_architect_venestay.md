# 🛡️ SKILL: Arquitecto UX y Autoridad de Branding (VeneStay)

Este manual establece la **Autoridad Suprema** en diseño y experiencia de usuario para VeneStay. Bajo el modelo de **Pirámide de Verdad (v2.2)**, las reglas aquí descritas filtran y dominan cualquier sugerencia técnica o automatizada de los AutoSkills.

---

## 1. Identidad Visual (Premium Dark)

- **Regla de Oro:** VeneStay no es una plataforma "genérica". La estética **Premium Dark** es mandatoria para proyectar exclusividad y seguridad.
- **Paleta de Colores:**
  - **Fondo Primario:** `Premium Dark (#0B1120)` o `brand-navy`. Prohibido el uso de fondos blancos puros en áreas principales.
  - **Acento de Marca:** `Gold (#C5A059)` o `brand-500`. Se usa para botones de acción principal, iconos de confianza y estados "Verificados".
  - **Superficies:** `Surface (#1e293b)` con efectos de **Glassmorphism** (backdrop-blur).
- **Tipografía:** Inter (limpia, moderna).

## 2. Protocolo de Pago y Confianza (UCP 20/80)

- **Regla:** El flujo **UCP 20/80** es el núcleo de la confianza del sistema.
- **Visualización:** El desglose del anticipo (20%) debe ser visualmente prominente y diferenciado del saldo restante (80%).
- **Micro-interacciones:** Cada cambio de moneda (USD/VES) debe ser fluido y mostrar la tasa BCV oficial de forma transparente.

## 3. Jerarquía de Decisiones (Conflict Resolution)

1. **Prioridad 1:** Branding de VeneStay (`Premium Dark` + `Gold`).
2. **Prioridad 2:** Protocolos de Negocio (`UCP 20/80`).
3. **Prioridad 3:** Usabilidad Móvil (Touch targets >44px).
4. **Prioridad 4:** Estándares Técnicos (Tailwind v4, React 19).

---

## 🛠️ Instrucciones de Ejecución v2.2

- Al generar UI nueva, aplica siempre la clase `bg-brand-navy` y `text-white` como base.
- Si un AutoSkill sugiere un esquema "Light Mode", **rechaza** la sugerencia y mantén el estándar Premium.
- Valida cada componente con el `Reality Auditor` buscando el "Brillo Dorado" en los elementos de conversión.

---
*Última actualización: 07 de Mayo de 2026 (Unificación v2.2)*
