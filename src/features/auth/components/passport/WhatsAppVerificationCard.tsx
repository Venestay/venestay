import React, { useState } from 'react';
import { Smartphone, Check, Info, Loader2 } from 'lucide-react';
import { UserProfile } from '@/features/auth/types';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { toast } from 'sonner';

interface WhatsAppVerificationCardProps {
  profile: Partial<UserProfile> | null;
}

const COUNTRIES = [
  { code: '+58', flag: '🇻🇪', label: 'Venezuela' },
  { code: '+1', flag: '🇺🇸', label: 'USA/Canadá' },
  { code: '+57', flag: '🇨🇴', label: 'Colombia' },
  { code: '+34', flag: '🇪🇸', label: 'España' },
  { code: '+56', flag: '🇨🇱', label: 'Chile' },
  { code: '+54', flag: '🇦🇷', label: 'Argentina' },
  { code: '+52', flag: '🇲🇽', label: 'México' },
  { code: '+51', flag: '🇵🇪', label: 'Perú' },
  { code: '+55', flag: '🇧🇷', label: 'Brasil' },
  { code: '+507', flag: '🇵🇦', label: 'Panamá' },
];

export const WhatsAppVerificationCard: React.FC<WhatsAppVerificationCardProps> = ({ profile }) => {
  // Parse existing phone number
  const initialPhone = profile?.trustSignals?.whatsappNumber || profile?.phoneNumber || '';
  const matchedCountry = COUNTRIES.find(c => initialPhone.startsWith(c.code));
  const initialCode = matchedCountry ? matchedCountry.code : '+58';
  const initialLocalNumber = matchedCountry ? initialPhone.slice(matchedCountry.code.length).trim() : initialPhone;

  const [countryCode, setCountryCode] = useState(initialCode);
  const [phoneNumber, setPhoneNumber] = useState(initialLocalNumber);
  const [step, setStep] = useState<'IDLE' | 'OTP_SENT'>('IDLE');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isVerified = profile?.trustSignals?.whatsappVerified || profile?.isPhoneVerified;

  const formatPhoneNumber = () => {
    let raw = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
    if (/^\+54[1-8]\d{9}$/.test(raw)) {
      raw = raw.replace(/^\+54/, '+549');
    }
    return raw;
  };

  const handleSendOTP = async () => {
    const fullNumber = formatPhoneNumber();
    if (!phoneNumber || fullNumber.length < 10) {
      toast.error('Por favor, ingresa un número de teléfono válido.');
      return;
    }
    
    setIsLoading(true);
    try {
      let usedLocal = false;
      if (import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_TWILIO_SERVER === 'true') {
        try {
          const response = await fetch('http://localhost:3001/api/send-whatsapp-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { phoneNumber: fullNumber } })
          });
          const resData = await response.json();
          if (!response.ok || resData.error) {
            throw new Error(resData.error?.message || 'Error al enviar OTP desde servidor local.');
          }
          usedLocal = true;
        } catch (localErr: unknown) {
          if (localErr instanceof TypeError || (localErr instanceof Error && localErr.message.toLowerCase().includes('fetch'))) {
            console.warn('[WhatsApp verification] Servidor local Twilio (3001) apagado, conectando a Cloud Function en NUBE...');
          } else {
            throw localErr;
          }
        }
      }
      if (!usedLocal) {
        const sendOTP = httpsCallable(functions, 'sendWhatsAppOTP');
        await sendOTP({ phoneNumber: fullNumber });
      }
      setStep('OTP_SENT');
      toast.success('Código OTP enviado por WhatsApp.');
    } catch (error: unknown) {
      console.error('Error sending OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar OTP.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOTP = async () => {
    const fullNumber = formatPhoneNumber();
    if (!otp || otp.length !== 6) {
      toast.error('Por favor, ingresa el código de 6 dígitos.');
      return;
    }

    setIsLoading(true);
    try {
      let usedLocal = false;
      if (import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_TWILIO_SERVER === 'true') {
        try {
          const response = await fetch('http://localhost:3001/api/confirm-whatsapp-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { phoneNumber: fullNumber, code: otp, uid: profile?.uid } })
          });
          const resData = await response.json();
          if (!response.ok || resData.error) {
            throw new Error(resData.error?.message || 'Error al confirmar OTP desde servidor local.');
          }
          usedLocal = true;
        } catch (localErr: unknown) {
          if (localErr instanceof TypeError || (localErr instanceof Error && localErr.message.toLowerCase().includes('fetch'))) {
            console.warn('[WhatsApp verification] Servidor local Twilio (3001) apagado, conectando a Cloud Function en NUBE...');
          } else {
            throw localErr;
          }
        }
      }
      if (!usedLocal) {
        const confirmOTP = httpsCallable(functions, 'confirmWhatsAppOTP');
        await confirmOTP({ phoneNumber: fullNumber, code: otp });
      }
      toast.success('¡Número de WhatsApp verificado con éxito!');
      // El backend actualizará el documento del usuario, lo cual refrescará el perfil
      setStep('IDLE');
    } catch (error: unknown) {
      console.error('Error confirming OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al confirmar OTP. Verifica que el código sea correcto.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-brand-navy">WhatsApp / Teléfono</p>
            {isVerified ? (
              <p className="text-xs text-gray-600 font-medium">{profile?.trustSignals?.whatsappNumber || profile?.phoneNumber || 'Número verificado'}</p>
            ) : (
              <p className="text-xs text-gray-500 font-medium">Verifica tu número para reservar</p>
            )}
          </div>
        </div>
        {isVerified ? (
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
            <Check className="h-3 w-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Verificado</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-brand-500 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100">
            <Info className="h-3 w-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Pendiente</span>
          </div>
        )}
      </div>

      {!isVerified && (
        <div className="mt-2 space-y-4 rounded-xl bg-gray-50 p-4 border border-gray-100">
          {step === 'IDLE' ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-navy">
                  Número de WhatsApp
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center rounded-lg border border-gray-200 bg-white px-2 focus-within:border-brand-500 overflow-hidden">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer py-2 pr-1"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <div className="h-4 w-px bg-gray-200 mx-1"></div>
                    <input
                      type="tel"
                      placeholder="412 1234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-transparent py-2 px-2 text-sm focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSendOTP}
                    disabled={isLoading}
                    className="flex min-w-[100px] items-center justify-center rounded-lg bg-brand-navy px-4 py-2 text-xs font-black tracking-widest text-white uppercase transition-colors hover:bg-brand-navy/90 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar OTP'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-navy">
                  Código de 6 dígitos
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm tracking-widest focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    onClick={handleConfirmOTP}
                    disabled={isLoading}
                    className="flex min-w-[100px] items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-xs font-black tracking-widest text-brand-navy uppercase transition-colors hover:bg-brand-400 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar'}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setStep('IDLE')}
                className="text-[10px] font-bold text-gray-400 hover:text-gray-600 underline"
              >
                Cambiar número
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
