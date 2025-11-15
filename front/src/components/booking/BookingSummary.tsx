import React from 'react';
import { Card } from '../ui/card';
import { FaCalendarAlt, FaClock, FaEuroSign, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import type { User } from '../../types/models';
import type { CoiffeurSlotDTO } from '../../services/api/coiffeurs';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface BookingSummaryProps {
  coiffeur: User;
  service?: {
    name?: string;
    price?: number;
    duration?: number;
  } | null;
  bookingMode: 'salon' | 'domicile';
  selectedDate?: string;
  selectedSlot?: CoiffeurSlotDTO | null;
  className?: string;
}

const formatPrice = (price?: number) => {
  if (typeof price !== 'number') {
    return '—';
  }
  return `${price.toFixed(2)}€`;
};

const formatDuration = (duration?: number) => {
  if (!duration) {
    return '—';
  }
  if (duration < 60) {
    return `${duration} min`;
  }
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return minutes > 0 ? `${hours}h${minutes}` : `${hours}h`;
};

const formatDate = (date?: string) => {
  if (!date) {
    return 'Sélectionnez une date';
  }
  try {
    return format(parseISO(date), "EEEE d MMMM", { locale: fr });
  } catch {
    return 'Date invalide';
  }
};

const BookingSummary: React.FC<BookingSummaryProps> = ({
  coiffeur,
  service,
  bookingMode,
  selectedDate,
  selectedSlot,
  className,
}) => {
  return (
    <Card className={cn('p-6 space-y-4', className)}>
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-fashion-black">
          <FaUser aria-hidden="true" />
          Récapitulatif de votre réservation
        </h3>
        <p className="text-sm text-fashion-gray-600">Vérifiez les informations avant de confirmer.</p>
      </div>

      <div className="rounded-lg border border-fashion-gray-200 bg-fashion-gray-50 p-4">
        <p className="text-sm text-fashion-gray-600">Coiffeur sélectionné</p>
        <p className="text-base font-semibold text-fashion-black">{coiffeur.name}</p>
        {coiffeur.city && (
          <p className="text-sm text-fashion-gray-600">{coiffeur.city}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3" aria-live="polite">
        <div className="flex items-start gap-3 rounded-lg border border-fashion-gray-200 p-3">
          <span className="mt-1 text-fashion-black">
            <FaEuroSign aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-fashion-gray-600">Service</p>
            <p className="font-medium text-fashion-black">{service?.name ?? 'Choisissez un service'}</p>
            <p className="text-sm text-fashion-gray-600">{formatPrice(service?.price)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-fashion-gray-200 p-3">
          <span className="mt-1 text-fashion-black">
            <FaClock aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-fashion-gray-600">Durée estimée</p>
            <p className="font-medium text-fashion-black">{formatDuration(service?.duration)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-fashion-gray-200 p-3">
          <span className="mt-1 text-fashion-black">
            <FaCalendarAlt aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-fashion-gray-600">Date &amp; heure</p>
            <p className="font-medium text-fashion-black">{formatDate(selectedDate)}</p>
            <p className="text-sm text-fashion-gray-600">{selectedSlot?.startTime ?? 'Sélectionnez un créneau'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-fashion-gray-200 p-3">
          <span className="mt-1 text-fashion-black">
            <FaMapMarkerAlt aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-fashion-gray-600">Mode de prestation</p>
            <p className="font-medium text-fashion-black">
              {bookingMode === 'salon' ? 'En salon' : 'À domicile'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-fashion-black/90 px-4 py-3 text-white" role="status">
        <span className="text-sm font-medium uppercase tracking-wide">Total estimé</span>
        <span className="text-xl font-semibold">{formatPrice(service?.price)}</span>
      </div>
    </Card>
  );
};

export default BookingSummary;
