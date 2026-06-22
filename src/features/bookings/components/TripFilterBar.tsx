import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TripFilterBarProps {
  activeTab: 'activos' | 'historial';
  onTabChange: (tab: 'activos' | 'historial') => void;
  activosCount: number;
  historialCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TripFilterBar: React.FC<TripFilterBarProps> = ({
  activeTab,
  onTabChange,
  activosCount,
  historialCount,
  searchQuery,
  onSearchChange,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  return (
    <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onTabChange('activos')}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center gap-2 border',
            activeTab === 'activos'
              ? 'bg-brand-navy text-white border-brand-navy'
              : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>Activos</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[9px] font-black leading-none',
              activeTab === 'activos'
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500'
            )}
          >
            {activosCount}
          </span>
        </button>

        <button
          onClick={() => onTabChange('historial')}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center gap-2 border',
            activeTab === 'historial'
              ? 'bg-brand-navy text-white border-brand-navy'
              : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>Historial</span>
          {historialCount > 0 && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[9px] font-black leading-none',
                activeTab === 'historial'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'
              )}
            >
              {historialCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Input (responsive layout) */}
      <div className="relative flex items-center grow max-w-md sm:justify-end">
        {/* Mobile collapsed icon trigger */}
        <button
          onClick={() => setMobileExpanded(true)}
          className={cn(
            'sm:hidden p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50',
            mobileExpanded ? 'hidden' : 'block'
          )}
          aria-label="Buscar reserva"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Input field */}
        <div
          className={cn(
            'w-full sm:w-64 relative focus-within:w-full transition-all duration-300',
            mobileExpanded ? 'flex' : 'hidden sm:flex'
          )}
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por propiedad o REF..."
            className="w-full pl-10 pr-9 py-2 border border-gray-200 rounded-full text-xs font-semibold focus:outline-none focus:border-brand-navy bg-white shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {mobileExpanded && (
            <button
              onClick={() => setMobileExpanded(false)}
              className="sm:hidden ml-2 p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-full bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
