import React from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DashboardTab = 'bookings' | 'listings' | 'profile';

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  isAdmin: boolean;
  isHost: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  isHost,
}) => {
  return (
    <div className="bg-brand-navy flex shrink-0 flex-col justify-between gap-6 border-b border-gray-100 p-8 md:flex-row md:items-center">
      <div className="flex items-center space-x-4">
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
              'rounded-xl px-6 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all',
              activeTab === 'bookings'
                ? 'bg-brand-500 text-brand-navy shadow-lg'
                : 'text-white/60 hover:text-white'
            )}
          >
            {isAdmin ? 'Reservas Globales' : 'Reservas Entrantes'}
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
