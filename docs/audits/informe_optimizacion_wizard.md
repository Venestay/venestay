# INFORME TÉCNICO Y PLANIFICACIÓN: OPTIMIZACIÓN DEL WIZARD DE PROPIEDADES (LISTINGFORM)
**ID de Control:** INFO-WIZARD-S03-02  
**Estado:** PROPUESTO  
**Autor:** Antigravity (División de Ingeniería de IA)  
**Fecha:** 2026-05-28  

---

## 1. Introducción y Requerimientos de UX

En la versión actual de la plataforma, cuando un anfitrión edita una propiedad ya publicada, la experiencia de usuario (UX) presenta dos fricciones importantes:
1. **Navegación Obligatoria Completa**: Al modificar un dato básico en el Paso 1 (por ejemplo, el precio o el título), el wizard obliga al usuario a pulsar "Siguiente" a través del Paso 2 (Galería), Paso 3 (Mapa) y Paso 4 (Métodos de pago) únicamente para poder pulsar "Actualizar" al final. Esto genera una pérdida de tiempo innecesaria.
2. **Falsas Alarmas al Cerrar**: Si el usuario abre el formulario para inspeccionar los datos y lo cierra pulsando la "X" sin haber realizado ninguna modificación, el sistema dispara el modal de advertencia de "Cambios no guardados", lo cual resulta redundante y molesto.

**Objetivo de la Solución:**
*   **Botón Dinámico de Guardado Rápido**: Detectar cambios locales en la etapa activa. Si hay alguna modificación respecto a los valores iniciales y la etapa es válida, el botón "Siguiente" cambiará a "Actualizar", permitiendo guardar los cambios directamente desde esa etapa y cerrar el formulario.
*   **Cierre Frictionless en la X**: Si el usuario cierra el formulario desde la "X" habiendo o no modificado los datos bajo la condición de guardado o conformidad, evitar disparar el modal de advertencia innecesario cuando no hay riesgo real de pérdida involuntaria de información.

---

## 2. Arquitectura de la Solución

### A. Captura del Estado Inicial
Al inicializar el componente `ListingForm`, guardaremos una copia profunda del objeto `editingListing` en un `useRef` para tener la referencia exacta pre-edición:

```typescript
const initialListingSnapshot = useRef<Listing | null>(null);

useEffect(() => {
  if (editingListing && !initialListingSnapshot.current) {
    initialListingSnapshot.current = JSON.parse(JSON.stringify(editingListing));
  }
}, [editingListing]);
```

### B. Detección de Cambios por Etapa
Implementaremos una función utilitaria `isStepModified(currentStep: number): boolean` que compare únicamente los campos validados en la etapa activa contra la referencia original:

```typescript
const isStepModified = (currentStep: number): boolean => {
  if (editingListing.id.startsWith('listing-')) return false; // Solo aplica para edición de existentes
  if (!initialListingSnapshot.current) return false;

  const currentData = getStepData(currentStep);
  const originalListing = initialListingSnapshot.current;

  // Mapeamos los campos originales equivalentes al paso actual
  const originalData = (() => {
    switch (currentStep) {
      case 1:
        return {
          title: originalListing.title,
          description: originalListing.description,
          pricePerNight: originalListing.pricePerNight,
          city: originalListing.city,
          maxGuests: originalListing.maxGuests,
          bedrooms: originalListing.bedrooms,
          beds: originalListing.beds,
          baths: originalListing.baths,
          buildingFloors: originalListing.buildingFloors,
          propertyFloor: originalListing.propertyFloor,
          constructionYear: originalListing.constructionYear,
          minNights: originalListing.minNights,
          // Campos adicionales de políticas y reserva visibles en StepGeneral
          cancellationPolicy: originalListing.cancellationPolicy,
          bookingMode: originalListing.bookingMode,
        };
      case 2:
        return {
          images: originalListing.images,
          environmentPhotos: originalListing.environmentPhotos,
        };
      case 3:
        return {
          latitude: originalListing.latitude,
          longitude: originalListing.longitude,
          manualAddress: originalListing.manualAddress,
        };
      case 4:
        return {
          paymentMethods: originalListing.paymentMethods,
        };
      default:
        return {};
    }
  })();

  // Comparamos el paso actual agregando campos especiales del Step 1
  const currentStepFields = {
    ...currentData,
    ...(currentStep === 1 ? {
      cancellationPolicy: editingListing.cancellationPolicy,
      bookingMode: editingListing.bookingMode,
    } : {})
  };

  return JSON.stringify(currentStepFields) !== JSON.stringify(originalData);
};
```

