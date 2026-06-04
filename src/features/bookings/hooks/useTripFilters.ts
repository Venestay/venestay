import { useState, useEffect, useMemo } from 'react';
import { Booking } from '@/types';

export interface TripFiltersResult {
  activeTab: 'activos' | 'historial';
  setActiveTab: (tab: 'activos' | 'historial') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredBookings: Booking[];
  activosCount: number;
  historialCount: number;
}

const ACTIVOS_HOURS = 48;
const TERMINAL_STATUSES = ['REJECTED', 'EXPIRED', 'CANCELLED_BY_GUEST', 'CANCELLED'] as const;
type TerminalStatus = typeof TERMINAL_STATUSES[number];

export function useTripFilters(
  bookings: Booking[],
  unreadChatMap: Record<string, boolean>
): TripFiltersResult {
  const [activeTab, setActiveTabState] = useState<'activos' | 'historial'>(() => {
    const saved = sessionStorage.getItem('mytrips_active_tab');
    return (saved === 'activos' || saved === 'historial') ? saved : 'activos';
  });

  const [searchQuery, setSearchQuery] = useState('');

  const setActiveTab = (tab: 'activos' | 'historial') => {
    setActiveTabState(tab);
    sessionStorage.setItem('mytrips_active_tab', tab);
  };

  const { classifiedActivos, classifiedHistorial } = useMemo(() => {
    const now = Date.now();
    const threshold48h = ACTIVOS_HOURS * 60 * 60 * 1000;
    const activos: Booking[] = [];
    const historial: Booking[] = [];

    bookings.forEach((booking) => {
      const status = booking.status as string;
      const hasUnreadChat = !!unreadChatMap[booking.id];

      // CONFIRMED bookings whose end date has passed are past check-in/completed
      const isCompletedConfirmed =
        status === 'CONFIRMED' &&
        booking.endDate &&
        new Date(booking.endDate).getTime() < new Date().setHours(0, 0, 0, 0);

      const isTerminal = TERMINAL_STATUSES.includes(status as TerminalStatus) || isCompletedConfirmed;

      if (hasUnreadChat) {
        activos.push(booking);
        return;
      }

      if (isTerminal) {
        const updatedRaw =
          (booking as unknown as { updatedAt?: string | { seconds: number } }).updatedAt ||
          (booking as unknown as { createdAt?: string | { seconds: number } }).createdAt;

        let updatedMs: number | null = null;
        if (typeof updatedRaw === 'string') {
          const d = new Date(updatedRaw);
          if (!isNaN(d.getTime())) updatedMs = d.getTime();
        } else if (updatedRaw && typeof (updatedRaw as { seconds: number }).seconds === 'number') {
          updatedMs = (updatedRaw as { seconds: number }).seconds * 1000;
        }

        const isRecent = updatedMs !== null && (now - updatedMs) < threshold48h;
        if (isRecent) {
          activos.push(booking);
        } else {
          historial.push(booking);
        }
      } else {
        activos.push(booking);
      }
    });

    return { classifiedActivos: activos, classifiedHistorial: historial };
  }, [bookings, unreadChatMap]);

  const filteredBookings = useMemo(() => {
    const targetGroup = activeTab === 'activos' ? classifiedActivos : classifiedHistorial;
    if (!searchQuery.trim()) return targetGroup;

    const query = searchQuery.toLowerCase().trim();
    return targetGroup.filter((booking) => {
      const titleMatch = booking.listingTitle?.toLowerCase().includes(query);
      const refMatch = booking.id?.toLowerCase().endsWith(query) || booking.id?.toLowerCase().includes(query);
      return titleMatch || refMatch;
    });
  }, [activeTab, classifiedActivos, classifiedHistorial, searchQuery]);

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredBookings,
    activosCount: classifiedActivos.length,
    historialCount: classifiedHistorial.length,
  };
}
