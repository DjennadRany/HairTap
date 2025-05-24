import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useClientBookings } from '../hooks/useClientBookings';

interface Booking {
  id: string;
  coiffeurId: number;
  coiffeurName: string;
  service: string;
  date: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  mode: 'salon' | 'domicile';
  address?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  cancellationDeadline: string;
}

const ClientBookingsPage = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { bookings, loading, error, cancelBooking, setError, getUpcomingBookings, getPastBookings, canCancel } = useClientBookings();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      cancelBooking(bookingId);
    } catch (error) {
      setError('Erreur lors de l\'annulation de la réservation');
    }
  };

  const getStatusBadgeClass = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadgeClass = (status: Booking['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-2"></div>
        </div>
      </div>
    );
  }

  const upcomingBookings = getUpcomingBookings();
  const pastBookings = getPastBookings();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes réservations</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Réservations à venir */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Réservations à venir</h2>
        {upcomingBookings.length > 0 ? (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {booking.coiffeurName}
                    </h3>
                    <p className="text-gray-600">{booking.service}</p>
                    <p className="text-gray-600">
                      {format(new Date(booking.date), 'EEEE d MMMM yyyy à HH:mm', {
                        locale: fr,
                      })}
                    </p>
                    {booking.mode === 'domicile' && booking.address && (
                      <p className="text-gray-600 mt-2">
                        Adresse : {booking.address}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                        booking.status
                      )}`}
                    >
                      {booking.status === 'confirmed'
                        ? 'Confirmé'
                        : booking.status === 'pending'
                        ? 'En attente'
                        : 'Annulé'}
                    </span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ml-2 ${getPaymentStatusBadgeClass(
                        booking.paymentStatus
                      )}`}
                    >
                      {booking.paymentStatus === 'paid'
                        ? 'Payé'
                        : booking.paymentStatus === 'pending'
                        ? 'En attente'
                        : 'Remboursé'}
                    </span>
                    <p className="mt-2 text-lg font-bold">{booking.price}€</p>
                  </div>
                </div>
                {canCancel(booking) && (
                  <div className="mt-4">
                    <Button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Annuler la réservation
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      Annulation possible jusqu'au{' '}
                      {format(
                        new Date(booking.cancellationDeadline),
                        'dd/MM/yyyy HH:mm'
                      )}
                    </p>
                  </div>
                )}
                <Button onClick={() => navigate(`/coiffeur/${booking.coiffeurId}`)} className="ml-2 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">Voir le coiffeur</Button>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Aucune réservation à venir</p>
        )}
      </div>

      {/* Réservations passées */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Historique des réservations</h2>
        {pastBookings.length > 0 ? (
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {booking.coiffeurName}
                    </h3>
                    <p className="text-gray-600">{booking.service}</p>
                    <p className="text-gray-600">
                      {format(new Date(booking.date), 'EEEE d MMMM yyyy à HH:mm', {
                        locale: fr,
                      })}
                    </p>
                    {booking.mode === 'domicile' && booking.address && (
                      <p className="text-gray-600 mt-2">
                        Adresse : {booking.address}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                        booking.status
                      )}`}
                    >
                      {booking.status === 'confirmed'
                        ? 'Terminé'
                        : booking.status === 'cancelled'
                        ? 'Annulé'
                        : 'En attente'}
                    </span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ml-2 ${getPaymentStatusBadgeClass(
                        booking.paymentStatus
                      )}`}
                    >
                      {booking.paymentStatus === 'paid'
                        ? 'Payé'
                        : booking.paymentStatus === 'refunded'
                        ? 'Remboursé'
                        : 'En attente'}
                    </span>
                    <p className="mt-2 text-lg font-bold">{booking.price}€</p>
                  </div>
                </div>
                <Button onClick={() => navigate(`/coiffeur/${booking.coiffeurId}`)} className="ml-2 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">Voir le coiffeur</Button>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Aucune réservation passée</p>
        )}
      </div>
    </div>
  );
};

export default ClientBookingsPage; 