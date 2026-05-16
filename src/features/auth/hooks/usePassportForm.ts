/**
 * usePassportForm — Custom hook del Pasaporte VeneStay
 *
 * Sprint 1 — Arquitectura
 * skill: vercel-react-best-practices → rerender-no-inline-components, rerender-derived-state-no-effect
 * skill: typescript-advanced-types → tipado estricto de entradas/salidas
 * AGENTS.md §1.1 → "Toda lógica de negocio/UI state debe vivir en custom hooks"
 *
 * Responsabilidades:
 *  - Gestiona los 6 campos del formulario Pasaporte
 *  - Sincroniza el estado inicial desde el perfil Firestore
 *  - Expone acciones: toggleInterest, toggleLanguage, toggleNotification
 *  - Valida y persiste vía useUserProfile.updateProfile
 *  - Detecta cambios no guardados (isDirty)
 *
 * NO gestiona: estados de modales (VerificationModal, PaymentMethodModal)
 * — esos permanecen en el componente orquestador ProfileSettings.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserProfile } from './useUserProfile';
import { TravelInterest, CurrencyPreference, UserProfile } from '../types';
import { toast } from 'sonner';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  email: boolean;
  whatsapp: boolean;
  push: boolean;
}

export interface PassportFormErrors {
  displayName?: string;
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
  const [currency, setCurrency] = useState<CurrencyPreference>('USD');
  const [selectedInterests, setSelectedInterests] = useState<TravelInterest[]>([]);
  const [languages, setLanguages] = useState<string[]>(['Español']);
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS);

  // ── Estado de UI ───────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<PassportFormErrors>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  // ── Sincronización desde Firestore ─────────────────────────────────────────
  // skill: rerender-derived-state-no-effect → solo sincronizamos al cargar,
  // no en cada render (profile como única dependencia)
  useEffect(() => {
    if (!profile) return;

    setDisplayName(profile.displayName || '');
    setBio(profile.bio || '');
    setCurrency(profile.currency || 'USD');
    setSelectedInterests((profile.selectedInterests as TravelInterest[]) || []);
    setLanguages(profile.languages || ['Español']);
    if (profile.notifications) {
      setNotifications(profile.notifications as NotificationPreferences);
    }
  }, [profile]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const trustScore = profile?.trustScore ?? 0;

  /**
   * isDirty: detecta si el usuario modificó algún campo respecto al perfil guardado.
   * skill: rerender-derived-state → derivar durante render, no en useEffect.
   * useMemo para no recalcular en renders no relacionados.
   */
  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      displayName !== (profile.displayName ?? '') ||
      bio !== (profile.bio ?? '') ||
      currency !== (profile.currency ?? 'USD') ||
      JSON.stringify(selectedInterests) !== JSON.stringify(profile.selectedInterests ?? []) ||
      JSON.stringify(languages) !== JSON.stringify(profile.languages ?? ['Español'])
    );
  }, [profile, displayName, bio, currency, selectedInterests, languages]);

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
    const newErrors: PassportFormErrors = {};

    if (displayName.length > 0 && displayName.length < 3) {
      newErrors.displayName = 'Tu nombre público debe ser descriptivo (mín. 3 caracteres)';
    }
    if (displayName.length > 50) {
      newErrors.displayName = 'El nombre es demasiado largo (máx. 50 caracteres)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Revisa los campos marcados en rojo');
      return;
    }

    await updateProfile({
      displayName,
      bio,
      currency,
      selectedInterests,
      languages,
      notifications,
    });
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
