# Plan de Implementación: Pasaporte VeneStay - Fase C (KYC & Auditoría)

> [!IMPORTANT]
> **CONTEXTO Y RECORDATORIO DE ESTADO (VeneStay Passport v2.2)**
> - **Fase A (Completada)**: Se creó la infraestructura base, el sistema de cálculo de Trust Score (0-100%) y la vista inicial del Pasaporte.
> - **Fase B (Completada)**: Se integró el Pasaporte en el flujo de negocio. Se implementó el "Gatekeeper" en el Checkout (bloqueo por score < 40%), se sincronizaron las comisiones del Admin Dashboard y se habilitó el badge de "Host Verificado". Se corrigieron permisos de Storage para `avatars/` y `kyc/`.
> - **Fase C (En Progreso)**: Implementación de validación documental legal (KYC). El objetivo es pasar del 60% al 100% de confianza mediante auditoría humana/admin.
> - **Pendiente Inmediato**: Crear el componente `KYCUploader.tsx` y el flujo de estados de revisión.


## Objetivo
Implementar el sistema de verificación documental (Know Your Customer) para validar legalmente la identidad de los usuarios, habilitando el nivel máximo de confianza y beneficios en la plataforma.

## Sprints de Ejecución

### Sprint C.1: Interfaz de Carga Documental
**Objetivo**: Permitir a los usuarios subir imágenes de sus documentos de identidad desde la sección de Pasaporte.
- **[NEW]** `src/features/passport/components/KYCUploader.tsx`: Componente de dropzone con validación de tipo de archivo y previsualización.
- **[MODIFY]** `src/features/passport/components/PassportManager.tsx`: Integración del uploader en la pestaña de seguridad.
- **Lógica**: Uso de `uploadUserDocument` (servicio de Storage ya configurado en la Fase B).

### Sprint C.2: Gestión de Estados KYC
**Objetivo**: Implementar el ciclo de vida del trámite de verificación.
- **[MODIFY]** `src/services/user-service.ts`: Añadir función `updateKYCStatus` y lógica de persistencia en Firestore.
- **[MODIFY]** `src/types/index.ts`: Asegurar la definición de estados (`NOT_STARTED`, `PENDING_REVIEW`, `VERIFIED`, `REJECTED`).
- **UI**: Feedback visual en tiempo real del progreso del trámite.

### Sprint C.3: Panel de Auditoría para Administradores
**Objetivo**: Crear la interfaz donde el equipo de VeneStay aprueba o rechaza los documentos.
- **[NEW]** `src/features/dashboard/components/KYCAuditPanel.tsx`: Lista de trámites pendientes con visor de imágenes.
- **[MODIFY]** `src/features/dashboard/components/AdminDashboard.tsx`: Nueva sección de "Verificaciones Pendientes".
- **Acciones**: Botones para aprobar (cambia `isIdentityVerified` a true) o rechazar (con campo para motivo).

### Sprint C.4: Refinamiento de Confianza (Trust Score)
**Objetivo**: Ajustar el algoritmo de confianza para dar peso a la validación legal.
- **[MODIFY]** `src/services/user-service.ts`: Actualizar `calculateTrustScore` para otorgar +40% de puntos adicionales por estado `VERIFIED`.
- **[MODIFY]** `src/features/listings/components/ListingDetail.tsx`: Asegurar que el badge de host verificado solo aparezca con el estado KYC validado.

### Sprint C.5: Optimización de Pago Móvil (Venezuela Pro)
**Objetivo**: Hacer que el método de Pago Móvil sea funcional con los datos bancarios reales de Venezuela.
- **[MODIFY]** `src/features/auth/components/PaymentMethodModal.tsx`: Añadir campos para Banco (Select), Teléfono (Input) y Cédula/RIF (Input con prefijo V/E/J).
- **[MODIFY]** `src/types/index.ts`: Actualizar la interfaz `PaymentMethod` para soportar estos campos específicos de transacciones locales.
- **UX**: Implementar validación de formato para números de teléfono venezolanos.

## Consideraciones de Seguridad

- **Privacidad**: Los documentos se almacenan en la carpeta `/kyc/` con reglas de acceso restringidas solo al dueño y administradores.
- **Borrado**: Al rechazar o actualizar un documento, el archivo anterior debe eliminarse de Storage para ahorrar espacio y reducir exposición de datos.

## Verificación Técnica
- Pruebas de carga de archivos (formatos JPG, PNG, PDF).
- Verificación de que el Trust Score se actualice inmediatamente tras la aprobación.
- Auditoría de reglas de Storage para confirmar que el directorio `/kyc/` es privado.
