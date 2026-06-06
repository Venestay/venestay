import React from 'react';
import { Building2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useChatNotifications } from '@/features/bookings/hooks/useChatNotifications';

export type DashboardTab = 'bookings' | 'listings' | 'profile' | 'kyc_audit';

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  isAdmin: boolean;
  isHost: boolean;
  kycPendingCount?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  isHost,
  kycPendingCount = 0,
}) => {
  const navigate = useNavigate();
  const { unreadCount } = useChatNotifications();

  return (
    <div className="bg-brand-navy flex shrink-0 flex-col justify-between gap-6 border-b border-gray-100 p-8 md:flex-row md:items-center">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/')}
          className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 transition-all hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-500/20"
          title="Volver al Inicio"
        >
          <ArrowLeft className="text-white h-5 w-5 transition-transform group-hover:-translate-x-1" />
        </button>
        <div className="bg-brand-500/20 rounded-2xl p-4">
          <Building2 className="text-brand-500 h-8 w-8" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white">
            Panel de Gestión
          </h2>
          <p className="text-brand-500 mt-1 text-[10px] font-black tracking-[0.3em] uppercase">
            VeneStay Administrativo
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex rounded-2xl bg-white/10 p-1">
        {(isAdmin || isHost) && (
          <button
            onClick={() => setActiveTab('bookings')}
            className={cn(
              'relative rounded-xl px-6 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all',
              activeTab === 'bookings'
                ? 'bg-brand-500 text-brand-navy shadow-lg'
                : 'text-white/60 hover:text-white'
            )}
          >
            {isAdmin ? 'Reservas Globales' : 'Reservas Entrantes'}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-brand-navy">
                {unreadCount}
              </span>
            )}
          </button>
        )}
        {(isAdmin || isHost) && (
          <button
            onClick={() => setActiveTab('listings')}
            className={cn(
              'rounded-xl px-6 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all',
              activeTab === 'listings'
                ? 'bg-brand-500 text-brand-navy shadow-lg'
                : 'text-white/60 hover:text-white'
            )}
          >
            {isAdmin ? 'Propiedades' : 'Mis Propiedades'}
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('kyc_audit')}
            className={cn(
              'relative rounded-xl px-6 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all',
              activeTab === 'kyc_audit'
                ? 'bg-brand-500 text-brand-navy shadow-lg'
                : 'text-white/60 hover:text-white'
            )}
          >
            Auditoría KYC
            {kycPendingCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-brand-navy animate-pulse">
                {kycPendingCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            'rounded-xl px-6 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all',
            activeTab === 'profile'
              ? 'bg-brand-500 text-brand-navy shadow-lg'
              : 'text-white/60 hover:text-white'
          )}
        >
          {isAdmin ? 'Mi Perfil' : 'Perfil'}
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
