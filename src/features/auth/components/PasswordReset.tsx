import React, { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { usePasswordReset } from '../hooks/usePasswordReset';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface PasswordResetProps {
  oobCode: string;
  onClose: () => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ oobCode, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    newPassword,
    confirmPassword,
    email,
    loading,
    submitting,
    showPassword,
    showConfirmPassword,
    success,
    fieldErrors,
    generalError,
    setNewPassword,
    setConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    handleSubmit,
    passwordStrength,
  } = usePasswordReset(oobCode, onClose);

  // Esc key closes the modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Trap focus inside modal
  useFocusTrap(containerRef, !loading);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const animationDuration = prefersReducedMotion ? 0 : 0.2;

  if (loading) {
    return (
      <div className="fixed inset-0 z-200 flex items-center justify-center bg-white" role="status" aria-busy="true">
        <div className="space-y-4 text-center">
          <Loader2 className="text-brand-navy mx-auto h-12 w-12 animate-spin" aria-hidden="true" />
          <p className="text-brand-navy text-xs font-black tracking-widest uppercase italic">
            Verificando enlace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 cursor-default" 
          onClick={onClose} 
          aria-hidden="true"
        />

        {/* Modal Container */}
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
          transition={{ duration: animationDuration, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
        >
          <div className="p-8">
            <div className="mb-8 text-center">
              <div className="bg-brand-500/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm">
                {success ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="text-brand-navy h-8 w-8" aria-hidden="true" />
                )}
              </div>
              <h2 id="reset-modal-title" className="text-brand-navy mb-2 text-3xl font-black tracking-tight">
                {success ? '¡Éxito!' : 'Nueva Contraseña'}
              </h2>
              <p className="text-sm font-medium text-gray-500">
                {success
                  ? 'Tu contraseña ha sido actualizada correctamente.'
                  : `Restableciendo acceso para ${email}`}
              </p>
            </div>

            {generalError && (
              <div 
                role="alert" 
                className="mb-6 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800"
              >
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                <span>{generalError}</span>
              </div>
            )}

            {success ? (
              <div className="space-y-6">
                <button
                  onClick={onClose}
                  className="bg-brand-navy hover:bg-brand-navy/90 flex w-full items-center justify-center rounded-xl py-4 font-sans text-xs font-bold tracking-widest text-white uppercase shadow-lg transition-all focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy focus:outline-none"
                >
                  Ir al Inicio de Sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* Password field */}
                  <div className="space-y-1">
                    <label htmlFor="new-password" className="text-brand-navy block flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        aria-invalid={!!fieldErrors.password}
                        aria-describedby={
                          fieldErrors.password 
                            ? "new-password-error" 
                            : "new-password-strength-desc"
                        }
                        className={`w-full rounded-xl border p-4 pr-12 text-sm font-medium transition-all focus:border-brand-navy focus:outline-none ${
                          fieldErrors.password ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-navy rounded-md p-1"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Eye className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    {/* Visual Password Strength bar */}
                    {newPassword.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              passwordStrength === 1 ? 'w-1/3 bg-red-500' :
                              passwordStrength === 2 ? 'w-2/3 bg-amber-500' :
                              passwordStrength === 3 ? 'w-full bg-green-500' : 'w-0'
                            }`}
                          />
                        </div>
                        <p id="new-password-strength-desc" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Fuerza: {
                            passwordStrength === 1 ? 'Débil' :
                            passwordStrength === 2 ? 'Media' :
                            passwordStrength === 3 ? 'Fuerte' : 'Muy débil'
                          } (mín. 8 caracteres, con letras y números)
                        </p>
                      </div>
                    )}

                    {fieldErrors.password && (
                      <p id="new-password-error" className="text-xs font-semibold text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password field */}
                  <div className="space-y-1">
                    <label htmlFor="confirm-password" className="text-brand-navy block flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        aria-invalid={!!fieldErrors.confirmPassword}
                        aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
                        className={`w-full rounded-xl border p-4 pr-12 text-sm font-medium transition-all focus:border-brand-navy focus:outline-none ${
                          fieldErrors.confirmPassword ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-navy rounded-md p-1"
                        aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Eye className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p id="confirm-password-error" className="text-xs font-semibold text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {generalError && generalError.includes('El enlace de recuperación') ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-brand-navy w-full rounded-xl bg-gray-100 py-4 text-xs font-bold tracking-widest uppercase transition-all hover:bg-gray-200 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 focus:outline-none"
                  >
                    Regresar
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-brand-navy hover:bg-brand-navy/90 flex w-full items-center justify-center rounded-xl py-4 font-sans text-xs font-bold tracking-widest text-white uppercase shadow-lg transition-all focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy focus:outline-none active:scale-[0.98] disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    ) : (
                      'Actualizar Contraseña'
                    )}
                  </button>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PasswordReset;
