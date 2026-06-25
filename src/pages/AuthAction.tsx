import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthAction } from '@/features/auth/hooks/useAuthAction';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export const AuthAction: React.FC = () => {
  const { mode, state, errorMessage, isPasswordResetValid, handlePasswordReset } = useAuthAction();
  const [newPassword, setNewPassword] = useState('');

  const renderContent = () => {
    if (state === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 text-navy-600 animate-spin" />
          <p className="text-navy-800 font-medium text-lg">Procesando solicitud...</p>
        </div>
      );
    }

    if (state === 'success') {
      return (
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <div>
            <h2 className="text-2xl font-bold text-navy-900 mb-2">
              {mode === 'verifyEmail' ? '¡Correo Verificado!' : '¡Contraseña Actualizada!'}
            </h2>
            <p className="text-gray-600">
              {mode === 'verifyEmail' 
                ? 'Tu dirección de correo electrónico ha sido verificada exitosamente.'
                : 'Tu contraseña ha sido actualizada. Ya puedes usarla para iniciar sesión.'}
            </p>
          </div>
          <Link 
            to="/" 
            className="w-full sm:w-auto px-8 py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors font-medium"
          >
            Ir al inicio
          </Link>
        </div>
      );
    }

    if (state === 'error') {
      return (
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <XCircle className="h-16 w-16 text-red-500" />
          <div>
            <h2 className="text-2xl font-bold text-navy-900 mb-2">Error en la verificación</h2>
            <p className="text-gray-600">{errorMessage}</p>
          </div>
          <Link 
            to="/" 
            className="w-full sm:w-auto px-8 py-3 bg-navy-100 text-navy-900 rounded-lg hover:bg-navy-200 transition-colors font-medium"
          >
            Volver al inicio
          </Link>
        </div>
      );
    }

    if (mode === 'resetPassword' && isPasswordResetValid) {
      return (
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-navy-900">Nueva Contraseña</h2>
            <p className="text-gray-600 text-sm mt-2">Ingresa tu nueva contraseña para la cuenta.</p>
          </div>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handlePasswordReset(newPassword);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <button
              type="submit"
              disabled={newPassword.length < 6}
              className="w-full bg-gold-500 text-navy-900 py-3 rounded-lg font-semibold hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Restablecer Contraseña
            </button>
          </form>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold text-navy-900 tracking-tight">Vene<span className="text-gold-500">Stay</span></span>
          </Link>
        </div>
        
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AuthAction;
