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
  arrayUnion,
  where,
} from 'firebase/firestore';
import { Booking, BookingStatus } from '@/features/bookings/types';
import { Listing } from '@/features/listings/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { ENVIRONMENTS } from '../constants/dashboard.constants';
import { Search, ShieldCheck, RefreshCcw } from 'lucide-react';
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

// v2.2 Refactored Components
import DashboardHeader, { DashboardTab } from './DashboardHeader';
import BookingList from './BookingList';
import ListingList from './ListingList';
import StatsCards from './StatsCards';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// Rule: bundle-dynamic-imports
const ListingForm = React.lazy(() => import('./ListingForm'));

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
    if (window.location.pathname === '/admin/mis-propiedades') return 'listings';
    return isAdmin ? 'bookings' : 'profile';
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'AWAITING_VERIFICATION' | 'CONFIRMED' | 'PENDING_PAYMENT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(null);
  
  // v2.2 Centralized Financial Intelligence
  const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length;
  const currentTier = (profileData?.isVerified || isAdmin) ? (confirmedCount >= 10 ? 8 : 10) : 12;

  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [isSyncConfirmOpen, setIsSyncConfirmOpen] = useState(false);

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
    }
  }, [initialListing]);

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
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement> | { files: FileList }, environmentId?: string) => {
    const listingId = editingListing?.id;
    if (!listingId || !user) return;

    const fileList = 'target' in e ? e.target.files : (e as { files: FileList }).files;
    if (!fileList || fileList.length === 0) return;
    
    // CRITICAL: Convert FileList to Array synchronously before any 'await' 
    // to prevent losing references if the input value is reset in the UI.
    const files = Array.from(fileList);

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
              const next = { ...prev, images: [...prev.images, downloadURL] };
              if (environmentId) {
                next.environmentPhotos = { ...(prev.environmentPhotos || {}), [environmentId]: downloadURL };
              }
              return next;
            });

            if (!listingId.startsWith('listing-')) {
              const updates: Record<string, string | ReturnType<typeof arrayUnion>> = {
                images: arrayUnion(downloadURL),
                updatedAt: new Date().toISOString(),
              };
              if (environmentId) {
                updates[`environmentPhotos.${environmentId}`] = downloadURL;
              }
              await updateDoc(doc(db, 'listings', listingId), updates);
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
    } catch (error) {
      toast.error('Error crítico en el proceso de subida');
    } finally {
      setIsUploading(false);
    }
  }, [user?.uid, editingListing?.id]);

  const removeImage = (index: number) => {
    setEditingListing((prev) => {
      if (!prev) return null;
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
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

      await updateDoc(doc(db, 'bookings', booking.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        statusHistory: [...(booking.statusHistory || []), historyEntry],
      });
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
      const payload: Partial<Listing> & { isPublishedFromDashboard: boolean } = { 
        ...data, 
        updatedAt: new Date().toISOString(),
        isPublishedFromDashboard: true 
      };
      if (isNew) payload.createdAt = new Date().toISOString();

      const listingRef = doc(db, 'listings', id);
      if (isNew) {
        await setDoc(listingRef, { ...payload, id });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const handleSyncListings = async () => {
    const toastId = toast.loading('Sincronizando visibilidad...');
    try {
      const { getDocs, collection, updateDoc, doc } = await import('firebase/firestore');
      const snapshot = await getDocs(collection(db, 'listings'));
      let updated = 0;
      let errors = 0;
      
      for (const lDoc of snapshot.docs) {
        const data = lDoc.data();
        if (!data.isPublishedFromDashboard) {
          try {
            // Asegurar que el documento cumple con isValidListing de firestore.rules
            const updatePayload: any = {
              isPublishedFromDashboard: true,
              updatedAt: new Date().toISOString()
            };

            // Rellenar campos críticos si faltan (para pasar isValidListing)
            if (!data.city) updatePayload.city = 'Caracas';
            if (!data.images) updatePayload.images = [];
            if (!data.maxGuests) updatePayload.maxGuests = 1;
            if (!data.description) updatePayload.description = 'Propiedad importada';
            if (!data.location) updatePayload.location = 'Ubicación no especificada';
            if (!data.pricePerNight) updatePayload.pricePerNight = 0;
            if (!data.hostId && user) updatePayload.hostId = user.uid;

            await updateDoc(doc(db, 'listings', lDoc.id), updatePayload);
            updated++;
          } catch (e) {
            console.error(`Error migrando ${lDoc.id}:`, e);
            errors++;
          }
        }
      }
      
      if (errors > 0) {
        toast.error(`Sincronización parcial: ${updated} éxito, ${errors} fallos. Verifica tus permisos de Admin.`, { id: toastId });
      } else {
        toast.success(`Sincronización completada: ${updated} listados actualizados`, { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error crítico al acceder a la base de datos', { id: toastId });
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (!isAdmin && b.ownerId !== user?.uid) return false;
      const matchesFilter = filter === 'ALL' || b.status === filter;
      const matchesSearch = b.listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.includes(searchTerm);
      return matchesFilter && matchesSearch;
    });
  }, [bookings, isAdmin, user?.uid, filter, searchTerm]);

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (!isAdmin && l.hostId !== user?.uid) return false;
      return l.title.toLowerCase().includes(searchTerm.toLowerCase()) || l.city.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [listings, isAdmin, user?.uid, searchTerm]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pt-16">
      <div className="animate-slide-up relative flex w-full flex-grow flex-col overflow-hidden bg-white shadow-2xl">
        <DashboardHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={isAdmin || false}
          isHost={isHost}
        />

        <div className="px-6 pt-6">
          <StatsCards 
            bookings={bookings} 
            listings={listings} 
            isVerified={profileData?.isVerified || false} 
            tier={currentTier}
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50/50 p-6 lg:flex-row">
          <div className="relative flex-grow">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'bookings' ? 'Buscar reservas...' : 'Buscar propiedades...'}
              className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-200 bg-white py-3 pr-4 pl-12 text-sm font-bold transition-all focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {activeTab === 'bookings' && (
            <div className="no-scrollbar flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0">
              {(['ALL', 'AWAITING_VERIFICATION', 'CONFIRMED', 'PENDING_PAYMENT'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-xl border px-4 py-2.5 text-[10px] font-black tracking-widest whitespace-nowrap uppercase transition-all',
                    filter === f ? 'bg-brand-navy border-brand-navy text-white' : 'hover:border-brand-500 hover:text-brand-navy border-gray-100 bg-white text-gray-500'
                  )}
                >
                  {f === 'ALL' ? 'Todos' : f === 'AWAITING_VERIFICATION' ? 'Por Verificar' : f === 'CONFIRMED' ? 'Confirmados' : 'Pendientes'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List Content */}
        <div className="no-scrollbar flex-grow overflow-y-auto bg-gray-50/20 p-6 md:p-8">
          <AnimatePresence mode="wait">
            {/* Herramienta de Migración Temporal - Visible para Admins y Hosts en cualquier pestaña */}
            {(isAdmin || isHost) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-8 overflow-hidden"
              >
                <div className="rounded-3xl border-2 border-dashed border-brand-500/20 bg-brand-500/5 p-6 text-center">
                  <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:text-left">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/20">
                        <RefreshCcw className="text-brand-500 h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-brand-navy text-sm font-black">¿No ves tus propiedades?</h4>
                        <p className="text-[10px] font-medium text-gray-500">
                          Usa esta utilidad para activar la visibilidad de listados antiguos en el nuevo sistema.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSyncConfirmOpen(true)}
                      className="bg-brand-navy text-white whitespace-nowrap rounded-xl px-6 py-2 text-[10px] font-black tracking-widest uppercase shadow-md hover:bg-brand-500 hover:text-brand-navy transition-all"
                    >
                      Sincronizar Visibilidad
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

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
                  isAdmin={isAdmin || false}
                  user={user}
                  handleUpdateStatus={handleUpdateStatus}
                  setActiveChatId={setActiveChatId}
                  setActiveChatBooking={setActiveChatBooking}
                  tier={currentTier}
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
                  handleDeleteListing={(id) => {
                    const listing = listings.find(l => l.id === id);
                    if (listing) setListingToDelete(listing);
                  }}
                  user={user}
                />
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

      <Suspense fallback={<div className="fixed inset-0 z-[120] bg-white/50 backdrop-blur-sm flex items-center justify-center"><Skeleton className="h-20 w-20 rounded-full" /></div>}>
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
          isOpen={true}
          bookingId={activeChatId}
          listingTitle={activeChatBooking.listingTitle}
          senderId={user?.uid || 'admin'}
          senderName={user?.displayName || 'Admin'}
          recipientName={activeChatBooking.guestName || 'Huésped'}
          onClose={() => {
            setActiveChatId(null);
            setActiveChatBooking(null);
          }}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!listingToDelete}
        onClose={() => setListingToDelete(null)}
        onConfirm={() => listingToDelete && handleDeleteListing(listingToDelete.id)}
        itemTitle={listingToDelete?.title || ''}
      />

      <ConfirmDialog
        isOpen={isSyncConfirmOpen}
        onClose={() => setIsSyncConfirmOpen(false)}
        onConfirm={handleSyncListings}
        title="Sincronizar Visibilidad"
        message="¿Deseas migrar todos los listados para asegurar su visibilidad en la nueva plataforma? Esto actualizará la base de datos."
      />
    </div>
  );
};

export default AdminDashboard;
