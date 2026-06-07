// Centraliza toda la información de contacto para evitar strings dispersos.
// Modificar aquí propaga el cambio a Footer e InfoModal automáticamente.
export const CONTACT_CONFIG = {
  whatsapp: {
    support: {
      url: import.meta.env.VITE_SUPPORT_WA_URL ?? 'https://wa.me/584248680233?text=Hola%2C%20necesito%20ayuda%20con%20mi%20reserva%20en%20VeneStay.',
      display: import.meta.env.VITE_SUPPORT_PHONE_DISPLAY ?? '+58 424-868-0233',
      ariaLabel: 'Contactar soporte de VeneStay por WhatsApp (abre WhatsApp)',
    },
    hostRegister: {
      url: import.meta.env.VITE_HOST_REGISTER_WA_URL ?? 'https://wa.me/584248680233?text=Me%20gustar%C3%ADa%20ingresar%20mi%20propiedad%20a%20Venestay%20y%20ser%20parte%20de%20los%20propietarios%20Fundadores.',
      display: import.meta.env.VITE_SUPPORT_PHONE_DISPLAY ?? '+58 424-868-0233',
      ariaLabel: 'Registrar mi propiedad en VeneStay por WhatsApp (abre WhatsApp)',
    },
  },
  policy: {
    effectiveDate: 'Julio 2025',
    version: '1.0',
  },
} as const;
