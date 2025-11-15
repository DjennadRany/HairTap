import React from 'react';
import { Card } from '../ui/card';
import { FaCalendarAlt, FaClock } from 'react-icons/fa';
import type { CoiffeurSlotDTO } from '../../services/api/coiffeurs';
import type { BookingValidationResult } from '../../hooks/useBookingValidation';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface BookingSlotListProps {
  dates: string[];
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  slots: CoiffeurSlotDTO[];
  onSlotSelect: (slot: CoiffeurSlotDTO) => void;
  selectedSlot?: CoiffeurSlotDTO | null;
  getSlotState: (slot: CoiffeurSlotDTO) => BookingValidationResult;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
}

const DateSkeleton = () => (
  <div className="h-10 w-full animate-pulse rounded-lg bg-fashion-gray-200" aria-hidden="true" />
);

const SlotSkeleton = () => (
  <div className="h-16 w-full animate-pulse rounded-lg bg-fashion-gray-200" aria-hidden="true" />
);

const formatDateLabel = (date: string) => {
  try {
    const parsed = parseISO(date);
    return format(parsed, 'dd MMM', { locale: fr });
  } catch {
    return date;
  }
};

const BookingSlotList: React.FC<BookingSlotListProps> = ({
  dates,
  selectedDate,
  onDateSelect,
  slots,
  onSlotSelect,
  selectedSlot,
  getSlotState,
  loading = false,
  error,
  onRetry,
  disabled = false,
}) => {
  return (
    <Card className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <FaCalendarAlt className="text-fashion-black" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-semibold text-fashion-black">Choisissez votre créneau</h3>
          <p className="text-sm text-fashion-gray-600">Sélectionnez d'abord une date, puis un horaire disponible.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-fashion-gray-700">Date</p>
          {loading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <DateSkeleton key={index} />
              ))}
            </div>
          ) : dates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-fashion-gray-200 px-4 py-6 text-center text-sm text-fashion-gray-600">
              Aucun créneau disponible pour le moment.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {dates.map((dateValue) => (
                <button
                  key={dateValue}
                  type="button"
                  onClick={() => onDateSelect(dateValue)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-fashion-black focus-visible:ring-offset-2',
                    selectedDate === dateValue
                      ? 'border-fashion-black bg-fashion-black text-white shadow-lg'
                      : 'border-transparent bg-fashion-gray-100 text-fashion-gray-700 hover:bg-fashion-gray-200'
                  )}
                  aria-pressed={selectedDate === dateValue}
                >
                  {formatDateLabel(dateValue)}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            <p>{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
              >
                Réessayer
              </button>
            )}
          </div>
        )}

        {selectedDate && (
          <div>
            <p className="mb-2 text-sm font-medium text-fashion-gray-700">Heure</p>
            {loading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SlotSkeleton key={index} />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <p className="rounded-lg border border-dashed border-fashion-gray-200 px-4 py-6 text-center text-sm text-fashion-gray-600">
                Aucun créneau disponible ce jour-là.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="list">
                {slots.map((slot) => {
                  const validation = getSlotState(slot);
                  const isSelected = selectedSlot?.id === slot.id;
                  const isAvailable = validation.isValid && !disabled;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => isAvailable && onSlotSelect(slot)}
                      disabled={!isAvailable}
                      className={cn(
                        'flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-fashion-black focus-visible:ring-offset-2',
                        isSelected
                          ? 'border-fashion-black bg-fashion-black text-white shadow-lg'
                          : isAvailable
                          ? 'border-fashion-gray-200 bg-white text-fashion-gray-800 hover:border-fashion-black/40 hover:shadow'
                          : 'cursor-not-allowed border-fashion-gray-200 bg-fashion-gray-100 text-fashion-gray-500'
                      )}
                      aria-pressed={isSelected}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <FaClock aria-hidden="true" />
                        {slot.startTime}
                      </span>
                      <span className="mt-1 text-xs text-fashion-gray-600">
                        {slot.durationMinutes} min · {slot.remainingCapacity} places restantes
                      </span>
                      {!validation.isValid && (
                        <span className="mt-2 text-xs text-red-600">{validation.errors[0] ?? 'Créneau indisponible'}</span>
                      )}
                      {validation.isValid && slot.remainingCapacity <= 1 && (
                        <span className="mt-2 text-xs font-semibold text-fashion-gray-900">
                          {slot.remainingCapacity === 1 ? 'Dernière place' : `Plus que ${slot.remainingCapacity} places`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default BookingSlotList;
