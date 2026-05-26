import { useState, useEffect } from 'react';

interface UseBookingPanelCollapseReturn {
  isExpanded: boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
}

export function useBookingPanelCollapse(listingId: string): UseBookingPanelCollapseReturn {
  const key = `venestay_booking_panel_${listingId}`;
  
  // Default: expanded (true). Lee sessionStorage al montar.
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  // Persiste en sessionStorage en cada cambio
  useEffect(() => {
    try {
      sessionStorage.setItem(key, String(isExpanded));
    } catch {
      // noop
    }
  }, [isExpanded, key]);

  const toggle = () => setIsExpanded((prev) => !prev);
  const expand = () => setIsExpanded(true);
  const collapse = () => setIsExpanded(false);

  return { isExpanded, toggle, expand, collapse };
}
