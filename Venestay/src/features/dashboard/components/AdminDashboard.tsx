import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  arrayUnion,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Booking, Listing, BookingStatus, City } from '@/types';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Calendar,
  User,
  Hash,
  CreditCard,
  Building2,
  Users,
  Edit2,
  Trash2,
  Save,
  Plus,
  Image as ImageIcon,
  Upload,
  Loader2,
  MessageSquare,
  Lock,
  Heart,
  Globe,
  MapPin,
  Sparkles,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import {
  GOOGLE_MAPS_API_KEY,
  MAPS_LIBRARIES,
  DEFAULT_MAP_OPTIONS,
  useMapsAuthCheck,
} from '@/lib/maps';
import Chat from '@/components/Chat';
import FloatingChat from '@/components/FloatingChat';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import Skeleton from '@/components/ui/Skeleton';
import UserProfileSetup from '@/features/auth/components/UserProfileSetup';

import PaymentSettings from '@/features/bookings/components/checkout/PaymentSettings';

const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { isLoaded, loadError: scriptLoadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });
  const mapsAuthError = useMapsAuthCheck();
  const loadError =
    scriptLoadError ||
    (mapsAuthError ? { message: 'ApiTargetBlockedMapError' } : null);

  const LECHERIA_CENTER = { lat: 10.2167, lng: -67.95 }; // Default to Lecheria coordinates (approx)

  const [activeTab, setActiveTab] = useState<
    'bookings' | 'listings' | 'profile'
  >(() => {
    if (window.location.pathname === '/admin/mis-propiedades')
      return 'listings';
    return isAdmin ? 'bookings' : 'profile';
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'ALL' | 'AWAITING_VERIFICATION' | 'CONFIRMED' | 'PENDING_PAYMENT'
  >('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(
    null
  );

  // Edit Listing State
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const { profileData } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const location = useLocation();
  const initialListing = location.state?.initialListing;

  // Determinar rol del usuario
  const isHost = Boolean(
    (user as any)?.role === 'host' ||
    profileData?.role === 'host' ||
    (user && listings.some((l) => l.hostId === user.uid)) ||
    initialListing
  );

  // Eliminar useEffect conflictivo que forzaba setActiveTab, permitiendo navegación libre.

  // Handle initial listing when opening dashboard
  useEffect(() => {
    if (initialListing) {
      setEditingListing(initialListing as Listing);
      setActiveTab('listings');
    }
  }, [initialListing]);

  // ELIMINADO: useEffect que forzaba setActiveTab('profile') agresivamente

  useEffect(() => {
    setLoading(true);

    // Subscribe to Bookings
    const bQuery = isAdmin
      ? query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
      : user
        ? query(collection(db, 'bookings'), where('ownerId', '==', user.uid))
        : null;

    const unsubscribeBookings = bQuery
      ? onSnapshot(
          bQuery,
          (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Booking[];
            if (!isAdmin) {
              data.sort((a: unknown, b: unknown) => {
                const timeA = (a as { createdAt?: { seconds: number } }).createdAt?.seconds || 0;
                const timeB = (b as { createdAt?: { seconds: number } }).createdAt?.seconds || 0;
                return timeB - timeA;
              });
            }
            setBookings(data);
            setLoading(false);
          },
          (error) => {
            console.error('Admin: Error listening to bookings:', error);
            setLoading(false);
          }
        )
      : () => {};

    // Subscribe to Listings
    const lQuery = query(
      collection(db, 'listings'),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribeListings = onSnapshot(
      lQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Listing[];
        setListings(data);
        setLoading(false);
      },
      (error) => {
        console.error('Admin: Error listening to listings:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeBookings();
      unsubscribeListings();
    };
  }, [isAdmin, user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !editingListing) return;

    setIsUploading(true);
    const listingId = editingListing.id;

    try {
      const imageCompression = (await import('browser-image-compression'))
        .default;
      const options = {
        maxSizeMB: 0.6, // Reducido para optimizar carga (era 1MB)
        maxWidthOrHeight: 1600, // Ajustado a un tamaño más estándar para web
        useWebWorker: true,
        initialQuality: 0.75,
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          let uploadFile: File | Blob = file;

          // 1. Manejo de Promesa de Compresión
          if (file.type.startsWith('image/')) {
            console.log(`Comprimiendo: ${file.name}...`);
            uploadFile = await imageCompression(file, options);
          }

          const fileName = `${Date.now()}-${i}-${file.name.replace(/\s+/g, '_')}`;
          const storageRef = ref(storage, `listings/${listingId}/${fileName}`);

          // 2. Metadata explícita con Cache-Control para persistencia en navegador
          const metadata = {
            contentType: file.type,
            cacheControl: 'public,max-age=31536000', // Cache por 1 año
            customMetadata: {
              originalName: file.name,
              listingId: listingId,
            },
          };

          // 3. Subida con reintentos manuales en caso de timeout
          let snapshot;
          let retries = 0;
          const maxRetries = 3;

          while (retries < maxRetries) {
            try {
              console.log(
                `Intentando subir ${fileName} (Intento ${retries + 1})...`
              );
              snapshot = await uploadBytes(storageRef, uploadFile, metadata);
              break; // Success!
            } catch (error: unknown) {
              if (
                (error as { code?: string }).code === 'storage/unauthorized' ||
                (error as Error).message?.includes('storage/unauthorized') ||
                (error as Error).message?.includes('does not have permission')
              ) {
                console.warn(
                  'Storage upload unauthorized. Using fallback URL.'
                );
                snapshot = { ref: storageRef } as unknown;
                break;
              }
              retries++;
              if (retries >= maxRetries) throw error;
              console.warn(`Reintentando debido a error: ${(error as Error).message}`);
              await new Promise((resolve) =>
                setTimeout(resolve, 2000 * retries)
              ); // Wait before retry
            }
          }

          if (!snapshot) throw new Error('Upload failed after retries');

          let downloadURL = `https://placehold.co/800x600/2a3b5c/ffffff?text=Image+${i + 1}+(Storage+Bloqueado)`;
          try {
            const actualUrl = await getDownloadURL(snapshot.ref);
            if (actualUrl) downloadURL = actualUrl;
          } catch (e) {
            console.warn(
              'Using placeholder image instead of original upload due to Storage block'
            );
          }

          if (downloadURL) {
            console.log(`Subida exitosa: ${downloadURL}`);

            // 4. Actualización del estado con patrón funcional
            setEditingListing((prev) => {
              if (!prev || prev.id !== listingId) return prev;
              if (prev.images.includes(downloadURL)) return prev;
              return { ...prev, images: [...prev.images, downloadURL] };
            });

            // 5. Persistencia inmediata en Firestore (opcional pero recomendado)
            // Solo si no es un listing nuevo (que aún no existe en DB)
            if (!listingId.startsWith('listing-')) {
              const listingRef = doc(db, 'listings', listingId);
              await updateDoc(listingRef, {
                images: arrayUnion(downloadURL),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        } catch (fileError) {
          console.error(`Error al procesar archivo ${file.name}:`, fileError);
        }
      }
    } catch (error) {
      console.error('Error crítico en el proceso de subida:', error);
      alert('Error al procesar las imágenes. Verifica tu conexión y permisos.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setEditingListing((prev) => {
      if (!prev) return null;
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const handleUpdateStatus = async (
    booking: Booking,
    newStatus: BookingStatus,
    note?: string
  ) => {
    try {
      const historyEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        actorId: user?.uid || 'system',
        actorName: user?.displayName || 'Admin',
        note: note || '',
      };

      await updateDoc(doc(db, 'bookings', booking.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        verifiedAt:
          newStatus === 'CONFIRMED'
            ? new Date().toISOString()
            : booking.verifiedAt,
        verifiedBy:
          newStatus === 'CONFIRMED' ? user?.displayName : booking.verifiedBy,
        rejectionReason:
          newStatus === 'REJECTED' ? note : booking.rejectionReason || '',
        statusHistory: [...(booking.statusHistory || []), historyEntry],
      });
    } catch (error) {
      console.error('Admin: Error updating status', error);
      alert('Error al actualizar estado');
    }
  };

  const handleUpdateListing = async (
    e: React.FormEvent,
    listingToSave?: Listing
  ) => {
    if (e) e.preventDefault();
    const listing = listingToSave || editingListing;
    if (!listing || !user) return;

    setIsSaving(true);
    try {
      const { id, ...data } = listing;
      const isNew = id.startsWith('listing-');

      const payload: Record<string, unknown> = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      if (isNew && !data.createdAt) {
        (payload as Record<string, unknown>).createdAt = new Date().toISOString();
      }

      const listingRef = doc(db, 'listings', id);

      if (isNew) {
        await setDoc(listingRef, { ...payload, id });
      } else {
        const { id: _, ...updateData } = payload as Record<string, unknown>;
        await updateDoc(listingRef, updateData);
      }

      // 1. Notificar primero
      toast.success(
        isNew ? '¡Propiedad publicada exitosamente!' : 'Cambios guardados'
      );

      // 2. Evaluamos el retorno
      setActiveTab('listings');
      setEditingListing(null);

      if (isNew) {
        navigate('/admin/mis-propiedades');
      }
    } catch (error) {
      console.error('Admin: Error saving listing document to Firestore', error);
      toast.error('Error al guardar los cambios en la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (
      !window.confirm(
        '¿Estás seguro de que deseas eliminar esta propiedad? Esta acción no se puede deshacer.'
      )
    )
      return;

    try {
      await deleteDoc(doc(db, 'listings', listingId));
    } catch (error) {
      console.error('Admin: Error deleting listing', error);
      alert('Error al eliminar la propiedad');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const isOwner = user && b.ownerId === user.uid;
    if (!isAdmin && !isOwner) return false;

    const matchesFilter = filter === 'ALL' || b.status === filter;
    const matchesSearch =
      b.listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.city.toLowerCase().includes(searchTerm.toLowerCase());
    const isOwner = user && l.hostId === user.uid;
    return matchesSearch && (isAdmin || isOwner);
  });

  return (
    <>
      <div className="flex min-h-screen flex-col bg-gray-50 pt-16">
        {!isAdmin && editingListing?.id?.startsWith('listing-') ? (
          <div className="invisible h-px w-px" />
        ) : (
          <div className="animate-slide-up relative flex w-full flex-grow flex-col overflow-hidden bg-white shadow-2xl">
            {/* Header */}
            {(isAdmin || !editingListing?.id?.startsWith('listing-')) && (
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
            )}

            {/* Toolbar */}
            {(isAdmin || !editingListing?.id?.startsWith('listing-')) && (
              <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50/50 p-6 lg:flex-row">
                <div className="relative flex-grow">
                  <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'bookings'
                        ? 'Buscar por propiedad, huésped o referencia...'
                        : 'Buscar por título, ubicación o ciudad...'
                    }
                    className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-200 bg-white py-3 pr-4 pl-12 text-sm font-bold transition-all focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {activeTab === 'bookings' && (
                  <div className="no-scrollbar flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0">
                    {(
                      [
                        'ALL',
                        'AWAITING_VERIFICATION',
                        'CONFIRMED',
                        'PENDING_PAYMENT',
                      ] as const
                    ).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                          'rounded-xl border px-4 py-2.5 text-[10px] font-black tracking-widest whitespace-nowrap uppercase transition-all',
                          filter === f
                            ? 'bg-brand-navy border-brand-navy text-white'
                            : 'hover:border-brand-500 hover:text-brand-navy border-gray-100 bg-white text-gray-500'
                        )}
                      >
                        {f === 'ALL'
                          ? 'Todos'
                          : f === 'AWAITING_VERIFICATION'
                            ? 'Por Verificar'
                            : f === 'CONFIRMED'
                              ? 'Confirmados'
                              : 'Pendientes'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* List Content */}
            <div
              className={cn(
                'no-scrollbar flex-grow overflow-y-auto bg-gray-50/20 p-6 md:p-8',
                !isAdmin &&
                  !isHost &&
                  editingListing?.id?.startsWith('listing-') &&
                  'hidden'
              )}
            >
              {!isAdmin &&
              !isHost &&
              (activeTab === 'bookings' || activeTab === 'listings') ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="mb-8 rounded-full bg-red-50 p-6">
                    <Lock className="h-16 w-16 text-red-500" />
                  </div>
                  <h3 className="text-brand-navy mb-4 text-3xl font-black">
                    Acceso Restringido
                  </h3>
                  <p className="mb-10 max-w-sm leading-relaxed font-medium text-gray-500">
                    Tu cuenta no cuenta con los permisos necesarios para acceder
                    a las herramientas administrativas. Si eres socio de
                    VeneStay, por favor contacta a soporte.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy rounded-2xl px-10 py-4 text-xs font-black tracking-widest text-white uppercase transition-all"
                  >
                    Volver a la tienda
                  </button>
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="space-y-6 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm"
                    >
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-32" />
                        <div className="flex gap-2">
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="flex-grow space-y-4">
                          <Skeleton className="h-8 w-3/4" />
                          <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-4" />
                            <Skeleton className="h-4" />
                          </div>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-32 w-48 rounded-3xl" />
                      </div>
                      <div className="border-t border-gray-100 pt-6">
                        <Skeleton className="h-12 w-full rounded-2xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeTab === 'bookings' ? (
                // BOOKINGS LIST
                filteredBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Filter className="mb-6 h-16 w-16 text-gray-100" />
                    <h3 className="text-brand-navy text-xl font-black">
                      No hay reservas
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      No se encontraron registros con este filtro.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {filteredBookings.map((booking) => (
                      <motion.div
                        layout
                        key={booking.id}
                        className="flex h-full flex-col rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm transition-all duration-500 hover:shadow-xl"
                      >
                        <div className="mb-6 flex items-start justify-between">
                          <div
                            className={cn(
                              'flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-black tracking-widest uppercase',
                              booking.status === 'CONFIRMED'
                                ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                : booking.status === 'AWAITING_VERIFICATION'
                                  ? 'border-blue-100 bg-blue-50 text-blue-600'
                                  : booking.status === 'PENDING_PAYMENT'
                                    ? 'border-amber-100 bg-amber-50 text-amber-600'
                                    : booking.status === 'REJECTED'
                                      ? 'border-red-100 bg-red-50 text-red-600'
                                      : 'border-gray-100 bg-gray-50 text-gray-600'
                            )}
                          >
                            {booking.status === 'CONFIRMED' ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : booking.status === 'REJECTED' ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {booking.status === 'CONFIRMED'
                              ? 'Confirmada'
                              : booking.status === 'AWAITING_VERIFICATION'
                                ? 'Verificación Pendiente'
                                : booking.status === 'PENDING_PAYMENT'
                                  ? 'Esperando Pago'
                                  : booking.status === 'REJECTED'
                                    ? 'Rechazada'
                                    : 'Cancelada'}
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setActiveChatId(booking.id);
                                setActiveChatBooking(booking);
                              }}
                              className="hover:text-brand-navy rounded-xl border border-gray-200 bg-white p-2 text-gray-400 transition-all hover:shadow-md"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <span className="shrink-0 text-[10px] font-black text-gray-300 uppercase">
                              REF: {booking.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>

                        <AnimatePresence mode="wait">
                          <div className="mb-8 flex flex-col gap-6 sm:flex-row">
                            <div className="flex-grow space-y-4">
                              <h4 className="text-brand-navy text-xl leading-tight font-black">
                                {booking.listingTitle}
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center text-xs font-bold text-gray-500">
                                  <Calendar className="text-brand-500 mr-2 h-4 w-4" />
                                  {booking.startDate &&
                                  !isNaN(
                                    new Date(booking.startDate).getTime()
                                  ) &&
                                  booking.endDate &&
                                  !isNaN(new Date(booking.endDate).getTime())
                                    ? `${format(new Date(booking.startDate), 'dd/MM')} - ${format(new Date(booking.endDate), 'dd/MM/yy')}`
                                    : 'Fechas inválidas'}
                                </div>
                                <div className="flex items-center text-xs font-bold text-gray-500">
                                  <Users className="text-brand-500 mr-2 h-4 w-4" />
                                  {booking.guests} Huéspedes
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 rounded-2xl bg-gray-50 p-3">
                                <div className="bg-brand-navy flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black text-white uppercase">
                                  {booking.guestName?.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-brand-navy text-xs font-black uppercase">
                                    {booking.guestName}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-400">
                                    Inquilino
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-brand-navy flex w-full flex-col justify-between rounded-3xl p-4 text-white sm:w-48">
                              <div className="flex flex-col">
                                <span className="text-brand-500 text-[10px] font-black tracking-widest uppercase">
                                  Monto Total
                                </span>
                                <span className="text-2xl font-black">
                                  ${booking.totalAmount}
                                </span>
                              </div>
                              {booking.paymentReference && (
                                <div className="mt-4 flex flex-col border-t border-white/10 pt-4">
                                  <span className="text-brand-500 flex items-center gap-1 text-[10px] font-black uppercase">
                                    <Hash className="h-3 w-3" /> Referencia
                                  </span>
                                  <span className="truncate text-xs font-black">
                                    {booking.paymentReference}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </AnimatePresence>

                        {/* Admin Actions */}
                        <div className="mt-auto space-y-4 border-t border-dashed border-gray-100 pt-6">
                          {booking.status === 'AWAITING_VERIFICATION' && (
                            <div className="flex flex-col gap-3">
                              <div className="flex gap-3">
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(booking, 'CONFIRMED')
                                  }
                                  className="flex-grow transform rounded-2xl bg-emerald-500 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-95"
                                >
                                  Validar Pago
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = window.prompt(
                                      'Indica la razón del rechazo:'
                                    );
                                    if (reason)
                                      handleUpdateStatus(
                                        booking,
                                        'REJECTED',
                                        reason
                                      );
                                  }}
                                  className="transform rounded-2xl border-2 border-red-100 px-6 py-3 text-[10px] font-black tracking-widest text-red-500 uppercase transition-all hover:bg-red-50 active:scale-95"
                                >
                                  Rechazar
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Status History / Info */}
                          <div className="space-y-2 rounded-2xl bg-gray-50 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black tracking-widest text-gray-400 uppercase">
                                Actividad de la Reserva
                              </span>
                              {booking.verifiedBy && (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-600">
                                  Verificado por {booking.verifiedBy}
                                </span>
                              )}
                            </div>

                            <div className="no-scrollbar max-h-24 space-y-2 overflow-y-auto pr-2">
                              {booking.statusHistory?.map((h, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-3 text-[9px]"
                                >
                                  <div className="bg-brand-500 mt-1.5 h-1 w-1 shrink-0 rounded-full" />
                                  <div className="flex-grow">
                                    <div className="mb-0.5 flex items-center justify-between">
                                      <span className="text-brand-navy font-black uppercase">
                                        {h.status}
                                      </span>
                                      <span className="text-[8px] text-gray-400">
                                        {h.timestamp &&
                                        !isNaN(new Date(h.timestamp).getTime())
                                          ? format(
                                              new Date(h.timestamp),
                                              'dd/MM HH:mm'
                                            )
                                          : ''}
                                      </span>
                                    </div>
                                    {h.note && (
                                      <p className="leading-snug text-gray-500 italic">
                                        {h.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {(!booking.statusHistory ||
                                booking.statusHistory.length === 0) && (
                                <p className="text-[10px] text-gray-400 italic">
                                  No hay historial registrado.
                                </p>
                              )}
                            </div>
                          </div>

                          {booking.status === 'CONFIRMED' && (
                            <div className="flex w-full items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 py-3">
                              <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">
                                Reserva Asegurada ✓
                              </span>
                            </div>
                          )}
                          {booking.status === 'REJECTED' && (
                            <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-3">
                              <span className="text-[10px] font-black tracking-widest text-red-600 uppercase">
                                Pago Rechazado ✕
                              </span>
                              {booking.rejectionReason && (
                                <p className="mt-1 text-[9px] font-bold text-red-400">
                                  {booking.rejectionReason}
                                </p>
                              )}
                            </div>
                          )}
                          {booking.status === 'PENDING_PAYMENT' && (
                            <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-amber-50 py-3">
                              <span className="text-[10px] font-black tracking-widest text-amber-600 uppercase">
                                Esperando comprobante del Huésped
                              </span>
                              <div className="mt-2">
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        '¿Deseas cancelar esta reserva por falta de pago?'
                                      )
                                    ) {
                                      handleUpdateStatus(
                                        booking,
                                        'CANCELLED',
                                        'Cancelada por administrador'
                                      );
                                    }
                                  }}
                                  className="text-[8px] font-black tracking-tighter text-amber-700 uppercase underline"
                                >
                                  Forzar Cancelación
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )
              ) : activeTab === 'listings' ? (
                // LISTINGS LIST
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex flex-col overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-sm"
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="text-brand-navy rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase shadow-sm backdrop-blur-sm">
                            {listing.city}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-grow flex-col p-6">
                        <div className="mb-2 flex items-start justify-between">
                          <h4 className="text-brand-navy line-clamp-1 text-lg leading-tight font-black">
                            {listing.title}
                          </h4>
                          <span className="text-brand-500 font-black">
                            ${listing.pricePerNight}
                          </span>
                        </div>
                        <p className="mb-4 line-clamp-2 text-xs text-gray-400">
                          {listing.description}
                        </p>

                        <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-6">
                          <div className="flex items-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                            <MapPin className="mr-1 h-3 w-3" />
                            {listing.location.split(',')[0]}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingListing(listing)}
                              className="text-brand-navy hover:bg-brand-500 rounded-xl bg-gray-50 p-2.5 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              className="rounded-xl bg-gray-50 p-2.5 text-red-500 transition-colors hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setEditingListing({
                        id: `listing-${Date.now()}`,
                        title: '',
                        description: '',
                        city: 'Caracas',
                        location: '',
                        pricePerNight: 0,
                        rating: 5,
                        reviewsCount: 0,
                        isVerified: true,
                        isPetFriendly: false,
                        images: [
                          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
                        ],
                        amenities: ['Wifi', 'Estacionamiento'],
                        maxGuests: 2,
                        bedrooms: 1,
                        beds: 1,
                        baths: 1,
                        hostName: user?.displayName || 'Admin',
                        hostAvatar:
                          user?.photoURL || 'https://i.pravatar.cc/150?u=admin',
                        hostId: user?.uid || 'admin',
                        blockedDates: [],
                        paymentInstructions: '',
                        minNights: 1,
                        maxNights: 30,
                        propertyType: 'Apartamento',
                        accommodationType: 'Alojamiento entero',
                        buildingFloors: 1,
                        propertyFloor: 0,
                        constructionYear: new Date().getFullYear(),
                      })
                    }
                    className="hover:border-brand-500 hover:bg-brand-500/5 hover:text-brand-500 flex flex-col items-center justify-center gap-4 rounded-[32px] border-2 border-dashed border-gray-200 p-8 text-gray-400 transition-all"
                  >
                    <Plus className="h-8 w-8" />
                    <span className="text-[10px] font-black tracking-widest uppercase">
                      Añadir Propiedad
                    </span>
                  </button>
                </div>
              ) : (
                // PROFILE EDITOR
                <UserProfileSetup />
              )}
            </div>
          </div>
        )}

        {/* Edit Listing Modal */}
        <AnimatePresence>
          {editingListing && (
            <div className="bg-brand-navy/60 fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto p-4 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-w-2xl md:rounded-[40px]"
              >
                <form
                  onSubmit={handleUpdateListing}
                  className="flex h-full flex-col md:max-h-[90vh]"
                >
                  <div className="bg-brand-navy flex shrink-0 items-center justify-between p-6 text-white md:p-8">
                    <div>
                      <h3 className="flex items-center gap-2 text-xl font-black tracking-tight md:text-2xl">
                        {editingListing.id.startsWith('listing-')
                          ? 'Nueva Propiedad'
                          : 'Editar Propiedad'}
                      </h3>
                      <p className="text-brand-500 mt-1 text-[9px] font-black tracking-[0.3em] uppercase md:text-[10px]">
                        {editingListing.id.startsWith('listing-')
                          ? 'Completa los detalles para publicar'
                          : `Ref: ${editingListing.id}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingListing(null)}
                      className="rounded-2xl bg-white/10 p-3 transition-transform hover:bg-white/20 active:scale-95"
                      aria-label="Cerrar modal"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {!user && editingListing.id.startsWith('listing-') && (
                    <div className="bg-brand-500 flex items-center justify-center gap-3 px-6 py-3">
                      <ShieldAlert className="text-brand-navy h-4 w-4" />
                      <p className="text-brand-navy text-center text-[10px] font-black tracking-widest uppercase">
                        ESTÁS CREANDO UN BORRADOR ASPIRACIONAL. NO PIERDAS TU
                        PROGRESO.
                      </p>
                    </div>
                  )}

                  <div className="no-scrollbar flex-grow space-y-6 overflow-y-auto p-6 md:p-8">
                    <div className="space-y-4">
                      <label className="text-brand-navy/40 ml-1 flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
                        <span>Imágenes de la Propiedad</span>
                        <span className="font-bold text-gray-400">
                          {editingListing.images.length} fotos
                        </span>
                      </label>

                      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                        {editingListing.images.map((img, idx) => (
                          <div
                            key={`${img}-${idx}`}
                            className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
                          >
                            <img
                              src={img}
                              alt=""
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 rounded-lg bg-white/90 p-1 text-red-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 transition-all disabled:opacity-50"
                        >
                          {isUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-6 w-6" />
                              <span className="text-[8px] font-black uppercase">
                                Subir
                              </span>
                            </>
                          )}
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                        Título de la Propiedad
                      </label>
                      <input
                        type="text"
                        className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold focus:outline-none"
                        value={editingListing.title}
                        onChange={(e) =>
                          setEditingListing((prev) =>
                            prev ? { ...prev, title: e.target.value } : null
                          )
                        }
                        placeholder="Ej: Penthouse de Lujo con Vista al Mar"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                        Descripción
                      </label>
                      <textarea
                        className="text-brand-navy focus:border-brand-500 h-32 w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold focus:outline-none"
                        value={editingListing.description}
                        onChange={(e) =>
                          setEditingListing((prev) =>
                            prev
                              ? { ...prev, description: e.target.value }
                              : null
                          )
                        }
                        placeholder="Describe la experiencia: 'Disfruta de este espacio con Planta Eléctrica 24/7, WiFi de alta velocidad y acabados de mármol...'"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                          Ciudad
                        </label>
                        <select
                          className="text-brand-navy focus:border-brand-500 w-full appearance-none rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold focus:outline-none"
                          value={editingListing.city}
                          onChange={(e) =>
                            setEditingListing((prev) =>
                              prev
                                ? { ...prev, city: e.target.value as City }
                                : null
                            )
                          }
                        >
                          <option value="Lechería">Lechería</option>
                          <option value="Caracas">Caracas</option>
                          <option value="Margarita">Margarita</option>
                          <option value="Puerto La Cruz">Puerto La Cruz</option>
                          <option value="Falcon">Falcón</option>
                          <option value="Maracaibo">Maracaibo</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                          Precio por Noche ($)
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-5 text-lg font-bold focus:outline-none"
                          value={editingListing.pricePerNight}
                          onChange={(e) =>
                            setEditingListing((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    pricePerNight: Number(e.target.value),
                                  }
                                : null
                            )
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* New Availability and Property Type Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                          Min. Noches
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-5 font-bold focus:outline-none"
                          value={editingListing.minNights || 1}
                          onChange={(e) =>
                            setEditingListing((prev) =>
                              prev
                                ? { ...prev, minNights: Number(e.target.value) }
                                : null
                            )
                          }
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                          Max. Noches
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-5 font-bold focus:outline-none"
                          value={editingListing.maxNights || 30}
                          onChange={(e) =>
                            setEditingListing((prev) =>
                              prev
                                ? { ...prev, maxNights: Number(e.target.value) }
                                : null
                            )
                          }
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                          Tipo de Propiedad
                        </label>
                        <select
                          className="text-brand-navy focus:border-brand-500 w-full appearance-none rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold focus:outline-none"
                          value={editingListing.propertyType || 'Apartamento'}
                          onChange={(e) =>
                            setEditingListing((prev) =>
                              prev
                                ? { ...prev, propertyType: e.target.value }
                                : null
                            )
                          }
                        >
                          <option value="Apartamento">Apartamento</option>
                          <option value="Casa">Casa</option>
                          <option value="Estudio">Estudio</option>
                          <option value="Villa">Villa</option>
                          <option value="Penthouse">Penthouse</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                          Tipo de Alojamiento
                        </label>
                        <select
                          className="text-brand-navy focus:border-brand-500 w-full appearance-none rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold focus:outline-none"
                          value={
                            editingListing.accommodationType ||
                            'Alojamiento entero'
                          }
                          onChange={(e) =>
                            setEditingListing((prev) =>
                              prev
                                ? { ...prev, accommodationType: e.target.value }
                                : null
                            )
                          }
                        >
                          <option value="Alojamiento entero">
                            Alojamiento entero
                          </option>
                          <option value="Habitación privada">
                            Habitación privada
                          </option>
                          <option value="Habitación compartida">
                            Habitación compartida
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 rounded-[32px] border border-gray-100 bg-gray-50/50 p-6 md:grid-cols-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                            Pisos del Edificio
                          </label>
                          <div className="flex h-[60px] items-center rounded-2xl border border-gray-100 bg-gray-50 p-1">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingListing((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        buildingFloors: Math.max(
                                          1,
                                          (prev.buildingFloors || 1) - 1
                                        ),
                                      }
                                    : null
                                )
                              }
                              className="text-brand-navy flex h-full w-14 items-center justify-center rounded-xl text-xl font-black transition-colors hover:bg-gray-200"
                            >
                              -
                            </button>
                            <div className="text-brand-navy flex-grow text-center font-bold">
                              {editingListing.buildingFloors || 1}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingListing((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        buildingFloors:
                                          (prev.buildingFloors || 1) + 1,
                                      }
                                    : null
                                )
                              }
                              className="text-brand-navy flex h-full w-14 items-center justify-center rounded-xl text-xl font-black transition-colors hover:bg-gray-200"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                            Piso del Alojamiento
                          </label>
                          <div className="flex h-[60px] items-center rounded-2xl border border-gray-100 bg-gray-50 p-1">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingListing((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        propertyFloor: Math.max(
                                          0,
                                          (prev.propertyFloor || 0) - 1
                                        ),
                                      }
                                    : null
                                )
                              }
                              className="text-brand-navy flex h-full w-14 items-center justify-center rounded-xl text-xl font-black transition-colors hover:bg-gray-200"
                            >
                              -
                            </button>
                            <div className="text-brand-navy flex-grow text-center font-bold">
                              {editingListing.propertyFloor === 0
                                ? 'PB'
                                : editingListing.propertyFloor || 0}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingListing((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        propertyFloor:
                                          (prev.propertyFloor || 0) + 1,
                                      }
                                    : null
                                )
                              }
                              className="text-brand-navy flex h-full w-14 items-center justify-center rounded-xl text-xl font-black transition-colors hover:bg-gray-200"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                          Año de Construcción
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1900"
                          max={new Date().getFullYear()}
                          className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-5 font-bold focus:outline-none"
                          value={editingListing.constructionYear || 2010}
                          onChange={(e) =>
                            setEditingListing((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    constructionYear: Number(e.target.value),
                                  }
                                : null
                            )
                          }
                          placeholder="Ej: 1995"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                        Ubicación Detallada
                      </label>
                      <input
                        type="text"
                        className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold focus:outline-none"
                        value={editingListing.location}
                        onChange={(e) =>
                          setEditingListing((prev) =>
                            prev ? { ...prev, location: e.target.value } : null
                          )
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">
                        Ubicación en el Mapa
                      </label>
                      <div className="group relative h-64 overflow-hidden rounded-[32px] border border-gray-100 bg-gray-50 shadow-inner">
                        {isLoaded && !loadError ? (
                          <GoogleMap
                            mapContainerStyle={{
                              width: '100%',
                              height: '100%',
                            }}
                            center={
                              editingListing.latitude &&
                              editingListing.longitude
                                ? {
                                    lat: editingListing.latitude,
                                    lng: editingListing.longitude,
                                  }
                                : LECHERIA_CENTER
                            }
                            zoom={14}
                            onClick={(e) => {
                              if (e.latLng) {
                                setEditingListing({
                                  ...editingListing,
                                  latitude: e.latLng.lat(),
                                  longitude: e.latLng.lng(),
                                });
                              }
                            }}
                            options={DEFAULT_MAP_OPTIONS}
                          >
                            {editingListing.latitude &&
                              editingListing.longitude && (
                                <Marker
                                  position={{
                                    lat: editingListing.latitude,
                                    lng: editingListing.longitude,
                                  }}
                                />
                              )}
                          </GoogleMap>
                        ) : (
                          <div className="bg-brand-navy group/map-error relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-6 text-center">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 grayscale invert" />
                            <div className="from-brand-navy via-brand-navy/95 to-brand-500/5 absolute inset-0 bg-gradient-to-br" />

                            <div className="relative z-10 flex flex-col items-center">
                              <div className="bg-brand-500/10 border-brand-500/20 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-xl">
                                <MapPin className="text-brand-500 h-6 w-6" />
                              </div>

                              <h4 className="mb-2 text-sm font-black tracking-tight text-white">
                                Asistente de Ubicación
                              </h4>
                              <p className="mb-6 max-w-[280px] text-[10px] leading-relaxed font-bold tracking-widest text-white/50 uppercase">
                                {loadError
                                  ? loadError.message?.includes(
                                      'ApiTargetBlockedMapError'
                                    )
                                    ? "Habilita 'Maps JavaScript API' en Google Cloud Console para activar el selector visual."
                                    : 'Configuración de API pendiente. Haz clic abajo para gestionar permisos.'
                                  : 'Cargando mapa interactivo...'}
                              </p>

                              {loadError && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.open(
                                      'https://console.cloud.google.com/google/maps-apis/api-list',
                                      '_blank'
                                    )
                                  }
                                  className="bg-brand-500 text-brand-navy flex items-center gap-2 rounded-xl px-6 py-3 text-[9px] font-black tracking-widest uppercase shadow-lg transition-all hover:bg-white"
                                >
                                  <ShieldAlert className="h-3 w-3" />
                                  Habilitar en Cloud Console
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black tracking-widest text-gray-400 uppercase">
                          Huéspedes
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-bold"
                          value={editingListing.maxGuests}
                          onChange={(e) =>
                            setEditingListing((prev) =>
                              prev
                                ? { ...prev, maxGuests: Number(e.target.value) }
                                : null
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black tracking-widest text-gray-400 uppercase">
                          Dormitorios
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-bold"
                          value={editingListing.bedrooms}
                          onChange={(e) =>
                            setEditingListing((prev) =>
                              prev
                                ? { ...prev, bedrooms: Number(e.target.value) }
                                : null
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black tracking-widest text-gray-400 uppercase">
                          Camas
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-bold"
                          value={editingListing.beds}
                          onChange={(e) =>
                            setEditingListing((prev) =>
                              prev
                                ? { ...prev, beds: Number(e.target.value) }
                                : null
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black tracking-widest text-gray-400 uppercase">
                          Baños
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-bold"
                          value={editingListing.baths}
                          onChange={(e) =>
                            setEditingListing((prev) =>
                              prev
                                ? { ...prev, baths: Number(e.target.value) }
                                : null
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* Dynamic Payment Settings Section */}
                    <div className="space-y-6 border-t border-gray-100 pt-10">
                      <div className="flex items-center gap-4">
                        <div className="bg-brand-navy/5 flex h-10 w-10 items-center justify-center rounded-2xl">
                          <CreditCard className="text-brand-navy h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-brand-navy text-sm leading-none font-black tracking-widest uppercase">
                            Configuración de Pagos
                          </h3>
                          <p className="mt-1 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                            Gestiona cómo recibirás los fondos
                          </p>
                        </div>
                      </div>

                      <PaymentSettings
                        listing={editingListing}
                        onChange={(updatedMethods) => {
                          setEditingListing((prev) =>
                            prev
                              ? { ...prev, paymentMethods: updatedMethods }
                              : null
                          );
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col justify-end gap-4 border-t border-gray-100 bg-gray-50 p-6 sm:flex-row md:p-8">
                    <button
                      type="button"
                      onClick={() => setEditingListing(null)}
                      className="hover:text-brand-navy order-2 px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase transition-colors sm:order-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || isUploading}
                      className="bg-brand-navy shadow-brand-navy/20 hover:bg-brand-500 hover:text-brand-navy group order-1 flex transform items-center justify-center gap-2 rounded-2xl px-10 py-5 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all active:scale-95 sm:order-2"
                    >
                      {isSaving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Save className="h-5 w-5" />
                      )}
                      {editingListing.id.startsWith('listing-')
                        ? 'Publicar Propiedad'
                        : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {activeChatId && activeChatBooking && (
          <FloatingChat
            isOpen={true}
            bookingId={activeChatId}
            listingTitle={activeChatBooking.listingTitle}
            senderId={user?.uid || 'admin'}
            senderName={user?.displayName || 'Admin'}
            recipientName={activeChatBooking.guestName}
            onClose={() => {
              setActiveChatId(null);
              setActiveChatBooking(null);
            }}
          />
        )}
      </div>
    </>
  );
};

export default AdminDashboard;






