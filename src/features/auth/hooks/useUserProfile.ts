import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { UserProfile } from '@/features/auth/types';
import * as userService from '@/services/user-service';
import { toast } from 'sonner';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = userService.subscribeToUserProfile(user.uid, (updatedProfile) => {
      setProfile(updatedProfile);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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
    profile,
    loading,
    saving,
    updateProfile
  };
};
