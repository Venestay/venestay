import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays, parseISO } from 'date-fns';
import * as bookingService from '@/services/booking-service';
import * as authService from '@/services/auth-service';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { Listing, BookingDetails, UserProfile } from '@/types';
import * as reviewService from '@/services/review-service';
import * as listingService from '@/services/listing-service';
import { useBookingPanelCollapse } from './useBookingPanelCollapse';

interface UseListingDetailProps {
  listing?: Listing;
  onClose?: () => void;
  onBooked?: (details: BookingDetails) => void;
  onViewTrips?: () => void;
  onOpenAuth?: (view?: 'login' | 'register') => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  onDatesChange?: (start: Date | null, end: Date | null) => void;
}

export function useListingDetail({
  listing,
  onClose,
  onOpenAuth,
  initialStartDate = null,
  initialEndDate = null,
  onDatesChange,
}: UseListingDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [currentListing, setCurrentListing] = useState<Listing | null>(listing || null);
  const [isLoadingListing, setIsLoadingListing] = useState(!listing);
  const { user, profileData } = useAuth();

  const [activeImage, setActiveImage] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMobileRequestOpen, setIsMobileRequestOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [guests, setGuests] = useState(2);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [reservedDates, setReservedDates] = useState<{ start: Date; end: Date }[]>([]);
  const [softReservedDates, setSoftReservedDates] = useState<{ start: Date; end: Date }[]>([]);
  const [hostProfile, setHostProfile] = useState<UserProfile | null>(null);
  const [loadingHost, setLoadingHost] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [reviews, setReviews] = useState<(reviewService.Review & { id: string })[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [activeReviewSession, setActiveReviewSession] = useState<reviewService.ReviewSession | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState(false);

  const { isExpanded: isPanelExpanded, toggle: togglePanel } = useBookingPanelCollapse(
    currentListing?.id ?? 'default'
  );

  // Fetch listing data if not passed in props
  useEffect(() => {
    let isMounted = true;
    async function fetchListing() {
      if (!listing && id) {
        setIsLoadingListing(true);
        try {
          const data = await listingService.getListingById(id);
          if (isMounted) {
            setCurrentListing(data);
          }
        } catch (error) {
          console.error('Error fetching listing by ID:', error);
        } finally {
          if (isMounted) {
            setIsLoadingListing(false);
          }
        }
      }
    }
    fetchListing();
    return () => {
      isMounted = false;
    };
  }, [id, listing]);

  // Set initial active image when listing changes
  useEffect(() => {
    if (currentListing?.images?.length) {
      setActiveImage(currentListing.images[0]);
    }
  }, [currentListing]);

  // Fetch listing reviews
  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      if (!currentListing?.id) {
        if (isMounted) setLoadingReviews(false);
        return;
      }
      try {
        if (isMounted) setLoadingReviews(true);
        const data = await reviewService.getListingReviews(currentListing.id);
        if (isMounted) {
          setReviews(data);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        if (isMounted) setLoadingReviews(false);
      }
    };
    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [currentListing?.id]);

  // Sync title and meta tags
  useEffect(() => {
    if (currentListing) {
      document.title = `${currentListing.title} | VeneStay Lechería`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `Alquiler premium de ${currentListing.title} en ${currentListing.location}. Reserva segura con VeneStay.`
        );
      }
    }
    return () => {
      document.title = 'VeneStay | Alquileres Premium en Lechería & Venezuela';
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          'VeneStay: La plataforma de alquileres vacacionales premium en Lechería. Reservas 100% seguras asegurando tu estadía con solo el 20% inicial.'
        );
      }
    };
  }, [currentListing]);

  // Fetch reserved dates
  useEffect(() => {
    let isMounted = true;
    const fetchReservedDates = async () => {
      if (!currentListing?.id) return;
      try {
        const ranges = await bookingService.getReservedDates(currentListing.id);
        if (!isMounted) return;

        const confirmed = ranges
          .filter((r) => r.type === 'confirmed')
          .map((r) => ({ start: r.start, end: r.end }));
        const pending = ranges
          .filter((r) => r.type === 'pending')
          .map((r) => ({ start: r.start, end: r.end }));

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
    return () => {
      isMounted = false;
    };
  }, [currentListing?.id, currentListing?.blockedDates]);

  // Fetch host profile
  useEffect(() => {
    let isMounted = true;
    const fetchHostProfile = async () => {
      if (!currentListing?.hostId) {
        if (isMounted) setLoadingHost(false);
        return;
      }
      try {
        if (isMounted) setLoadingHost(true);
        const profile = await authService.getUserProfile(currentListing.hostId);
        if (isMounted) {
          setHostProfile(profile);
        }
      } catch (error) {
        console.error('ListingDetail: Error fetching host profile:', error);
      } finally {
        if (isMounted) setLoadingHost(false);
      }
    };
    fetchHostProfile();
    return () => {
      isMounted = false;
    };
  }, [currentListing?.hostId]);

  // Clear session error when user becomes authenticated
  useEffect(() => {
    if (user && bookingError === 'Por favor inicia sesión para completar tu reserva') {
      setBookingError(null);
    }
  }, [user, bookingError]);

  const totalNights = startDate && endDate ? differenceInDays(endDate, startDate) : 0;
  const totalPrice =
    totalNights > 0
      ? (currentListing?.pricePerNight || 0) * totalNights
      : (currentListing?.pricePerNight || 0);

  const handleBooking = () => {
    try {
      if (!currentListing) return;

      if ((currentListing.bookingMode as string) === 'request') {
        setIsMobileRequestOpen(true);
        return;
      }

      if (!startDate || !endDate) {
        setBookingError('Por favor selecciona las fechas de tu estancia');
        setIsCalendarOpen(true);
        setTimeout(() => setBookingError(null), 3000);
        return;
      }

      const minNightsRequired = currentListing.minNights ?? 2;
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
      setBookingError('Ocurrió un error al procesar tu reserva. Intenta de nuevo.');
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
        endDate: endDate?.toISOString(),
      },
    });
  };

  const handleDatesChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    onDatesChange?.(start, end);
  };

  return {
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
    setBookingError,
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
  };
}
