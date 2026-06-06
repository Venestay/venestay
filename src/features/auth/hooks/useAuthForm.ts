import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  AuthError,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { loginSchema, registerSchema, forgotPasswordSchema } from '../schemas/auth.schema';

type FormMode = 'login' | 'register' | 'forgot-password';

const firebaseErrorMap: Record<string, string> = {
  'auth/user-not-found': 'No existe ninguna cuenta registrada con este correo electrónico.',
  'auth/wrong-password': 'La contraseña es incorrecta. Por favor, inténtalo de nuevo.',
  'auth/email-already-in-use': 'Este correo electrónico ya está registrado en VeneStay.',
  'auth/invalid-email': 'El correo electrónico no tiene un formato válido.',
  'auth/weak-password': 'La contraseña elegida es muy débil.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor, inténtalo más tarde.',
  'auth/network-request-failed': 'Error de red. Verifica tu conexión a internet.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de inicio de sesión con Google.',
  'auth/cancelled-popup-request': 'Se canceló el inicio de sesión con Google debido a múltiples solicitudes.',
  'auth/internal-error': 'Ocurrió un error interno en el servidor de autenticación.',
};

export function useAuthForm(onClose: () => void, initialView: 'login' | 'register') {
  const [mode, setMode] = useState<FormMode>(initialView === 'login' ? 'login' : 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const resetForm = (keepEmail: boolean = false) => {
    if (!keepEmail) {
      setEmail('');
    }
    setPassword('');
    setName('');
    setFieldErrors({});
    setGeneralError(null);
    setShowPassword(false);
    setResetEmailSent(false);
  };

  const handleModeChange = (newMode: FormMode) => {
    resetForm(newMode === 'forgot-password'); // Keep email if moving to forgot-password
    setMode(newMode);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setGeneralError(null);
    setFieldErrors({});
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: unknown) {
      const authErr = err as AuthError;
      const mappedMsg = firebaseErrorMap[authErr?.code] || 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
      setGeneralError(mappedMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError(null);
    setFieldErrors({});

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (err: unknown) {
      const authErr = err as AuthError;
      const mappedMsg = firebaseErrorMap[authErr?.code] || 'Ocurrió un error al enviar el correo de recuperación.';
      setGeneralError(mappedMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError(null);
    setFieldErrors({});

    if (mode === 'login') {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setFieldErrors(newErrors);
        setLoading(false);
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } catch (err: unknown) {
        const authErr = err as AuthError;
        const mappedMsg = firebaseErrorMap[authErr?.code] || 'Error al iniciar sesión. Verifica tus credenciales.';
        setGeneralError(mappedMsg);
      } finally {
        setLoading(false);
      }
    } else {
      const result = registerSchema.safeParse({ name, email, password });
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setFieldErrors(newErrors);
        setLoading(false);
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await updateProfile(userCredential.user, { displayName: name });
        onClose();
      } catch (err: unknown) {
        const authErr = err as AuthError;
        const mappedMsg = firebaseErrorMap[authErr?.code] || 'Error al crear la cuenta. Inténtalo de nuevo.';
        setGeneralError(mappedMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  // Basic password strength helper for visual feedback
  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-zA-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    return strength; // 0, 1, 2, or 3
  };

  return {
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
    passwordStrength: getPasswordStrength(),
  };
}
