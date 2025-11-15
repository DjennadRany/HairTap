import React from 'react';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Notification } from '../../services/api/notifications';
import { Booking } from '../../services/api/bookings';

interface RegularizationNotificationsListProps {
  notifications: Notification[];
  bookings: Booking[];
  onNotificationClick: (notification: Notification, booking: Booking) => void;
}

const RegularizationNotificationsList: React.FC<RegularizationNotificationsListProps> = ({
  notifications,
  bookings,
  onNotificationClick
}) => {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <ClockIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Aucune notification de régularisation</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const booking = bookings.find(b => b._id === notification.bookingId);
        if (!booking) return null;

        const clientName = typeof booking.client === 'object' && booking.client !== null && 'name' in booking.client
          ? (booking.client as any).name
          : 'Client';

        return (
          <div
            key={notification._id}
            onClick={() => onNotificationClick(notification, booking)}
            className="p-4 bg-white border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  <p>Client : {clientName}</p>
                  <p>Date : {new Date(booking.date).toLocaleDateString('fr-FR')} à {new Date(booking.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {!notification.read && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full">
                    En attente
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RegularizationNotificationsList;

