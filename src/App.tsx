import React, { Suspense, lazy, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import Home from '@/pages/Home';
import { Toaster } from 'sonner';
import { useBookingManager } from '@/features/bookings/hooks/use-booking-manager';
import { useDatabaseSeeder } from '@/lib/hooks/use-database-seeder';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ChatNotificationProvider } from '@/features/bookings/hooks/useChatNotifications';
import AuthGuard from '@/features/auth/components/AuthGuard';

// 🚀 CODE SPLITTING: Lazy Load de componentes pesados
const AdminDashboard = lazy(
  () => import('@/features/dashboard/components/AdminDashboard')
);
const CheckoutPage = lazy(
  () => import('@/features/bookings/components/checkout/CheckoutPage')
);
const HostGuide = lazy(() => import('@/pages/HostGuide'));
const ListingDetail = lazy(() => import('@/features/listings/components/ListingDetail'));
const ProfileSettings = lazy(() => import('@/features/auth/components/ProfileSettings'));
const MyTrips = lazy(() => import('@/features/bookings/components/MyTrips'));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  useBookingManager();
  useDatabaseSeeder();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ChatNotificationProvider>
        <ScrollToTop />
      <Suspense
        fallback={
          <div className="flex min-h-screen flex-col items-center justify-center bg-brand-navy p-6 text-center">
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-brand-500/10 shadow-inner">
              <div className="absolute inset-0 rounded-2xl border border-brand-500/20 animate-ping opacity-75"></div>
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host-guide" element={<HostGuide />} />
          <Route
            path="/publicar-espacio"
            element={
              <AuthGuard>
                <AdminDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/nueva-propiedad"
            element={
              <AuthGuard>
                <AdminDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/mis-propiedades"
            element={
              <AuthGuard>
                <AdminDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <AdminDashboard />
              </AuthGuard>
            }
          />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/:bookingId" element={<CheckoutPage />} />
          <Route
            path="/mi-pasaporte"
            element={
              <AuthGuard>
                <ProfileSettings />
              </AuthGuard>
            }
          />
          <Route
            path="/mis-viajes"
            element={
              <AuthGuard>
                <MyTrips />
              </AuthGuard>
            }
          />
        </Routes>
      </Suspense>
      <Toaster position="top-right" richColors />
      </ChatNotificationProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;






