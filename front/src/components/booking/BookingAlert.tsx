import React from 'react';
import type { BookingAlert as BookingAlertType } from '../../services/api/bookingValidations';
import { Button } from '../ui/Button';

interface BookingAlertsListProps {
  alerts: BookingAlertType[];
  onAction?: (alert: BookingAlertType) => void | Promise<void>;
  maxAlerts?: number;
}

const typeStyles: Record<string, { badge: string; background: string }> = {
  past_booking_needs_regularization: {
    badge: 'bg-amber-100 text-amber-800',
    background: 'bg-amber-50 border-amber-100'
  },
  awaiting_confirmation: {
    badge: 'bg-blue-100 text-blue-800',
    background: 'bg-blue-50 border-blue-100'
  },
  incident_report_required: {
    badge: 'bg-red-100 text-red-800',
    background: 'bg-red-50 border-red-100'
  },
  payment_issue: {
    badge: 'bg-purple-100 text-purple-800',
    background: 'bg-purple-50 border-purple-100'
  },
  default: {
    badge: 'bg-gray-100 text-gray-800',
    background: 'bg-gray-50 border-gray-100'
  }
};

const getStylesForType = (type?: string) => typeStyles[type ?? ''] ?? typeStyles.default;

const formatTimestamp = (isoDate: string) => {
  try {
    return new Date(isoDate).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return isoDate;
  }
};

export const BookingAlertsList: React.FC<BookingAlertsListProps> = ({ alerts, onAction, maxAlerts = alerts.length }) => {
  const items = alerts.slice(0, maxAlerts);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {items.map((alert) => {
        const styles = getStylesForType(alert.type);
        return (
          <div
            key={alert.id || `${alert.bookingId}-${alert.type}`}
            className={`rounded-lg border p-4 shadow-sm ${styles.background}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                  {alert.type?.replace(/_/g, ' ') ?? 'Alerte'}
                </span>
                <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{alert.message}</p>
                <p className="text-xs text-gray-500">Émise le {formatTimestamp(alert.createdAt)}</p>
              </div>

              {alert.action && (
                <Button
                  size="sm"
                  onClick={() => onAction?.(alert)}
                  className="shrink-0"
                >
                  Traiter
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export type { BookingAlertType };

