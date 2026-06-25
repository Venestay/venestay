import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserProfile } from './useUserProfile';
import { TravelInterest, CurrencyPreference, UserProfile } from '../types';
import { toast } from 'sonner';
import { passportDraftSchema } from '../schemas/auth.schema';
import { calculateTrustScore } from '@/services/user-service';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  email: boolean;
  whatsapp: boolean;
  push: boolean;
}

export interface PassportFormErrors {
  displayName?: string;
  bio?: string;
}

export interface UsePassportFormReturn {
  // Datos del perfil (read-only, desde Firestore)
  profile: ReturnType<typeof useUserProfile>['profile'];
  loading: boolean;
  saving: boolean;
  isAvatarUploading: boolean;
  trustScore: number;

  // Campos del formulario
  displayName: string;
  setDisplayName: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  birthDate: string;
  setBirthDate: (v: string) => void;
  currency: CurrencyPreference;
  setCurrency: (v: CurrencyPreference) => void;
  selectedInterests: TravelInterest[];
  toggleInterest: (i: TravelInterest) => void;
  languages: string[];
  toggleLanguage: (l: string) => void;
  notifications: NotificationPreferences;
  toggleNotification: (channel: keyof NotificationPreferences) => void;

  // Estado de UI
  errors: PassportFormErrors;
  isPreviewMode: boolean;
  setIsPreviewMode: (v: boolean) => void;
  isDirty: boolean;

  // Acciones
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleAvatarChange: (file: File) => Promise<void>;
  handleRemoveAvatar: () => Promise<void>;
  handleAddPaymentMethod: (method: import('../types').PaymentMethod) => void;
  handleRemovePaymentMethod: (id: string) => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

// ─── Constantes hoistadas fuera del componente ────────────────────────────────
// skill: rendering-hoist-jsx → constantes estáticas fuera de componentes
export const ALL_INTERESTS: TravelInterest[] = [
  'Playa', 'Mascotas', 'Trabajo', 'Lujo', 'Aventura', 'Ciudad',
];

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  email: true,
  whatsapp: true,
  push: false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const usePassportForm = (): UsePassportFormReturn => {
  const { profile, loading, saving, updateProfile } = useUserProfile();

  // ── Estado del formulario ──────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [currency, setCurrency] = useState<CurrencyPreference>('USD');
  const [selectedInterests, setSelectedInterests] = useState<TravelInterest[]>([]);
  const [languages, setLanguages] = useState<string[]>(['Español']);
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS);

