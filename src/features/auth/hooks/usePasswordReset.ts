import { useState, useEffect } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode, AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { resetPasswordSchema } from '../schemas/auth.schema';

const firebaseErrorMap: Record<string, string> = {
  'auth/expired-action-code': 'El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.',
  'auth/invalid-action-code': 'El enlace de recuperación es inválido. Puede que ya haya sido usado.',
  'auth/user-disabled': 'Esta cuenta de usuario ha sido inhabilitada.',
  'auth/user-not-found': 'No se encontró el usuario asociado a este enlace.',
  'auth/weak-password': 'La contraseña elegida es muy débil.',
  'auth/network-request-failed': 'Error de red. Verifica tu conexión a internet.',
};

export function usePasswordReset(oobCode: string, onClose: () => void) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    const verifyCode = async () => {
      setLoading(true);
      setGeneralError(null);
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
      } catch (err: unknown) {
        const authErr = err as AuthError;
        setGeneralError(firebaseErrorMap[authErr?.code] || 'El enlace de recuperación es inválido o ha expirado.');
      } finally {
        setLoading(false);
      }
    };

    if (oobCode) {
      verifyCode();
    }
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});

    const result = resetPasswordSchema.safeParse({ password: newPassword, confirmPassword });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(newErrors);
      setSubmitting(false);
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      const authErr = err as AuthError;
      setGeneralError(firebaseErrorMap[authErr?.code] || 'Error al restablecer la contraseña. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let strength = 0;
    if (newPassword.length >= 8) strength += 1;
    if (/[a-zA-Z]/.test(newPassword)) strength += 1;
    if (/\d/.test(newPassword)) strength += 1;
    return strength; // 0 to 3
  };

  return {
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
    passwordStrength: getPasswordStrength(),
  };
}
