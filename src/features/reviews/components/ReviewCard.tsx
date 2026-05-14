import React from 'react';
import { Star, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'motion/react';

interface ReviewCardProps {
  guestName: string;
  rating: number;
  comment: string;
  createdAt: { toDate?: () => Date } | string | Date;
  isVerified?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
  guestName, 
  rating, 
  comment, 
  createdAt,
  isVerified = true 
}) => {
  const date = (() => {
    if (createdAt instanceof Date) return createdAt;
    if (typeof createdAt === 'string') return new Date(createdAt);
    if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt && typeof createdAt.toDate === 'function') {
      return (createdAt as { toDate: () => Date }).toDate();
    }
    return new Date();
  })();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative overflow-hidden rounded-3xl border border-gray-800 bg-[#0B1120]/50 p-6 backdrop-blur-sm transition-all hover:border-[#C5A059]/30"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-sm font-bold text-white shadow-inner">
            {guestName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-100">{guestName}</h4>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
              {format(date, "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>

        {isVerified && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#C5A059]/10 px-3 py-1 border border-[#C5A059]/20">
            <ShieldCheck className="h-3 w-3 text-[#C5A059]" />
            <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-tighter">
              Estancia Verificada
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-3 w-3 ${i < rating ? 'fill-[#C5A059] text-[#C5A059]' : 'text-gray-700'}`} 
          />
        ))}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-gray-400 group-hover:text-gray-300 transition-colors">
        "{comment}"
      </p>

      {/* Decorative accent */}
      <div className="absolute bottom-0 right-0 h-16 w-16 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none">
        <div className="absolute -bottom-4 -right-4 h-full w-full rounded-full bg-[#C5A059] blur-2xl" />
      </div>
    </motion.div>
  );
};

export default ReviewCard;
