import React, { Suspense, lazy, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/AuthContext';
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
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="border-brand-500 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"></div>
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






