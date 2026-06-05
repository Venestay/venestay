export const AMENITY_CATEGORIES: Record<string, string[]> = {
  'Esenciales': ['Wifi', 'A/A', 'Agua', 'Luz', 'Planta eléctrica', 'Pozo de agua', 'Calentador de agua', 'Purificador de Agua'],
  'Relax': ['Piscina', 'BBQ', 'Piscina infinita', 'Jacuzzi', 'Terraza', 'Parrillera / BBQ', 'Kayak / Paddle Board'],
  'Acceso y Seguridad': ['Estacionamiento', 'Seguridad privada', 'Seguridad 24/7', 'Muelle', 'Muelle Privado', 'Muelle Privado / Acceso al Canal', 'Cerradura Inteligente'],
  'Cocina y Hogar': ['Cocina equipada', 'Desayuno incluido', 'Tv por cable', 'Smart TV', 'Electrodomésticos', 'Lavadora', 'Secadora'],
  'Conectividad': ['Wifi Fibra', 'Gimnasio'],
};

export function categorizeAmenities(amenities: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const categorized = new Set<string>();
  
  for (const [cat, keywords] of Object.entries(AMENITY_CATEGORIES)) {
    const matches = amenities.filter(a => keywords.some(k => a.toLowerCase().includes(k.toLowerCase())));
    if (matches.length) {
      result[cat] = matches;
      matches.forEach(m => categorized.add(m));
    }
  }
  
  const uncategorized = amenities.filter(a => !categorized.has(a));
  if (uncategorized.length) {
    result['Otros'] = uncategorized;
  }
  
  return result;
}
