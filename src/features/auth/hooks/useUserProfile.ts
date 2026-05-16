/**
 * useUserProfile — Adaptador del perfil para ProfileSettings.
 *
 * skill: vercel-react-best-practices → client-swr-dedup / rerender-split-combined-hooks
 *
 * ANTES: Abría su propio onSnapshot a /users/{uid} — duplicando el listener de AuthContext.
 * AHORA: Lee profileData desde AuthContext (fuente de verdad única).
 *        Solo gestiona el estado de guardado (saving) y la acción de escritura (updateProfile).
 *
 * Beneficio: 1 sola suscripción Firestore activa por sesión en lugar de 2.
 */
import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { UserProfile } from '@/features/auth/types';
import * as userService from '@/services/user-service';
import { toast } from 'sonner';

export const useUserProfile = () => {
  const { user, profileData, loading } = useAuth();
  const [saving, setSaving] = useState(false);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    setSaving(true);
    try {
      await userService.updateUserProfile(user.uid, data);
      toast.success('Pasaporte VeneStay actualizado');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  return {
    profile: profileData,
    loading,
    saving,
    updateProfile,
  };
};
