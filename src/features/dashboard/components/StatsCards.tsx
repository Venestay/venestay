import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Building2, 
  Award 
} from 'lucide-react';
import { Booking, Listing } from '@/types';
import { calculateCommission } from '@/lib/commission';
import { motion } from 'motion/react';

interface StatsCardsProps {
  bookings: Booking[];
  listings: Listing[];
  isVerified: boolean;
  tier: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({ bookings, listings, tier, isVerified }) => {
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const pendingBookings = bookings.filter(b => b.status === 'AWAITING_VERIFICATION');
  
  // Calculate total net profit across all confirmed bookings using the centralized tier
  const totalNetProfit = confirmedBookings.reduce((acc, booking) => {
    return acc + calculateCommission(booking.totalAmount, tier as 8 | 10 | 12).hostNetProfit;
  }, 0);

  const currentTier = tier;
  const isMaxTier = currentTier === 8;

  const stats = [
    {
      label: 'Ganancia Neta',
      value: `$${totalNetProfit.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      subtext: 'Dinero real acumulado'
    },
    {
      label: 'Por Verificar',
      value: pendingBookings.length,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      subtext: 'Pagos pendientes de validación'
    },
    {
      label: 'Mis Propiedades',
      value: listings.length,
      icon: Building2,
      color: 'text-brand-500',
      bgColor: 'bg-brand-50',
      subtext: 'Activas en Lechería'
    },
    {
      label: 'Comisión Actual',
      value: `${currentTier}%`,
      icon: Award,
      color: isMaxTier ? 'text-brand-500' : (isVerified ? 'text-purple-500' : 'text-red-500'),
      bgColor: isMaxTier ? 'bg-brand-50' : (isVerified ? 'bg-purple-50' : 'bg-red-50'),
      subtext: isMaxTier 
        ? 'Nivel Superhost Max Alcanzado' 
        : isVerified 
          ? `Faltan ${10 - confirmedBookings.length} reservas para 8%`
          : 'Completa tu Pasaporte para bajar al 10%',
      isGlow: isMaxTier
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, staggerChildren: 0.1 }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
    >
      {stats.map((stat, idx) => (
        <motion.div 
          key={idx} 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          className={`relative bg-white border rounded-[32px] p-6 shadow-sm hover:shadow-lg transition-all group overflow-hidden ${stat.isGlow ? 'border-brand-500/50 ring-1 ring-brand-500/20' : 'border-gray-100'}`}
        >
          {stat.isGlow && (
            <div className="absolute inset-0 bg-brand-500/5 animate-pulse rounded-[32px]"></div>
          )}
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${stat.bgColor} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black tracking-widest text-gray-300 uppercase">Resumen</span>
          </div>
          <div className="relative z-10">
            <h3 className={`text-2xl font-black tracking-tight ${stat.isGlow ? 'text-brand-500' : 'text-brand-navy'}`}>{stat.value}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
            <p className={`text-[9px] font-medium mt-2 italic ${stat.isGlow ? 'text-brand-500 font-bold' : 'text-gray-400'}`}>{stat.subtext}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StatsCards;
