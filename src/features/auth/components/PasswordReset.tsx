import React, { useState, useEffect } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface PasswordResetProps {
  oobCode: string;
  onClose: () => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ oobCode, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
      } catch (err: unknown) {
        setError('El enlace de recuperación es inválido o ha expirado.');
      } finally {
        setLoading(false);
      }
    };
    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <Loader2 className="text-brand-500 mx-auto h-12 w-12 animate-spin" />
          <p className="text-brand-navy text-xs font-black tracking-widest uppercase italic">
            Verificando enlace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="p-8">
          <div className="mb-8 text-center">
            <div className="bg-brand-500/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm">
              {success ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <ShieldCheck className="text-brand-navy h-8 w-8" />
              )}
            </div>
            <h2 className="text-brand-navy mb-2 text-3xl font-black tracking-tight">
              {success ? '¡Éxito!' : 'Nueva Contraseña'}
            </h2>
            <p className="text-sm font-medium text-gray-500">
              {success
                ? 'Tu contraseña ha sido actualizada correctamente.'
                : `Restableciendo acceso para ${email}`}
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <button
                onClick={onClose}
                className="bg-brand-navy hover:bg-brand-navy/90 flex w-full items-center justify-center rounded-xl py-4 font-sans text-[10px] font-bold tracking-widest text-white uppercase shadow-lg transition-all"
              >
                Ir al Inicio de Sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-brand-navy mb-1 ml-1 block flex items-center gap-2 text-[10px] font-black uppercase">
                    <Lock className="h-3 w-3" />
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="focus:ring-brand-500 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all outline-none focus:border-transparent focus:ring-2"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-brand-navy mb-1 ml-1 block flex items-center gap-2 text-[10px] font-black uppercase">
                    <CheckCircle2 className="h-3 w-3" />
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="focus:ring-brand-500 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all outline-none focus:border-transparent focus:ring-2"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 rounded-xl border border-red-100 bg-red-50 p-3 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-[10px] font-bold tracking-tight uppercase">
                    {error}
                  </p>
                </div>
              )}

              {error &&
              error ===
                'El enlace de recuperación es inválido o ha expirado.' ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-brand-navy w-full rounded-xl bg-gray-100 py-4 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gray-200"
                >
                  Regresar
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-navy hover:bg-brand-navy/90 flex w-full items-center justify-center rounded-xl py-4 font-sans text-[10px] font-bold tracking-widest text-white uppercase shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Actualizar Contraseña'
                  )}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;






