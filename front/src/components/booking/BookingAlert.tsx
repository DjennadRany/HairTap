import React, { useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import type { BookingAlert as BookingAlertType } from '../../services/api/bookingValidations';
import { Button } from '../ui/Button';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  markAllBookingAlertsRead,
  markBookingAlertRead,
  selectBookingAlerts,
  selectUnreadBookingAlertCount,
  setBookingAlerts,
} from '../../store/slices/bookingAlertSlice';

interface BookingAlertsListProps {
  alerts?: BookingAlertType[];
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
  custom: {
    badge: 'bg-slate-100 text-slate-800',
    background: 'bg-slate-50 border-slate-100'
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

const useNewAlertToasts = (alerts: BookingAlertType[]) => {
  const knownAlertIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newUnread = alerts.filter(alert => !knownAlertIds.current.has(alert.id));
    if (newUnread.length > 0) {
      newUnread.forEach(alert => {
        knownAlertIds.current.add(alert.id);
        toast.info(alert.title ?? 'Nouvelle alerte', {
          position: 'bottom-right',
          autoClose: 4500,
          toastId: alert.id,
        });
      });
    }
  }, [alerts]);
};

export const BookingAlertsList: React.FC<BookingAlertsListProps> = ({ alerts: incomingAlerts, onAction, maxAlerts }) => {
  const dispatch = useAppDispatch();
  const storeAlerts = useAppSelector(selectBookingAlerts);
  const unreadCount = useAppSelector(selectUnreadBookingAlertCount);

  useEffect(() => {
    if (incomingAlerts) {
      dispatch(setBookingAlerts(incomingAlerts));
    }
  }, [dispatch, incomingAlerts]);

  const alerts = useMemo(() => {
    const base = incomingAlerts ? storeAlerts : storeAlerts;
    return maxAlerts ? base.slice(0, maxAlerts) : base;
  }, [incomingAlerts, maxAlerts, storeAlerts]);

  useNewAlertToasts(alerts);

  if (alerts.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-500">
        Aucune alerte pour le moment
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{unreadCount} alerte(s) non lue(s)</span>
        {unreadCount > 0 && (
          <button
            onClick={() => dispatch(markAllBookingAlertsRead())}
            className="text-blue-600 hover:text-blue-800"
          >
            Marquer tout comme lu
          </button>
        )}
      </div>

      {alerts.map((alert) => {
        const styles = getStylesForType(alert.type);
        return (
          <div
            key={alert.id || `${alert.bookingId}-${alert.type}`}
            className={`rounded-lg border p-4 shadow-sm ${styles.background} ${alert.isRead ? 'opacity-70' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                    {alert.type?.replace(/_/g, ' ') ?? 'Alerte'}
                  </span>
                  {!alert.isRead && <span className="h-2 w-2 rounded-full bg-blue-600" aria-label="Non lu" />}
                </div>
                <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{alert.message}</p>
                <p className="text-xs text-gray-500">Émise le {formatTimestamp(alert.createdAt)}</p>
              </div>

              <div className="flex flex-col gap-2 items-end">
                {alert.action && (
                  <Button
                    size="sm"
                    onClick={() => onAction?.(alert)}
                    className="shrink-0"
                  >
                    Traiter
                  </Button>
                )}
                {!alert.isRead && (
                  <button
                    onClick={() => dispatch(markBookingAlertRead(alert.id))}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Marquer comme lu
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export type { BookingAlertType };

