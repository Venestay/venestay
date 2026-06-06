/**
 * ProfileSettings — Pasaporte VeneStay (Orquestador)
 *
 * Sprint 4 — Funcionalidades Marketplace:
 * - Avatar real upload (Firebase Storage).
 * - Borrado de métodos de pago.
 * - KYC PENDING_REVIEW.
 * - Orquestación de nuevas acciones del hook usePassportForm.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { usePassportForm, ALL_INTERESTS } from '../hooks/usePassportForm';
import VerificationModal from './VerificationModal';
import PaymentMethodModal from './PaymentMethodModal';
import ConfirmExitModal from './ConfirmExitModal';
import Navbar from '@/components/ui/Navbar';
import { motion } from 'motion/react';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { useBookingDraft } from '@/features/bookings/hooks/useBookingDraft';

// Sub-componentes
import { PassportHeader } from './passport/PassportHeader';
import { TransactionalEngine } from './passport/TransactionalEngine';
import { SecuritySection } from './passport/SecuritySection';
import { PublicProfile } from './passport/PublicProfile';
import { TravelerDNA } from './passport/TravelerDNA';
import { NotificationChannels } from './passport/NotificationChannels';
import { toast } from 'sonner';

import { getAuth } from 'firebase/auth';

const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const { restoreDraft } = useBookingDraft();

  // Estados de UI locales (apertura de modales)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const [isGeneratingQA, setIsGeneratingQA] = useState(false);

  // Toda la lógica de negocio y estado del formulario viene del hook
  const {
    profile,
    loading,
    saving,
    isAvatarUploading,
    trustScore,
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
    errors,
    isPreviewMode,
    setIsPreviewMode,
    isDirty,
    handleSubmit,
    handleAvatarChange,
    handleRemoveAvatar,
    handleAddPaymentMethod,
    handleRemovePaymentMethod,
    updateProfile,
  } = usePassportForm();

  const draft = React.useMemo(() => restoreDraft(), [restoreDraft]);
  const isKycVerified = React.useMemo(() => {
    return profile?.kycStatus === 'VERIFIED' || profile?.isIdentityVerified === true;
  }, [profile]);

  // Interceptar la recarga/cierre de la pestaña si el formulario tiene cambios
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar en tu pasaporte.';
        return 'Tienes cambios sin guardar en tu pasaporte.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleLogoClick = () => {
    if (isDirty) {
      setIsConfirmExitOpen(true);
    } else {
      navigate('/');
    }
  };

  const handleGenerateQAProfile = async () => {
    setIsGeneratingQA(true);
    const isQAActive = profile?.isIdentityVerified === true && profile?.kycStatus === 'VERIFIED';
    try {
      if (profile?.uid) {
        localStorage.removeItem(`venestay_passport_draft_${profile.uid}`);
      }

      if (isQAActive) {
        // TURN OFF (Reset to 0% and deactivate validations)
        await updateProfile({
          displayName: 'Anfitrión VeneStay',
          bio: '',
          selectedInterests: [],
          languages: [],
          location: '',
          isEmailVerified: false,
          isPhoneVerified: false,
          isIdentityVerified: false,
          kycStatus: 'UNVERIFIED',
          notifications: { email: false, whatsapp: false, push: false },
          phoneNumber: '',
        });
        toast.success('¡Pasaporte restablecido! Score de confianza al 0% y validaciones activas.');
      } else {
        // TURN ON (Activate to 100% QA profile)
        await updateProfile({
          displayName: 'Anfitrión VeneStay',
          bio: 'Viajero verificado de VeneStay. Apasionado por conocer las hermosas playas de Lechería, explorar la gastronomía local y disfrutar de estancias de lujo de forma segura y confiable.',
          selectedInterests: ['Playa', 'Lujo', 'Aventura'],
          languages: ['Español', 'Inglés'],
          location: 'Lechería, Anzoátegui',
          isEmailVerified: true,
          isPhoneVerified: true,
          isIdentityVerified: true,
          kycStatus: 'VERIFIED',
          notifications: { email: true, whatsapp: true, push: true },
          phoneNumber: '+58 414 1234567',
        });
        toast.success('¡Pasaporte QA Generado con 100% de Trust Score!', {
          description: 'La identidad y reputación han sido actualizadas con éxito.',
          duration: 5000,
        });
      }

      // Forzar el refresco del token ID para que el claim 'qa' se sincronice de inmediato
      const auth = getAuth();
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
        console.log('[QA Toggle] Token ID refrescado para aplicar Custom Claims.');
      }
    } catch (error) {
      console.error('Error toggling QA profile:', error);
      toast.error('Error al cambiar el estado del perfil de prueba.');
    } finally {
      setIsGeneratingQA(false);
    }
  };

  // ─── Skeleton de carga ───
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-brand-navy">
        <div className="relative">
          <div className="h-16 w-16 rounded-[20px] border-2 border-brand-500/20 bg-brand-50 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-brand-500 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Cargando tu Pasaporte
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-brand-navy selection:bg-brand-500/30">
      <Navbar
        logoOnly={true}
        onLogoClick={handleLogoClick}
        onOpenAuth={() => {}}
      />
      <div className="mx-auto max-w-2xl px-6 py-12 space-y-6">

        {/* 
          ── HEADER ──
          VFX + Avatar Upload Real
        */}
        <PassportHeader
          profile={profile}
          trustScore={trustScore}
          isPreviewMode={isPreviewMode}
          setIsPreviewMode={setIsPreviewMode}
          isAvatarUploading={isAvatarUploading}
          onAvatarChange={handleAvatarChange}
          onRemoveAvatar={handleRemoveAvatar}
          onGenerateQAProfile={handleGenerateQAProfile}
          isGeneratingQA={isGeneratingQA}
        />

        {isKycVerified && draft && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(draft.returnUrl)}
            className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 transition-all duration-300 hover:scale-[1.01] hover:border-emerald-200 hover:bg-emerald-50 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  ¡Identidad Verificada!
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-600 leading-normal">
                  Tienes una reserva pendiente esperándote.
                  <br />
                  <span className="text-emerald-700 font-bold underline">Haz clic aquí para retomar tu última estadía ahora.</span>
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-600 shrink-0" />
          </motion.div>
        )}

        {/* 
          ── FORMULARIO CON SECCIONES ESCALONADAS ──
        */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Sección 1 — Motor Transaccional */}
          <div className="passport-section passport-section--d1">
            <TransactionalEngine
              profile={profile}
              currency={currency}
              setCurrency={setCurrency}
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
              onRemovePaymentMethod={handleRemovePaymentMethod}
            />
          </div>

          {/* Sección 2 — Seguridad y Respaldo */}
          <div className="passport-section passport-section--d2">
            <SecuritySection
              profile={profile}
              onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
            />
          </div>

          {/* Sección 3 — Perfil Público */}
          <div className="passport-section passport-section--d3">
            <PublicProfile
              displayName={displayName}
              setDisplayName={setDisplayName}
              bio={bio}
              setBio={setBio}
              errors={errors}
            />
          </div>

          {/* CTA — Submit */}
          <div className="passport-section passport-section--d4">
            <button
              type="submit"
              disabled={saving}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-navy py-5 text-xs font-black tracking-[0.4em] text-brand-500 uppercase border border-brand-500/30 transition-all duration-300 hover:bg-brand-navy/90 hover:border-brand-500/60 hover:shadow-[0_0_30px_rgba(197,160,89,0.15)] hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 shadow-xl shadow-brand-navy/10 focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:ring-offset-2 focus:ring-offset-white"
              aria-busy={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
                  Actualizar Pasaporte
                </>
              )}
            </button>
          </div>

          {/* Sección 4 — ADN de Viajero */}
          <div className="passport-section passport-section--d5">
            <TravelerDNA
              allInterests={ALL_INTERESTS}
              selectedInterests={selectedInterests}
              toggleInterest={toggleInterest}
              languages={languages}
              toggleLanguage={toggleLanguage}
            />
          </div>

          {/* Sección 5 — Canales VIP */}
          <div className="passport-section passport-section--d6">
            <NotificationChannels
              profile={profile}
              notifications={notifications}
              toggleNotification={toggleNotification}
              updateProfile={updateProfile}
            />
          </div>

        </form>

        {/* Modales fuera del form */}
        <VerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          userId={profile?.uid || ''}
          onVerified={updateProfile}
        />

        <PaymentMethodModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onAdd={handleAddPaymentMethod}
        />

        <ConfirmExitModal
          isOpen={isConfirmExitOpen}
          onClose={() => setIsConfirmExitOpen(false)}
          onConfirm={() => {
            setIsConfirmExitOpen(false);
            navigate('/');
          }}
        />

      </div>
    </div>
  );
};

export default ProfileSettings;
