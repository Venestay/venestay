import React, { createContext, useContext, ReactNode } from 'react';
import { Listing } from '@/types';
import { useListingValidation } from '../hooks/useListingValidation';

interface ListingFormContextValue {
  editingListing: Listing;
  setEditingListing: React.Dispatch<React.SetStateAction<Listing | null>>;
  validation: ReturnType<typeof useListingValidation>;
  isSaving: boolean;
  isUploading: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement> | { files: FileList }, environmentId?: string) => Promise<void>;
  removeImage: (index: number) => void;
  isLoaded: boolean;
  LECHERIA_CENTER: { lat: number; lng: number };
  DEFAULT_MAP_OPTIONS: google.maps.MapOptions;
}

const ListingFormContext = createContext<ListingFormContextValue | undefined>(undefined);

export const useListingForm = () => {
  const context = useContext(ListingFormContext);
  if (!context) {
    throw new Error('useListingForm must be used within a ListingFormProvider');
  }
  return context;
};

interface ListingFormProviderProps extends Omit<ListingFormContextValue, 'validation'> {
  children: ReactNode;
  validation: ReturnType<typeof useListingValidation>;
}

export const ListingFormProvider: React.FC<ListingFormProviderProps> = ({ children, ...props }) => {
  return (
    <ListingFormContext.Provider value={props}>
      {children}
    </ListingFormContext.Provider>
  );
};
