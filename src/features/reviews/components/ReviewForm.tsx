import React, { useState } from 'react';
import { Star, Send, Loader2, MessageSquareText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitVerifiedReview } from '@/services/review-service';
import { toast } from 'sonner';

interface ReviewFormProps {
  listingId: string;
  guestId: string;
  guestName: string;
  reviewSessionId: string;
  onSuccess?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  listingId,
  guestId,
  guestName,
  reviewSessionId,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Por favor, selecciona una calificación');
      return;
    }
    if (comment.length < 10) {
      toast.error('Tu comentario debe tener al menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitVerifiedReview({
        listingId,
        guestId,
        guestName,
        rating,
        comment,
        reviewSessionId
      }, reviewSessionId);
      
      setSubmitted(true);
      toast.success('¡Reseña publicada con éxito!');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('No se pudo publicar la reseña. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <MessageSquareText className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-white">¡Gracias por tu reseña!</h3>
        <p className="mt-2 text-sm text-gray-400">Tu experiencia ayuda a otros viajeros a elegir con confianza.</p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-800 bg-[#0B1120] p-8 shadow-2xl">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C5A059]/10 text-[#C5A059]">
          <Star className="h-6 w-6 fill-current" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Comparte tu Experiencia</h3>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Reseña Verificada por UCP</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            Calificación
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="group relative h-10 w-10 transition-transform active:scale-90"
              >
                <Star
                  className={`h-8 w-8 transition-all duration-300 ${
                    star <= (hover || rating)
                      ? 'fill-[#C5A059] text-[#C5A059] drop-shadow-[0_0_8px_rgba(197,160,89,0.5)]'
                      : 'text-gray-700'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            Tu Comentario
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Qué tal estuvo tu estancia en Lechería?"
            className="h-32 w-full rounded-2xl border-2 border-gray-800 bg-gray-900/50 p-4 text-sm text-gray-200 placeholder:text-gray-600 focus:border-[#C5A059]/50 focus:bg-gray-900 outline-none transition-all resize-none"
          />
        </div>

        <button
          disabled={isSubmitting}
          type="submit"
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#C5A059] py-5 text-xs font-black uppercase tracking-widest text-[#0B1120] transition-all hover:bg-[#b8914d] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Asegurar mi Opinión
              <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
