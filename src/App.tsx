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

// 🚀 CODE SPLITTING: Lazy Load de componentes pesados
const AdminDashboard = lazy(
  () => import('@/features/dashboard/components/AdminDashboard')
);
const CheckoutPage = lazy(
  () => import('@/features/bookings/components/checkout/CheckoutPage')
);
const HostGuide = lazy(() => import('@/pages/HostGuide'));
const ListingDetail = lazy(() => import('@/features/listings/components/ListingDetail'));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  useBookingManager();
  useDatabaseSeeder();

  return (
    <ErrorBoundary>
      <BrowserRouter>
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
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/nueva-propiedad"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/mis-propiedades"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/:bookingId" element={<CheckoutPage />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;






