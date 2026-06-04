import { useState } from 'react';
import { requestReschedule } from '@/services/booking-service';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { toast } from 'sonner';

export function useRescheduleRequest(bookingId: string | null, onSucces?: () => void) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proposedStartDate, setProposedStartDate] = useState<string>('');
  const [proposedEndDate, setProposedEndDate] = useState<string>('');
  const [rescheduleNote, setRescheduleNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReschedule = async () => {
    if (!bookingId) {
      setError('ID de reserva no válido');
      return;
    }
    if (!user) {
      setError('Debes iniciar sesión para realizar esta acción');
      return;
    }
    if (!proposedStartDate || !proposedEndDate) {
      setError('Debes seleccionar las fechas de inicio y fin');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await requestReschedule({
        bookingId,
        proposedStartDate,
        proposedEndDate,
        rescheduleNote,
        actorId: user.uid,
        actorName: user.displayName || user.email || 'Huésped',
      });
      toast.success('Solicitud de reprogramación enviada con éxito');
      setIsModalOpen(false);
      reset();
      if (onSucces) {
        onSucces();
      }
    } catch (err) {
      console.error('Error submitting reschedule:', err);
      const errMsg = err instanceof Error ? err.message : 'Error al enviar la solicitud de reprogramación';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setProposedStartDate('');
    setProposedEndDate('');
    setRescheduleNote('');
    setError(null);
  };

  return {
    isModalOpen,
    setIsModalOpen,
    proposedStartDate,
    setProposedStartDate,
    proposedEndDate,
    setProposedEndDate,
    rescheduleNote,
    setRescheduleNote,
    isSubmitting,
    error,
    submitReschedule,
    reset,
  };
}
