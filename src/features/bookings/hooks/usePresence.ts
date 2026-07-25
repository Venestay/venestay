import { useEffect, useRef } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks/AuthContext';

/**
 * SPEC-CHAT-EMAIL-NOTIFICATION-PRESENCE-001
 * Hook de presencia de usuario.
 *
 * Escribe `onlineAt: serverTimestamp()` en /users/{uid} cada HEARTBEAT_MS
 * mientras el usuario tiene la app abierta. La Cloud Function onChatMessageCreated
 * lee este campo para decidir si enviar o no el email de notificacion (umbral: 60s).
 *
 * Estrategia:
 * - Heartbeat cada 30s (mucho menor que el umbral de 60s del backend).
 * - Limpia el intervalo al desmontar (usuario cierra sesion / cierra tab).
 * - No bloquea el render ni lanza errores al usuario (fire-and-forget silencioso).
 */
const HEARTBEAT_MS = 30_000; // 30 segundos

export function usePresence(): void {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      // Limpiar intervalo si el usuario cierra sesion
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const uid = user.uid;
    const userRef = doc(db, 'users', uid);

    const updatePresence = () => {
      setDoc(
        userRef,
        { onlineAt: serverTimestamp() },
        { merge: true }
      ).catch((err) => {
        // Silencioso: no romper la UX por un fallo de presencia
        console.warn('[usePresence] Failed to update onlineAt:', err);
      });
    };

    // Actualizar inmediatamente al montar y luego cada HEARTBEAT_MS
    updatePresence();
    intervalRef.current = setInterval(updatePresence, HEARTBEAT_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.uid]);
}
