import React, { useEffect, useState, Suspense, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  where,
} from 'firebase/firestore';
import { Booking, BookingStatus } from '@/features/bookings/types';
import { Listing } from '@/features/listings/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '@/lib/firebase';
import { ENVIRONMENTS } from '../constants/dashboard.constants';
import { Search, ShieldCheck, Clock, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoadScript } from '@react-google-maps/api';
import {
  GOOGLE_MAPS_API_KEY,
  MAPS_LIBRARIES,
  DEFAULT_MAP_OPTIONS,
  useMapsAuthCheck,
} from '@/lib/maps';
import FloatingChat from '@/components/FloatingChat';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import Skeleton from '@/components/ui/Skeleton';
import UserProfileSetup from '@/features/auth/components/UserProfileSetup';
import { cleanupExpiredBookings } from '@/services/booking-service';

// v2.2 Refactored Components
import DashboardHeader, { DashboardTab } from './DashboardHeader';
import BookingList from './BookingList';
import ListingList from './ListingList';
import StatsCards from './StatsCards';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import GuestRequestVerificationDrawer from './GuestRequestVerificationDrawer';

// Rule: bundle-dynamic-imports
const ListingForm = React.lazy(() => import('./ListingForm'));
const KYCAuditPanel = React.lazy(() => import('./KYCAuditPanel'));


