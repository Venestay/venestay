import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2,
  ArrowLeft,
  Star,
  MapPin,
  Users,
  DoorOpen,
  Bed,
  Bath,
  Building2,
  Hash,
  CalendarDays,
  PawPrint,
  Info,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '@/components/ui/Navbar';
import CalendarComponent from '@/features/bookings/components/Calendar';
import { CancellationPolicyCard } from './CancellationPolicyCard';
import { getAmenityIcon, HOUSE_RULES_ICONS } from '../utils/amenities-icons';
import { useListingDetail } from '../hooks/useListingDetail';
import { ListingGallery } from './ListingGallery';
import { HostContactCard } from './HostContactCard';
import { ListingReviews } from './ListingReviews';
import { BookingPanel } from './BookingPanel';
import { Listing, BookingDetails } from '@/types';
import { CancellationPolicyType } from '../types';
import { CANCELLATION_POLICIES } from '../utils/cancellationPolicies';
import * as reviewService from '@/services/review-service';
import { toast } from 'sonner';
import { clearListingCalendar } from '@/services/listing-service';
import { PurgeTestBookingsModal } from './PurgeTestBookingsModal';
const ListingMap = lazy(() => import('./ListingMap'));

const MapSkeleton = () => (
  <div className="bg-brand-navy flex h-96 w-full flex-col items-center justify-center rounded-[40px] border-8 border-gray-100 p-12 text-center relative overflow-hidden shadow-2xl">
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-20 grayscale invert" />
    <div className="from-brand-navy via-brand-navy/95 to-brand-500/10 absolute inset-0 bg-gradient-to-br animate-pulse" />
    <div className="relative z-10 flex flex-col items-center gap-4">
      <Loader2 className="text-brand-500 h-10 w-10 animate-spin" />
      <span className="text-[10px] font-black tracking-widest text-white/50 uppercase">
        Cargando mapa interactivo...
      </span>
    </div>
  </div>
);

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

import { categorizeAmenities } from '../utils/amenities-categories';

