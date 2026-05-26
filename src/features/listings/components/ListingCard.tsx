import React from 'react';
import { Listing } from '@/types';
import { Star, Heart, CheckCircle2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useBcvRate } from '../hooks/useBcvRate';

interface ListingCardProps {
  listing: Listing;
  onClick: (listing: Listing) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const { bcvRate } = useBcvRate();

  return (
    <Link
      to={`/?listingId=${listing.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group animate-fade-in block flex cursor-pointer flex-col space-y-3"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl">
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute top-4 right-4 z-10 rounded-full bg-white/20 p-2 text-white shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-red-500"
        >
          <Heart className="h-4 w-4" />
        </button>

        <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2">
          <div className="flex items-center gap-1 rounded-md bg-orange-50/90 px-2 py-1 text-[11px] font-semibold text-orange-700 shadow-sm backdrop-blur-sm sm:text-xs">
            <span>🔥</span> Muy solicitado: Pocas fechas disponibles
          </div>
          {listing.isVerified && (
            <div className="bg-brand-navy/80 animate-slide-up flex items-center rounded-md border border-white/20 px-2 py-1 shadow-md backdrop-blur-md">
              <CheckCircle2 className="text-brand-500 mr-1 h-3 w-3" />
              <span className="text-[9px] font-black tracking-widest text-white uppercase">
                Verificado
              </span>
            </div>
          )}
        </div>

        <div className="absolute right-4 bottom-4 left-4 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(`/?listingId=${listing.id}`, '_blank');
            }}
            className="text-brand-navy w-full rounded-xl bg-white py-3 text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl transition-transform active:scale-95"
          >
            Explorar Estancia
          </button>
        </div>
      </div>

      <div className="flex flex-col space-y-1.5 px-1">
        <div className="flex items-start justify-between">
          <h3 className="text-brand-navy line-clamp-1 text-lg leading-tight font-black tracking-tight" title={listing.title}>
            {listing.title}
          </h3>
        </div>

        <div className="flex flex-col space-y-1">
          <div className="flex items-center text-sm font-medium text-gray-600">
            <Star className="text-brand-500 fill-brand-500 mr-1 h-4 w-4" />
            <span>
              {listing.rating} ({listing.reviewsCount}{' '}
              evaluaciones)
            </span>
          </div>
          <div className="mt-1 flex items-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
            <MapPin className="text-brand-500 mr-1 h-2.5 w-2.5" />
            <span>{listing.city}</span>
          </div>
        </div>

        <p className="text-[11px] font-semibold text-gray-400">
          {listing.bedrooms} hab · {listing.beds} camas ·{' '}
          <span className="text-brand-navy/60">
            {listing.isPetFriendly ? 'Pet Friendly' : 'No Pets'}
          </span>
        </p>

        <div className="flex flex-col pt-2">
          <div className="flex items-baseline space-x-1">
            <span className="text-brand-navy text-2xl font-black">
              ${listing.pricePerNight}
            </span>
            <span className="text-[11px] font-bold text-gray-500">
              / noche (Anticipo 20%)
            </span>
          </div>
          <div className="text-brand-500 mt-0.5 text-[10px] font-black tracking-widest uppercase">
            ≈{' '}
            {(listing.pricePerNight * bcvRate).toLocaleString('es-VE', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}{' '}
            Bs. <span className="font-medium opacity-50">(Tasa BCV)</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;






