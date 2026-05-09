# 📸 SKILL: Antes y Después (Regresión Visual y de Rendimiento v2.2)

Este Skill previene regresiones visuales y de rendimiento obligando a realizar una comparación del estado del componente antes y después de aplicar cambios bajo el flujo **Harness Engineering**.

---

## 1. Captura de Estado Base y "Skeleton"

- **Regla:** Antes de modificar componentes de alto impacto (Dashboard, Checkout, Cards), se debe registrar el estado visual actual.
- **Validación de Carga (v2.2):** No solo comparamos el estado final, sino el estado de carga (Skeleton Loader). El "Before" y "After" deben demostrar que la percepción de velocidad ha mejorado.
- **Acción:** Capturar el componente renderizado y su estado de `Suspense`.

## 2. Verificación de Layout y Eficiencia

- **Regla:** Los cambios no deben generar Layout Shifts (CLS) ni romper la simetría de la cuadrícula "Premium Dark".
- **TTI & Performance:** El estado "After" debe validar las leyes **async-parallel** y **bundle-dynamic-imports**. Si el componente se ve igual pero carga más lento, la refactorización se considera fallida.
- **Acción:** Comparar el tiempo de interactividad percibido además del diseño visual.

## 3. Gobernanza de Evidencia

- **Regla (Disk Management):** Para mantener el flujo de pruebas activo, el agente debe purgar capturas obsoletas tras la validación final del "Before & After" para liberar espacio en disco.

---

## 🛠️ Instrucciones de Ejecución v2.2

1. **Estado Inicial:** Toma capturas del componente y de su Skeleton Loader (si aplica).
2. **Aplicación Harness:** Implementa optimizaciones (Zod, Lazy, Parallel).
3. **Análisis Comparativo:** Toma la captura final. El reporte debe indicar:
   - ¿Se mantiene la estética Premium?
   - ¿Ha mejorado la modularidad y el tiempo de carga?
   - ¿Cumple con el Zod Schema Coercion?
4. **Cierre:** Registra el éxito en `PROJECT_MEMORY.md` y limpia el buffer de imágenes.

---
*Última actualización: 07 de Mayo de 2026 (Unificación v2.2)*
