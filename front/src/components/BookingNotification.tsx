import React from 'react';
import { Card } from './ui/card';
import { FaCheckCircle, FaTimesCircle, FaClock, FaUser } from 'react-icons/fa';

interface BookingNotificationProps {
  booking: {
    _id: string;
    service: string;
    date: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    coiffeur: {
      name: string;
      email: string;
    };
    price: number;
    duration: number;
  };
  onViewDetails?: () => void;
}

const BookingNotification: React.FC<BookingNotificationProps> = ({ booking, onViewDetails }) => {
  const getStatusIcon = () => {
    switch (booking.status) {
      case 'confirmed':
        return <FaCheckCircle className="text-green-500 text-xl" />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-500 text-xl" />;
      case 'completed':
        return <FaCheckCircle className="text-blue-500 text-xl" />;
      default:
        return <FaClock className="text-yellow-500 text-xl" />;
    }
  };

  const getStatusText = () => {
    switch (booking.status) {
      case 'confirmed':
        return 'Réservation confirmée';
      case 'cancelled':
        return 'Réservation annulée';
      case 'completed':
        return 'Prestation terminée';
      default:
        return 'En attente de confirmation';
    }
  };

  const getStatusColor = () => {
    switch (booking.status) {
      case 'confirmed':
        return 'border-green-200 bg-green-50';
      case 'cancelled':
        return 'border-red-200 bg-red-50';
      case 'completed':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  return (
    <Card className={`p-4 border-2 ${getStatusColor()} transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{getStatusText()}</h3>
            <span className="text-sm text-gray-500">
              {new Date(booking.date).toLocaleDateString('fr-FR')}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <FaUser className="text-gray-500" />
              <span><strong>Coiffeur:</strong> {booking.coiffeur.name}</span>
            </div>
            <div>
              <span><strong>Service:</strong> {booking.service}</span>
            </div>
            <div>
              <span><strong>Prix:</strong> {booking.price}€ ({booking.duration} min)</span>
            </div>
            <div>
              <span><strong>Date:</strong> {new Date(booking.date).toLocaleString('fr-FR')}</span>
            </div>
          </div>

          {booking.status === 'completed' && (
            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                Votre prestation est terminée ! N'oubliez pas de laisser un avis à {booking.coiffeur.name}.
              </p>
            </div>
          )}

          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="mt-3 text-accent hover:text-accent/80 text-sm font-medium"
            >
              Voir les détails →
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BookingNotification; 