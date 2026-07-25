import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getReservedDates } from '@/services/booking-service';
import { clearListingCalendar } from '@/services/listing-service';
import { Listing } from '@/features/listings/types';
import { z } from 'zod';
import { toast } from 'sonner';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido');

const BlockRangeSchema = z.object({
  startDate: DateStringSchema,
  endDate: DateStringSchema,
}).refine(
  ({ startDate, endDate }) => startDate <= endDate,
  { message: 'La fecha de inicio no puede ser posterior a la fecha de fin' }
);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CalendarDayState {
  date: string;         // 'YYYY-MM-DD'
  isBlocked: boolean;   // en blockedDates del listing (bloqueo manual)
  isReserved: boolean;  // tiene booking activo (solo lectura)
  isSelected: boolean;  // parte del rango en curso de selección
  isInRange: boolean;   // entre rangeStart y rangeEnd (highlight visual)
  isCurrentMonth: boolean;
  dayOfMonth: number;
}

export interface UseHostCalendarReturn {
  days: CalendarDayState[];
  currentMonth: Date;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  rangeStart: string | null;
  rangeEnd: string | null;
  handleDayClick: (dateStr: string) => void;
  blockSelectedRange: () => Promise<void>;
  clearAll: () => Promise<void>;
  resetRange: () => void;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toDateStr = (d: Date): string => d.toISOString().split('T')[0];

const getDaysInRange = (start: string, end: string): string[] => {
  const result: string[] = [];
  const current = new Date(start + 'T12:00:00');
  const last = new Date(end + 'T12:00:00');
  while (current <= last) {
    result.push(toDateStr(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
};

const buildMonthDays = (
  month: Date,
  blockedDates: Set<string>,
  reservedDates: Set<string>,
  rangeStart: string | null,
  rangeEnd: string | null
): CalendarDayState[] => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  // First day of month, then pad to Monday
  const firstDay = new Date(year, monthIndex, 1);
  // Adjust: JS getDay() = 0 (Sun)..6 (Sat), we want Mon=0
  const startPad = (firstDay.getDay() + 6) % 7;

  const lastDay = new Date(year, monthIndex + 1, 0);
  const endPad = (7 - (lastDay.getDay() + 6) % 7 - 1) % 7;

  const days: CalendarDayState[] = [];

  // Previous month padding
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, monthIndex, -i);
    const dateStr = toDateStr(d);
    days.push({
      date: dateStr,
      isBlocked: false,
      isReserved: false,
      isSelected: false,
      isInRange: false,
      isCurrentMonth: false,
      dayOfMonth: d.getDate(),
    });
  }

  // Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, monthIndex, day);
    const dateStr = toDateStr(d);

    const inRange =
      rangeStart !== null && rangeEnd !== null
        ? dateStr >= rangeStart && dateStr <= rangeEnd
        : rangeStart !== null
          ? dateStr === rangeStart
          : false;

    days.push({
      date: dateStr,
      isBlocked: blockedDates.has(dateStr),
      isReserved: reservedDates.has(dateStr),
      isSelected: dateStr === rangeStart || dateStr === rangeEnd,
      isInRange: inRange,
      isCurrentMonth: true,
      dayOfMonth: day,
    });
  }

  // Next month padding
  for (let i = 1; i <= endPad; i++) {
    const d = new Date(year, monthIndex + 1, i);
    const dateStr = toDateStr(d);
    days.push({
      date: dateStr,
      isBlocked: false,
      isReserved: false,
      isSelected: false,
      isInRange: false,
      isCurrentMonth: false,
      dayOfMonth: d.getDate(),
    });
  }

  return days;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useHostCalendar = (listing: Listing): UseHostCalendarReturn => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [reservedDates, setReservedDates] = useState<Set<string>>(new Set());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(
    new Set(listing.blockedDates ?? [])
  );
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync blockedDates if the listing prop changes (reactive re-open)
  useEffect(() => {
    setBlockedDates(new Set(listing.blockedDates ?? []));
  }, [listing.blockedDates]);

  // Load reserved dates from Firestore bookings
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getReservedDates(listing.id)
      .then((ranges) => {
        if (cancelled) return;
        const set = new Set<string>();
        ranges.forEach(({ start, end }) => {
          const startStr = toDateStr(start);
          const endStr = toDateStr(end);
          getDaysInRange(startStr, endStr).forEach((d) => set.add(d));
        });
        setReservedDates(set);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('useHostCalendar: Error cargando reservas', err);
        setErrorMessage('No se pudieron cargar las reservas activas.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [listing.id]);

  const days = useMemo(
    () => buildMonthDays(currentMonth, blockedDates, reservedDates, rangeStart, rangeEnd),
    [currentMonth, blockedDates, reservedDates, rangeStart, rangeEnd]
  );

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleDayClick = useCallback((dateStr: string) => {
    // Día reservado → no hacer nada
    if (reservedDates.has(dateStr)) return;

    setRangeStart((prevStart) => {
      if (prevStart === null) {
        setRangeEnd(null);
        return dateStr;
      }
      if (rangeEnd !== null) {
        // Reiniciar selección
        setRangeEnd(null);
        return dateStr;
      }
      // Segunda selección
      if (dateStr >= prevStart) {
        setRangeEnd(dateStr);
        return prevStart;
      } else {
        // Seleccionó antes del inicio → resetear
        setRangeEnd(null);
        return dateStr;
      }
    });
  }, [reservedDates, rangeEnd]);

  const resetRange = useCallback(() => {
    setRangeStart(null);
    setRangeEnd(null);
  }, []);

  const blockSelectedRange = useCallback(async () => {
    const validation = BlockRangeSchema.safeParse({
      startDate: rangeStart,
      endDate: rangeEnd,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    const { startDate, endDate } = validation.data;
    const newDays = getDaysInRange(startDate, endDate);
    const merged = new Set([...blockedDates, ...newDays]);

    setIsSaving(true);
    try {
      const docRef = doc(db, 'listings', listing.id);
      await updateDoc(docRef, { blockedDates: [...merged] });
      setBlockedDates(merged);
      setRangeStart(null);
      setRangeEnd(null);
      toast.success(`${newDays.length} día${newDays.length !== 1 ? 's' : ''} bloqueado${newDays.length !== 1 ? 's' : ''} correctamente`, {
        description: `Del ${startDate} al ${endDate}`,
        style: { background: '#0b1120', color: '#c5a059', border: '1px solid #c5a059' },
      });
    } catch (err) {
      console.error('useHostCalendar: Error guardando bloqueo', err);
      toast.error('Error al guardar el bloqueo. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }, [rangeStart, rangeEnd, blockedDates, listing.id]);

  const clearAll = useCallback(async () => {
    setIsSaving(true);
    try {
      await clearListingCalendar(listing.id);
      setBlockedDates(new Set());
      setRangeStart(null);
      setRangeEnd(null);
      toast.success('Todos los bloqueos manuales eliminados', {
        style: { background: '#0b1120', color: '#c5a059', border: '1px solid #c5a059' },
      });
    } catch (err) {
      console.error('useHostCalendar: Error limpiando calendario', err);
      toast.error('Error al limpiar el calendario.');
    } finally {
      setIsSaving(false);
    }
  }, [listing.id]);

  return {
    days,
    currentMonth,
    goToPrevMonth,
    goToNextMonth,
    rangeStart,
    rangeEnd,
    handleDayClick,
    blockSelectedRange,
    clearAll,
    resetRange,
    isLoading,
    isSaving,
    errorMessage,
  };
};