export const ListingDetail: React.FC<ListingDetailProps> = (props) => {
  const navigate = useNavigate();

  const {
    currentListing,
    setCurrentListing,
    isLoadingListing,
    user,
    profileData,
    activeImage,
    setActiveImage,
    startDate,
    endDate,
    searchQuery,
    setSearchQuery,
    isCalendarOpen,
    setIsCalendarOpen,
    isMobileRequestOpen,
    setIsMobileRequestOpen,
    isBreakdownOpen,
    setIsBreakdownOpen,
    guests,
    setGuests,
    bookingError,
    reservedDates,
    softReservedDates,
    hostProfile,
    loadingHost,
    isGalleryOpen,
    setIsGalleryOpen,
    reviews,
    setReviews,
    loadingReviews,
    activeReviewSession,
    setActiveReviewSession,
    isDescriptionExpanded,
    setIsDescriptionExpanded,
    isAmenitiesExpanded,
    setIsAmenitiesExpanded,
    isPanelExpanded,
    togglePanel,
    totalNights,
    totalPrice,
    handleBooking,
    handleClose,
    handleSearchSubmit,
    handleDatesChange,
    onOpenAuth,
  } = useListingDetail(props);

  const [isClearing, setIsClearing] = React.useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = React.useState(false);

  const handleClearCalendar = async () => {
    if (!currentListing?.id) return;
    setIsClearing(true);
    try {
      await clearListingCalendar(currentListing.id);
      setCurrentListing(prev => prev ? { ...prev, blockedDates: [] } : null);
      toast.success('Calendario limpiado correctamente');
    } catch (err) {
      toast.error('Error al limpiar el calendario');
      console.error('[Admin] clearListingCalendar:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const SHOW_HOUSE_RULES_DETAIL = true;

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
                }}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                startDate={startDate}
                endDate={endDate}
                setDates={handleDatesChange}
                onOpenAdmin={() => navigate('/dashboard')}
                onOpenAuth={(view) => {
                  if (onOpenAuth) onOpenAuth(view);
                  else navigate('/');
                }}
                hideFilters={true}
                onSearchSubmit={handleSearchSubmit}
                onLogoClick={() => navigate('/')}
              />
            </div>

            {/* Mobile Calendar Modal */}
            <AnimatePresence>
              {isCalendarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-brand-navy/60 fixed inset-0 z-[100] flex items-end justify-center p-4 backdrop-blur-md sm:items-center lg:hidden"
                  onClick={() => setIsCalendarOpen(false)}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Selector de fechas móvil"
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
                      minNights={currentListing.minNights ?? 2}
                      onChange={handleDatesChange}
                      onClose={() => setIsCalendarOpen(false)}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              {/* Image Gallery Header */}
              <ListingGallery
                images={currentListing.images}
                title={currentListing.title}
                activeImage={activeImage}
                setActiveImage={setActiveImage}
                isGalleryOpen={isGalleryOpen}
                setIsGalleryOpen={setIsGalleryOpen}
                handleClose={handleClose}
              />

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
                        {profileData?.role === 'admin' && (
                          <div className="flex items-center gap-2">
                            <button
                              id="admin-clear-calendar-btn"
                              onClick={handleClearCalendar}
                              disabled={isClearing}
                              aria-label="Limpiar fechas bloqueadas del calendario (solo admin)"
                              className="flex items-center gap-2 rounded-2xl border border-red-900/20 bg-red-950/10 px-4 py-2 text-[10px] font-black tracking-widest text-red-800 uppercase transition-all hover:bg-red-950/20 active:scale-95 disabled:opacity-50"
                            >
                              {isClearing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CalendarDays className="h-3.5 w-3.5" />
                              )}
                              {isClearing ? 'Limpiando...' : 'Limpiar Calendario'}
                            </button>
                            <button
                              id="admin-purge-test-bookings-btn"
                              onClick={() => setIsPurgeModalOpen(true)}
                              className="flex items-center gap-2 rounded-2xl border border-orange-900/20 bg-orange-950/10 px-4 py-2 text-[10px] font-black tracking-widest text-orange-800 uppercase transition-all hover:bg-orange-950/20 active:scale-95"
                            >
                              Purgar Pruebas
                            </button>
                          </div>
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

                    {/* Room & Spaces details grid */}
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

                    {/* Building Details Section */}
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

                    {/* Meet your host section */}
                    <HostContactCard
                      hostProfile={hostProfile}
                      hostName={currentListing.hostName}
                      hostAvatar={currentListing.hostAvatar}
                      loadingHost={loadingHost}
                    />

                    {/* Description Section */}
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

                    {/* Amenities Section */}
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
                                {items.map((item) => {
                                  const Icon = getAmenityIcon(item);
                                  return (
                                    <div
                                      key={item}
                                      className="hover:border-brand-100 hover:bg-brand-50 flex items-center space-x-4 rounded-2xl border border-transparent bg-gray-50 p-4 transition-all duration-300"
                                    >
                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                                        <Icon className="text-brand-500 h-5 w-5 shrink-0" />
                                      </div>
                                      <span className="text-brand-navy font-bold">
                                        {item}
                                      </span>
                                    </div>
                                  );
                                })}
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

                    {/* Google Map Section (Lazy loaded) */}
                    <div className="space-y-6 border-t border-gray-100 pt-8 lg:border-t-0 lg:pt-0">
                      <h3 className="text-brand-navy flex items-center text-2xl font-black">
                        <span className="bg-brand-navy text-brand-500 mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                          <span className="hidden lg:inline">04</span>
                          <span className="inline lg:hidden">05</span>
                        </span>
                        Ubicación
                      </h3>
                      <Suspense fallback={<MapSkeleton />}>
                        <ListingMap
                          latitude={currentListing.latitude}
                          longitude={currentListing.longitude}
                          locationName={currentListing.location}
                          manualAddress={currentListing.manualAddress}
                        />
                      </Suspense>

                      {/* Detailed address below the map */}
                      <div className="mt-5 flex items-start gap-4 rounded-[28px] border border-gray-100 bg-white p-6 shadow-md transition-all hover:shadow-lg">
                        <div className="bg-brand-500/10 text-brand-500 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                          <MapPin className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Dirección de la Propiedad
                          </h4>
                          <p className="text-brand-navy font-black leading-relaxed text-sm">
                            {currentListing.manualAddress || currentListing.location || "Dirección no especificada"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reviews Section */}
                    <ListingReviews
                      listingId={currentListing.id}
                      rating={currentListing.rating}
                      reviewsCount={currentListing.reviewsCount}
                      reviews={reviews}
                      loadingReviews={loadingReviews}
                      activeReviewSession={activeReviewSession}
                      setActiveReviewSession={setActiveReviewSession}
                      user={user}
                      profileData={profileData}
                      onReviewSubmitted={() => {
                        reviewService.getListingReviews(currentListing.id).then(setReviews);
                      }}
                    />

                    {/* Policies and House Rules Section */}
                    {SHOW_HOUSE_RULES_DETAIL && (
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
                          const policyKey = 'non_refundable_reschedulable' as CancellationPolicyType;

                          return (
                            <div className="space-y-8">
                              {/* Policy Detail Card */}
                              <CancellationPolicyCard policyType={policyKey} />

                              {/* House Rules */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-black tracking-widest uppercase text-slate-400">
                                  Normas de la Casa
                                </h4>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                  {/* Smoking Rule */}
                                  {(() => {
                                    const allowed = currentListing.allowSmoking ?? false;
                                    const ruleData = allowed ? HOUSE_RULES_ICONS.smokingAllowed : HOUSE_RULES_ICONS.smokingForbidden;
                                    const Icon = ruleData.icon;
                                    return (
                                      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/30 p-4">
                                        <Icon className="h-5 w-5 text-slate-500 shrink-0" />
                                        <span className="text-[11.5px] font-bold text-slate-600">{ruleData.label}</span>
                                      </div>
                                    );
                                  })()}

                                  {/* Pets Rule */}
                                  {(() => {
                                    const allowed = currentListing.isPetFriendly ?? false;
                                    const ruleData = allowed ? HOUSE_RULES_ICONS.petsAllowed : HOUSE_RULES_ICONS.petsForbidden;
                                    const Icon = ruleData.icon;
                                    return (
                                      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/30 p-4">
                                        <Icon className="h-5 w-5 text-slate-500 shrink-0" />
                                        <span className="text-[11.5px] font-bold text-slate-600">
                                          {allowed ? 'Se admiten mascotas' : 'No se admiten mascotas'}
                                        </span>
                                      </div>
                                    );
                                  })()}

                                  {/* Events Rule */}
                                  {(() => {
                                    const allowed = currentListing.allowEvents ?? false;
                                    const ruleData = allowed ? HOUSE_RULES_ICONS.eventsAllowed : HOUSE_RULES_ICONS.eventsForbidden;
                                    const Icon = ruleData.icon;
                                    return (
                                      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/30 p-4">
                                        <Icon className="h-5 w-5 text-slate-500 shrink-0" />
                                        <span className="text-[11.5px] font-bold text-slate-600">{ruleData.label}</span>
                                      </div>
                                    );
                                  })()}

                                  {/* Check-in Time */}
                                  {(() => {
                                    const time = currentListing.checkInTime || '14:00';
                                    const Icon = HOUSE_RULES_ICONS.checkIn.icon;
                                    return (
                                      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/30 p-4">
                                        <Icon className="h-5 w-5 text-slate-500 shrink-0" />
                                        <span className="text-[11.5px] font-bold text-slate-600">Entrada: {time}</span>
                                      </div>
                                    );
                                  })()}

                                  {/* Check-out Time */}
                                  {(() => {
                                    const time = currentListing.checkOutTime || '11:00';
                                    const Icon = HOUSE_RULES_ICONS.checkOut.icon;
                                    return (
                                      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/30 p-4">
                                        <Icon className="h-5 w-5 text-slate-500 shrink-0" />
                                        <span className="text-[11.5px] font-bold text-slate-600">Salida: {time}</span>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Additional Rules */}
                                {currentListing.additionalRules && currentListing.additionalRules.length > 0 && (
                                  <div className="mt-6 space-y-3">
                                    <h5 className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                                      Normas Adicionales
                                    </h5>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                      {currentListing.additionalRules.map((rule, idx) => {
                                        const Icon = HOUSE_RULES_ICONS.rule.icon;
                                        return (
                                          <div key={idx} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/10 p-4">
                                            <Icon className="h-4 w-4 text-brand-gold shrink-0 mt-0.5" />
                                            <span className="text-[11px] font-bold text-slate-600">{rule}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Booking Panel Component (handles expanded sticky, collapsed sticky, and mobile layouts) */}
                  <BookingPanel
                    listing={currentListing}
                    user={user}
                    startDate={startDate}
                    endDate={endDate}
                    onDatesChange={handleDatesChange}
                    guests={guests}
                    setGuests={setGuests}
                    bookingError={bookingError}
                    reservedDates={reservedDates}
                    softReservedDates={softReservedDates}
                    isCalendarOpen={isCalendarOpen}
                    setIsCalendarOpen={setIsCalendarOpen}
                    isBreakdownOpen={isBreakdownOpen}
                    setIsBreakdownOpen={setIsBreakdownOpen}
                    isPanelExpanded={isPanelExpanded}
                    togglePanel={togglePanel}
                    handleBooking={handleBooking}
                    totalNights={totalNights}
                    totalPrice={totalPrice}
                    isMobileRequestOpen={isMobileRequestOpen}
                    setIsMobileRequestOpen={setIsMobileRequestOpen}
                    navigate={navigate}
                  />
                </div>
              </div>
            </div>
          </div>

          <PurgeTestBookingsModal
            isOpen={isPurgeModalOpen}
            onClose={() => setIsPurgeModalOpen(false)}
            listingId={currentListing.id}
          />

          {/* Fullscreen Photo Gallery Overlay */}
          <AnimatePresence>
            {isGalleryOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex flex-col bg-black/95"
                role="dialog"
                aria-modal="true"
                aria-label="Galería de fotos en pantalla completa"
              >
                <div className="absolute top-4 left-4 z-10 sm:top-6 sm:left-6">
                  <button
                    onClick={() => setIsGalleryOpen(false)}
                    className="flex items-center justify-center rounded-full bg-white/10 p-3 font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                    aria-label="Cerrar galería de fotos"
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
                        alt={`${currentListing.title} - Foto ${idx + 1}`}
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
