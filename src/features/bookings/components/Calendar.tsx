import React, { useState, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isWithinInterval,
  isBefore,
  startOfToday,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  startDate: Date | null;
  endDate: Date | null;
  reservedDates?: { start: Date; end: Date }[];
  onChange: (start: Date | null, end: Date | null) => void;
  onClose: () => void;
}

const Calendar: React.FC<CalendarProps> = ({
  startDate,
  endDate,
  reservedDates = [],
  onChange,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = startOfToday();

  const handleDateClick = (day: Date) => {
    // Normalizamos la fecha seleccionada a medianoche para evitar bugs de componentes de tiempo
    const normalizedDay = startOfDay(day);

    // Check if the date is reserved
    const isReserved = reservedDates.some((range) =>
      isWithinInterval(normalizedDay, {
        start: startOfDay(range.start),
        end: startOfDay(range.end),
      })
    );

    if (isBefore(normalizedDay, today) || isReserved) return;

    if (!startDate || (startDate && endDate)) {
      onChange(normalizedDay, null);
    } else if (startDate && !endDate) {
      // Si el usuario selecciona el mismo día o uno anterior, reiniciamos el inicio
      if (
        isBefore(normalizedDay, startDate) ||
        isSameDay(normalizedDay, startDate)
      ) {
        onChange(normalizedDay, null);
      } else {
        // Verificar si hay fechas reservadas en el rango seleccionado
        const hasOverlap = reservedDates.some((range) => {
          const resStart = startOfDay(range.start);
          const resEnd = startOfDay(range.end);

          // El rango seleccionado (startDate -> normalizedDay) no debe contener ninguna fecha reservada
          return (
            (isBefore(startDate, resStart) &&
              isBefore(resStart, normalizedDay)) ||
            isSameDay(resStart, startDate) ||
            isSameDay(resStart, normalizedDay)
          );
        });

        if (hasOverlap) {
          // Si hay solape, reiniciamos la selección con el nuevo día como inicio
          onChange(normalizedDay, null);
        } else {
          onChange(startDate, normalizedDay);
        }
      }
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <span className="text-brand-navy text-sm font-black tracking-widest uppercase">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return (
      <div className="mb-2 grid grid-cols-7">
        {days.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[10px] font-black text-gray-400 uppercase"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateRange = startOfWeek(monthStart);
    const endDateRange = endOfWeek(monthEnd);

    const rows = [];
    let daysContent = [];
    let day = startDateRange;
    let formattedDate = '';

    while (day <= endDateRange) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;

        const isSelected =
          (startDate && isSameDay(day, startDate)) ||
          (endDate && isSameDay(day, endDate));
        const isInRange =
          startDate &&
          endDate &&
          isWithinInterval(day, { start: startDate, end: endDate });

        // Check if date is in reserved ranges
        const isReserved = reservedDates.some((range) =>
          isWithinInterval(startOfDay(day), {
            start: startOfDay(range.start),
            end: startOfDay(range.end),
          })
        );

        const isDisabled = isBefore(day, today) || isReserved;
        const isNotCurrentMonth = !isSameMonth(day, monthStart);

        daysContent.push(
          <div
            key={day.toString()}
            className={cn(
              'group relative flex h-10 cursor-pointer items-center justify-center transition-all duration-200',
              isInRange && !isSelected ? 'bg-brand-50' : '',
              isDisabled ? 'cursor-not-allowed opacity-20' : 'hover:bg-gray-50',
              isNotCurrentMonth ? 'text-gray-300' : 'text-brand-navy font-bold'
            )}
            onClick={() => handleDateClick(cloneDay)}
          >
            {isSelected && (
              <div className="bg-brand-500 animate-pop-in absolute inset-1 rounded-full" />
            )}
            <span
              className={cn(
                'relative z-10 text-xs transition-colors',
                isSelected ? 'text-brand-navy font-black' : ''
              )}
            >
              {formattedDate}
            </span>
            {isSameDay(day, today) && !isSelected && (
              <div className="bg-brand-500 absolute bottom-1 h-1 w-1 rounded-full" />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {daysContent}
        </div>
      );
      daysContent = [];
    }
    return <div className="px-2 pb-4">{rows}</div>;
  };

  return (
    <div className="animate-fade-in flex max-h-[85vh] w-full max-w-[340px] flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl ring-1 ring-black/5 sm:max-h-none">
      <div className="bg-brand-navy flex shrink-0 items-center justify-between p-3">
        <div>
          <p className="text-brand-500 mb-1 text-[8px] leading-none font-black tracking-widest uppercase">
            Selecciona Fechas
          </p>
          <h3 className="text-xs leading-none font-black text-white">
            Calendario de Reservación
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white/50 transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="no-scrollbar overflow-y-auto p-0">
        <div className="flex gap-1.5 border-b border-gray-100 p-1 px-2 italic">
          <div
            className={cn(
              'flex-1 rounded-xl border p-2 transition-all',
              startDate
                ? 'bg-brand-50 border-brand-200'
                : 'border-gray-100 bg-gray-50'
            )}
          >
            <p className="text-[7px] leading-tight font-black text-gray-400 uppercase">
              Llegada
            </p>
            <p className="text-brand-navy text-[10px] leading-tight font-black">
              {startDate
                ? format(startDate, 'dd MMM', { locale: es })
                : 'Elegir'}
            </p>
          </div>
          <div
            className={cn(
              'flex-1 rounded-xl border p-2 transition-all',
              endDate
                ? 'bg-brand-50 border-brand-200'
                : 'border-gray-100 bg-gray-50'
            )}
          >
            <p className="text-[7px] leading-tight font-black text-gray-400 uppercase">
              Salida
            </p>
            <p className="text-brand-navy text-[10px] leading-tight font-black">
              {endDate ? format(endDate, 'dd MMM', { locale: es }) : 'Elegir'}
            </p>
          </div>
        </div>

        {renderHeader()}
        <div className="px-2">
          {renderDays()}
          {renderCells()}
        </div>
      </div>

      <div className="flex shrink-0 gap-2 border-t border-gray-100 bg-gray-50/50 p-3">
        <button
          onClick={() => onChange(null, null)}
          className="hover:text-brand-navy flex-1 py-2.5 text-[9px] font-black tracking-widest text-gray-400 uppercase transition-colors"
        >
          Limpiar
        </button>
        <button
          onClick={onClose}
          className="bg-brand-navy flex-1 rounded-xl py-2.5 text-[9px] font-black tracking-widest text-white uppercase shadow-xl transition-all active:scale-95"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default Calendar;






