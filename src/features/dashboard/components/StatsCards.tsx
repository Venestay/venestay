import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Building2, 
  Award 
} from 'lucide-react';
import { Booking, Listing } from '@/types';
import { calculateCommission, getCommissionTier } from '@/lib/commission';

interface StatsCardsProps {
  bookings: Booking[];
  listings: Listing[];
  isVerified: boolean;
  tier: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({ bookings, listings, isVerified, tier }) => {
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const pendingBookings = bookings.filter(b => b.status === 'AWAITING_VERIFICATION');
  
  // Calculate total net profit across all confirmed bookings using the centralized tier
  const totalNetProfit = confirmedBookings.reduce((acc, booking) => {
    return acc + calculateCommission(booking.totalAmount, tier as any).hostNetProfit;
  }, 0);

  const currentTier = tier;

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
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      subtext: currentTier === 8 ? 'Nivel Superhost Max' : `Faltan ${10 - confirmedBookings.length} para 8%`
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${stat.bgColor} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black tracking-widest text-gray-300 uppercase">Resumen</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-brand-navy tracking-tight">{stat.value}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
            <p className="text-[9px] font-medium text-gray-400 mt-2 italic">{stat.subtext}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
