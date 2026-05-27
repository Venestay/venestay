import React, { useEffect, useState } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import * as bookingService from '@/services/booking-service';
import * as authService from '@/services/auth-service';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import {
  Listing,
  BookingDetails,
  BookingStatus,
  Booking,
  UserProfile,
} from '@/types';
import CalendarComponent from '@/features/bookings/components/Calendar';
import Navbar from '@/components/ui/Navbar';
import { getLocalInsights } from '@/services/gemini-service';
import ExchangeCalculator from '@/features/bookings/components/checkout/ExchangeCalculator';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import {
  GOOGLE_MAPS_API_KEY,
  MAPS_LIBRARIES,
  DEFAULT_MAP_OPTIONS,
  useMapsAuthCheck,
} from '@/lib/maps';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Users,
  DoorOpen,
  Bed,
  Bath,
  Sparkles,
  Check,
  Star,
  MapPin,
  PawPrint,
  Clock,
  Info,
  ShieldCheck,
  CreditCard,
  Image as ImageIcon,
  Heart,
  Globe,
  Languages,
  MessageCircle,
  ShieldAlert,
  Building2,
  Hash,
  CalendarDays,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn, calculatePaymentBreakdown } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';
import { checkProfileCompletion } from '@/lib/user-utils';
import { motion, AnimatePresence } from 'motion/react';
import ReviewCard from '@/features/reviews/components/ReviewCard';
import ReviewForm from '@/features/reviews/components/ReviewForm';
import * as reviewService from '@/services/review-service';
import * as listingService from '@/services/listing-service';
import { CancellationPolicyType } from '../types';
import { CANCELLATION_POLICIES, POLICY_TIMELINE } from '../utils/cancellationPolicies';
import { useBookingPanelCollapse } from '../hooks/useBookingPanelCollapse';

interface ListingDetailProps {
  listing?: Listing;
  onClose?: () => void;
  onBooked?: (details: BookingDetails) => void;
  onViewTrips?: () => void;
  onOpenAuth?: (view?: 'login' | 'register') => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  onDatesChange?: (start: Date | null, end: Date | null) => void;
}

