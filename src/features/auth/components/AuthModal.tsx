import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Loader2, AlertCircle, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthForm } from '../hooks/useAuthForm';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = 'login',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  const {
    mode,
    email,
    password,
    name,
    loading,
    showPassword,
    resetEmailSent,
    fieldErrors,
    generalError,
    setEmail,
    setPassword,
    setName,
    handleModeChange,
    handleGoogleLogin,
    handleForgotPassword,
    handleSubmit,
    toggleShowPassword,
    passwordStrength,
    resetForm,
    setMode,
  } = useAuthForm(onClose, initialView);

  // Reset the form when the modal opens to avoid showing stale state (e.g. unverified email warning)
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setMode(initialView);
    }
  }, [isOpen, initialView, resetForm, setMode]);

  // Esc key closes the modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Trap focus inside modal
  useFocusTrap(modalRef, isOpen);

  // Check for prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const animationDuration = prefersReducedMotion ? 0 : 0.2;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        {/* Backdrop (Click to close) */}
        <div 
          className="absolute inset-0 cursor-default" 
          onClick={onClose} 
          aria-hidden="true"
        />

        {/* Modal Container */}
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
          transition={{ duration: animationDuration, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="hover:text-brand-navy absolute top-4 right-4 text-gray-400 transition-colors focus:ring-2 focus:ring-brand-navy focus:outline-none rounded-lg p-1"
            aria-label="Cerrar modal de autenticación"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="mb-8 text-center">
              <h2 id="auth-modal-title" className="text-brand-navy mb-2 text-3xl font-black">
                {mode === 'forgot-password'
                  ? 'Recuperar acceso'
                  : mode === 'login'
                    ? 'Bienvenido de nuevo'
                    : 'Crea tu cuenta'}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === 'forgot-password'
                  ? 'Te enviaremos un enlace para restaurar tu contraseña'
                  : mode === 'login'
                    ? 'Accede a tus reservas y favoritos'
                    : 'Únete a la comunidad de VeneStay'}
              </p>
            </div>

            {/* General error message */}
            {generalError && (
              <div 
                role="alert" 
                className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800"
              >
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                <span>{generalError}</span>
              </div>
            )}

            {mode === 'forgot-password' ? (
              <div className="space-y-6">
                {resetEmailSent ? (
                  <div className="space-y-6 py-4 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                      <Mail className="h-10 w-10 text-green-500" aria-hidden="true" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-brand-navy text-xl font-black">
                        ¡Correo enviado!
                      </h3>
                      <p className="text-xs font-medium text-gray-500">
                        Revisa tu bandeja de entrada ({email}) y sigue las
                        instrucciones para restablecer tu contraseña.
                      </p>
                    </div>
                    <button
                      onClick={() => handleModeChange('login')}
                      className="bg-brand-navy hover:bg-brand-navy/90 flex w-full items-center justify-center rounded-xl py-4 font-sans text-xs font-bold tracking-widest text-white uppercase shadow-lg transition-all focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy focus:outline-none"
                    >
                      Volver al inicio
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <button
                      type="button"
                      onClick={() => handleModeChange('login')}
                      className="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 uppercase transition-colors hover:text-gray-600 focus:outline-none focus:underline"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      Atrás
                    </button>

                    <div className="space-y-1">
                      <label htmlFor="forgot-email" className="text-xs font-bold text-gray-400 uppercase">
                        Correo electrónico
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        autoComplete="email"
                        aria-invalid={!!fieldErrors.email}
                        aria-describedby={fieldErrors.email ? "forgot-email-error" : undefined}
                        className={`w-full rounded-xl border p-4 text-sm font-medium transition-all focus:border-brand-navy focus:outline-none ${
                          fieldErrors.email ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'
                        }`}
                        required
                      />
                      {fieldErrors.email && (
                        <p id="forgot-email-error" className="text-xs font-semibold text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" aria-hidden="true" />
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-brand-navy hover:bg-brand-navy/90 flex w-full items-center justify-center rounded-xl py-4 font-sans text-xs font-bold tracking-widest text-white uppercase shadow-lg transition-all disabled:opacity-50 focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy focus:outline-none"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      ) : (
                        'Enviar instrucciones'
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label htmlFor="reg-name" className="text-xs font-bold text-gray-400 uppercase">
                      Nombre completo
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      autoComplete="name"
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? "reg-name-error" : undefined}
                      className={`w-full rounded-xl border p-4 text-sm font-medium transition-all focus:border-brand-navy focus:outline-none ${
                        fieldErrors.name ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'
                      }`}
                      required
                    />
                    {fieldErrors.name && (
                      <p id="reg-name-error" className="text-xs font-semibold text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="auth-email" className="text-xs font-bold text-gray-400 uppercase">
                    Correo electrónico
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? "auth-email-error" : undefined}
                    className={`w-full rounded-xl border p-4 text-sm font-medium transition-all focus:border-brand-navy focus:outline-none ${
                      fieldErrors.email ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'
                    }`}
                    required
                  />
                  {fieldErrors.email && (
                    <p id="auth-email-error" className="text-xs font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auth-password" className="text-xs font-bold text-gray-400 uppercase">
                      Contraseña
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => handleModeChange('forgot-password')}
                        className="text-brand-navy hover:text-brand-navy/80 text-xs font-bold"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={
                        fieldErrors.password 
                          ? "auth-password-error" 
                          : mode === 'register' 
                            ? "password-strength-desc" 
                            : undefined
                      }
                      className={`w-full rounded-xl border p-4 pr-12 text-sm font-medium transition-all focus:border-brand-navy focus:outline-none ${
                        fieldErrors.password ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={toggleShowPassword}
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
                  
                  {/* Password strength visual indicator for register */}
                  {mode === 'register' && password.length > 0 && (
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
                      <p id="password-strength-desc" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Fuerza: {
                          passwordStrength === 1 ? 'Débil' :
                          passwordStrength === 2 ? 'Media' :
                          passwordStrength === 3 ? 'Fuerte' : 'Muy débil'
                        } (requiere letras y números, min. 8 caracteres)
                      </p>
                    </div>
                  )}

                  {fieldErrors.password && (
                    <p id="auth-password-error" className="text-xs font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-navy hover:bg-brand-navy/90 flex w-full items-center justify-center rounded-xl py-4 font-sans text-xs font-bold tracking-widest text-white uppercase shadow-lg transition-all disabled:opacity-50 focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy focus:outline-none"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : mode === 'login' ? (
                    'Iniciar sesión'
                  ) : (
                    'Crear cuenta'
                  )}
                </button>

                {/* Google login */}
                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-100" />
                  </div>
                  <span className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    O continúa con
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-4 font-sans text-xs font-bold tracking-wider text-gray-700 hover:bg-gray-50 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy focus:outline-none"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.14-.14 3.08l4.1-3.18c2.4-2.2 3.79-5.45 3.79-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.02c-1.08.72-2.48 1.16-4.08 1.16-3.14 0-5.8-2.12-6.75-4.97L1.13 17.39c2 3.97 6.11 6.61 10.87 6.61z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.25 14.26c-.25-.72-.39-1.5-.39-2.3a7.88 7.88 0 01.39-2.26L1.13 6.6C.41 8.04 0 9.71 0 11.96c0 2.25.41 3.92 1.13 5.36l4.12-3.06z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.24 0 3.13 2.64 1.13 6.61l4.12 3.09c.95-2.85 3.61-4.95 6.75-4.95z"
                    />
                  </svg>
                  Google
                </button>

                {/* Footer Switch mode */}
                <div className="mt-8 text-center text-sm">
                  <p className="text-gray-500 font-medium">
                    {mode === 'login' ? (
                      <>
                        ¿No tienes una cuenta?{' '}
                        <button
                          type="button"
                          onClick={() => handleModeChange('register')}
                          className="text-brand-navy font-bold hover:underline focus:outline-none"
                        >
                          Regístrate
                        </button>
                      </>
                    ) : (
                      <>
                        ¿Ya tienes una cuenta?{' '}
                        <button
                          type="button"
                          onClick={() => handleModeChange('login')}
                          className="text-brand-navy font-bold hover:underline focus:outline-none"
                        >
                          Inicia sesión
                        </button>
                      </>
                    )}
                  </p>
                </div>

                {/* Terms and conditions disclaimer (register only) */}
                {mode === 'register' && (
                  <div className="mt-6 text-center text-[10px] leading-relaxed text-gray-400 font-medium">
                    Al registrarte, aceptas nuestros{' '}
                    <a href="#" className="underline hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-navy rounded px-1">
                      Términos de Servicio
                    </a>{' '}
                    y{' '}
                    <a href="#" className="underline hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-navy rounded px-1">
                      Política de Privacidad
                    </a>
                    .
                  </div>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
