import { Sofa, UtensilsCrossed, Bed, BedDouble, Bath, Mountain } from 'lucide-react';

export const ENVIRONMENTS = [
  { id: 'habitacion_principal', label: 'Habitación Principal', icon: Bed },
  { id: 'sala', label: 'Sala Principal', icon: Sofa },
  { id: 'cocina', label: 'Cocina', icon: UtensilsCrossed },
  { id: 'habitacion_secundaria', label: 'Habitación Secundaria', icon: BedDouble },
  { id: 'bano', label: 'Baño', icon: Bath },
  { id: 'terraza', label: 'Terraza / Vista', icon: Mountain },
] as const;
