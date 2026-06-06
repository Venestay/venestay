# VeneStay — Comercio Conversacional (WhatsApp & Jelou AI)
## Flujo de Reservas desde WhatsApp

Este documento desglosa y analiza la especificación del flujo de comercio conversacional de **VeneStay** integrado con la IA de **Jelou**, diseñado para simplificar y acelerar el proceso de reserva de hospedajes vacacionales directamente desde WhatsApp sin requerir descargas ni registros web complejos.

---

### 1. Arquitectura del Flujo y Estados de Sincronización (Firestore)

El flujo se divide en 4 pasos principales, cada uno con una acción del usuario, una respuesta de la IA (Jelou) y un estado de sincronización en tiempo real en la base de datos (Firestore):

| Paso | Fase del Flujo | Interacción en WhatsApp | Estado en Firestore |
|:---:|:---|:---|:---|
| **1** | **Descubrimiento de Propiedades** | El huésped solicita opciones de hospedaje (p. ej., *"Busco apto en Lechería por $120/noche"*). La IA procesa con lenguaje natural (NLP) y devuelve tarjetas interactivas con imágenes, detalles y el botón **"Reservar Ahora"**. | `EXPLORANDO` |
| **2** | **Filtro de Seguridad (Trust Score)** | El sistema verifica en segundo plano el historial/puntaje de seguridad del número de teléfono en menos de 1 segundo. Si el *Trust Score* es $\ge 75$, se aprueba el avance rápido. | `VALIDANDO_TRUST` |
| **3** | **Intención de Reserva (Esquema 20/80)** | Se pre-reserva la propiedad y se calcula el desglose de pago: **20% de depósito inmediato** para asegurar la reserva y **80% restante en el Check-in**. Se envían los datos bancarios automáticos (Pago Móvil/Transferencias). | `PENDING_PAYMENT` |
| **4** | **Carga del Pago y Sincronización** | El huésped envía una foto del comprobante de transferencia en el chat. Jelou sube el archivo a los servidores de VeneStay de inmediato. La reserva se marca para aprobación del host. | `PENDING_APPROVAL` |

---

### 2. Detalle Paso a Paso de la Interacción

#### Paso 1: Descubrimiento de Propiedades (Inbound)
* **Acción del Huésped:** 
  > *"Quiero buscar un apartamento en Lechería de 120$ la noche."*
* **Respuesta de Jelou AI:** 
  Presenta un carrusel o tarjeta de flujo interactivo con la imagen de la propiedad, el precio, la capacidad y un botón de acción rápida:
  * **Propiedad:** Apto Vista Mar - Complejo El Morro
  * **Precio:** $120 USD/noche
  * **Capacidad:** 4 huéspedes
  * **Acción:** `[ Reservar Ahora ]`

#### Paso 2: Filtro de Seguridad (Trust Score)
* **Acción del Huésped:** Hace clic en `[ Reservar Ahora ]`.
* **Proceso de Backend:** 
  Ejecuta una validación automatizada de seguridad e identidad del número telefónico en base a comportamiento previo y listas de confianza de la plataforma.
* **Respuesta de Jelou AI:**
  > *"🔒 Un momento por favor, estamos verificando su nivel de confianza en VeneStay Security Shield...*
  > *✅ **¡Verificación Exitosa!** Su Trust Score es de **88/100**. Cumple con los requisitos para reserva rápida directa en WhatsApp."*

#### Paso 3: Intención de Reserva (Modelo Financiero 20/80)
* **Acción del Huésped:** Confirma la intención de reserva y consulta los montos.
* **Respuesta de Jelou AI:**
  Calcula el desglose del total basándose en la política 20/80 para proteger tanto al huésped como al anfitrión:
  * **Pago Hoy (Depósito del 20%):** $126.00 USD (ejemplo con fees incluidos)
  * **Pago en Check-In (80% restante):** $504.00 USD
  * **Total:** $630.00 USD
  * **Instrucciones de Pago:** Envía de forma estructurada los datos de Pago Móvil o transferencia en Venezuela (Banesco, Titular, RIF, número telefónico).

#### Paso 4: Carga del Pago y Sincronización (Omnicanalidad)
* **Acción del Huésped:** Envía la imagen del comprobante de transferencia directamente en el chat de WhatsApp:
  > 📸 **`[Comprobante_Banesco.jpg]`**
* **Respuesta de Jelou AI:**
  > *"📥 Recibido. El comprobante fue subido a los servidores seguros de VeneStay.*
  > *Tu reserva ha pasado al estado **PENDIENTE DE APROBACIÓN**. Te avisaremos en unos minutos cuando el anfitrión valide la transacción en su panel web. ⚡"*

---

### 3. Beneficios de Negocio y Valor Comercial

1. **Fricción Cero para el Usuario (Cero Descargas):**
   * Más del 80% de los usuarios en Venezuela prefieren la mensajería instantánea para coordinar servicios. Al eliminar la necesidad de descargar una app o registrarse en un portal web pesado, la tasa de conversión aumenta sustancialmente.
2. **Sincronización Omnicanal Automática:**
   * La mensajería y la base de datos web están perfectamente conectadas. Cualquier cambio o actualización en el panel de administración web se notifica de inmediato al huésped en su WhatsApp personal, manteniendo la transparencia.
3. **Seguridad Contra Estafas (Trust Score & 20/80):**
   * El sistema de *Trust Score* previene fraudes, suplantaciones de identidad y comprobantes falsificados antes de proceder al bloqueo definitivo de fechas en el calendario, protegiendo el inventario de los anfitriones.