const ListingDetail: React.FC<ListingDetailProps> = ({
  listing,
  onClose,
  onBooked,
  onViewTrips,
  onOpenAuth,
  initialStartDate = null,
  initialEndDate = null,
  onDatesChange,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentListing, setCurrentListing] = useState<Listing | null>(listing || null);
  const [isLoadingListing, setIsLoadingListing] = useState(!listing);
  const { user, profileData } = useAuth();
  const { isLoaded, loadError: scriptLoadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });
  const mapsAuthError = useMapsAuthCheck();
  const loadError =
    scriptLoadError ||
    (mapsAuthError ? { message: 'ApiTargetBlockedMapError' } : null);

  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState<boolean>(true);
  const [activeImage, setActiveImage] = useState<string>(
    currentListing?.images?.[0] ?? ''
  );
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [guests, setGuests] = useState(2);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [reservedDates, setReservedDates] = useState<
    { start: Date; end: Date }[]
  >([]);
  const [softReservedDates, setSoftReservedDates] = useState<
    { start: Date; end: Date }[]
  >([]);
  const [hostProfile, setHostProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchListing() {
      if (!listing && id) {
        setIsLoadingListing(true);
        const data = await listingService.getListingById(id);
        setCurrentListing(data);
        setIsLoadingListing(false);
      }
    }
    fetchListing();
  }, [id, listing]);

  useEffect(() => {
    if (currentListing?.images?.length) {
      setActiveImage(currentListing.images[0]);
    }
  }, [currentListing]);
  const [loadingHost, setLoadingHost] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [reviews, setReviews] = useState<(reviewService.Review & { id: string })[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [activeReviewSession, setActiveReviewSession] = useState<reviewService.ReviewSession | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState(false);
  const [guideQuestion, setGuideQuestion] = useState('');
  const { isExpanded: isPanelExpanded, toggle: togglePanel } = useBookingPanelCollapse(
    currentListing?.id ?? 'default'
  );

  useEffect(() => {
    const fetchReviews = async () => {
      if (!currentListing?.id) {
        setLoadingReviews(false);
        return;
      }
      try {
        const data = await reviewService.getListingReviews(currentListing.id);
        setReviews(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [currentListing?.id]);

  useEffect(() => {
    if (currentListing) {
      document.title = `${currentListing.title} | VeneStay Lechería`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `Alquiler premium de ${currentListing.title} en ${currentListing.location}. Reserva segura con VeneStay.`);
      }
    }
    return () => {
      document.title = 'VeneStay | Alquileres Premium en Lechería & Venezuela';
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'VeneStay: La plataforma de alquileres vacacionales premium en Lechería. Reservas 100% seguras asegurando tu estadía con solo el 20% inicial.');
      }
    };
  }, [currentListing]);

  const AMENITY_CATEGORIES: Record<string, string[]> = {
    'Esenciales': ['Wifi', 'A/A', 'Agua', 'Luz', 'Planta eléctrica', 'Pozo de agua', 'Calentador de agua', 'Purificador de Agua'],
    'Relax': ['Piscina', 'BBQ', 'Piscina infinita', 'Jacuzzi', 'Terraza', 'Parrillera / BBQ', 'Kayak / Paddle Board'],
    'Acceso y Seguridad': ['Estacionamiento', 'Seguridad privada', 'Seguridad 24/7', 'Muelle', 'Muelle Privado', 'Muelle Privado / Acceso al Canal', 'Cerradura Inteligente'],
    'Cocina y Hogar': ['Cocina equipada', 'Desayuno incluido', 'Tv por cable', 'Smart TV', 'Electrodomésticos', 'Lavadora', 'Secadora'],
    'Conectividad': ['Wifi Fibra', 'Gimnasio'],
  };

  function categorizeAmenities(amenities: string[]) {
    const result: Record<string, string[]> = {};
    const categorized = new Set<string>();
    for (const [cat, keywords] of Object.entries(AMENITY_CATEGORIES)) {
      const matches = amenities.filter(a => keywords.some(k => a.toLowerCase().includes(k.toLowerCase())));
      if (matches.length) { result[cat] = matches; matches.forEach(m => categorized.add(m)); }
    }
    const uncategorized = amenities.filter(a => !categorized.has(a));
    if (uncategorized.length) result['Otros'] = uncategorized;
    return result;
  }

  const totalNights =
    startDate && endDate ? differenceInDays(endDate, startDate) : 0;
  const totalPrice =
    totalNights > 0
      ? (currentListing?.pricePerNight || 0) * totalNights
      : (currentListing?.pricePerNight || 0);

  /* 
     VeneStay Local Guide (IA) - Deshabilitado por ahora
     "Información impulsada por IA deshabilitada por ahora."
  useEffect(() => {
    const fetchInsights = async () => {
      if (!currentListing?.city) {
        setLoadingInsights(false);
        return;
      }
      setLoadingInsights(false);
      setInsights('Información impulsada por IA deshabilitada por ahora.');
    };
    fetchInsights();
  }, [currentListing?.city]);
  */

  useEffect(() => {
    const fetchReservedDates = async () => {
      if (!currentListing?.id) return;
      try {
        const ranges = await bookingService.getReservedDates(currentListing.id);

        const confirmed = ranges.filter(r => r.type === 'confirmed').map(r => ({ start: r.start, end: r.end }));
        const pending = ranges.filter(r => r.type === 'pending').map(r => ({ start: r.start, end: r.end }));

        if (currentListing.blockedDates && currentListing.blockedDates.length > 0) {
          currentListing.blockedDates.forEach((dateStr) => {
            const date = parseISO(dateStr);
            confirmed.push({ start: date, end: date });
          });
        }

        setReservedDates(confirmed);
        setSoftReservedDates(pending);
      } catch (error) {
        console.error('Error fetching reserved dates:', error);
      }
    };
    fetchReservedDates();
  }, [currentListing?.id]);

  useEffect(() => {
    const fetchHostProfile = async () => {
      if (!currentListing?.hostId) {
        setLoadingHost(false);
        return;
      }
      try {
        setLoadingHost(true);
        const profile = await authService.getUserProfile(currentListing.hostId);
        setHostProfile(profile);
      } catch (error) {
        console.error('ListingDetail: Error fetching host profile:', error);
      } finally {
        setLoadingHost(false);
      }
    };
    fetchHostProfile();
  }, [currentListing?.hostId]);

  useEffect(() => {
    if (
      user &&
      bookingError === 'Por favor inicia sesión para completar tu reserva'
    ) {
      setBookingError(null);
    }
  }, [user, bookingError]);


  const handleBooking = () => {
    try {
      if (!startDate || !endDate) {
        setBookingError('Por favor selecciona las fechas de tu estancia');
        setIsCalendarOpen(true);
        setTimeout(() => setBookingError(null), 3000);
        return;
      }

      const minNightsRequired = currentListing?.minNights ?? 2;
      if (totalNights < minNightsRequired) {
        setBookingError(`La estadía mínima para este alojamiento es de ${minNightsRequired} noches.`);
        setIsCalendarOpen(true);
        setTimeout(() => setBookingError(null), 4000);
        return;
      }

      const bookingData = {
        listingId: currentListing.id,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        guests: guests,
      };

      navigate('/checkout', { state: { bookingData } });
    } catch (err) {
      console.error('Error in handleBooking:', err);
      setBookingError(
        'Ocurrió un error al procesar tu reserva. Intenta de nuevo.'
      );
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  const handleSearchSubmit = () => {
    navigate('/', { 
      state: { 
        searchQuery, 
        startDate: startDate?.toISOString(), 
        endDate: endDate?.toISOString() 
      } 
    });
  };

  return (
    <div className="animate-fade-in relative min-h-screen bg-white pb-32">

      {isLoadingListing ? (
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="text-brand-500 h-12 w-12 animate-spin" />
            <p className="text-brand-navy text-[10px] font-black tracking-[0.2em] uppercase opacity-40">
              Iniciando Experiencia Premium...
            </p>
          </div>
        </div>
      ) : !currentListing ? (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center">
          <div className="bg-brand-navy text-brand-500 mb-8 flex h-24 w-24 items-center justify-center rounded-[40px] border border-white/10 text-4xl font-serif italic">
            VS
          </div>
          <h2 className="text-brand-navy mb-4 text-3xl font-black">
            Propiedad No Encontrada
          </h2>
          <p className="max-w-md text-sm font-medium text-gray-500">
            Lo sentimos, el enlace que has seguido parece ser inválido o la
            propiedad ya no está disponible en nuestro catálogo exclusivo.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy mt-10 rounded-2xl px-10 py-5 text-xs font-black tracking-widest text-white uppercase shadow-2xl transition-all active:scale-95"
          >
            Explorar Catálogo
          </button>
        </div>
      ) : (
        <>

      <div className="mx-auto flex max-w-7xl flex-col pt-0 sm:pt-4">
        {/* Navigation / Navbar (Desktop & Mobile) */}
        <div className="-mx-4 mb-6 bg-white sm:-mx-6 lg:-mx-8">
          <Navbar
            activeCity={currentListing.city || 'All'}
            setActiveCity={(city) => {
              if (city === 'All') navigate('/');
              // If we want to filter by city on home, we can pass it in state
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            startDate={startDate}
            endDate={endDate}
            setDates={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              onDatesChange?.(start, end);
            }}
            onOpenAdmin={() => navigate('/dashboard')}
            onOpenAuth={(view) => {
              if (onOpenAuth) onOpenAuth(view);
              else navigate('/'); // Fallback if no modal handler
            }}
            hideFilters={true}
            onSearchSubmit={handleSearchSubmit}
            onLogoClick={() => navigate('/')}
          />
        </div>

        <AnimatePresence>
          {isCalendarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-brand-navy/60 fixed inset-0 z-[100] flex items-end justify-center p-4 backdrop-blur-md sm:items-center lg:hidden"
              onClick={() => setIsCalendarOpen(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <CalendarComponent
                  startDate={startDate}
                  endDate={endDate}
                  reservedDates={reservedDates}
                  minNights={currentListing?.minNights ?? 2}
                  onChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                    onDatesChange?.(start, end);
                  }}
                  onClose={() => setIsCalendarOpen(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="">
          {/* Gallery Header */}
          <div className="relative mt-2 mb-6 hidden h-[50vh] max-h-[600px] min-h-[400px] gap-2 px-4 sm:px-6 md:grid md:grid-cols-4 md:grid-rows-2 lg:px-8">
            {/* Desktop Bento Box */}
            <div
              className="group relative col-span-2 row-span-2 cursor-pointer overflow-hidden bg-gray-100"
              onClick={() => setIsGalleryOpen(true)}
            >
              <img
                src={currentListing.images[0]}
                alt={currentListing.title}
                loading="eager" /* First image should be eager */
                decoding="async"
                className="h-full w-full rounded-l-2xl object-cover transition-opacity duration-300 hover:opacity-90"
              />
            </div>
            {currentListing.images.slice(1, 5).map((img, idx) => {
              const isTopRight = idx === 1;
              const isBottomRight = idx === 3;
              return (
                <div
                  key={idx}
                  className="group relative cursor-pointer overflow-hidden bg-gray-100"
                  onClick={() => setIsGalleryOpen(true)}
                >
                  <img
                    src={img}
                    alt={`Gallery ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className={cn(
                      'h-full w-full object-cover transition-opacity duration-300 hover:opacity-90',
                      isTopRight && 'rounded-tr-2xl',
                      isBottomRight && 'rounded-br-2xl'
                    )}
                  />
                  {isBottomRight && (
                    <button
                      className="absolute right-4 bottom-4 z-10 flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-md transition-colors hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsGalleryOpen(true);
                      }}
                    >
                      <ImageIcon className="h-4 w-4" />
                      Ver recorrido visual
                    </button>
                  )}
                </div>
              );
            })}
            {currentListing.images.length < 5 &&
              Array.from({ length: 4 - (currentListing.images.length - 1) }).map(
                (_, i) => {
                  const isBottomRight =
                    i === 4 - (currentListing.images.length - 1) - 1;
                  return (
                    <div
                      key={`empty-${i}`}
                      className="relative flex items-center justify-center bg-gray-50"
                    >
                      <ImageIcon className="h-8 w-8 text-gray-200" />
                      {isBottomRight && (
                        <button
                          className="absolute right-4 bottom-4 z-10 flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-md transition-colors hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsGalleryOpen(true);
                          }}
                        >
                          <ImageIcon className="h-4 w-4" />
                          Ver recorrido visual
                        </button>
                      )}
                    </div>
                  );
                }
              )}
          </div>

          {/* Mobile swipeable gallery */}
          <div className="relative h-[400px] w-full md:hidden">
            {/* Floating Back Button for Mobile */}
            <button
              onClick={handleClose}
              className="absolute left-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform active:scale-90"
            >
              <ArrowLeft className="h-5 w-5 text-brand-navy" />
            </button>
            <motion.div
              className="flex h-full w-full"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                const swipe = info.offset.x;
                if (swipe < -50) {
                  const currentIndex = currentListing.images.indexOf(activeImage);
                  if (currentIndex < currentListing.images.length - 1) {
                    setActiveImage(currentListing.images[currentIndex + 1]);
                  }
                } else if (swipe > 50) {
                  const currentIndex = currentListing.images.indexOf(activeImage);
                  if (currentIndex > 0) {
                    setActiveImage(currentListing.images[currentIndex - 1]);
                  }
                }
              }}
              onClick={() => setIsGalleryOpen(true)}
            >
              <img
                src={activeImage}
                alt={currentListing.title}
                className="h-full w-full cursor-pointer object-cover select-none"
              />
            </motion.div>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden">
              {currentListing.images.map((img, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-all',
                    img === activeImage ? 'bg-brand-500 w-4' : 'bg-white/50'
                  )}
                />
              ))}
            </div>

            <button
              className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-md transition-colors hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                setIsGalleryOpen(true);
              }}
            >
              <ImageIcon className="h-3 w-3" />1 / {currentListing.images.length}
            </button>
          </div>

          <div className="p-6 md:px-12 md:py-6">
            <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-grow space-y-10">
                <div>
                  {/* Reviews & Status Bar */}
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <div className="bg-brand-navy group flex items-center overflow-hidden rounded-2xl border border-white/10 px-4 py-2 text-white shadow-lg">
                      <Star className="text-brand-500 fill-brand-500 mr-2 h-4 w-4" />
                      <span className="text-sm font-black tracking-tight">
                        {currentListing.rating}
                      </span>
                      <div className="mx-2 h-4 w-[1px] bg-white/20" />
                      <span className="text-[11px] font-black tracking-wider text-white/70 uppercase">
                        {currentListing.reviewsCount} reseñas
                      </span>
                    </div>
                    {currentListing.isVerified && (
                      <span className="text-brand-navy bg-brand-500/10 border-brand-500/20 flex items-center rounded-2xl border px-4 py-2 text-[10px] leading-none font-black tracking-widest uppercase">
                        <CheckCircle2 className="text-brand-500 mr-2 h-4 w-4" />{' '}
                        Publicación Verificada
                      </span>
                    )}
                    {currentListing.isPetFriendly && (
                      <span className="flex items-center rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black tracking-wider text-emerald-700 uppercase">
                        <PawPrint className="mr-1.5 h-3.5 w-3.5" /> Pet-friendly
                      </span>
                    )}
                  </div>
                  <h1 className="text-brand-navy mb-4 text-3xl leading-[1.1] font-black tracking-tight md:text-5xl">
                    {currentListing.title}
                  </h1>
                  <div className="flex items-center font-bold text-gray-500">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span className="decoration-brand-500/30 underline underline-offset-4">
                      {currentListing.location}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-y border-gray-100 py-8 sm:grid-cols-4">
                  <div className="flex flex-col items-center rounded-2xl bg-gray-50 p-4">
                    <Users className="text-brand-500 mb-2 h-6 w-6" />
                    <span className="text-brand-navy text-sm font-black">
                      {currentListing.maxGuests}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Huéspedes
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl bg-gray-50 p-4">
                    <DoorOpen className="text-brand-500 mb-2 h-6 w-6" />
                    <span className="text-brand-navy text-sm font-black">
                      {currentListing.bedrooms}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Habitaciones
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl bg-gray-50 p-4">
                    <Bed className="text-brand-500 mb-2 h-6 w-6" />
                    <span className="text-brand-navy text-sm font-black">
                      {currentListing.beds}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Camas
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl bg-gray-50 p-4">
                    <Bath className="text-brand-500 mb-2 h-6 w-6" />
                    <span className="text-brand-navy text-sm font-black">
                      {currentListing.baths}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Baños
                    </span>
                  </div>
                </div>
                
                {/* Building Details Section - Unified Premium Style */}
                {(currentListing.buildingFloors || currentListing.propertyFloor || currentListing.constructionYear) && (
                  <div className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3">
                    {currentListing.buildingFloors && (
                      <div className="flex items-center gap-3 rounded-2xl bg-gray-50/50 border border-gray-100 p-4 transition-all hover:bg-white hover:shadow-md">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                          <Building2 className="text-brand-500 h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-brand-navy text-sm font-black leading-tight">
                            {currentListing.buildingFloors} pisos
                          </span>
                          <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase">
                            Edificio
                          </span>
                        </div>
                      </div>
                    )}
                    {currentListing.propertyFloor && (
                      <div className="flex items-center gap-3 rounded-2xl bg-gray-50/50 border border-gray-100 p-4 transition-all hover:bg-white hover:shadow-md">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                          <Hash className="text-brand-500 h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-brand-navy text-sm font-black leading-tight">
                            Piso {currentListing.propertyFloor}
                          </span>
                          <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase">
                            Ubicación
                          </span>
                        </div>
                      </div>
                    )}
                    {currentListing.constructionYear && (
                      <div className="flex items-center gap-3 rounded-2xl bg-gray-50/50 border border-gray-100 p-4 transition-all hover:bg-white hover:shadow-md">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                          <CalendarDays className="text-brand-500 h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-brand-navy text-sm font-black leading-tight">
                            {currentListing.constructionYear}
                          </span>
                          <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase">
                            Construcción
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Meet your host section - Minimalist Integration */}
                <div className="group relative border-y border-gray-100/60 py-10 md:py-12">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-transform duration-700 group-hover:scale-110">
                    <ShieldCheck className="text-brand-navy h-32 w-32" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-10 md:flex-row md:items-start">
                    <div className="relative">
                      <div className="relative h-32 w-32 overflow-hidden rounded-[32px] border-2 border-gray-100 bg-gray-50">
                        {loadingHost ? (
                          <Skeleton className="h-full w-full rounded-none" />
                        ) : (
                          <img
                            src={hostProfile?.photoURL || currentListing.hostAvatar}
                            alt={hostProfile?.displayName || currentListing.hostName}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      {!loadingHost && (
                        <div className="bg-brand-500 text-brand-navy absolute -right-2 -bottom-2 rounded-xl border-2 border-white p-2">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="w-full flex-grow space-y-6 text-center md:text-left">
                      {loadingHost ? (
                        <div className="space-y-4">
                          <Skeleton className="h-8 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-20 w-full" />
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="mb-2 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                              <h3 className="text-brand-navy text-3xl font-black tracking-tight">
                                Conoce a{' '}
                                {hostProfile?.displayName?.split(' ')[0] ||
                                  currentListing.hostName.split(' ')[0]}
                              </h3>
                              <div className="flex gap-2">
                                <span className="bg-brand-navy text-brand-500 border-brand-navy rounded-lg border px-3 py-1 text-[9px] font-black tracking-widest uppercase">
                                  Superanfitrión
                                </span>
                                {hostProfile?.isIdentityVerified && (
                                  <span className="bg-emerald-500 text-white rounded-lg px-3 py-1 text-[9px] font-black tracking-widest uppercase flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                                    <ShieldCheck className="h-3 w-3" />
                                    Pasaporte Verificado
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 text-[10px] font-black tracking-widest text-gray-400 uppercase md:justify-start">
                              <span className="flex items-center gap-1.5">
                                <Star className="text-brand-500 fill-brand-500 h-3 w-3" />{' '}
                                4.95 Rating
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MessageCircle className="text-brand-500 h-3 w-3" />{' '}
                                {hostProfile?.responseRate || '100%'} Respuesta
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="text-brand-500 h-3 w-3" />{' '}
                                {hostProfile?.responseTime || 'Pocos minutos'}
                              </span>
                            </div>
                          </div>

                          {hostProfile?.about && (
                            <p className="line-clamp-3 text-sm leading-relaxed font-medium text-gray-500 italic md:line-clamp-none">
                              "{hostProfile.about}"
                            </p>
                          )}
                        </>
                      )}

                      <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
                        {hostProfile?.languages && (
                          <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/60 p-3">
                            <Languages className="text-brand-500 h-4 w-4" />
                            <div>
                              <p className="mb-1 text-[8px] leading-none font-black tracking-widest text-gray-400 uppercase">
                                Idiomas
                              </p>
                              <p className="text-brand-navy text-xs leading-none font-bold">
                                {hostProfile.languages}
                              </p>
                            </div>
                          </div>
                        )}
                        {hostProfile?.location && (
                          <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/60 p-3">
                            <MapPin className="text-brand-500 h-4 w-4" />
                            <div>
                              <p className="mb-1 text-[8px] leading-none font-black tracking-widest text-gray-400 uppercase">
                                Ubicación
                              </p>
                              <p className="text-brand-navy text-xs leading-none font-bold">
                                {hostProfile.location}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {hostProfile?.interests && (
                        <div className="flex flex-wrap justify-center gap-2 pt-2 md:justify-start">
                          {hostProfile.interests
                            .split(',')
                            .map((interest, i) => (
                              <span
                                key={i}
                                className="text-brand-navy/60 flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-3 py-1 text-[9px] font-black tracking-widest uppercase shadow-sm"
                              >
                                <Heart className="text-brand-500 h-2.5 w-2.5" />{' '}
                                {interest.trim()}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-brand-navy flex items-center text-2xl font-black">
                    <span className="bg-brand-navy text-brand-500 mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                      01
                    </span>
                    Descripción del espacio
                  </h3>
                  <div className="relative">
                    <p
                      className={cn(
                        'text-lg leading-relaxed font-medium text-gray-600 transition-all duration-500 whitespace-pre-line',
                        !isDescriptionExpanded && 'line-clamp-4'
                      )}
                    >
                      {currentListing.description}
                    </p>
                    {!isDescriptionExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
                    )}
                  </div>
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="flex items-center gap-1 text-sm font-black text-brand-navy/60 hover:text-brand-navy transition-colors"
                  >
                    {isDescriptionExpanded ? 'Leer menos ↑' : 'Leer más →'}
                  </button>
                </div>

                {/* Environment / Nearby Activities Section */}
                {currentListing.nearbyActivities && (
                  <div className="space-y-6">
                    <h3 className="text-brand-navy flex items-center text-2xl font-black">
                      <span className="bg-brand-navy text-brand-500 mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                        02
                      </span>
                      Entorno y Experiencias
                    </h3>
                    <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-8">
                      <p className="text-lg leading-relaxed font-medium text-gray-600 whitespace-pre-line">
                        {currentListing.nearbyActivities}
                      </p>
                    </div>
                  </div>
                )}

                {/* 
                <div className="space-y-6">
                  <h3 className="text-brand-navy flex items-center text-2xl font-black">
                    <Sparkles className="text-brand-500 fill-brand-500/20 mr-3 h-7 w-7" />
                    VeneStay Local Guide (IA)
                  </h3>
                  <div className="bg-brand-navy brand-gradient group rounded-3xl border border-white/10 p-8 text-white shadow-2xl">
                    {loadingInsights ? (
                      <div className="space-y-4">
                        <Skeleton className="h-4 w-full bg-white/10" />
                        <Skeleton className="h-4 w-5/6 bg-white/10" />
                      </div>
                    ) : (
                      <p className="relative text-lg leading-relaxed font-light text-white/90 italic">
                        <span className="text-brand-500/20 absolute -top-4 -left-4 font-serif text-5xl">
                          "
                        </span>
                        {insights}
                        <span className="text-brand-500/20 absolute -right-2 -bottom-8 font-serif text-5xl">
                          "
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                */}

                <div className="space-y-8">
                  <h3 className="text-brand-navy flex items-center text-2xl font-black">
                    <span className="bg-brand-navy text-brand-500 mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                      03
                    </span>
                    Comodidades
                  </h3>
                  <div className="space-y-8">
                    {Object.entries(categorizeAmenities(currentListing.amenities))
                      .filter(([category]) => isAmenitiesExpanded || category === 'Esenciales')
                      .map(([category, items]) => (
                      <div key={category} className="space-y-4">
                        <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{category}</p>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {items.map((item) => (
                            <div
                              key={item}
                              className="hover:border-brand-100 hover:bg-brand-50 flex items-center space-x-4 rounded-2xl border border-transparent bg-gray-50 p-4 transition-all duration-300"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                                <Check className="text-brand-500 h-5 w-5" />
                              </div>
                              <span className="text-brand-navy font-bold">
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {currentListing.amenities.length > 6 && (
                      <button
                        onClick={() => setIsAmenitiesExpanded(!isAmenitiesExpanded)}
                        className="w-full sm:w-auto mt-4 px-8 py-4 border-2 border-brand-navy text-brand-navy rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-brand-navy hover:text-white transition-all duration-300 shadow-lg active:scale-95"
                      >
                        {isAmenitiesExpanded ? 'Ver menos ↑' : `Ver todas las comodidades (${currentListing.amenities.length}) →`}
                      </button>
                    )}
                  </div>
                </div>

                {/* 04 Configuración de Reserva y Divisas (Mobile Only) */}
                <div className="space-y-6 block lg:hidden border-t border-gray-100 pt-8">
                  <h3 className="text-brand-navy flex items-center text-2xl font-black">
                    <span className="bg-brand-navy text-brand-500 mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                      04
                    </span>
                    Detalle de Reserva y Divisas
                  </h3>

                  <div className="rounded-[32px] border border-gray-100 p-6 bg-gray-50/30 space-y-6">
                    {/* Bloque de Fechas y Huéspedes en Móvil */}
                    <div className="bg-white rounded-[24px] border border-slate-200/80 overflow-hidden shadow-sm">
                      <div className="grid grid-cols-2 border-b border-slate-100">
                        <div
                          className="cursor-pointer border-r border-slate-100 p-4 active:bg-slate-50"
                          onClick={() => setIsCalendarOpen(true)}
                        >
                          <div className="mb-1 flex items-center space-x-1.5 select-none">
                            <Clock className="text-brand-navy/40 h-3.5 w-3.5 shrink-0" />
                            <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                              Check-in
                            </p>
                          </div>
                          <p className="text-brand-navy text-[13px] font-black leading-tight mt-1">
                            {startDate
                              ? format(startDate, 'dd MMM yyyy', { locale: es })
                              : 'Elegir fecha'}
                          </p>
                        </div>
                        <div
                          className="cursor-pointer p-4 active:bg-slate-50"
                          onClick={() => setIsCalendarOpen(true)}
                        >
                          <div className="mb-1 flex items-center space-x-1.5 select-none">
                            <Clock className="text-brand-navy/40 h-3.5 w-3.5 shrink-0" />
                            <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                              Check-out
                            </p>
                          </div>
                          <p className="text-brand-navy text-[13px] font-black leading-tight mt-1">
                            {endDate
                              ? format(endDate, 'dd MMM yyyy', { locale: es })
                              : 'Elegir fecha'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white select-none">
                        <div className="flex items-center space-x-2">
                          <Users className="text-brand-navy/40 h-3.5 w-3.5" />
                          <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                            Huéspedes
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setGuests(Math.max(1, guests - 1))}
                            className="text-brand-navy flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 active:bg-slate-100 text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="text-brand-navy min-w-[2.5rem] text-center text-xs font-black">
                            {guests} {guests === 1 ? 'Viajero' : 'Viajeros'}
                          </span>
                          <button
                            onClick={() => setGuests(Math.min(currentListing.maxGuests, guests + 1))}
                            disabled={guests >= currentListing.maxGuests}
                            className="text-brand-navy flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 active:bg-slate-100 disabled:opacity-30 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desglose de Divisas / Conversiones en Móvil */}
                    <div className="border-t border-slate-100 pt-4">
                      <ExchangeCalculator
                        totalPrice={totalNights > 0 ? totalPrice : currentListing.pricePerNight}
                        depositAmount={
                          totalNights > 0
                            ? calculatePaymentBreakdown(totalPrice).depositAmount
                            : currentListing.pricePerNight * 0.20
                        }
                        remainingAmount={
                          totalNights > 0
                            ? calculatePaymentBreakdown(totalPrice).remainingBalance
                            : currentListing.pricePerNight * 0.80
                        }
                        paymentMethods={currentListing.paymentMethods}
                      />
                    </div>

                    {/* Acordeón de desglose detallado en móvil */}
                    <div className="border-t border-slate-100 pt-4">
                      <button
                        onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
                        className="flex w-full items-center justify-between text-[10px] font-black tracking-widest text-[#0a142c]/60 uppercase py-1 px-1 select-none"
                      >
                        <span>{isBreakdownOpen ? 'Ocultar desglose' : 'Ver desglose de tarifas'}</span>
                        <span className="text-sm font-semibold transition-transform duration-200 text-slate-400" style={{ transform: isBreakdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                          ▼
                        </span>
                      </button>
                      <AnimatePresence>
                        {isBreakdownOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3.5 pt-4 pb-2 px-1 text-[12px] font-medium text-slate-500">
                              <div className="flex justify-between items-baseline">
                                <span className="text-slate-500 font-medium">Estadía • {totalNights > 0 ? `${totalNights} ${totalNights === 1 ? 'noche' : 'noches'}` : '1 noche'}</span>
                                <span className="font-extrabold text-brand-navy font-sans text-sm">
                                  ${(currentListing.pricePerNight * (totalNights > 0 ? totalNights : 1)).toLocaleString()} USD
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Limpieza de alojamiento</span>
                                <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50/70 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none">
                                  Incluida
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Servicios de plataforma</span>
                                <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50/70 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none">
                                  $0 Cargo
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Impuestos municipales</span>
                                <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50/70 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none">
                                  Incluidos
                                </span>
                              </div>
                              <div className="border-t border-slate-100 pt-3.5 flex justify-between items-baseline font-black text-brand-navy mt-1">
                                <span className="text-[10px] tracking-widest uppercase text-slate-400 font-extrabold">Total Final</span>
                                <span className="text-base font-extrabold font-sans">
                                  ${(currentListing.pricePerNight * (totalNights > 0 ? totalNights : 1)).toLocaleString()} USD
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Política de Cancelación en Móvil */}
                    <div className="border-t border-slate-100 pt-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-[#0a142c]/60 uppercase select-none">
                        <Info className="h-3.5 w-3.5 text-brand-gold" />
                        <span>Política de Cancelación</span>
                      </div>
                      <p className="text-[10.5px] leading-relaxed text-slate-500 font-medium">
                        {(() => {
                          const policyKey = (currentListing.cancellationPolicy ?? 'moderate') as CancellationPolicyType;
                          const policy = CANCELLATION_POLICIES[policyKey];
                          return (
                            <>
                              <strong>{policy.label}:</strong> {policy.detail}
                            </>
                          );
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 border-t border-gray-100 pt-8 lg:border-t-0 lg:pt-0">
                  <h3 className="text-brand-navy flex items-center text-2xl font-black">
                    <span className="bg-brand-navy text-brand-500 mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                      <span className="hidden lg:inline">04</span>
                      <span className="inline lg:hidden">05</span>
                    </span>
                    Ubicación
                  </h3>
                  <div className="group relative h-96 w-full overflow-hidden rounded-[40px] border-8 border-gray-100 bg-gray-50 shadow-2xl">
                    {isLoaded && !loadError ? (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={{
                          lat: currentListing.latitude || 10.2167,
                          lng: currentListing.longitude || -67.95,
                        }}
                        zoom={15}
                        options={DEFAULT_MAP_OPTIONS}
                      >
                        {currentListing.latitude && currentListing.longitude && (
                          <Marker
                            position={{
                              lat: currentListing.latitude,
                              lng: currentListing.longitude,
                            }}
                            icon={{
                              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#C5A059" stroke="#0B1120" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                  <polyline points="9 22 9 12 15 12 15 22"/>
                                </svg>
                              `),
                              scaledSize: new window.google.maps.Size(40, 40),
                              anchor: new window.google.maps.Point(20, 40),
                            }}
                          />
                        )}
                      </GoogleMap>
                    ) : (
                      <div className="bg-brand-navy group/map-error relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-12 text-center">
                        {/* Decorative background map pattern */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-20 grayscale invert" />
                        <div className="from-brand-navy via-brand-navy/95 to-brand-500/10 absolute inset-0 bg-gradient-to-br" />

                        <div className="relative z-10 flex max-w-md flex-col items-center">
                          <div className="bg-brand-500/10 border-brand-500/20 mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] border shadow-2xl backdrop-blur-xl transition-transform duration-700 group-hover/map-error:scale-110">
                            <MapPin className="text-brand-500 h-12 w-12 animate-bounce" />
                          </div>

                          <h4 className="mb-4 text-2xl font-black tracking-tight text-white">
                            Mapa Interactivo
                          </h4>
                          <p className="mb-10 text-sm leading-relaxed font-medium text-white/70">
                            {loadError
                              ? loadError.message?.includes(
                                  'ApiTargetBlockedMapError'
                                )
                                ? "El mapa requiere que habilites 'Maps JavaScript API' en tu Google Cloud Console. Mientras tanto, puedes usar la vista externa."
                                : 'Configuración de API pendiente. Verifica tus permisos de Maps en Google Cloud.'
                              : 'Preparando vista detallada del sector...'}
                          </p>

                          <div className="flex w-full flex-col gap-5 sm:flex-row">
                            <button
                              onClick={() =>
                                window.open(
                                  `https://www.google.com/maps?q=${currentListing.latitude},${currentListing.longitude}`,
                                  '_blank'
                                )
                              }
                              className="bg-brand-500 text-brand-navy flex flex-grow items-center justify-center gap-3 rounded-2xl px-8 py-5 text-xs font-black tracking-widest uppercase shadow-2xl transition-all hover:bg-white active:scale-95"
                            >
                              Abrir en Google Maps
                              <Globe className="h-4 w-4" />
                            </button>
                          </div>

                          {loadError && (
                            <div className="mt-10 w-full border-t border-white/10 pt-8">
                              <button
                                onClick={() =>
                                  window.open(
                                    'https://console.cloud.google.com/google/maps-apis/api-list',
                                    '_blank'
                                  )
                                }
                                className="text-brand-500 mx-auto flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase transition-colors hover:text-white"
                              >
                                <ShieldAlert className="h-3 w-3" />
                                Configuración Técnica: Maps JavaScript API
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="absolute right-6 bottom-6 left-6 translate-y-4 rounded-3xl border border-white bg-white/90 p-6 opacity-0 shadow-xl backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="flex items-center justify-between">
                        <div className="mr-4">
                          <p className="text-brand-500 mb-1 text-[10px] font-black tracking-widest uppercase">
                            Dirección Exacta
                          </p>
                          <p className="text-brand-navy line-clamp-1 text-sm font-black">
                            {currentListing.manualAddress || currentListing.location}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps?q=${currentListing.latitude},${currentListing.longitude}`,
                              '_blank'
                            )
                          }
                          className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy shrink-0 rounded-xl px-5 py-2.5 text-[10px] font-black tracking-widest text-white uppercase transition-all"
                        >
                          Ver en Google Maps
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="space-y-10 border-t border-gray-100 pt-12">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-brand-navy flex items-center text-2xl font-black">
                      <span className="bg-brand-navy text-brand-500 mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                        <span className="hidden lg:inline">05</span>
                        <span className="inline lg:hidden">06</span>
                      </span>
                      Reseñas Verificadas
                    </h3>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2">
                        <Star className="text-brand-500 fill-brand-500 h-4 w-4" />
                        <span className="text-sm font-black text-brand-navy">{currentListing.rating}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {reviews.length || currentListing.reviewsCount} Reseñas Totales
                      </span>
                    </div>
                  </div>

                  {activeReviewSession && (
                    <ReviewForm 
                      listingId={currentListing.id}
                      guestId={user?.uid || ''}
                      guestName={profileData?.displayName || 'Huésped'}
                      reviewSessionId={activeReviewSession.id}
                      onSuccess={() => {
                        setActiveReviewSession(null);
                        reviewService.getListingReviews(currentListing.id).then(setReviews);
                      }}
                    />
                  )}

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {loadingReviews ? (
                      [...Array(2)].map((_, i) => (
                        <div key={i} className="h-48 w-full animate-pulse rounded-3xl bg-gray-50" />
                      ))
                    ) : reviews.length > 0 ? (
                      reviews.map((review) => (
                        <ReviewCard 
                          key={review.id}
                          guestName={review.guestName}
                          rating={review.rating}
                          comment={review.comment}
                          createdAt={review.createdAt}
                        />
                      ))
                    ) : (
                      <div className="col-span-full rounded-3xl border-2 border-dashed border-gray-100 p-12 text-center">
                        <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-200" />
                        <p className="text-sm font-bold text-gray-400">Aún no hay reseñas verificadas para esta propiedad.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 06 Reglas y Políticas Section */}
                <div className="space-y-10 border-t border-gray-100 pt-12">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-brand-navy flex items-center text-2xl font-black">
                      <span className="bg-brand-navy text-brand-500 mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                        <span className="hidden lg:inline">06</span>
                        <span className="inline lg:hidden">07</span>
                      </span>
                      Reglas y Políticas
                    </h3>
                  </div>

                  {(() => {
                    const policyKey = (currentListing.cancellationPolicy ?? 'moderate') as CancellationPolicyType;
                    const policy = CANCELLATION_POLICIES[policyKey];
                    const timeline = POLICY_TIMELINE[policyKey];
                    
                    return (
                      <div className="space-y-8">
                        {/* Policy Detail Card */}
                        <div className="rounded-[28px] border border-slate-100 bg-slate-50/50 p-6 md:p-8 space-y-6">
                          <div className="flex items-center gap-3">
                            <span className={cn("inline-block h-3.5 w-3.5 rounded-full", policy.dotColor)} />
                            <h4 className="text-lg font-black text-brand-navy tracking-tight">{policy.label}</h4>
                            <span className={cn("rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest leading-none", policy.badgeColor)}>
                              Activa
                            </span>
                          </div>
                          
                          <p className="text-sm font-semibold leading-relaxed text-slate-600">
                            {policy.detail}
                          </p>

                          {/* Visual Timeline */}
                          <div className="relative pt-6 pb-2">
                            {/* Horizontal Line */}
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 rounded-full" />
                            
                            <div className="relative flex justify-between">
                              {timeline.milestones.map((milestone, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center space-y-2 relative z-10">
                                  {/* Milestone Bullet */}
                                  <div className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full border-4 border-white shadow-md transition-colors",
                                    milestone.refundPct === 100 
                                      ? "bg-emerald-500" 
                                      : milestone.refundPct === 50 
                                        ? "bg-amber-500" 
                                        : "bg-red-500"
                                  )}>
                                    {milestone.refundPct > 0 ? (
                                      <Check className="h-2 w-2 text-white stroke-[4]" />
                                    ) : (
                                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                    )}
                                  </div>
                                  
                                  {/* Label */}
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {milestone.label}
                                  </span>
                                  
                                  {/* Refund Percentage */}
                                  <span className={cn(
                                    "text-xs font-extrabold",
                                    milestone.refundPct === 100 
                                      ? "text-emerald-600" 
                                      : milestone.refundPct === 50 
                                        ? "text-amber-600" 
                                        : "text-red-600"
                                  )}>
                                    {milestone.refundPct}% reembolso
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {timeline.strictNote && (
                            <p className="text-xs font-semibold text-red-500 bg-red-50/50 border border-red-100/50 rounded-xl px-4 py-2.5">
                              ⚠️ {timeline.strictNote}
                            </p>
                          )}

                          {/* UCP Note */}
                          <div className="border-t border-slate-100 pt-5 mt-4">
                            <p className="text-[11px] leading-relaxed text-slate-400 font-bold">
                              ℹ️ <span className="uppercase tracking-widest text-[9px] font-extrabold mr-1 text-slate-500">Garantía de Reserva 20/80:</span>
                              Aseguras tu estadía pagando solo un 20% hoy a la plataforma (Depósito de Garantía), el cual está protegido por esta política de cancelación. El 80% restante lo abonas directamente a tu anfitrión al momento de hacer el check-in.
                            </p>
                          </div>
                        </div>

                        {/* House Rules */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black tracking-widest uppercase text-slate-400">
                            Normas de la Casa
                          </h4>
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/30 p-4">
                              <span className="text-base">🚭</span>
                              <span className="text-[11.5px] font-bold text-slate-600">No Fumar</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/30 p-4">
                              <span className="text-base">🐾</span>
                              <span className="text-[11.5px] font-bold text-slate-600">
                                {currentListing.isPetFriendly ? 'Pet Friendly' : 'No Mascotas'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/30 p-4">
                              <span className="text-base">⏰</span>
                              <span className="text-[11.5px] font-bold text-slate-600">Check-in: 14:00</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Desktop Booking Panel — Variantes Expanded / Collapsed */}
              <AnimatePresence mode="wait" initial={false}>
                {isPanelExpanded ? (
                  // VARIANTE EXPANDED (panel sticky actual)
                  <motion.div
                    key="booking-panel-expanded"
                    layout
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.28, ease: [0.32, 0, 0.67, 0] }}
                    className="hidden w-full shrink-0 lg:sticky lg:top-24 lg:block lg:w-[460px] pr-2"
                  >
                    <div className="rounded-[32px] border border-white/60 p-6 md:p-8 bg-white/98 backdrop-blur-md shadow-[0_25px_60px_rgba(0,0,0,0.04),0_0_50px_rgba(212,175,55,0.015)] space-y-6.5">
                      
                      {/* 1. HEADER DE PRECIO */}
                      <div className="flex flex-col space-y-3.5 border-b border-slate-100 pb-5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="text-brand-navy text-4xl font-extrabold font-sans tracking-tight leading-none block">
                              ${(totalNights > 0 ? totalPrice : currentListing.pricePerNight).toLocaleString()}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 block">
                              {totalNights > 0 ? (
                                <>
                                  Total estadía <span className="text-slate-300 mx-1">•</span> {totalNights} {totalNights === 1 ? 'noche' : 'noches'}
                                </>
                              ) : (
                                'Precio por noche'
                              )}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-brand-navy/[0.02] border border-brand-navy/[0.06] rounded-xl px-2.5 py-1.5 shrink-0 select-none">
                              <Star className="text-brand-500 fill-brand-500 h-3.5 w-3.5" />
                              <span className="text-brand-navy text-[11px] font-extrabold">
                                {currentListing.rating}
                              </span>
                            </div>
                            
                            {/* NUEVO: botón de colapso */}
                            <button
                              onClick={togglePanel}
                              aria-label="Contraer panel de reserva"
                              aria-expanded={isPanelExpanded}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-brand-navy active:scale-95 cursor-pointer"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Luxury pill badge pill premium */}
                        <div className="flex select-none">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/[0.07] border border-brand-gold/[0.18] px-3.5 py-1 text-[11px] font-bold text-[#b08f23] tracking-wide shadow-[0_2px_10px_rgba(212,175,55,0.03)] transition-all hover:bg-brand-gold/[0.1]">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse shrink-0" />
                            Reserva hoy con solo ${(totalNights > 0 ? calculatePaymentBreakdown(totalPrice).depositAmount : currentListing.pricePerNight * 0.20).toFixed(0)} USD
                          </span>
                        </div>
                      </div>

                      {/* 2. BLOQUE DE RESERVA (APPLE WALLET / LINEAR CARD STACKS STYLE) */}
                      <div
                        className={cn(
                          'group relative overflow-hidden rounded-[24px] border bg-white transition-all duration-300 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]',
                          isCalendarOpen
                            ? 'border-brand-navy/60 ring-brand-navy/5 shadow-md ring-2'
                            : 'hover:border-slate-300 border-slate-200/80'
                        )}
                      >
                        <div className="grid grid-cols-2 border-b border-slate-100">
                          <div
                            className="group/item cursor-pointer border-r border-slate-100 p-4 transition-all hover:bg-slate-50/50"
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                          >
                            <div className="mb-1 flex items-center space-x-1.5 select-none">
                              <Clock className="text-brand-navy/40 h-3.5 w-3.5 shrink-0" />
                              <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                                Check-in
                              </p>
                            </div>
                            <p className="text-brand-navy text-[13px] font-black leading-tight mt-1">
                              {startDate
                                ? format(startDate, 'dd MMM yyyy', { locale: es })
                                : 'Elegir fecha'}
                            </p>
                          </div>
                          <div
                            className="group/item cursor-pointer p-4 transition-all hover:bg-slate-50/50"
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                          >
                            <div className="mb-1 flex items-center space-x-1.5 select-none">
                              <Clock className="text-brand-navy/40 h-3.5 w-3.5 shrink-0" />
                              <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                                Check-out
                              </p>
                            </div>
                            <p className="text-brand-navy text-[13px] font-black leading-tight mt-1">
                              {endDate
                                ? format(endDate, 'dd MMM yyyy', { locale: es })
                                : 'Elegir fecha'}
                            </p>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isCalendarOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-b border-slate-100 bg-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="p-2">
                                <CalendarComponent
                                  startDate={startDate}
                                  endDate={endDate}
                                  reservedDates={reservedDates}
                                  softReservedDates={softReservedDates}
                                  minNights={currentListing?.minNights ?? 2}
                                  onChange={(start, end) => {
                                    setStartDate(start);
                                    setEndDate(end);
                                    onDatesChange(start, end);
                                  }}
                                  onClose={() => setIsCalendarOpen(false)}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex items-center justify-between p-4 bg-white select-none">
                          <div className="flex items-center space-x-2">
                            <Users className="text-brand-navy/40 h-3.5 w-3.5" />
                            <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                              Huéspedes
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setGuests(Math.max(1, guests - 1))}
                              className="text-brand-navy flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 transition-colors hover:bg-slate-100 active:scale-95 text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="text-brand-navy min-w-[2.5rem] text-center text-xs font-black">
                              {guests} {guests === 1 ? 'Viajero' : 'Viajeros'}
                            </span>
                            <button
                              onClick={() => setGuests(Math.min(currentListing.maxGuests, guests + 1))}
                              disabled={guests >= currentListing.maxGuests}
                              className="text-brand-navy flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 transition-colors hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 3. BLOQUE DE PAGO */}
                      <div>
                        <ExchangeCalculator
                          totalPrice={totalNights > 0 ? totalPrice : currentListing.pricePerNight}
                          depositAmount={
                            totalNights > 0
                              ? calculatePaymentBreakdown(totalPrice).depositAmount
                              : currentListing.pricePerNight * 0.20
                          }
                          remainingAmount={
                            totalNights > 0
                              ? calculatePaymentBreakdown(totalPrice).remainingBalance
                              : currentListing.pricePerNight * 0.80
                          }
                          paymentMethods={currentListing.paymentMethods}
                        />
                      </div>

                      {/* 4. DESGLOSE TRANSPARENTE (ACCORDION MINIMALISTA AIRY) */}
                      <div className="border-t border-slate-100 pt-4">
                        <button
                          onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
                          className="flex w-full items-center justify-between text-[10px] font-black tracking-widest text-[#0a142c]/60 uppercase hover:text-brand-navy transition-colors py-1 px-1 select-none"
                        >
                          <span>{isBreakdownOpen ? 'Ocultar desglose' : 'Ver desglose'}</span>
                          <span className="text-sm font-semibold transition-transform duration-200 text-slate-400" style={{ transform: isBreakdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                            ▼
                          </span>
                        </button>
                        <AnimatePresence>
                          {isBreakdownOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-3.5 pt-4 pb-2 px-1 text-[12px] font-medium text-slate-500">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-slate-500 font-medium">Estadía • {totalNights > 0 ? `${totalNights} ${totalNights === 1 ? 'noche' : 'noches'}` : '1 noche'}</span>
                                  <span className="font-extrabold text-brand-navy font-sans text-sm">
                                    ${(currentListing.pricePerNight * (totalNights > 0 ? totalNights : 1)).toLocaleString()} USD
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">Limpieza de alojamiento</span>
                                  <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50/70 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none select-none">
                                    Incluida
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">Servicios de plataforma</span>
                                  <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50/70 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none select-none">
                                    $0 Cargo
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">Impuestos municipales</span>
                                  <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50/70 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none select-none">
                                    Incluidos
                                  </span>
                                </div>
                                <div className="border-t border-slate-100 pt-3.5 flex justify-between items-baseline font-black text-brand-navy mt-1">
                                  <span className="text-[10px] tracking-widest uppercase text-slate-400 font-extrabold">Total Final</span>
                                  <span className="text-base font-extrabold font-sans">
                                    ${(currentListing.pricePerNight * (totalNights > 0 ? totalNights : 1)).toLocaleString()} USD
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {bookingError && (
                        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center">
                          <p className="text-[10px] font-black tracking-widest text-red-500 uppercase leading-snug">
                            {bookingError}
                          </p>
                        </div>
                      )}

                      {/* 6. CTA PRINCIPAL */}
                      <div className="space-y-3.5">
                        {currentListing.bookingMode === 'request' ? (
                          <button
                            id="reserve-button-desktop"
                            className="border border-brand-gold bg-transparent text-brand-navy hover:bg-brand-gold/10 active:scale-[0.99] group/btn relative w-full transform overflow-hidden rounded-[24px] py-[18px] text-[11px] font-black tracking-[0.25em] uppercase shadow-[0_10px_30px_rgba(197,160,89,0.08)] transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                            onClick={handleBooking}
                          >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              <MessageCircle className="h-4 w-4 animate-pulse" />
                              Solicitar Reserva
                            </span>
                          </button>
                        ) : (
                          <button
                            id="reserve-button-desktop"
                            className="bg-gradient-to-r from-brand-navy via-[#0d1b3a] to-brand-navy hover:from-[#0d1b3a] hover:to-brand-navy active:scale-[0.99] group/btn relative w-full transform overflow-hidden rounded-[24px] py-[18px] text-[11px] font-black tracking-[0.25em] text-white uppercase shadow-[0_10px_30px_rgba(10,15,40,0.18)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_14px_35px_rgba(10,15,40,0.22)] cursor-pointer"
                            onClick={handleBooking}
                          >
                            <span className="relative z-10">Asegurar mi Estadía</span>
                            <div className="bg-brand-500 absolute inset-0 -translate-x-full opacity-10 transition-transform duration-500 group-hover/btn:translate-x-0" />
                          </button>
                        )}
                        <p className="text-center text-[10.5px] text-slate-500 font-semibold tracking-normal select-none">
                          {currentListing.bookingMode === 'request'
                            ? 'El anfitrión tiene 24h para confirmar. No se realiza ningún cargo hasta su aprobación.'
                            : 'No se realizará ningún cargo adicional.'}
                        </p>
                      </div>

                      {/* 7. POLÍTICA DE CANCELACIÓN — DINÁMICA */}
                      <div className="border-t border-slate-100 pt-4 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-[#0a142c]/60 uppercase select-none">
                          <Info className="h-3.5 w-3.5 text-brand-gold" />
                          <span>Política de Cancelación</span>
                        </div>
                        {(() => {
                          const policyKey = (currentListing.cancellationPolicy ?? 'moderate') as CancellationPolicyType;
                          const policy = CANCELLATION_POLICIES[policyKey];
                          return (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', policy.dotColor)} />
                                <span className={cn(
                                  'inline-flex items-center rounded-lg border px-2.5 py-1 text-[9px] font-black tracking-widest uppercase',
                                  policy.badgeColor
                                )}>
                                  {policy.label}
                                </span>
                              </div>
                              <p className="text-[10.5px] leading-relaxed text-slate-500 font-medium">
                                {policy.detail}
                              </p>
                            </>
                          );
                        })()}
                      </div>

                      {/* 5. BLOQUE DE CONFIANZA */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-3.5 pt-5 border-t border-slate-100 select-none">
                        <div className="flex items-center space-x-2 text-[10.5px] font-bold text-slate-500 select-none">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100/50 shrink-0">
                            <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span>Pago seguro</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10.5px] font-bold text-slate-500 select-none">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100/50 shrink-0">
                            <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span>Confirmación inmediata</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10.5px] font-bold text-slate-500 select-none">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100/50 shrink-0">
                            <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span>Reserva protegida</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10.5px] font-bold text-slate-500 select-none">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100/50 shrink-0">
                            <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span>Sin cargos ocultos</span>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                ) : (
                  // VARIANTE COLLAPSED — barra fija bottom-right (desktop only)
                  <motion.div
                    key="booking-panel-collapsed"
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.96 }}
                    transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
                    className="hidden lg:block fixed bottom-6 right-6 z-[55]"
                  >
                    <div className="flex items-center gap-4 rounded-[20px] border border-white/60 bg-white/98 px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] backdrop-blur-md">
                      {/* Precio compacto */}
                      <div className="flex flex-col select-none">
                        <span className="text-brand-navy text-lg font-extrabold font-sans leading-none">
                          ${(totalNights > 0 ? totalPrice : currentListing.pricePerNight).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {totalNights > 0 ? `${totalNights} ${totalNights === 1 ? 'noche' : 'noches'}` : 'por noche'}
                        </span>
                      </div>

                      {/* Separador */}
                      <div className="h-8 w-px bg-slate-100" />

                      {/* Rating */}
                      <div className="flex items-center gap-1 select-none">
                        <Star className="text-brand-500 fill-brand-500 h-3.5 w-3.5" />
                        <span className="text-brand-navy text-[12px] font-extrabold">
                          {currentListing.rating}
                        </span>
                      </div>

                      {/* Separador */}
                      <div className="h-8 w-px bg-slate-100" />

                      {/* CTA compacto */}
                      {currentListing.bookingMode === 'request' ? (
                        <button
                          onClick={handleBooking}
                          className="border border-brand-gold bg-transparent text-brand-navy hover:bg-brand-gold/10 rounded-[14px] px-5 py-2.5 text-[10px] font-black tracking-[0.2em] uppercase shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                          Solicitar
                        </button>
                      ) : (
                        <button
                          onClick={handleBooking}
                          className="bg-gradient-to-r from-brand-navy to-[#0d1b3a] rounded-[14px] px-5 py-2.5 text-[10px] font-black tracking-[0.2em] text-white uppercase shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] cursor-pointer"
                        >
                          Reservar
                        </button>
                      )}

                      {/* Botón de expansión */}
                      <button
                        onClick={togglePanel}
                        aria-label="Expandir panel de reserva"
                        aria-expanded={isPanelExpanded}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all hover:border-brand-navy/30 hover:bg-slate-50 hover:text-brand-navy active:scale-95 cursor-pointer"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      {/* Sticky Mobile CTA Bar */}
      <div className="fixed right-0 bottom-0 left-0 z-[70] flex items-center justify-between border-t border-gray-100 bg-white/95 px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-brand-navy shadow-sm transition-transform active:scale-90"
            aria-label="Volver al inicio"
          >
            <Globe className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-brand-navy text-lg font-black">
                ${currentListing.pricePerNight}
              </span>
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                / noche
              </span>
            </div>
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="text-brand-500 text-[10px] font-black tracking-widest uppercase hover:underline"
            >
              {startDate && endDate
                ? `${format(startDate, 'dd MMM', { locale: es })} - ${format(endDate, 'dd MMM', { locale: es })}`
                : 'Elegir fechas'}
            </button>
          </div>
        </div>
        <button
          id="reserve-button-mobile"
          onClick={handleBooking}
          className={cn(
            "flex h-[60px] min-w-[160px] items-center justify-center rounded-2xl px-10 py-5 text-xs font-black tracking-[0.1em] uppercase shadow-xl transition-all active:scale-95",
            currentListing.bookingMode === 'request'
              ? "border border-brand-gold bg-transparent text-brand-navy shadow-brand-gold/10"
              : "bg-brand-500 text-brand-navy shadow-brand-500/20"
          )}
        >
          {startDate && endDate 
            ? (currentListing.bookingMode === 'request' ? 'Solicitar Reserva' : 'Asegurar Estadía')
            : 'Disponibilidad'}
        </button>
      </div>

      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col bg-black/95"
          >
            <div className="absolute top-4 left-4 z-10 sm:top-6 sm:left-6">
              <button
                onClick={() => setIsGalleryOpen(false)}
                className="flex items-center justify-center rounded-full bg-white/10 p-3 font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <div className="relative flex h-5 w-5 items-center justify-center">
                  <div className="absolute h-0.5 w-5 rotate-45 bg-white" />
                  <div className="absolute h-0.5 w-5 -rotate-45 bg-white" />
                </div>
              </button>
            </div>

            <div className="flex w-full flex-1 flex-col items-center overflow-y-auto">
              <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-20 lg:space-y-16">
                {currentListing.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${currentListing.title} - ${idx + 1}`}
                    className="h-auto w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
};

export default ListingDetail;






