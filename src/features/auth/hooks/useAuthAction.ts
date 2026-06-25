import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { confirmEmailVerification, verifyPasswordReset, resetPasswordWithCode } from '@/services/auth-service';

type ActionState = 'loading' | 'success' | 'error' | 'idle';

export const useAuthAction = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const [state, setState] = useState<ActionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // For password reset flow
  const [isPasswordResetValid, setIsPasswordResetValid] = useState(false);

  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!mode || !oobCode) {
      setState('error');
      setErrorMessage('Enlace inválido o incompleto.');
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const processAction = async () => {
      setState('loading');
      try {
        if (mode === 'verifyEmail') {
          await confirmEmailVerification(oobCode);
          setState('success');
        } else if (mode === 'resetPassword') {
          // Verify code first before letting user enter new password
          await verifyPasswordReset(oobCode);
          setIsPasswordResetValid(true);
          setState('idle'); // Wait for user to input new password
        } else {
          setState('error');
          setErrorMessage('Acción no soportada.');
        }
      } catch (err) {
        const error = err as any;
        setState('error');
        console.error('Error processing auth action:', error);
        if (error.code === 'auth/invalid-action-code') {
          setErrorMessage('El enlace es inválido o ya expiró. Por favor solicita uno nuevo.');
        } else {
          setErrorMessage('Ocurrió un error al procesar tu solicitud.');
        }
      }
    };

    processAction();
  }, [mode, oobCode]);

  const handlePasswordReset = async (newPassword: string) => {
    if (!oobCode || mode !== 'resetPassword') return;
    setState('loading');
    try {
      await resetPasswordWithCode(oobCode, newPassword);
      setState('success');
    } catch (err) {
      const error = err as any;
      setState('error');
      if (error.code === 'auth/weak-password') {
        setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setErrorMessage('Error al restablecer la contraseña. Es posible que el enlace haya expirado.');
      }
    }
  };

  return {
    mode,
    state,
    errorMessage,
    isPasswordResetValid,
    handlePasswordReset,
  };
};