const AdminDashboard: React.FC = () => {
  const { user, isAdmin, profileData } = useAuth();
  const navigate = useNavigate();
  const { isLoaded, loadError: scriptLoadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });
  const mapsAuthError = useMapsAuthCheck();
  const loadError = scriptLoadError || (mapsAuthError ? { message: 'ApiTargetBlockedMapError' } : null);

  const LECHERIA_CENTER = { lat: 10.2167, lng: -67.95 };

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (window.location.pathname === '/admin/mis-propiedades' || window.location.pathname === '/publicar-espacio') return 'listings';
    return isAdmin ? 'bookings' : 'profile';
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'AWAITING_VERIFICATION' | 'CONFIRMED' | 'PENDING_PAYMENT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedBookingForVerification, setSelectedBookingForVerification] = useState<Booking | null>(null);
  
  // v2.2 Centralized Financial Intelligence
  const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length;
  const currentTier = (profileData?.isIdentityVerified || isAdmin) ? (confirmedCount >= 10 ? 8 : 10) : 12;

  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [kycPendingCount, setKycPendingCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);


  const location = useLocation();
  const initialListing = location.state?.initialListing;

  const isHost = Boolean(
    profileData?.role === 'host' ||
    (user && listings.some((l) => l.hostId === user.uid)) ||
    initialListing
  );

  useEffect(() => {
    if (initialListing) {
      setEditingListing(initialListing as Listing);
      setActiveTab('listings');
    } else if (window.location.pathname === '/publicar-espacio') {
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
        hostId: user?.uid || '',
        hostName: user?.displayName || '',
        hostAvatar: user?.photoURL || '',
        images: [],
        environmentPhotos: {},
        maxGuests: 1,
        bedrooms: 1,
        beds: 1,
        baths: 1,
        buildingFloors: 1,
        propertyFloor: 1,
        constructionYear: new Date().getFullYear(),
        amenities: [],
        paymentMethods: [],
        isPublishedFromDashboard: false,
        minNights: 1,
        maxNights: 30,
        cancellationPolicy: 'flexible',
        bookingMode: 'request',
        propertyType: 'apartment',
        accommodationType: 'entire',
        cleaningFee: 0,
        isPetFriendly: false,
      });
      setActiveTab('listings');
    }
  }, [initialListing, user]);

  // Rule: async-parallel (Subscriptions)
  useEffect(() => {
    setLoading(true);

    const bQuery = isAdmin
      ? query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
      : user
        ? query(collection(db, 'bookings'), where('ownerId', '==', user.uid))
        : null;

    const unsubscribeBookings = bQuery
      ? onSnapshot(bQuery, (snapshot) => {
          const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Booking[];
          setBookings(data);
          setLoading(false);
        }, (error) => {
          console.error('Admin: Error listening to bookings:', error);
          setLoading(false);
        })
      : () => {};

    const lQuery = query(
      collection(db, 'listings'),
      where('isPublishedFromDashboard', '==', true),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribeListings = onSnapshot(lQuery, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Listing[];
        setListings(data);
        setLoading(false);
      }, (error) => {
        console.error('Admin: Error listening to listings:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeBookings();
      unsubscribeListings();
    };
  }, [isAdmin, user]);

  // Ejecutar limpieza pasiva (Lazy Expiry) de reservas expiradas al montar
  useEffect(() => {
    cleanupExpiredBookings();
  }, []);

  // Suscribirse en tiempo real al conteo de KYC pendientes
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'users'),
      where('kycStatus', '==', 'PENDING_REVIEW')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setKycPendingCount(snapshot.size);
    }, (error) => {
      console.error('Admin: Error listening to pending KYC:', error);
    });

    return () => unsubscribe();
  }, [isAdmin]);


  // v2.2 Persistencia: Recuperar borrador y reabrir formulario al refrescar
  useEffect(() => {
    const savedDraft = localStorage.getItem('venestay_draft_listing');
    if (savedDraft && !editingListing) {
      try {
        const draft = JSON.parse(savedDraft);
        // Solo reabrimos si es una propiedad nueva (draft) para evitar conflictos con ediciones reales
        if (draft.id.startsWith('listing-')) {
          setEditingListing(draft);
          // Opcional: toast ya se dispara dentro de ListingForm, 
          // pero aquí aseguramos que el modal se abra.
        }
      } catch (e) {
        console.error('Error auto-reopening draft:', e);
      }
    }
  }, [editingListing]);

  const reorderImagesWithPrimary = useCallback((images: string[]): string[] => {
    // Retornamos el array libre de duplicados y valores nulos sin alterar el orden del usuario
    return Array.from(new Set(images.filter(Boolean)));
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement> | { files: FileList }, environmentId?: string) => {
    const listingId = editingListing?.id;
    if (!listingId || !user) return;

    const fileList: FileList | null = 'target' in e
      ? (e as React.ChangeEvent<HTMLInputElement>).target.files
      : (e as { files: FileList }).files;
    if (!fileList || fileList.length === 0) return;
    
    // CRITICAL: Convert FileList to Array synchronously before any 'await' 
    // to prevent losing references if the input value is reset in the UI.
    const files: File[] = Array.from(fileList);

    setIsUploading(true);

    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const options = { maxSizeMB: 0.6, maxWidthOrHeight: 1600, useWebWorker: true, initialQuality: 0.75 };

      for (const file of files) {
        try {
          let uploadFile: File | Blob = file;
          if (file.type.startsWith('image/')) {
            uploadFile = await imageCompression(file, options);
          }

          const uniqueId = Math.random().toString(36).substring(2, 8);
          const fileName = `${Date.now()}-${uniqueId}-${file.name.replace(/\s+/g, '_')}`;
          const storageRef = ref(storage, `listings/${listingId}/${fileName}`);
          const metadata = { contentType: file.type, cacheControl: 'public,max-age=31536000' };

          const snapshot = await uploadBytes(storageRef, uploadFile, metadata);
          const downloadURL = await getDownloadURL(snapshot.ref);

            setEditingListing((prev) => {
              if (!prev || prev.id !== listingId) return prev;
              
              const oldPhotoUrl = prev.environmentPhotos?.[environmentId || ''];
              
              let nextImages = [...prev.images];
              if (oldPhotoUrl && nextImages.includes(oldPhotoUrl)) {
                // Reemplazar en el mismo índice exacto
                const idx = nextImages.indexOf(oldPhotoUrl);
                nextImages[idx] = downloadURL;
              } else {
                if (!nextImages.includes(downloadURL)) {
                  nextImages.push(downloadURL);
                }
              }

              const newEnvPhotos = { ...(prev.environmentPhotos || {}) };
              if (environmentId) {
                newEnvPhotos[environmentId] = downloadURL;
              }

              nextImages = reorderImagesWithPrimary(nextImages);

              return {
                ...prev,
                images: nextImages,
                environmentPhotos: newEnvPhotos
              };
            });

            if (!listingId.startsWith('listing-')) {
              // Obtener listado actual para calcular los arrays limpios y actualizados para Firestore
              const currentListing = listings.find(l => l.id === listingId);
              if (currentListing) {
                const oldPhotoUrl = currentListing.environmentPhotos?.[environmentId || ''];
                let nextImages = [...currentListing.images];
                if (oldPhotoUrl && nextImages.includes(oldPhotoUrl)) {
                  // Reemplazar en el mismo índice exacto
                  const idx = nextImages.indexOf(oldPhotoUrl);
                  nextImages[idx] = downloadURL;
                } else {
                  if (!nextImages.includes(downloadURL)) {
                    nextImages.push(downloadURL);
                  }
                }

                const newEnvPhotos = { ...(currentListing.environmentPhotos || {}) };
                if (environmentId) {
                  newEnvPhotos[environmentId] = downloadURL;
                }

                nextImages = reorderImagesWithPrimary(nextImages);

                const updates = {
                  images: nextImages,
                  environmentPhotos: newEnvPhotos,
                  updatedAt: new Date().toISOString(),
                };
                
                await updateDoc(doc(db, 'listings', listingId), updates);
              }
            }

            if (environmentId) {
              const envLabel = ENVIRONMENTS.find(env => env.id === environmentId)?.label || environmentId;
              toast.success(`¡${envLabel} Verificada!`, {
                description: "La imagen ha sido asignada y verificada en la galería.",
                style: { background: '#0A192F', color: '#C5A059', border: '1px solid #C5A059' },
                icon: <div className="bg-brand-500 rounded-full p-1"><ShieldCheck className="h-4 w-4 text-brand-navy" /></div>
              });
            } else {
              toast.success("Foto añadida a la galería general");
            }
        } catch (err) {
          console.error('Upload error:', err);
        }
      }
    } catch {
      toast.error('Error crítico en el proceso de subida');
    } finally {
      setIsUploading(false);
    }
  }, [user, editingListing?.id, listings, reorderImagesWithPrimary]);

  const removeImage = (index: number) => {
    setEditingListing((prev) => {
      if (!prev) return null;
      const newImages = [...prev.images];
      const removedUrl = newImages[index];
      newImages.splice(index, 1);

      // Limpiar también del mapeo de ambientes si la foto estaba asignada
      const newEnvPhotos = { ...(prev.environmentPhotos || {}) };
      let envPhotosChanged = false;
      if (prev.environmentPhotos) {
        Object.entries(prev.environmentPhotos).forEach(([key, val]) => {
          if (val === removedUrl) {
            delete newEnvPhotos[key];
            envPhotosChanged = true;
          }
        });
      }

      // Reordenar las imágenes restantes
      const nextImages = reorderImagesWithPrimary(newImages);

      return {
        ...prev,
        images: nextImages,
        environmentPhotos: envPhotosChanged ? newEnvPhotos : prev.environmentPhotos
      };
    });
  };

  const handleUpdateStatus = async (booking: Booking, newStatus: BookingStatus, note?: string) => {
    try {
      const historyEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        actorId: user?.uid || 'system',
        actorName: user?.displayName || 'Admin',
        note: note || '',
      };

      const updateData: Record<string, unknown> = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        statusHistory: [...(booking.statusHistory || []), historyEntry],
      };

      if (newStatus === 'REJECTED' && note) {
        updateData.rejectionReason = note;
      }

      await updateDoc(doc(db, 'bookings', booking.id), updateData);
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const handleUpdateListing = async (e: React.FormEvent, listingToSave?: Listing) => {
    if (e) e.preventDefault();
    const listing = listingToSave || editingListing;
    if (!listing || !user) return;

    setIsSaving(true);
    try {
      const { id, ...data } = listing;
      const isNew = id.startsWith('listing-');
      
      // Asegurar que las imágenes estén ordenadas correctamente con Habitación Principal en el índice 0
      const finalImages = reorderImagesWithPrimary(data.images);

      const payload: Partial<Listing> & { isPublishedFromDashboard: boolean } = { 
        ...data, 
        images: finalImages,
        updatedAt: new Date().toISOString(),
        isPublishedFromDashboard: true 
      };
      if (isNew) payload.createdAt = new Date().toISOString();

      const listingRef = doc(db, 'listings', id);
      if (isNew) {
        await setDoc(listingRef, { ...payload, id });
      } else {
         
        const { id: _, ...updateData } = payload;
        await updateDoc(listingRef, updateData as unknown as Record<string, string | number | boolean>);
      }

      toast.success(isNew ? '¡Propiedad publicada!' : 'Cambios guardados');
      setEditingListing(null);
      if (isNew) navigate('/admin/mis-propiedades');
    } catch {
      toast.error('Error al guardar la propiedad');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      await deleteDoc(doc(db, 'listings', listingId));
      toast.success('Propiedad eliminada');
      setListingToDelete(null);
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Generando reporte CSV de usuarios...');
    try {
      const exportUsers = httpsCallable(functions, 'exportUsersToCSV');
      const response = await exportUsers();
      const csvString = (response.data as { csv: string }).csv;
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `venestay_usuarios_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Reporte exportado con éxito', { id: toastId });
    } catch (err: unknown) {
      console.error(err);
      toast.error('Error al exportar usuarios. Verifica tus permisos.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredBookings = useMemo(() => {
    const base = bookings.filter((b) => {
      if (!isAdmin && b.ownerId !== user?.uid) return false;
      const matchesFilter = filter === 'ALL' || b.status === filter;
      const matchesSearch = b.listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.includes(searchTerm);
      return matchesFilter && matchesSearch;
    });
    
    return showHistory ? base : base.slice(0, 10);
  }, [bookings, isAdmin, user?.uid, filter, searchTerm, showHistory]);

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (!isAdmin && l.hostId !== user?.uid) return false;
      return l.title.toLowerCase().includes(searchTerm.toLowerCase()) || l.city.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [listings, isAdmin, user?.uid, searchTerm]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="animate-slide-up relative flex w-full grow flex-col overflow-hidden bg-white shadow-2xl">
        <DashboardHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={isAdmin || false}
          isHost={isHost}
          kycPendingCount={kycPendingCount}
        />


        {activeTab === 'bookings' && (
          <div className="px-6 pt-6">
            <StatsCards 
              bookings={bookings} 
              listings={listings} 
              isVerified={profileData?.isIdentityVerified || false} 
              tier={currentTier}
            />
          </div>
        )}

        {/* Toolbar — Stack de 2 filas para mejor jerarquía visual */}
        <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/50 px-6 pt-5 pb-4">

          {/* Fila 1: Búsqueda global + Acción de sistema */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'bookings' ? 'Buscar reservas...' : 'Buscar propiedades...'}
                className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-200 bg-white py-2.5 pr-4 pl-12 text-sm font-bold transition-all focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && (
              <button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="flex shrink-0 items-center gap-2 rounded-2xl bg-brand-navy px-5 py-2.5 text-xs font-black tracking-widest uppercase text-white shadow-md transition-all hover:bg-brand-500 hover:text-brand-navy disabled:opacity-50"
              >
                {isExporting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Download className="h-4 w-4" />}
                <span className="hidden sm:inline">Exportar Usuarios CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
            )}
          </div>

          {/* Fila 2: Filtros contextuales de estado + Toggle histórico */}
          {activeTab === 'bookings' && (
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
              {(['ALL', 'PENDING_APPROVAL', 'AWAITING_VERIFICATION', 'CONFIRMED', 'PENDING_PAYMENT'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-bold tracking-wide whitespace-nowrap uppercase transition-all',
                    filter === f
                      ? 'bg-brand-navy border-brand-navy text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-brand-500 hover:text-brand-navy'
                  )}
                >
                  {f === 'ALL' ? 'Todos'
                    : f === 'PENDING_APPROVAL' ? 'Solicitudes'
                    : f === 'AWAITING_VERIFICATION' ? 'Por Verificar'
                    : f === 'CONFIRMED' ? 'Confirmados'
                    : 'Pendientes'}
                </button>
              ))}

              <div className="ml-auto shrink-0 border-l border-gray-200 pl-3">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[11px] font-bold tracking-wide uppercase transition-all',
                    showHistory
                      ? 'border-amber-200 bg-amber-50 text-amber-600'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-600'
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {showHistory ? 'Ocultar Histórico' : `Ver Histórico (${bookings.length})`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* List Content */}
        <div className="no-scrollbar grow overflow-y-auto bg-gray-50/20 p-6 md:p-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 gap-6 xl:grid-cols-2"
              >
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-6 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
                    <Skeleton className="h-40 w-full rounded-3xl" />
                    <Skeleton className="h-8 w-3/4" />
                  </div>
                ))}
              </motion.div>
            ) : activeTab === 'bookings' ? (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <BookingList
                  bookings={filteredBookings}
                  user={user}
                  handleUpdateStatus={handleUpdateStatus}
                  setActiveChatId={setActiveChatId}
                  setActiveChatBooking={setActiveChatBooking}
                  tier={currentTier}
                  onVerifyRequest={setSelectedBookingForVerification}
                />
                
              </motion.div>
            ) : activeTab === 'listings' ? (
              <motion.div
                key="listings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ListingList
                  listings={filteredListings}
                  setEditingListing={setEditingListing}
                  handleDeleteListing={async (id) => {
                    const listing = listings.find(l => l.id === id);
                    if (listing) setListingToDelete(listing);
                  }}
                  user={user}
                />
              </motion.div>
            ) : activeTab === 'kyc_audit' ? (
              <motion.div
                key="kyc_audit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={
                  <div className="flex justify-center items-center py-20">
                    <div className="text-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-500 mx-auto" />
                      <p className="text-xs text-gray-500 font-bold">Cargando panel de auditoría...</p>
                    </div>
                  </div>
                }>
                  <KYCAuditPanel />
                </Suspense>
              </motion.div>
            ) : (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <UserProfileSetup />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Suspense fallback={<div className="fixed inset-0 z-120 bg-white/50 backdrop-blur-sm flex items-center justify-center"><Skeleton className="h-20 w-20 rounded-full" /></div>}>
        {editingListing && (
          <ListingForm
            editingListing={editingListing}
            setEditingListing={setEditingListing}
            handleUpdateListing={handleUpdateListing}
            isSaving={isSaving}
            isUploading={isUploading}
            handleImageUpload={handleImageUpload}
            removeImage={removeImage}
            isLoaded={isLoaded}
            loadError={loadError}
            LECHERIA_CENTER={LECHERIA_CENTER}
            DEFAULT_MAP_OPTIONS={DEFAULT_MAP_OPTIONS}
            user={user}
          />
        )}
      </Suspense>

      {activeChatId && activeChatBooking && (
        <FloatingChat
          isOpen={!!activeChatId}
          onClose={() => {
            setActiveChatId(null);
            setActiveChatBooking(null);
          }}
          bookingId={activeChatId}
          listingTitle={activeChatBooking.listingTitle}
          senderId={user?.uid || 'admin'}
          senderName={user?.displayName || 'Anfitrión (Tú)'}
          recipientName={activeChatBooking.guestName || 'Huésped'}
          recipientId={activeChatBooking.guestId}
          isHost={true}
        />
      )}

      <GuestRequestVerificationDrawer
        booking={selectedBookingForVerification}
        isOpen={!!selectedBookingForVerification}
        onClose={() => setSelectedBookingForVerification(null)}
        onOpenChat={(booking) => {
          setActiveChatId(booking.id);
          setActiveChatBooking(booking);
        }}
        onApproveSuccess={() => setSelectedBookingForVerification(null)}
        onRejectSuccess={() => setSelectedBookingForVerification(null)}
        allBookings={bookings}
        tier={currentTier}
      />

      <DeleteConfirmationModal
        isOpen={!!listingToDelete}
        onClose={() => setListingToDelete(null)}
        onConfirm={() => listingToDelete && handleDeleteListing(listingToDelete.id)}
        itemTitle={listingToDelete?.title || ''}
      />
    </div>
  );
};

export default AdminDashboard;
