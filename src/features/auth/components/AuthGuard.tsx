import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { Shield } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-navy p-6 text-center">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-brand-500/10 shadow-inner">
          {/* Pulsing Outer Rings */}
          <div className="absolute inset-0 rounded-3xl border border-brand-500/20 animate-ping opacity-75"></div>
          {/* Icon */}
          <Shield className="h-10 w-10 text-brand-500 animate-pulse" />
        </div>
        
        {/* Skeleton lines representing loading text */}
        <div className="space-y-3 w-48 mx-auto">
          <div className="h-4 bg-white/10 rounded-full animate-pulse w-3/4 mx-auto"></div>
          <div className="h-3 bg-white/5 rounded-full animate-pulse w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
