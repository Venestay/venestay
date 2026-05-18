import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { City } from '@/types';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import AuthModal from '@/features/auth/components/AuthModal';
import CalendarComponent from '@/features/bookings/components/Calendar';
import MyTrips from '@/features/bookings/components/MyTrips';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Menu,
  User,
  Globe,
  Building2,
  Umbrella,
  Wind,
  Ship,
  Navigation,
  Dog,
  LogOut,
  Heart,
  Calendar,
  ChevronDown,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  activeCity?: City;
  setActiveCity?: (city: City) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  startDate?: Date | null;
  endDate?: Date | null;
  setDates?: (start: Date | null, end: Date | null) => void;
  onOpenAdmin?: () => void;
  onOpenAuth?: (view?: 'login' | 'register') => void;
  hideFilters?: boolean;
  onSearchSubmit?: () => void;
  onLogoClick?: () => void;
  logoOnly?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  activeCity = 'All',
  setActiveCity = () => {},
  searchQuery = '',
  setSearchQuery = () => {},
  startDate = null,
  endDate = null,
  setDates = () => {},
  onOpenAdmin,
  onOpenAuth = () => {},
  hideFilters = false,
  onSearchSubmit,
  onLogoClick,
  logoOnly = false,
}) => {
  const navigate = useNavigate();
  const { user, signOut, isAdmin, profileData } = useAuth();
  const [isMyTripsOpen, setIsMyTripsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);
  const mobileCalendarRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
      if (
        mobileCalendarRef.current &&
        !mobileCalendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isCalendarOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen, isUserMenuOpen]);

  const cities: { name: City; label: string; icon: React.ReactNode; isAvailable: boolean }[] = [
    { name: 'All', label: 'Todos', icon: <Globe className="h-5 w-5" />, isAvailable: true },
    { name: 'Lechería', label: 'Lechería', icon: <Ship className="h-5 w-5" />, isAvailable: true },
    {
      name: 'Caracas',
      label: 'Caracas',
      icon: <Building2 className="h-5 w-5" />,
      isAvailable: false,
    },
    {
      name: 'Margarita',
      label: 'Margarita',
      icon: <Umbrella className="h-5 w-5" />,
      isAvailable: false,
    },
    { name: 'Falcon', label: 'Falcon', icon: <Wind className="h-5 w-5" />, isAvailable: false },
    {
      name: 'Maracaibo',
      label: 'Maracaibo',
      icon: <Navigation className="h-5 w-5" />,
      isAvailable: false,
    },
    /* {
      name: 'Petfriendly',
      label: 'Pet-friendly',
      icon: <Dog className="h-5 w-5" />,
      isAvailable: false,
    }, */
  ];

  return (
    <nav className="border-b border-gray-100 bg-white py-6 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Logo */}
          <Link
            to="/"
            aria-label="VeneStay - Volver a Inicio"
            className="group flex shrink-0 cursor-pointer items-center focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-xl px-2 py-1"
            onClick={(e) => {
              setActiveCity('All');
              if (onLogoClick) {
                e.preventDefault();
                onLogoClick();
              }
            }}
          >
            <div className="relative mr-2 flex h-10 w-10 items-center justify-center transition-transform group-hover:scale-110">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 50L50 20L85 50"
                  stroke="#c5a059"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M68 35V25H75V40" fill="#c5a059" />
                <rect
                  x="44"
                  y="38"
                  width="12"
                  height="12"
                  fill="#c5a059"
                  opacity="0.8"
                />
                <line
                  x1="50"
                  y1="38"
                  x2="50"
                  y2="50"
                  stroke="white"
                  strokeWidth="1"
                />
                <line
                  x1="44"
                  y1="44"
                  x2="56"
                  y2="44"
                  stroke="white"
                  strokeWidth="1"
                />
                <path
                  d="M30 60L48 78L90 35"
                  stroke="#050b18"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-brand-navy hidden text-2xl font-black tracking-tighter sm:block">
              Vene<span className="text-brand-500">Stay</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          {!logoOnly && (
            <div className="relative mx-8 hidden max-w-xl flex-grow lg:flex">
              <div className="hover:border-brand-200 flex w-full items-center rounded-full border border-gray-200 bg-gray-50 transition-all duration-300 hover:bg-white hover:shadow-lg">
                <div className="flex-1 cursor-text border-r border-gray-100 px-5 py-2 hover:bg-gray-100/50">
                  <label className="text-brand-navy/60 block text-[10px] font-black uppercase">
                    Destino
                  </label>
                  <input
                    type="text"
                    placeholder="¿A dónde vas?"
                    className="w-full bg-transparent text-base font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && onSearchSubmit) {
                        onSearchSubmit();
                      }
                    }}
                  />
                </div>
                <div
                  ref={calendarRef}
                  className="relative flex-1 cursor-pointer border-r border-gray-100 px-5 py-2 hover:bg-gray-100/50"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  <p className="text-brand-navy/60 text-[10px] font-black uppercase">
                    Estancia
                  </p>
                  <p
                    className={cn(
                      'truncate text-sm font-medium',
                      startDate ? 'text-gray-900' : 'text-gray-500'
                    )}
                  >
                    {startDate && endDate
                      ? `${format(startDate, 'dd MMM')} - ${format(endDate, 'dd MMM')}`
                      : 'Añadir fechas'}
                  </p>

                  {isCalendarOpen && (
                    <div
                      className="animate-slide-up absolute top-full right-0 z-[120] mt-4 w-[320px] origin-top-right md:w-[350px]"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <CalendarComponent
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(start, end) => {
                          setDates(start, end);
                        }}
                        onClose={() => setIsCalendarOpen(false)}
                      />
                    </div>
                  )}
                </div>
                <div
                  className="group flex cursor-pointer items-center py-1.5 pr-2 pl-4"
                  onClick={() => {
                    setIsCalendarOpen(false);
                    if (onSearchSubmit) onSearchSubmit();
                  }}
                >
                  <div className="bg-brand-500 rounded-full p-2.5 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Actions */}
          {!logoOnly && (
            <div className="flex items-center space-x-3">
              {isAdmin && (
                <Link
                  to="/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-navy border-brand-500/20 group flex items-center space-x-2 rounded-full border px-4 py-2 shadow-sm transition-all duration-300"
                >
                  <ShieldCheck className="text-brand-500 h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    Panel Admin
                  </span>
                </Link>
              )}

              <button
                onClick={() => navigate('/host-guide')}
                className="group hidden items-center space-x-2 rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 sm:flex"
              >
                <span>Ser Anfitrión</span>
              </button>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-gray-300 bg-white p-2 transition hover:shadow-md"
                >
                  <div className="pl-1">
                    <Menu className="h-5 w-5 text-gray-600" />
                  </div>
                  {user ? (
                    <div className="border-brand-500 h-8 w-8 overflow-hidden rounded-full border-2 shadow-sm transition-transform active:scale-90">
                      {profileData?.photoURL || user.photoURL ? (
                        <img
                          src={profileData?.photoURL || user.photoURL || ''}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="bg-brand-navy text-brand-500 flex h-full w-full items-center justify-center text-xs font-black">
                          {profileData?.displayName?.charAt(0) ||
                            user.displayName?.charAt(0) ||
                            user.email?.charAt(0)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-brand-navy text-brand-500 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 z-[110] mt-3 w-64 origin-top-right rounded-2xl border border-gray-100 bg-white py-3 shadow-xl"
                    >
                      {!user ? (
                        <div className="py-2">
                          <button
                            onClick={() => {
                              onOpenAuth('login');
                              setIsUserMenuOpen(false);
                            }}
                            className="text-brand-navy flex w-full justify-start px-5 py-3 text-sm font-black transition-colors hover:bg-gray-50"
                          >
                            Iniciar Sesión
                          </button>
                          <button
                            onClick={() => {
                              onOpenAuth('register');
                              setIsUserMenuOpen(false);
                            }}
                            className="flex w-full justify-start px-5 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            Registrarse
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="mb-1 border-b border-gray-100/50 px-5 py-3">
                            <p className="text-brand-navy truncate text-xs font-black uppercase">
                              {profileData?.displayName || user.displayName}
                            </p>
                            <p className="truncate text-[10px] font-medium text-gray-400">
                              {user.email}
                            </p>
                          </div>
                          <div className="py-2">
                            <Link
                              to="/mi-pasaporte"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="text-brand-navy hover:bg-brand-500/10 flex w-full items-center space-x-3 px-5 py-2.5 text-sm font-bold transition-colors"
                            >
                              <ShieldCheck className="text-brand-500 h-4 w-4" />
                              <span>Mi Pasaporte</span>
                            </Link>
                            <button
                              onClick={() => {
                                setIsMyTripsOpen(true);
                                setIsUserMenuOpen(false);
                              }}
                              className="flex w-full items-center space-x-3 px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              <Calendar className="text-brand-navy/70 h-4 w-4" />
                              <span>Mis Viajes</span>
                            </button>
                            <button
                              onClick={() => {
                                navigate('/host-guide');
                                setIsUserMenuOpen(false);
                              }}
                              className="flex w-full items-center space-x-3 px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              <Sparkles className="text-brand-500 h-4 w-4" />
                              <span>Publicar Espacio</span>
                            </button>
                            <div className="mx-4 my-2 h-px bg-gray-100" />
                            <button
                              onClick={() => {
                                signOut();
                                setIsUserMenuOpen(false);
                              }}
                              className="flex w-full items-center space-x-3 px-5 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>Cerrar Sesión</span>
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar - Mobile */}
        {!logoOnly && (
          <div className="space-y-2 py-3 lg:hidden">
            <div className="focus-within:border-brand-500 flex items-center rounded-2xl border border-gray-200 bg-gray-100 px-4 py-2 shadow-inner transition-all duration-300 focus-within:bg-white">
              <Search className="text-brand-500 mr-3 h-4 w-4" />
              <input
                type="text"
                placeholder="¿A dónde vas?"
                className="w-full bg-transparent text-base font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onSearchSubmit) {
                    onSearchSubmit();
                  }
                }}
              />
            </div>

            <div className="relative" ref={mobileCalendarRef}>
              <div
                className="group flex cursor-pointer items-center rounded-2xl border border-gray-100 bg-gray-50 p-3 transition-colors duration-300 hover:bg-white"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              >
                <Calendar className="text-brand-navy/60 mr-3 h-4 w-4" />
                <div className="flex flex-1 flex-col">
                  <span className="text-brand-navy text-[10px] leading-tight font-black uppercase">
                    {startDate && endDate
                      ? `${format(startDate, 'dd MMM')} - ${format(endDate, 'dd MMM')}`
                      : 'Seleccionar fechas'}
                  </span>
                </div>
                {startDate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDates(null, null);
                    }}
                    className="rounded-lg border border-gray-200 bg-white p-1 px-2 text-[8px] font-black"
                  >
                    LIMPIAR
                  </button>
                )}
              </div>

              {isCalendarOpen && (
                <div
                  className="animate-slide-up absolute top-full right-0 left-0 z-[120] mt-2 rounded-3xl border border-gray-100 bg-white p-2 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <CalendarComponent
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(start, end) => setDates(start, end)}
                    onClose={() => setIsCalendarOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* City Filters */}
        {!logoOnly && !hideFilters && (
          <div className="no-scrollbar mt-1 flex items-center space-x-4 overflow-x-auto border-t border-gray-50 py-4">
          {cities.map((city) => (
            <button
              key={city.name}
              disabled={!city.isAvailable}
              onClick={() => city.isAvailable && setActiveCity(city.name)}
              className={cn(
                'group relative flex items-center space-x-2 rounded-full border-2 px-6 py-3 text-xs font-black tracking-widest whitespace-nowrap uppercase transition-all duration-300',
                activeCity === city.name
                  ? 'bg-brand-navy border-brand-navy scale-105 text-white shadow-xl'
                  : city.isAvailable
                    ? 'hover:border-brand-500 hover:text-brand-navy border-gray-100 bg-white text-gray-400 hover:shadow-md'
                    : 'cursor-not-allowed border-gray-50 bg-gray-50/50 text-gray-300 grayscale'
              )}
            >
              {!city.isAvailable && (
                <span className="absolute -top-1 -right-1 z-10 rounded-full bg-amber-500 px-1.5 py-0.5 text-[6px] font-black tracking-tighter text-gray-900 shadow-sm transition-transform group-hover:scale-110">
                  PRÓXIMAMENTE
                </span>
              )}
              <div
                className={cn(
                  'transition-transform duration-300',
                  activeCity === city.name ? 'text-brand-500' : 'opacity-70'
                )}
              >
                {city.icon}
              </div>
              <span>{city.label}</span>
            </button>
          ))}
        </div>
        )}
      </div>

      <MyTrips isOpen={isMyTripsOpen} onClose={() => setIsMyTripsOpen(false)} />
    </nav>
  );
};

export default Navbar;






