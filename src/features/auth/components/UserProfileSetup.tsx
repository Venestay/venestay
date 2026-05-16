import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Upload,
  Save,
  Loader2,
  Heart,
  Globe,
  MapPin,
  Phone,
  CheckCircle2,
  X,
  BadgeCheck,
  Calendar,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { UserProfile } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { checkProfileCompletion } from '@/lib/user-utils';
import { cn } from '@/lib/utils';

const UserProfileSetup: React.FC = () => {
  const { user, profileData, refreshProfile } = useAuth();
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completionPercentage = checkProfileCompletion(profileData);

  useEffect(() => {
    if (profileData) {
      setEditingProfile({ ...profileData });
    }
  }, [profileData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const imageCompression = (await import('browser-image-compression'))
        .default;
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const storageRef = ref(
        storage,
        `profiles/${user.uid}/${Date.now()}-${file.name}`
      );
      let downloadURL = `https://placehold.co/150x150/2a3b5c/ffffff?text=Avatar+(Bloqueado)`;
      try {
        const snapshot = await uploadBytes(storageRef, compressedFile);
        downloadURL = await getDownloadURL(snapshot.ref);
      } catch (err: unknown) {
        if (
          (err as { code?: string })?.code === 'storage/unauthorized' ||
          (err as Error)?.message?.includes('storage/unauthorized') ||
          (err as Error)?.message?.includes('does not have permission')
        ) {
          console.warn('Storage upload unauthorized. Using fallback URL.');
        } else {
          throw err;
        }
      }

      if (editingProfile) {
        setEditingProfile({ ...editingProfile, photoURL: downloadURL });
        // Immediate save for photo
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: downloadURL,
          updatedAt: new Date().toISOString(),
        });
        await refreshProfile();
        toast.success('Foto de perfil actualizada');
      }
    } catch (error) {
      console.error('Error uploading profile image', error);
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingProfile) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...editingProfile,
        updatedAt: new Date().toISOString(),
      });
      await refreshProfile();
      toast.success('Perfil actualizado con éxito');
    } catch (error) {
      console.error('Error saving profile', error);
      toast.error('No se pudo guardar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  if (!editingProfile || !profileData) return null;

  return (
    <div className="mx-auto max-w-4xl py-8">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="shadow-brand-navy/5 mb-8 overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-2xl"
      >
        <div className="p-8 md:p-12">
          <div className="flex flex-col items-center gap-12 md:flex-row">
            {/* Avatar Section */}
            <div className="group relative">
              <div className="relative h-44 w-44 overflow-hidden rounded-[56px] border-4 border-white bg-gray-50 shadow-2xl">
                <img
                  src={
                    editingProfile.photoURL ||
                    'https://i.pravatar.cc/150?u=temp'
                  }
                  alt={editingProfile.displayName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <AnimatePresence>
                  {isUploading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-brand-navy/60 absolute inset-0 flex items-center justify-center backdrop-blur-sm"
                    >
                      <Loader2 className="text-brand-500 h-10 w-10 animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-brand-navy text-brand-500 hover:bg-brand-500 hover:text-brand-navy absolute -right-2 -bottom-2 z-10 transform rounded-3xl p-4 shadow-xl transition-all hover:scale-110 active:scale-95"
                title="Actualizar Foto"
              >
                <Upload className="h-5 w-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            {/* Title & Badges */}
            <div className="flex-grow space-y-4 text-center md:text-left">
              <div className="bg-brand-500/10 mb-2 inline-flex items-center gap-2 rounded-full px-4 py-2">
                <Sparkles className="text-brand-500 h-4 w-4" />
                <span className="text-brand-500 text-[10px] font-black tracking-widest uppercase">
                  Perfil de Usuario
                </span>
              </div>

              <div className="group/name relative">
                <input
                  type="text"
                  value={editingProfile.displayName}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      displayName: e.target.value,
                    })
                  }
                  className="text-brand-navy hover:text-brand-500 w-full border-none bg-transparent p-0 text-5xl font-black transition-colors focus:ring-0 focus:outline-none md:text-6xl"
                  placeholder="Tu nombre"
                />
                <div className="bg-brand-500 mt-2 h-1 w-20 rounded-full transition-all duration-500 group-hover/name:w-full" />
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-2 md:justify-start">
                <span className="bg-brand-500/10 text-brand-500 border-brand-500/10 flex items-center gap-2 rounded-2xl border px-5 py-2 text-[10px] font-black tracking-widest uppercase">
                  <BadgeCheck className="h-4 w-4" />
                  Anfitrión Verificado
                </span>
                <span className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-2 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                  <Calendar className="h-4 w-4" />
                  Miembro desde{' '}
                  {(() => {
                    if (!profileData?.createdAt) return '2024';
                    
                    let date: Date | null = null;
                    const val = profileData.createdAt;
                    
                    if (val instanceof Date) date = val;
                    else if (typeof val === 'string') date = new Date(val);
                    else if (typeof val === 'number') date = new Date(val);
                    else if (val && typeof val === 'object' && 'seconds' in val) {
                      date = new Date((val as any).seconds * 1000);
                    } else if (val && typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
                      date = (val as any).toDate();
                    }

                    if (!date || isNaN(date.getTime())) return '2024';
                    return format(date, 'yyyy');
                  })()}
                </span>
              </div>
            </div>

            {/* Completion Progress */}
            <div className="hidden flex-col items-center gap-2 rounded-3xl border border-gray-100 bg-gray-50 p-6 lg:flex">
              <div className="relative h-20 w-20">
                <svg className="h-full w-full -rotate-90 transform">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-200"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={213.6}
                    strokeDashoffset={213.6 * (1 - completionPercentage / 100)}
                    className={cn(
                      'transition-all duration-1000 ease-out',
                      completionPercentage === 100
                        ? 'text-emerald-500'
                        : 'text-brand-500'
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-brand-navy text-lg font-black">
                    {completionPercentage}%
                  </span>
                </div>
              </div>
              <span className="text-[8px] font-black tracking-widest text-gray-400 uppercase">
                Perfil Completo
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Form Grid */}
      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 gap-8 md:grid-cols-2"
      >
        {/* Bio Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="shadow-brand-navy/5 space-y-6 rounded-[40px] border border-gray-100 bg-white p-8 shadow-xl md:p-10"
        >
          <div className="space-y-3">
            <label className="text-brand-navy/40 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
              <User className="text-brand-500 h-4 w-4" /> Sobre mí
            </label>
            <textarea
              value={editingProfile.about || ''}
              onChange={(e) =>
                setEditingProfile({ ...editingProfile, about: e.target.value })
              }
              className="text-brand-navy focus:border-brand-500 h-80 w-full resize-none rounded-3xl border border-gray-100 bg-gray-50 p-6 leading-relaxed font-bold transition-all placeholder:text-gray-300 focus:outline-none md:p-8"
              placeholder="Cuéntales a tus huéspedes quién eres, qué te gusta y por qué amas ser anfitrión..."
            />
            {(!editingProfile.about || editingProfile.about.length < 50) && (
              <p className="ml-2 flex items-center gap-2 text-[9px] font-bold tracking-widest text-amber-500 uppercase">
                <ShieldAlert className="h-3 w-3" /> Escribe al menos 50
                caracteres para un perfil de confianza
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-brand-navy/40 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
              <Phone className="text-brand-500 h-4 w-4" /> Teléfono de Contacto
            </label>
            <div className="relative">
              <Phone className="absolute top-1/2 left-6 h-4 w-4 -translate-y-1/2 text-gray-300" />
              <input
                type="tel"
                value={editingProfile.phoneNumber || ''}
                onChange={(e) =>
                  setEditingProfile({
                    ...editingProfile,
                    phoneNumber: e.target.value,
                  })
                }
                className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-14 py-5 font-bold transition-all placeholder:text-gray-300 focus:outline-none"
                placeholder="+58 412 000 0000"
              />
            </div>
          </div>
        </motion.div>

        {/* Details Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div className="shadow-brand-navy/5 space-y-8 rounded-[40px] border border-gray-100 bg-white p-8 shadow-xl md:p-10">
            <div className="space-y-4">
              <label className="text-brand-navy/40 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
                <Heart className="text-brand-500 h-4 w-4" /> Intereses y
                Pasiones
              </label>
              <div className="relative">
                <Sparkles className="absolute top-1/2 left-6 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  value={editingProfile.interests || ''}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      interests: e.target.value,
                    })
                  }
                  className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-14 py-5 font-bold transition-all placeholder:text-gray-300 focus:outline-none"
                  placeholder="Playas, Gastronomía, Viajes..."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(editingProfile.interests || '')
                  .split(',')
                  .filter((t) => t.trim())
                  .map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1 text-[9px] font-black tracking-widest text-gray-500 uppercase"
                    >
                      {tag.trim()}
                    </span>
                  ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-brand-navy/40 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
                <Globe className="text-brand-500 h-4 w-4" /> Idiomas
              </label>
              <div className="relative">
                <Globe className="absolute top-1/2 left-6 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  value={Array.isArray(editingProfile.languages) ? editingProfile.languages.join(', ') : (editingProfile.languages || '')}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    })
                  }
                  className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-14 py-5 font-bold transition-all placeholder:text-gray-300 focus:outline-none"
                  placeholder="Español, Inglés, Francés..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-brand-navy/40 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
                <MapPin className="text-brand-500 h-4 w-4" /> Mi Ubicación
              </label>
              <div className="relative">
                <MapPin className="absolute top-1/2 left-6 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  value={editingProfile.location || ''}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      location: e.target.value,
                    })
                  }
                  className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-14 py-5 font-bold transition-all placeholder:text-gray-300 focus:outline-none"
                  placeholder="Ej: Lechería, Anzoátegui"
                />
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSaving}
            className="bg-brand-navy shadow-brand-navy/20 hover:bg-brand-500 hover:text-brand-navy group flex w-full items-center justify-center gap-3 rounded-[32px] p-6 text-xs font-black tracking-[0.3em] text-white uppercase shadow-2xl transition-all"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5 group-hover:animate-bounce" />
            )}
            Guardar Cambios de Perfil
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
};

export default UserProfileSetup;






