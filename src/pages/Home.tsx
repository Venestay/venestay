import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/ui/Navbar';
import ListingCard from '@/features/listings/components/ListingCard';
import { City, Listing } from '@/types';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import AuthModal from '@/features/auth/components/AuthModal';
import InfoModal, { InfoKey } from '@/components/ui/InfoModal';
import PasswordReset from '@/features/auth/components/PasswordReset';

// 🚀 CODE SPLITTING: Lazy Load de componentes pesados que no son la vista principal
const ListingDetail = lazy(
  () => import('@/features/listings/components/ListingDetail')
);
const MyTrips = lazy(() => import('@/features/bookings/components/MyTrips'));

import * as listingService from '@/services/listing-service';
import {
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Globe,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { normalizeString } from '@/utils/string-utils';


const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin, loading } = useAuth();
  const isPropertyView = searchParams.has('listingId');
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [activeCity, setActiveCity] = useState<City>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [isMyTripsOpen, setIsMyTripsOpen] = useState(false);
  // isAdminDashboardOpen wasn't actually rendering a modal, we'll keep the state for compatibility
  // but it's better to navigate to /dashboard
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<InfoKey>('zones');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>(
    'login'
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);

  // Handle URL Parameters (Admin access, Password Reset)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const canAccessAdmin = Boolean(user);

    if (
      params.get('admin') === 'true' ||
      location.pathname === '/admin/nueva-propiedad' ||
      location.pathname === '/publicar-espacio' ||
      location.pathname === '/admin/mis-propiedades'
    ) {
      if (canAccessAdmin) {
        setIsAdminDashboardOpen(true);
        navigate('/dashboard'); // Added navigation since state wasn't rendering anything
      } else if (!loading) {
        // Redirect non-authenticated users
        navigate('/', { replace: true });
      }
    }

    const mode = params.get('mode');
    const oobCode = params.get('oobCode');
    if (mode === 'resetPassword' && oobCode) {
      setResetCode(oobCode);
    }
  }, [location, isAdmin, listings, user, loading, navigate]);

  // Sync with Firestore for real-time listings
  useEffect(() => {
    const unsubscribe = listingService.subscribeToListings(
      (data) => {
        setListings(data);
        setIsLoadingListings(false);
        setConnectionError(false);

        const params = new URLSearchParams(location.search);
        const listingId = params.get('listingId');
        if (listingId) {
          // Backward compatibility: redirect old listingId query param to new route
          navigate(`/listing/${listingId}`, { replace: true });
        }
      },
      (error) => {
        console.error('App: Error fetching listings:', error);
        if ((error as { code?: string }).code === 'unavailable') {
          setConnectionError(true);
        }
      }
    );

    return () => unsubscribe();
  }, [location.search]);

  // Sync search state from location.state (e.g. when searching from ListingDetail)
  useEffect(() => {
    interface LocationState {
      searchQuery?: string;
      startDate?: string | Date;
      endDate?: string | Date;
    }

    if (location.state) {
      const state = location.state as LocationState;
      if (state.searchQuery !== undefined) setSearchQuery(state.searchQuery);
      if (state.startDate) setStartDate(new Date(state.startDate));
      if (state.endDate) setEndDate(new Date(state.endDate));

      // Clear state to avoid infinite loop or re-applying stale state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleListingClick = (listing: Listing) => {
    navigate(`/listing/${listing.id}`);
  };

  const openInfo = (tab: InfoKey) => {
    setActiveInfoTab(tab);
    setIsInfoModalOpen(true);
  };

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const normalizedActiveCity = normalizeString(activeCity);
      const normalizedListingCity = normalizeString(listing.city);

      const matchesCity =
        activeCity === 'All' ||
        (activeCity === 'Petfriendly'
          ? listing.isPetFriendly
          : normalizedListingCity === normalizedActiveCity);

      const normalizedSearch = normalizeString(searchQuery);
      const matchesSearch =
        normalizeString(listing.title).includes(normalizedSearch) ||
        normalizeString(listing.location).includes(normalizedSearch) ||
        normalizeString(listing.city).includes(normalizedSearch);

      const isAvailable =
        !startDate ||
        parseInt(listing.id) % 2 === 0 ||
        startDate.getDate() % 2 !== 0;

      return matchesCity && matchesSearch && isAvailable;
    });
  }, [activeCity, searchQuery, startDate, listings]);


  return (
    <div className="text-brand-navy min-h-screen bg-white">
      <AnimatePresence>
        {connectionError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sticky top-0 z-[100] overflow-hidden bg-red-600 text-white shadow-lg"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                <p className="text-[10px] leading-none font-black tracking-widest uppercase">
                  Error de servidor: Intentando reconectar con la base de
                  datos...
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-[9px] font-black tracking-widest uppercase transition-colors hover:bg-white/30"
              >
                Reintentar Ahora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar
        activeCity={activeCity}
        setActiveCity={setActiveCity}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        startDate={startDate}
        endDate={endDate}
        setDates={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        onOpenAdmin={() => navigate('/dashboard')}
        onOpenAuth={(view: 'login' | 'register' = 'login') => {
          setAuthModalView(view);
          setIsAuthModalOpen(true);
        }}
      />

      {!isLoadingListings ? (
        <div className="animate-fade-in">
          <main className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-6 lg:px-8">
            {/* Gatillo de Autoridad 
            <div className="mb-6 flex items-center justify-center gap-2 text-sm font-medium tracking-wide text-gray-600">
              <span>🛡️</span> Más de 500 estancias verificadas en toda la
              región.
            </div>
            */}

            {/* Hero Section */}
            {!isPropertyView &&
              !isLoadingListings &&
              activeCity === 'All' &&
              searchQuery === '' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="group relative mb-16 flex min-h-[85vh] items-center overflow-hidden rounded-[40px] border-8 border-gray-50 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-[#0B1120]">
                    <img
                      src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80"
                      alt="Luxury Venezuela"
                      className="h-full w-full object-cover opacity-50 transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120]/90 via-[#0B1120]/40 to-transparent" />
                  </div>

                  <div className="relative flex w-full max-w-3xl flex-col justify-center p-8 md:p-20">
                    <div className="mb-8 flex items-center space-x-2 text-xs font-black tracking-[0.4em] text-amber-500 uppercase">
                      <Sparkles className="h-4 w-4 fill-amber-500" />
                      <span>Experiencias Premium</span>
                    </div>
                    <h2 className="mb-8 text-4xl leading-[1.15] font-black tracking-tight text-white md:text-6xl lg:text-7xl uppercase">
                      Encuentra tu próximo <br />{' '}
                      <span className="text-amber-500">Alquiler Vacacional</span> <br /> en Lechería
                    </h2>
                    <p className="mb-10 max-w-2xl text-lg leading-relaxed font-medium text-gray-300 md:text-xl">
                      Propiedades verificadas, pagos adaptados al contexto actual y reservas más seguras para disfrutar sin preocupaciones.
                    </p>
                    <div className="flex flex-col items-start gap-4 sm:flex-row">
                      <button
                        onClick={() => {
                          const grid = document.getElementById('listings-grid');
                          grid?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex w-full items-center justify-center rounded-full bg-amber-500 px-8 py-4 font-bold text-gray-900 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-amber-600 sm:w-auto"
                      >
                        Explorar alojamientos
                        <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </button>
                      <button
                        onClick={() => openInfo('security')}
                        className="w-full rounded-full border border-white/50 px-6 py-4 font-medium text-white transition-all duration-300 hover:bg-white/10 sm:w-auto"
                      >
                        ¿Cómo protegemos tu reserva?
                      </button>
                    </div>
                  </div>

                  {/* Stats Overlay */}
                  <div className="absolute right-12 bottom-12 z-10 hidden space-x-12 xl:flex">
                    <div className="text-right">
                      <p className="text-4xl leading-none font-black text-white">
                        100%
                      </p>
                      <p className="mt-1 text-[10px] font-black tracking-widest text-amber-500 uppercase">
                        Verificado
                      </p>
                    </div>
                    <div className="border-l border-white/10 pl-12 text-right">
                      <p className="text-4xl leading-none font-black text-white">
                        VIP
                      </p>
                      <p className="mt-1 text-[10px] font-black tracking-widest text-amber-500 uppercase">
                        Soporte 24/7
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

            {/* Section Heading */}
            <div
              id="listings-grid"
              className="mb-10 flex scroll-mt-24 flex-col justify-between gap-6 md:flex-row md:items-end"
            >
              <div>
                <div className="text-brand-500 mb-2 flex items-center space-x-2">
                  <div className="bg-brand-500 h-[2px] w-8" />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    Nuestra Selección
                  </span>
                </div>
                <h2 className="text-brand-navy text-4xl font-black tracking-tight">
                  {activeCity === 'All'
                    ? 'Propiedades Destacadas'
                    : activeCity === 'Petfriendly'
                      ? 'Opciones Pet-friendly'
                      : `Alojamientos en ${activeCity}`}
                </h2>
                <p className="mt-2 text-sm font-bold tracking-widest text-gray-400 uppercase">
                  Explorando {filteredListings.length} estancias increíbles
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openInfo('security')}
                  className="hover:text-brand-navy rounded-2xl border border-gray-100 bg-gray-50 p-3 text-gray-400 transition-all duration-300 hover:bg-white hover:shadow-lg"
                >
                  <ShieldCheck className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Listings Grid */}
            {filteredListings.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredListings.map((listing) => (
                    <motion.div
                      key={listing.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.35, ease: 'circOut' }}
                    >
                      <ListingCard
                        listing={listing}
                        onClick={handleListingClick}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="animate-fade-in flex flex-col items-center justify-center py-32 text-center">
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[40px] border border-gray-100 bg-gray-50 font-serif text-4xl text-gray-200 italic">
                  VS
                </div>
                <h3 className="text-brand-navy mb-4 text-3xl font-black">
                  Sin resultados disponibles
                </h3>
                <p className="max-w-sm leading-relaxed font-medium text-gray-500">
                  No hemos encontrado propiedades que coincidan con tu búsqueda
                  actual. Prueba con otros filtros.
                </p>
                <button
                  onClick={() => {
                    setActiveCity('All');
                    setSearchQuery('');
                    setStartDate(null);
                    setEndDate(null);
                  }}
                  className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy mt-8 rounded-2xl px-8 py-4 text-xs font-black tracking-[0.2em] text-white uppercase shadow-xl transition-all duration-300 active:scale-95"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            )}
          </main>

          <footer className="bg-brand-navy relative overflow-hidden px-4 pt-24 pb-12">
            {/* Host Banner - Moved from Hero */}
            <div className="mx-auto mb-24 max-w-7xl">
              <div className="bg-brand-500 group relative flex flex-col items-center justify-between gap-10 overflow-hidden rounded-[40px] p-8 shadow-2xl md:flex-row md:p-16">
                <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
                <div className="relative z-10 max-w-xl text-center md:text-left">
                  <h3 className="text-brand-navy mb-4 text-3xl leading-tight font-black md:text-5xl">
                    {isAdmin
                      ? 'Gestiona tus propiedades de lujo'
                      : '¿Tienes un espacio de lujo en Venezuela?'}
                  </h3>
                  <p className="text-brand-navy/70 text-lg font-bold">
                    {isAdmin
                      ? 'Accede a tus anuncios, revisa reservas y actualiza disponibilidad.'
                      : 'Únete a nuestra exclusiva red de anfitriones y empieza a recibir huéspedes verificados.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (isAdmin) {
                      navigate('/dashboard');
                    } else {
                      navigate('/host-guide');
                    }
                  }}
                  className="bg-brand-navy relative z-10 rounded-2xl px-10 py-5 text-sm font-black tracking-widest text-white uppercase shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                  {isAdmin ? 'Gestionar mis propiedades' : 'Ser Anfitrión'}
                </button>
              </div>
            </div>

            <div className="bg-brand-500/5 absolute top-0 right-0 h-[500px] w-[500px] translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />

            <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-16 md:grid-cols-12">
              <div className="space-y-8 md:col-span-5">
                <div className="flex items-center">
                  <div className="mr-4 h-10 w-10">
                    <svg
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 50L50 20L85 50"
                        stroke="#c5a059"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M30 60L48 78L90 35"
                        stroke="white"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-3xl font-black tracking-tighter text-white">
                    Vene<span className="text-brand-500">Stay</span>
                  </span>
                </div>
                <p className="max-w-md text-lg leading-relaxed font-medium text-white/40">
                  Elevando el estándar de los alquileres vacacionales en
                  Venezuela. Conectividad, seguridad jurídica y eficiencia
                  financiera a través de pagos P2P.
                </p>
                <div className="flex space-x-6">
                  <button className="hover:text-brand-500 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/50 transition-all hover:bg-white">
                    <Globe className="h-5 w-5" />
                  </button>
                  <button className="hover:text-brand-500 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/50 transition-all hover:bg-white">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-6 md:col-span-2">
                <h4 className="text-xs font-black tracking-widest text-white uppercase">
                  Descubrir
                </h4>
                <ul className="space-y-4">
                  <li>
                    <button
                      onClick={() => openInfo('zones')}
                      className="hover:text-brand-500 text-left text-sm font-bold text-white/30 transition-colors"
                    >
                      Zonas Premium
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openInfo('investment')}
                      className="hover:text-brand-500 text-left text-sm font-bold text-white/30 transition-colors"
                    >
                      Guía de Inversión
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openInfo('blog')}
                      className="hover:text-brand-500 text-left text-sm font-bold text-white/30 transition-colors"
                    >
                      VeneStay Blog
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate('/host-guide')}
                      className="hover:text-brand-500 text-left text-sm font-bold text-white/30 transition-colors"
                    >
                      ¿Cómo publicar?
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-6 md:col-span-2">
                <h4
                  onClick={() => openInfo('support')}
                  className="hover:text-brand-500 cursor-pointer text-xs font-black tracking-widest text-white uppercase transition-colors"
                >
                  Soporte
                </h4>
                <ul className="space-y-4">
                  <li>
                    <button
                      onClick={() => openInfo('p2p')}
                      className="hover:text-brand-500 text-left text-sm font-bold text-white/30 transition-colors"
                    >
                      Ayuda P2P
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openInfo('security')}
                      className="hover:text-brand-500 text-left text-sm font-bold text-white/30 transition-colors"
                    >
                      Seguridad
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openInfo('cancellation')}
                      className="hover:text-brand-500 text-left text-sm font-bold text-white/30 transition-colors"
                    >
                      Políticas de Cancelación
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openInfo('contact')}
                      className="hover:text-brand-500 text-left text-sm font-bold text-white/30 transition-colors"
                    >
                      Contacto
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-8 md:col-span-3">
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                  <h5 className="text-brand-500 mb-4 text-xs font-black tracking-widest uppercase">
                    Exclusivo
                  </h5>
                  <p className="mb-4 text-xs font-medium text-white/60">
                    Únete a nuestra lista VIP y recibe las mejores ofertas antes
                    que nadie.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tu email"
                      className="bg-brand-navy focus:border-brand-500 flex-grow rounded-xl border border-white/10 px-4 py-2 text-xs text-white focus:outline-none"
                    />
                    <button className="bg-brand-500 text-brand-navy rounded-xl p-2 transition-transform active:scale-95">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-24 flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 md:flex-row">
              <p className="text-[10px] font-black tracking-widest text-white/20 uppercase">
                © 2024 VeneStay Luxury Rentals. Design for Venezuela.
              </p>
              <div className="flex items-center space-x-8 text-[10px] font-black tracking-widest text-white/40 uppercase">
                <a href="#" className="hover:text-brand-500">
                  Términos
                </a>
                <a href="#" className="hover:text-brand-500">
                  Privacidad
                </a>
                <a href="#" className="hover:text-brand-500">
                  Cookies
                </a>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="border-brand-500 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"></div>
            <p className="text-brand-navy text-[10px] font-black tracking-[0.2em] uppercase opacity-40">
              Preparando Catálogo Exclusivo...
            </p>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={authModalView}
      />

      <Suspense fallback={null}>
        <MyTrips
          isOpen={isMyTripsOpen}
          onClose={() => setIsMyTripsOpen(false)}
        />
      </Suspense>

      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        tab={activeInfoTab}
      />

      {resetCode && (
        <PasswordReset
          oobCode={resetCode}
          onClose={() => {
            setResetCode(null);
            const url = new URL(window.location.href);
            url.searchParams.delete('mode');
            url.searchParams.delete('oobCode');
            window.history.pushState({}, '', url.toString());
          }}
        />
      )}
    </div>
  );
};

export default Home;






