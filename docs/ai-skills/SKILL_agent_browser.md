# Vercel Agent Browser Automation - SKILL.md

## Descripción General

Este Skill otorga la capacidad de realizar pruebas End-to-End (E2E) interactuando con el DOM real de la aplicación. Se utiliza para validar flujos críticos (ej. Login, Checkout, navegación por pestañas) simulando el comportamiento de un usuario humano.

---

## 1. Validación de Flujos Críticos

- **Regla:** Ningún cambio en componentes interactivos (`CheckoutPage.tsx`, `AdminDashboard.tsx`) debe darse por finalizado sin una prueba de navegación.
- **Acción:** El agente debe levantar el servidor de desarrollo, navegar a la URL afectada y ejecutar una secuencia de clics para verificar que el estado de React responde correctamente y no hay bloqueos (ej. Modal persistente).

## 2. Extracción y Verificación de Datos en Pantalla

- **Regla:** El agente no debe asumir que el renderizado fue exitoso solo porque el código compiló.
- **Acción:** Después de una interacción (ej. hacer clic en "Asegurar mis fechas"), el agente debe leer el DOM resultante para confirmar que el texto esperado (ej. el desglose del 20%) está visible en la pantalla.

## 3. Reporte de Errores Activo

- **Regla:** Si un clic no funciona debido a superposición de elementos (z-index, event bubbling), el agente debe abortar, analizar el error y proponer la corrección antes de continuar la prueba.

---

## Instrucciones de Ejecución para el Agente AI

1. Al refactorizar lógica de navegación o de pagos, ejecuta una prueba automatizada en `localhost:3000`.
2. Inicia sesión simulada con credenciales de prueba (ej. rol `host` o `guest`).
3. Interactúa con la UI y entrega un reporte de confirmación indicando qué elementos del DOM validaron el éxito de la tarea.