---

## 3. Cambios Propuestos en la UI

### A. Comportamiento Dinámico del Botón Siguiente
Modificaremos la barra de acciones inferior de `ListingFormContent` para alternar dinámicamente el botón de submit basándonos en la detección de cambios:

*   **Si `isStepModified(step)` es verdadero en pasos 1, 2 o 3:**
    El botón de la derecha se renderiza con el texto **"Actualizar Propiedad"**, de tipo `submit` y con color `bg-brand-500` (oro/acento), permitiendo la actualización inmediata.
*   **Si `isStepModified(step)` es falso:**
    El botón se mantiene como **"Siguiente →"** de tipo `button` con navegación regular a la siguiente pestaña.

```tsx
{step < 4 ? (
  isStepModified(step) ? (
    <button
      type="submit"
      disabled={isSaving || isUploading}
      className="bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase shadow-xl transition-all flex-grow disabled:opacity-50"
    >
      {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><Check className="h-4 w-4" /> Actualizar Propiedad</>}
    </button>
  ) : (
    <button
      type="button"
      onClick={handleNextStep}
      disabled={!isStepValid({ step, data: getStepData(step) } as unknown as FormStepState)}
      className={cn(
        "flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase shadow-xl transition-all flex-grow",
        isStepValid({ step, data: getStepData(step) } as unknown as FormStepState)
          ? "bg-brand-navy text-white hover:bg-brand-500 hover:text-brand-navy"
          : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
      )}
    >
      Siguiente <ArrowRight className="h-4 w-4" />
    </button>
  )
) : (
  <button type="submit" disabled={isSaving || isUploading} className="bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase shadow-xl transition-all flex-grow disabled:opacity-50">
    {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><Check className="h-4 w-4" /> {editingListing.id.startsWith('listing-') ? 'Publicar Propiedad' : 'Actualizar Propiedad'}</>}
  </button>
)}
```

### B. Control del Modal de Cierre de la "X"
Reemplazaremos el llamado directo a `setShowWarningModal(true)` por una función controladora `handleCloseAttempt()` que evalúe si existen cambios pendientes de guardar en el formulario general:

```typescript
const handleCloseAttempt = () => {
  // Comparamos el estado actual del listado completo contra el snapshot inicial
  const hasChanges = (() => {
    if (editingListing.id.startsWith('listing-')) {
      // Para nuevas propiedades, si ya escribió campos válidos, mostramos advertencia
      return editingListing.title.trim() !== '' || editingListing.images.length > 0;
    }
    if (!initialListingSnapshot.current) return false;
    return JSON.stringify(editingListing) !== JSON.stringify(initialListingSnapshot.current);
  })();

  if (!hasChanges) {
    // Si NO hay cambios respecto al estado original, cerramos directamente sin molestar al usuario
    setEditingListing(null);
  } else {
    // Si hay cambios no guardados, abrimos el modal de confirmación
    setShowWarningModal(true);
  }
};
```

---

## 4. Plan de Verificación y QA Gate

Realizaremos las siguientes pruebas exhaustivas para certificar la calidad:
1.  **Edición sin cambios**: Abrir una propiedad publicada en el dashboard. Hacer click en la "X" del wizard sin modificar ningún dato. Comprobar que el modal se cierra de forma inmediata sin disparar el popup de advertencia.
2.  **Modificación parcial y guardado rápido**:
    *   Editar el título de una propiedad en el paso 1 (GENERAL).
    *   Verificar que el botón "Siguiente" cambie instantáneamente a "Actualizar Propiedad".
    *   Hacer click en "Actualizar Propiedad" y comprobar que la información se guarda y el modal se cierra exitosamente.
3.  **Cancelación con cambios**: Modificar un campo, pulsar la "X" y verificar que sí aparezca el modal "¿Salir sin guardar?" previniendo la pérdida involuntaria de cambios.
4.  **Flujo de Nueva Propiedad**: Verificar que en la creación de una nueva propiedad el wizard funcione de forma normal (requiriendo avanzar por todos los pasos hasta el final).
5.  **Compilación y Linting**: Ejecutar `npm run lint` para certificar cero advertencias y errores de TypeScript.

---

## 5. Próxima Acción

Quedamos a la espera de tu **aprobación** sobre este informe de planificación para emitir la spec atómica correspondiente e iniciar el desarrollo técnico.
