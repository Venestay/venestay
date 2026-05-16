# Niveles de Acceso y Roles: admin@venestay.com

> [!IMPORTANT]
> **RECORDATORIO DE IMPLEMENTACIÓN (Seguridad Administrativa)**
> - **Estado Actual**: Perfil de Super Admin activo (Control Total).
> - **Pendiente**: Implementar RBAC (Role-Based Access Control) y sistema de Logs de Auditoría para escalar el equipo de soporte.


Este documento detalla los permisos y capacidades asignadas al usuario administrador principal dentro de la plataforma VeneStay.

---

## 🔑 Atributos del Perfil
El usuario posee los siguientes identificadores de confianza máxima en la base de datos:

| Atributo | Valor | Descripción |
| :--- | :--- | :--- |
| `role` | `admin` | Identificador maestro para reglas de seguridad (Firestore/Storage). |
| `isIdentityVerified` | `true` | Salta los bloqueos de identidad en el checkout. |
| `kycStatus` | `VERIFIED` | Estado de verificación documental legal completado. |
| `trustScore` | `100` | Puntuación de confianza máxima en el sistema. |

---

## 🛡️ Capacidades y Accesos Desbloqueados

### 1. Gestión de Propiedades (Listings)
- **Lectura/Escritura Total**: Capacidad de editar, pausar o eliminar cualquier propiedad en la plataforma, sin importar quién sea el dueño.
- **Validación de Fotos**: Permiso para gestionar el almacenamiento de imágenes de cualquier propiedad en Firebase Storage.

### 2. Gestión de Reservas (Bookings)
- **Auditoría Financiera**: Acceso a ver los comprobantes de pago de todos los huéspedes.
- **Control de Estados**: Capacidad de intervenir en disputas o cambios de estado de reservas ajenas.

### 3. Ecosistema Pasaporte (KYC)
- **Auditor de Identidad**: Permiso exclusivo para acceder al directorio privado `/kyc/` en Storage.
- **Aprobador**: Capacidad de cambiar el estado de verificación de otros usuarios de `PENDING_REVIEW` a `VERIFIED`.

### 4. Inteligencia Financiera
- **Dashboard Global**: Acceso a ver métricas de ingresos totales, comisiones generadas y estadísticas de crecimiento del marketplace.
- **Tier Preferencial**: El administrador opera bajo el esquema de comisión más bajo (10%) por defecto.

---

## 📜 Array de Permisos Específicos (`permissions`)
El usuario tiene inyectados los siguientes tokens de permiso para la lógica de la interfaz:
1.  `manage_listings`: Acceso a herramientas de edición global de alojamientos.
2.  `manage_bookings`: Supervisión de todas las transacciones de la plataforma.
3.  `manage_users`: Capacidad de ver y gestionar perfiles de otros usuarios.
4.  `audit_kyc`: Acceso al futuro panel de revisión de documentos legales.
5.  `view_financials`: Acceso a reportes de ganancias y comisiones.

---

## 📊 Análisis de Cumplimiento: Estándar de Marketplace
| Criterio | Estado | Evaluación |
| :--- | :--- | :--- |
| **Moderación de Propiedades** | ✅ Activo | Cumple con estándares de Airbnb/Booking para control de calidad. |
| **Gestión de Disputas** | ✅ Activo | Acceso total a pagos y estados para resolución de conflictos. |
| **Auditoría KYC** | ✅ En Fase C | Sistema de verificación de identidad robusto para seguridad legal. |
| **Logs de Auditoría** | ❌ Pendiente | Se recomienda registrar quién y cuándo modifica datos sensibles. |
| **Roles Granulares** | ❌ Pendiente | Escalable a roles como "Moderador", "Soporte" y "Finanzas". |

**Puntuación de Cumplimiento Actual: 8/10**

---

> [!TIP]
> **Próxima Conversación - Escalabilidad Administrativa**:
> Al expandir el equipo de VeneStay, el primer paso técnico deberá ser la creación de la colección `admin_logs` en Firestore para registrar todas las acciones realizadas por los usuarios con `role: 'admin'`.

