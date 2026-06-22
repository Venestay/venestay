import React from 'react';
import { UserProfile } from '@/types';
import { Star, MessageCircle, Clock, Heart, Globe, MapPin, Languages, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';

interface HostContactCardProps {
  hostProfile: UserProfile | null;
  hostName: string;
  hostAvatar: string;
  loadingHost: boolean;
}

export const HostContactCard: React.FC<HostContactCardProps> = ({
  hostProfile,
  hostName,
  hostAvatar,
  loadingHost,
}) => {
  return (
    <div className="group relative border-y border-gray-100/60 py-10 md:py-12">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-transform duration-700 group-hover:scale-110">
        <ShieldCheck className="text-brand-navy h-32 w-32" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 md:flex-row md:items-start">
        <div className="relative">
          <div className="relative h-32 w-32 overflow-hidden rounded-[32px] border-2 border-gray-100 bg-gray-50">
            {loadingHost ? (
              <Skeleton className="h-full w-full rounded-none" />
            ) : (
              <img
                src={hostProfile?.photoURL || hostAvatar}
                alt={hostProfile?.displayName || hostName}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          {!loadingHost && (
            <div className="bg-brand-500 text-brand-navy absolute -right-2 -bottom-2 rounded-xl border-2 border-white p-2">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="w-full grow space-y-6 text-center md:text-left">
          {loadingHost ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <h3 className="text-brand-navy text-3xl font-black tracking-tight">
                    Conoce a {hostProfile?.displayName?.split(' ')[0] || hostName.split(' ')[0]}
                  </h3>
                  <div className="flex gap-2">
                    <span className="bg-brand-navy text-brand-500 border-brand-navy rounded-lg border px-3 py-1 text-[9px] font-black tracking-widest uppercase">
                      Superanfitrión
                    </span>
                    {hostProfile?.isIdentityVerified && (
                      <span className="bg-emerald-500 text-white rounded-lg px-3 py-1 text-[9px] font-black tracking-widest uppercase flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                        <ShieldCheck className="h-3 w-3" />
                        Pasaporte Verificado
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-4 text-[10px] font-black tracking-widest text-gray-400 uppercase md:justify-start">
                  <span className="flex items-center gap-1.5">
                    <Star className="text-brand-500 fill-brand-500 h-3 w-3" /> 4.95 Rating
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="text-brand-500 h-3 w-3" /> {hostProfile?.responseRate || '100%'} Respuesta
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="text-brand-500 h-3 w-3" /> {hostProfile?.responseTime || 'Pocos minutos'}
                  </span>
                </div>
              </div>

              {hostProfile?.about && (
                <p className="line-clamp-3 text-sm leading-relaxed font-medium text-gray-500 italic md:line-clamp-none">
                  "{hostProfile.about}"
                </p>
              )}
            </>
          )}

          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
            {hostProfile?.languages && (
              <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/60 p-3">
                <Languages className="text-brand-500 h-4 w-4" />
                <div>
                  <p className="mb-1 text-[8px] leading-none font-black tracking-widest text-gray-400 uppercase">
                    Idiomas
                  </p>
                  <p className="text-brand-navy text-xs leading-none font-bold">
                    {hostProfile.languages}
                  </p>
                </div>
              </div>
            )}
            {hostProfile?.location && (
              <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/60 p-3">
                <MapPin className="text-brand-500 h-4 w-4" />
                <div>
                  <p className="mb-1 text-[8px] leading-none font-black tracking-widest text-gray-400 uppercase">
                    Ubicación
                  </p>
                  <p className="text-brand-navy text-xs leading-none font-bold">
                    {hostProfile.location}
                  </p>
                </div>
              </div>
            )}
          </div>

          {hostProfile?.interests && (
            <div className="flex flex-wrap justify-center gap-2 pt-2 md:justify-start">
              {hostProfile.interests.split(',').map((interest, i) => (
                <span
                  key={i}
                  className="text-brand-navy/60 flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-3 py-1 text-[9px] font-black tracking-widest uppercase shadow-sm"
                >
                  <Heart className="text-brand-500 h-2.5 w-2.5" /> {interest.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostContactCard;