  // ── Estado de UI ───────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<PassportFormErrors>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Resetear inicialización cuando cambia el ID de usuario y limpiar claves de localStorage residuales/sensibles
  useEffect(() => {
    setIsInitialized(false);
    if (profile?.uid) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.toLowerCase().includes('kyc') || key.toLowerCase().includes('document') || key.toLowerCase().includes('sensitive'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => {
          localStorage.removeItem(k);
          console.log(`[Security] Removida clave de localStorage potencialmente sensible: ${k}`);
        });
      } catch (e) {
        console.warn('Error al limpiar claves de localStorage:', e);
      }
    }
  }, [profile?.uid]);

  const loadFromProfile = () => {
    if (!profile) return;
    setDisplayName(profile.displayName || '');
    setBio(profile.bio || '');
    setBirthDate((profile.profile?.birthDate as string) || '');
    setCurrency(profile.currency || 'USD');
    setSelectedInterests((profile.selectedInterests as TravelInterest[]) || []);
    setLanguages(profile.languages || ['Español']);
    if (profile.notifications) {
      setNotifications(profile.notifications as NotificationPreferences);
    }
  };

  // ── Sincronización desde Firestore y Borrador Local ────────────────────────
  useEffect(() => {
    if (!profile) return;

    // Verificar si hay un borrador local para este usuario
    const savedDraft = localStorage.getItem(`venestay_passport_draft_${profile.uid}`);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        // Validar y sanitizar con Zod
        const result = passportDraftSchema.safeParse(parsedDraft);
        if (result.success) {
          const draft = result.data;
          setDisplayName(draft.displayName);
          setBio(draft.bio || '');
          setBirthDate(draft.birthDate || (profile.profile?.birthDate as string) || '');
          setCurrency(draft.currency);
          setSelectedInterests(draft.selectedInterests);
          setLanguages(draft.languages);
          setNotifications(draft.notifications);
        } else {
          console.warn('[Passport] El borrador no cumple el esquema de validación:', result.error);
          loadFromProfile();
        }
      } catch (e) {
        console.warn('[Passport] Error al parsear el borrador local:', e);
        loadFromProfile();
      }
    } else {
      loadFromProfile();
    }
    setIsInitialized(true);
  }, [profile]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const trustScore = useMemo(() => calculateTrustScore(profile || {}), [profile]);

  /**
   * isDirty: detecta si el usuario modificó algún campo respecto al perfil guardado.
   * skill: rerender-derived-state → derivar durante render, no en useEffect.
   * useMemo para no recalcular en renders no relacionados.
   */
  const isDirty = useMemo(() => {
    if (!profile || !isInitialized) return false;
    return (
      displayName !== (profile.displayName ?? '') ||
      bio !== (profile.bio ?? '') ||
      birthDate !== ((profile.profile?.birthDate as string) ?? '') ||
      currency !== (profile.currency ?? 'USD') ||
      JSON.stringify(selectedInterests) !== JSON.stringify(profile.selectedInterests ?? []) ||
      JSON.stringify(languages) !== JSON.stringify(profile.languages ?? ['Español']) ||
      JSON.stringify(notifications) !== JSON.stringify(profile.notifications ?? DEFAULT_NOTIFICATIONS)
    );
  }, [profile, isInitialized, displayName, bio, birthDate, currency, selectedInterests, languages, notifications]);

  // ── Guardado de Borrador Reactivo ──────────────────────────────────────────
  useEffect(() => {
    if (!profile?.uid || !isInitialized) return;

    if (isDirty) {
      // Sanitizamos explícitamente: SOLO se guardan campos públicos y permitidos.
      // Quedan completamente fuera de aquí KYC y otros metadatos sensibles.
      const draft = {
        displayName,
        bio,
        birthDate,
        currency,
        selectedInterests,
        languages,
        notifications,
      };
      
      const validation = passportDraftSchema.safeParse(draft);
      if (validation.success) {
        localStorage.setItem(`venestay_passport_draft_${profile.uid}`, JSON.stringify(validation.data));
      }
    } else {
      localStorage.removeItem(`venestay_passport_draft_${profile.uid}`);
    }
  }, [isInitialized, isDirty, displayName, bio, currency, selectedInterests, languages, notifications, profile?.uid]);


  // ── Acciones de formulario ─────────────────────────────────────────────────

  /**
   * useCallback para evitar recreación en cada render.
   * skill: rerender-functional-setstate → usa función de actualización para prev state.
   */
  const toggleInterest = useCallback((interest: TravelInterest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  }, []);

  const toggleLanguage = useCallback((lang: string) => {
    setLanguages(prev =>
      prev.includes(lang)
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  }, []);

  const toggleNotification = useCallback((channel: keyof NotificationPreferences) => {
    setNotifications(prev => ({ ...prev, [channel]: !prev[channel] }));
  }, []);

  const handleAddPaymentMethod = useCallback((method: import('../types').PaymentMethod) => {
    const currentMethods = profile?.paymentMethods || [];
    updateProfile({ paymentMethods: [...currentMethods, method] });
  }, [profile, updateProfile]);

  const handleRemovePaymentMethod = useCallback((id: string) => {
    if (!profile) return;
    const currentMethods = profile.paymentMethods || [];
    const updatedMethods = currentMethods.filter(m => m.id !== id);
    updateProfile({ paymentMethods: updatedMethods });
  }, [profile, updateProfile]);

  const handleAvatarChange = useCallback(async (file: File) => {
    if (!profile) return;
    
    setIsAvatarUploading(true);
    try {
      const { uploadAvatar, deleteImageByUrl } = await import('@/services/storage-service');
      
      // 1. Borrar avatar anterior si existe
      if (profile.photoURL) {
        try {
          await deleteImageByUrl(profile.photoURL);
        } catch (e) {
          console.warn('[Passport] No se pudo borrar el avatar anterior:', e);
        }
      }

      // 2. Subir nuevo
      const photoURL = await uploadAvatar(profile.uid, file);
      await updateProfile({ photoURL });
      toast.success('Avatar actualizado con éxito');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('No se pudo subir la imagen');
    } finally {
      setIsAvatarUploading(false);
    }
  }, [profile, updateProfile]);

  const handleRemoveAvatar = useCallback(async () => {
    if (!profile || !profile.photoURL) return;

    setIsAvatarUploading(true);
    try {
      const { deleteImageByUrl } = await import('@/services/storage-service');
      
      // 1. Borrar de Storage
      await deleteImageByUrl(profile.photoURL);
      
      // 2. Limpiar de Firestore
      await updateProfile({ photoURL: '' });
      
      toast.success('Avatar eliminado');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('No se pudo eliminar el avatar');
    } finally {
      setIsAvatarUploading(false);
    }
  }, [profile, updateProfile]);

  // ── Validación ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const draft = {
      displayName,
      bio,
      birthDate,
      currency,
      selectedInterests,
      languages,
      notifications,
    };

    const result = passportDraftSchema.safeParse(draft);
    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: PassportFormErrors = {};
    result.error.issues.forEach(err => {
      const path = err.path[0] as keyof PassportFormErrors;
      if (path) {
        newErrors[path] = err.message;
      }
    });

    setErrors(newErrors);
    return false;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Revisa los campos marcados con error');
      return;
    }

    await updateProfile({
      displayName,
      bio,
      currency,
      selectedInterests,
      languages,
      notifications,
      profile: {
        ...profile?.profile,
        birthDate,
      },
    });

    if (profile?.uid) {
      localStorage.removeItem(`venestay_passport_draft_${profile.uid}`);
    }
  };


  return {
    // Perfil
    profile,
    loading,
    saving,
    trustScore,

    // Campos
    displayName,
    setDisplayName,
    bio,
    setBio,
    birthDate,
    setBirthDate,
    currency,
    setCurrency,
    selectedInterests,
    toggleInterest,
    languages,
    toggleLanguage,
    notifications,
    toggleNotification,

    // UI
    errors,
    isPreviewMode,
    setIsPreviewMode,
    isAvatarUploading,
    isDirty,

    // Acciones
    handleSubmit,
    handleAvatarChange,
    handleRemoveAvatar,
    handleAddPaymentMethod,
    handleRemovePaymentMethod,
    updateProfile,
  };
};
