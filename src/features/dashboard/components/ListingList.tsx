import React, { useState } from 'react';
import { MapPin, Edit2, Trash2, Plus } from 'lucide-react';
import { Listing } from '@/types';

interface ListingListProps {
  listings: Listing[];
  setEditingListing: (listing: Listing | null) => void;
  handleDeleteListing: (id: string) => Promise<void>;
  handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement> | { files: FileList }, environmentId?: string) => Promise<void>;
  user: { uid?: string; displayName?: string; photoURL?: string } | null;
}

const ListingList: React.FC<ListingListProps> = ({
  listings,
  setEditingListing,
  handleDeleteListing,
  user,
}) => {
  const [now] = useState(() => Date.now());

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="flex flex-col overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-sm"
        >
          <div className="relative aspect-video overflow-hidden">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="text-brand-navy rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase shadow-sm backdrop-blur-sm">
                {listing.city}
              </span>
              {listing.createdAt && (now - new Date(listing.createdAt).getTime() < 24 * 60 * 60 * 1000) && (
                <span className="flex items-center gap-1 bg-red-500/90 text-white rounded-full px-2.5 py-1 text-[8px] font-black uppercase shadow-sm backdrop-blur-sm tracking-widest animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-white block" />
                  Nuevo
                </span>
              )}
            </div>
          </div>
          <div className="flex grow flex-col p-6">
            <div className="mb-2 flex items-start justify-between">
              <h4 className="text-brand-navy line-clamp-1 text-lg leading-tight font-black">
                {listing.title}
              </h4>
              <span className="text-brand-500 font-black">
                ${listing.pricePerNight}
              </span>
            </div>
            <p className="mb-4 line-clamp-2 text-xs text-gray-400">
              {listing.description}
            </p>

            <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-6">
              <div className="flex items-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                <MapPin className="mr-1 h-3 w-3" />
                {listing.location.split(',')[0]}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingListing(listing)}
                  className="bg-brand-navy hover:bg-brand-500 flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-[10px] font-black tracking-widest text-white uppercase transition-colors"
                >
                  <Edit2 className="h-3 w-3" /> Editar
                </button>
                <button
                  onClick={() => handleDeleteListing(listing.id)}
                  className="flex items-center justify-center rounded-xl bg-gray-50 p-2.5 text-red-500 transition-colors hover:bg-red-50"
                  title="Eliminar propiedad"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={() => {
          localStorage.removeItem('venestay_draft_listing');
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
            isPetFriendly: false,
            images: [],
            amenities: ['WiFi', 'Estacionamiento'],
            maxGuests: 2,
            bedrooms: 1,
            beds: 1,
            baths: 1,
            hostName: user?.displayName || 'Admin',
            hostAvatar:
              user?.photoURL || 'https://i.pravatar.cc/150?u=admin',
            hostId: user?.uid || 'admin',
            blockedDates: [],
            paymentInstructions: '',
            minNights: 2,
            maxNights: 30,
            propertyType: 'Apartamento',
            accommodationType: 'Alojamiento entero',
            buildingFloors: 1,
            propertyFloor: 0,
            constructionYear: new Date().getFullYear(),
            environmentPhotos: {},
          });
        }}
        className="hover:border-brand-500 hover:bg-brand-500/5 hover:text-brand-500 flex flex-col items-center justify-center gap-4 rounded-[32px] border-2 border-dashed border-gray-200 p-8 text-gray-400 transition-all"
      >
        <Plus className="h-8 w-8" />
        <span className="text-[10px] font-black tracking-widest uppercase">
          Añadir Propiedad
        </span>
      </button>
    </div>
  );
};

export default ListingList;
