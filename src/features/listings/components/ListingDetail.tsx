import React, { useEffect, useState } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import * as bookingService from '@/services/booking-service';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import {
  Listing,
  BookingDetails,
  BookingStatus,
  Booking,
  UserProfile,
} from '@/types';
import CalendarComponent from '@/features/bookings/components/Calendar';
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
} from 'lucide-react';
import { cn, calculatePaymentBreakdown } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';
import { checkProfileCompletion } from '@/lib/user-utils';
import { motion, AnimatePresence } from 'motion/react';
import PaymentBanner from '@/features/bookings/components/checkout/PaymentBanner';

interface ListingDetailProps {
  listing: Listing;
  onClose: () => void;
  onBooked: (details: BookingDetails) => void;
  onViewTrips?: () => void;
  onOpenAuth?: () => void;
  initialStartDate: Date | null;
  initialEndDate: Date | null;
  onDatesChange: (start: Date | null, end: Date | null) => void;
}

const ListingDetail: React.FC<ListingDetailProps> = ({
  listing,
  onClose,
  onBooked,
  onViewTrips,
  onOpenAuth,
  initialStartDate,
  initialEndDate,
  onDatesChange,
}) => {
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
  const [activeImage, setActiveImage] = useState<string>(listing.images[0]);
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [guests, setGuests] = useState(2);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [reservedDates, setReservedDates] = useState<
    { start: Date; end: Date }[]
  >([]);
  const [hostProfile, setHostProfile] = useState<UserProfile | null>(null);
  const [loadingHost, setLoadingHost] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    // Note: Fetching host profile directly from the 'users' collection violates PII
    // isolation rules since 'users' contains private data (email, etc.) and is
    // restricted to isOwner(). Relying on 'listing.hostName' and 'listing.hostAvatar' instead.
    setLoadingHost(false);
  }, [listing.hostId]);

  const totalNights =
    startDate && endDate ? differenceInDays(endDate, startDate) : 0;
  const totalPrice =
    totalNights > 0
      ? listing.pricePerNight * totalNights
      : listing.pricePerNight;

  useEffect(() => {
    const fetchInsights = async () => {
      setLoadingInsights(true);
      try {
        const text = await getLocalInsights(listing.city);
        setInsights(text);
      } catch (error) {
        setInsights('No pudimos cargar los consejos locales en este momento.');
      } finally {
        setLoadingInsights(false);
      }
    };
    fetchInsights();
  }, [listing.city]);

  useEffect(() => {
    const fetchReservedDates = async () => {
      try {
        const ranges = await bookingService.getReservedDates(listing.id);

        if (listing.blockedDates && listing.blockedDates.length > 0) {
          listing.blockedDates.forEach((dateStr) => {
            const date = parseISO(dateStr);
            ranges.push({ start: date, end: date });
          });
        }

        setReservedDates(ranges);
      } catch (error) {
        console.error('Error fetching reserved dates:', error);
      }
    };
    fetchReservedDates();
  }, [listing.id]);

  useEffect(() => {
    if (
      user &&
      bookingError === 'Por favor inicia sesión para completar tu reserva'
    ) {
      setBookingError(null);
    }
  }, [user, bookingError]);

  const navigate = useNavigate();

  const handleBooking = () => {
    try {
      if (!startDate || !endDate) {
        setBookingError('Por favor selecciona las fechas de tu estancia');
        setIsCalendarOpen(true);
        setTimeout(() => setBookingError(null), 3000);
        return;
      }

      const bookingData = {
        listingId: listing.id,
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

  return (
    <div className="animate-fade-in relative min-h-screen bg-white pb-32">
      {isRedirecting && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
          <Loader2 className="text-brand-500 mb-4 h-12 w-12 animate-spin" />
          <p className="text-brand-navy text-sm font-black tracking-widest uppercase">
            Preparando tu resumen de reserva...
          </p>
        </div>
      )}

      {/* Sticky Mobile Header */}
      <div className="sticky top-0 z-[60] flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button
          onClick={onClose}
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft className="text-brand-navy h-5 w-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-brand-500 text-[10px] font-black tracking-widest uppercase">
            VeneStay Premium
          </span>
          <span className="text-brand-navy max-w-[150px] truncate text-xs font-black">
            {listing.title}
          </span>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </div>

      <div className="mx-auto flex max-w-7xl flex-col pt-4">
        {/* Navigation / Back Button (Desktop) */}
        <div className="mb-6 hidden px-4 sm:px-6 lg:block lg:px-8">
          <button
            onClick={onClose}
            className="group hover:bg-brand-navy text-brand-navy flex items-center space-x-3 rounded-2xl border border-gray-100 bg-white p-3 px-5 shadow-lg transition-all duration-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-black tracking-widest uppercase">
              Regresar
            </span>
          </button>
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
                  onChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                    onDatesChange(start, end);
                  }}
                  onClose={() => setIsCalendarOpen(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-hidden">
          {/* Gallery Header */}
          <div className="relative mt-2 mb-6 hidden h-[50vh] max-h-[600px] min-h-[400px] gap-2 px-4 sm:px-6 md:grid md:grid-cols-4 md:grid-rows-2 lg:px-8">
            {/* Desktop Bento Box */}
            <div
              className="group relative col-span-2 row-span-2 cursor-pointer overflow-hidden bg-gray-100"
              onClick={() => setIsGalleryOpen(true)}
            >
              <img
                src={listing.images[0]}
                alt={listing.title}
                loading="eager" /* First image should be eager */
                decoding="async"
                className="h-full w-full rounded-l-2xl object-cover transition-opacity duration-300 hover:opacity-90"
              />
            </div>
            {listing.images.slice(1, 5).map((img, idx) => {
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
            {listing.images.length < 5 &&
              Array.from({ length: 4 - (listing.images.length - 1) }).map(
                (_, i) => {
                  const isBottomRight =
                    i === 4 - (listing.images.length - 1) - 1;
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
            <motion.div
              className="flex h-full w-full"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                const swipe = info.offset.x;
                if (swipe < -50) {
                  const currentIndex = listing.images.indexOf(activeImage);
                  if (currentIndex < listing.images.length - 1) {
                    setActiveImage(listing.images[currentIndex + 1]);
                  }
                } else if (swipe > 50) {
                  const currentIndex = listing.images.indexOf(activeImage);
                  if (currentIndex > 0) {
                    setActiveImage(listing.images[currentIndex - 1]);
                  }
                }
              }}
              onClick={() => setIsGalleryOpen(true)}
            >
              <img
                src={activeImage}
                alt={listing.title}
                className="h-full w-full cursor-pointer object-cover select-none"
              />
            </motion.div>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden">
              {listing.images.map((img, idx) => (
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
              <ImageIcon className="h-3 w-3" />1 / {listing.images.length}
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
                        {listing.rating}
                      </span>
                      <div className="mx-2 h-4 w-[1px] bg-white/20" />
                      <span className="text-[11px] font-black tracking-wider text-white/70 uppercase">
                        {listing.reviewsCount} reseñas
                      </span>
                    </div>
                    {listing.isVerified && (
                      <span className="text-brand-navy bg-brand-500/10 border-brand-500/20 flex items-center rounded-2xl border px-4 py-2 text-[10px] leading-none font-black tracking-widest uppercase">
                        <CheckCircle2 className="text-brand-500 mr-2 h-4 w-4" />{' '}
                        Publicación Verificada
                      </span>
                    )}
                    {listing.isPetFriendly && (
                      <span className="flex items-center rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black tracking-wider text-emerald-700 uppercase">
                        <PawPrint className="mr-1.5 h-3.5 w-3.5" /> Pet-friendly
                      </span>
                    )}
                  </div>
                  <h1 className="text-brand-navy mb-4 text-3xl leading-[1.1] font-black tracking-tight md:text-5xl">
                    {listing.title}
                  </h1>
                  <div className="flex items-center font-bold text-gray-500">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span className="decoration-brand-500/30 underline underline-offset-4">
                      {listing.location}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-y border-gray-100 py-8 sm:grid-cols-4">
                  <div className="flex flex-col items-center rounded-2xl bg-gray-50 p-4">
                    <Users className="text-brand-500 mb-2 h-6 w-6" />
                    <span className="text-brand-navy text-sm font-black">
                      {listing.maxGuests}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Huéspedes
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl bg-gray-50 p-4">
                    <DoorOpen className="text-brand-500 mb-2 h-6 w-6" />
                    <span className="text-brand-navy text-sm font-black">
                      {listing.bedrooms}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Habitaciones
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl bg-gray-50 p-4">
                    <Bed className="text-brand-500 mb-2 h-6 w-6" />
                    <span className="text-brand-navy text-sm font-black">
                      {listing.beds}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Camas
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl bg-gray-50 p-4">
                    <Bath className="text-brand-500 mb-2 h-6 w-6" />
                    <span className="text-brand-navy text-sm font-black">
                      {listing.baths}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Baños
                    </span>
                  </div>
                </div>

                {/* Meet your host section */}
                <div className="group relative overflow-hidden rounded-[40px] border border-gray-100 bg-gray-50/50 p-8 md:p-10">
                  <div className="absolute top-0 right-0 p-8 opacity-5 transition-transform duration-700 group-hover:scale-110">
                    <ShieldCheck className="text-brand-navy h-32 w-32" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-10 md:flex-row md:items-start">
                    <div className="relative">
                      <div className="relative h-32 w-32 overflow-hidden rounded-[32px] border-4 border-white shadow-2xl">
                        {loadingHost ? (
                          <Skeleton className="h-full w-full rounded-none" />
                        ) : (
                          <img
                            src={hostProfile?.photoURL || listing.hostAvatar}
                            alt={hostProfile?.displayName || listing.hostName}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      {!loadingHost && (
                        <div className="bg-brand-500 text-brand-navy absolute -right-2 -bottom-2 rounded-xl border-2 border-white p-2 shadow-lg">
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
                            <div className="mb-2 flex items-center justify-center gap-3 md:justify-start">
                              <h3 className="text-brand-navy text-3xl font-black tracking-tight">
                                Conoce a{' '}
                                {hostProfile?.displayName?.split(' ')[0] ||
                                  listing.hostName.split(' ')[0]}
                              </h3>
                              <span className="bg-brand-navy text-brand-500 border-brand-navy rounded-lg border px-3 py-1 text-[9px] font-black tracking-widest uppercase shadow-sm">
                                Superanfitrión
                              </span>
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
                  <p className="text-lg leading-relaxed font-medium whitespace-pre-line text-gray-600">
                    {listing.description}
                  </p>
                </div>

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

                <div className="space-y-6">
                  <h3 className="text-brand-navy flex items-center text-2xl font-black">
                    <span className="bg-brand-navy text-brand-500 mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                      02
                    </span>
                    Comodidades
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {listing.amenities.map((item) => (
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

                <div className="space-y-6">
                  <h3 className="text-brand-navy flex items-center text-2xl font-black">
                    <span className="bg-brand-navy text-brand-500 mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                      03
                    </span>
                    Ubicación
                  </h3>
                  <div className="group relative h-96 w-full overflow-hidden rounded-[40px] border-8 border-gray-100 bg-gray-50 shadow-2xl">
                    {isLoaded && !loadError ? (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={{
                          lat: listing.latitude || 10.2167,
                          lng: listing.longitude || -67.95,
                        }}
                        zoom={15}
                        options={DEFAULT_MAP_OPTIONS}
                      >
                        {listing.latitude && listing.longitude && (
                          <Marker
                            position={{
                              lat: listing.latitude,
                              lng: listing.longitude,
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
                                  `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`,
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
                            {listing.location}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`,
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
              </div>

              {/* Desktop Booking Card (Visible on lg) */}
              <div className="hidden w-full shrink-0 lg:sticky lg:top-24 lg:block lg:w-[480px]">
                <div className="glass-card rounded-[32px] border-gray-200/50 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] md:p-10">
                  <div className="mb-10 flex items-center justify-between">
                    <div>
                      <span className="text-brand-navy text-4xl font-black">
                        ${listing.pricePerNight}
                      </span>
                      <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                        {' '}
                        / noche
                      </span>
                    </div>
                    <div className="bg-brand-navy/5 border-brand-navy/5 flex items-center space-x-2 rounded-2xl border px-4 py-2">
                      <Star className="text-brand-500 fill-brand-500 h-4 w-4" />
                      <span className="text-brand-navy font-black">
                        {listing.rating}
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'group relative mb-8 overflow-hidden rounded-2xl border bg-gray-50 transition-all duration-300',
                      isCalendarOpen
                        ? 'border-brand-500 ring-brand-500/10 shadow-lg ring-1'
                        : 'hover:border-brand-500 border-gray-200'
                    )}
                  >
                    <div className="grid grid-cols-2 border-b border-gray-200">
                      <div
                        className="group/item cursor-pointer border-r border-gray-200 p-5 transition hover:bg-white"
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      >
                        <div className="mb-1 flex items-center space-x-2">
                          <Clock className="text-brand-500 h-3 w-3" />
                          <p className="text-brand-navy/40 text-[10px] font-black tracking-widest uppercase">
                            Check-in
                          </p>
                        </div>
                        <p className="text-brand-navy text-sm font-black">
                          {startDate
                            ? format(startDate, 'dd MMM yyyy', { locale: es })
                            : 'Elegir'}
                        </p>
                      </div>
                      <div
                        className="group/item cursor-pointer p-5 transition hover:bg-white"
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      >
                        <div className="mb-1 flex items-center space-x-2">
                          <Clock className="text-brand-500 h-3 w-3" />
                          <p className="text-brand-navy/40 text-[10px] font-black tracking-widest uppercase">
                            Check-out
                          </p>
                        </div>
                        <p className="text-brand-navy text-sm font-black">
                          {endDate
                            ? format(endDate, 'dd MMM yyyy', { locale: es })
                            : 'Elegir'}
                        </p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isCalendarOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-b border-gray-100 bg-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="p-2">
                            <CalendarComponent
                              startDate={startDate}
                              endDate={endDate}
                              reservedDates={reservedDates}
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
                    <div className="group/item flex items-center justify-between border-t border-gray-100 p-5">
                      <div className="flex items-center space-x-2">
                        <Users className="text-brand-500 h-3 w-3" />
                        <p className="text-brand-navy/40 text-[10px] font-black tracking-widest uppercase">
                          Ocupación
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          className="text-brand-navy flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 transition-colors hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="text-brand-navy min-w-[3rem] text-center text-sm font-black">
                          {guests} {guests === 1 ? 'Viajero' : 'Viajeros'}
                        </span>
                        <button
                          onClick={() => setGuests(guests + 1)}
                          className="text-brand-navy flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 transition-colors hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-10 space-y-6">
                    {totalNights > 0 && (
                      <div className="bg-brand-navy flex flex-col justify-between rounded-[28px] p-5 text-white shadow-xl">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-brand-500 text-[10px] font-black tracking-widest uppercase">
                            Anticipo de Reserva (20%)
                          </span>
                          <Globe className="h-3 w-3 text-white/40" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl leading-none font-black">
                            $
                            {calculatePaymentBreakdown(
                              totalPrice
                            ).depositAmount.toFixed(2)}
                          </p>
                        </div>
                        <p className="mt-1 mt-2 text-[9px] leading-none font-medium text-gray-300">
                          Paga{' '}
                          <strong className="text-white">
                            $
                            {calculatePaymentBreakdown(
                              totalPrice
                            ).depositAmount.toFixed(2)}
                          </strong>{' '}
                          hoy para asegurar tus fechas. Los{' '}
                          <strong className="text-white">
                            $
                            {calculatePaymentBreakdown(
                              totalPrice
                            ).remainingBalance.toFixed(2)}
                          </strong>{' '}
                          restantes se entregan al anfitrión al llegar.
                        </p>
                      </div>
                    )}

                    <ExchangeCalculator
                      basePriceUSD={
                        totalNights > 0
                          ? calculatePaymentBreakdown(totalPrice).depositAmount
                          : calculatePaymentBreakdown(listing.pricePerNight)
                              .depositAmount
                      }
                    />

                    {totalNights > 0 && (
                      <p className="text-center text-[10px] font-black text-gray-400 uppercase">
                        Desglose: {totalNights}{' '}
                        {totalNights === 1 ? 'noche' : 'noches'} x $
                        {listing.pricePerNight} = ${totalPrice}
                      </p>
                    )}

                    <PaymentBanner />
                  </div>

                  {bookingError && (
                    <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-center">
                      <p className="text-[10px] font-black tracking-widest text-red-500 uppercase">
                        {bookingError}
                      </p>
                    </div>
                  )}

                  <button
                    className="bg-brand-navy hover:bg-brand-navy/95 group/btn relative w-full transform overflow-hidden rounded-2xl py-5 text-sm font-black tracking-[0.2em] text-white uppercase shadow-[0_15px_30px_-5px_rgba(5,11,24,0.4)] transition-all duration-300 active:scale-[0.98]"
                    onClick={handleBooking}
                  >
                    <span className="relative z-10">Reservar</span>
                    <div className="bg-brand-500 absolute inset-0 -translate-x-full opacity-20 transition-transform duration-500 group-hover/btn:translate-x-0" />
                  </button>

                  <div className="mt-6 flex flex-col items-center justify-center space-y-2 text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4" />
                      <p className="text-[11px] font-bold tracking-tighter uppercase">
                        Sin cargos inmediatos
                      </p>
                    </div>
                    <p className="px-4 text-center text-[10px] leading-relaxed font-medium">
                      Tras reservar, verás las instrucciones de pago del
                      anfitrión para confirmar tu estadía.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Sticky Mobile CTA Bar */}
      <div className="fixed right-0 bottom-0 left-0 z-[70] flex items-center justify-between border-t border-gray-100 bg-white/95 px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-brand-navy text-lg font-black">
              ${listing.pricePerNight}
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
        <button
          onClick={handleBooking}
          className="bg-brand-500 text-brand-navy shadow-brand-500/20 flex h-[60px] min-w-[160px] items-center justify-center rounded-2xl px-10 py-5 text-xs font-black tracking-[0.1em] uppercase shadow-xl transition-all active:scale-95"
        >
          {startDate && endDate ? 'Reservar' : 'Disponibilidad'}
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
                {listing.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${listing.title} - ${idx + 1}`}
                    className="h-auto w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListingDetail;






