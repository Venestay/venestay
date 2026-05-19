# Mejores Prácticas de React (Vercel) - SKILL.md

## Descripción General

Este documento define las directrices maestras (Skill) de Vercel orientadas al rendimiento, arquitectura y eficiencia en aplicaciones React y Next.js. El objetivo principal es optimizar los Core Web Vitals (LCP, FID, CLS) y garantizar un código escalable y limpio.

---

## 1. Evitar Cascadas de Carga (Waterfalls)

- **Contexto:** Las llamadas secuenciales a bases de datos o APIs bloquean el renderizado del componente.
- **Regla:** Nunca utilices `await` de forma secuencial si los datos no dependen estrictamente uno del otro.
- **Acción:** Utiliza `Promise.all()` para paralelizar la obtención de datos (Data Fetching).
- **Ejemplo Correcto:**
  ```javascript
  // BIEN: Fetching en paralelo
  const [userData, propertiesData] = await Promise.all([
    getUser(userId),
    getProperties(),
  ]);
  ```
