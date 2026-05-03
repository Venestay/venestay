import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { X, Loader2, AlertCircle, Mail, ArrowLeft } from 'lucide-react';

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
  const [isLogin, setIsLogin] = useState(initialView === 'login');

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsLogin(initialView === 'login');
      setIsForgotPassword(false);
      setResetEmailSent(false);
      setError(null);
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await updateProfile(userCredential.user, { displayName: name });
      }
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="hover:text-brand-navy absolute top-4 right-4 text-gray-400 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-8">
          <div className="mb-8 text-center">
            <h2 className="text-brand-navy mb-2 text-3xl font-black">
              {isForgotPassword
                ? 'Recuperar acceso'
                : isLogin
                  ? 'Bienvenido de nuevo'
                  : 'Crea tu cuenta'}
            </h2>
            <p className="text-sm text-gray-500">
              {isForgotPassword
                ? 'Te enviaremos un enlace para restaurar tu contraseña'
                : isLogin
                  ? 'Accede a tus reservas y favoritos'
                  : 'Únete a la comunidad de VeneStay'}
            </p>
          </div>

          {isForgotPassword ? (
            <div className="space-y-6">
              {resetEmailSent ? (
                <div className="space-y-6 py-4 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                    <Mail className="h-10 w-10 text-green-500" />
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
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetEmailSent(false);
                    }}
                    className="bg-brand-navy hover:bg-brand-navy/90 flex w-full items-center justify-center rounded-xl py-4 font-sans text-[10px] font-bold tracking-widest text-white uppercase shadow-lg transition-all"
                  >
                    Volver al inicio
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div>
                    <label className="text-brand-navy mb-1 ml-1 block text-[10px] font-black uppercase">
                      Email de recuperación
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="focus:ring-brand-500 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all outline-none focus:border-transparent focus:ring-2"
                      placeholder="tu@email.com"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center space-x-2 rounded-xl border border-red-100 bg-red-50 p-3 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-[10px] font-bold tracking-tight uppercase">
                        {error}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-brand-navy hover:bg-brand-navy/90 flex w-full items-center justify-center rounded-xl py-4 font-sans text-[10px] font-bold tracking-widest text-white uppercase shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Enviar enlace'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="hover:text-brand-navy flex w-full items-center justify-center space-x-2 py-2 text-xs font-bold text-gray-500 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Volver a Iniciar Sesión</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="mb-8 flex rounded-xl bg-gray-100 p-1">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
                    isLogin
                      ? 'text-brand-navy bg-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
                    !isLogin
                      ? 'text-brand-navy bg-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Registrarse
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="text-brand-navy mb-1 ml-1 block text-[10px] font-black uppercase">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="focus:ring-brand-500 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all outline-none focus:border-transparent focus:ring-2"
                      placeholder="Juan Pérez"
                    />
                  </div>
                )}
                <div>
                  <label className="text-brand-navy mb-1 ml-1 block text-[10px] font-black uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-brand-500 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all outline-none focus:border-transparent focus:ring-2"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <div className="mb-1 ml-1 flex items-center justify-between">
                    <label className="text-brand-navy block text-[10px] font-black uppercase">
                      Contraseña
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-brand-500 hover:text-brand-navy text-[10px] font-bold tracking-tight uppercase transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="focus:ring-brand-500 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all outline-none focus:border-transparent focus:ring-2"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="flex items-center space-x-2 rounded-xl border border-red-100 bg-red-50 p-3 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-[10px] font-bold tracking-tight uppercase">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-navy hover:bg-brand-navy/90 flex w-full items-center justify-center rounded-xl py-4 font-sans text-[10px] font-bold tracking-widest text-white uppercase shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isLogin ? (
                    'Entrar'
                  ) : (
                    'Crear Cuenta'
                  )}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 font-bold text-gray-400">
                    O continúa con
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="text-brand-navy hover:border-brand-500 group flex w-full items-center justify-center space-x-3 rounded-xl border-2 border-gray-100 bg-white py-3 font-bold shadow-sm transition-all"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  className="h-5 w-5"
                  alt="Google"
                />
                <span className="text-sm">Google</span>
              </button>
            </>
          )}
        </div>

        <div className="border-t border-gray-100 bg-gray-50 p-6 text-center">
          <p className="text-xs text-gray-500">
            Al continuar, aceptas nuestros{' '}
            <span className="text-brand-navy cursor-pointer font-bold underline">
              Términos de Servicio
            </span>{' '}
            y{' '}
            <span className="text-brand-navy cursor-pointer font-bold underline">
              Política de Privacidad
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;






