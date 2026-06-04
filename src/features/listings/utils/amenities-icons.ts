import { 
  Wifi, 
  Wind, 
  Tv, 
  ChefHat, 
  Microwave, 
  Flame, 
  Droplets, 
  Sparkles, 
  Waves, 
  Zap, 
  Database, 
  Sun, 
  Anchor, 
  Ship, 
  Dumbbell, 
  Car, 
  Key, 
  Shield, 
  ShieldAlert, 
  HeartPulse,
  HelpCircle,
  Tv2,
  Cigarette,
  CigaretteOff,
  PartyPopper,
  VolumeX,
  Clock,
  LogOut,
  ChevronRight,
  PawPrint
} from 'lucide-react';
import React from 'react';

export const AMENITIES_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'WiFi': Wifi,
  'A/A': Wind,
  'TV': Tv,
  'Smart TV': Tv2,
  'Cocina equipada': ChefHat,
  'Electrodomésticos': Microwave,
  'Calentador de agua': Flame,
  'Purificador de Agua': Droplets,
  'Lavadora': Sparkles,
  'Secadora': Wind,
  'Piscina': Waves,
  'Planta Eléctrica': Zap,
  'Tanque de Agua': Database,
  'Vista al Mar': Sun,
  'Muelle Privado / Acceso al Canal': Anchor,
  'Parrillera / BBQ (a Gas o Carbón)': Flame,
  'Kayak / Paddle Board incluido': Ship,
  'Gimnasio': Dumbbell,
  'Estacionamiento': Car,
  'Cerradura Inteligente': Key,
  'Elementos de seguridad': Shield,
  'Extintor de incendios': ShieldAlert,
  'Botiquín de primeros auxilios': HeartPulse,
};

export const HOUSE_RULES_ICONS = {
  smokingAllowed:   { icon: Cigarette,    label: 'Se permite fumar' },
  smokingForbidden: { icon: CigaretteOff, label: 'No fumar' },
  eventsAllowed:    { icon: PartyPopper,  label: 'Fiestas permitidas' },
  eventsForbidden:  { icon: VolumeX,      label: 'No fiestas ni eventos' },
  petsAllowed:      { icon: PawPrint,     label: 'Se admiten mascotas' },
  petsForbidden:    { icon: HelpCircle,   label: 'No se admiten mascotas' }, // Standard check fallback
  checkIn:          { icon: Clock,        label: 'Check-in' },
  checkOut:         { icon: LogOut,       label: 'Check-out' },
  rule:             { icon: ChevronRight, label: 'Norma' },
};

export function getAmenityIcon(amenityName: string) {
  return AMENITIES_ICONS[amenityName] || HelpCircle;
}

