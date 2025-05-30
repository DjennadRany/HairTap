import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useClientBookings } from '../hooks/useClientBookings';
import { Booking } from '../types/models';

const ClientBookingsPage = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { cancelBooking, setError, getUpcomingBookings, getPastBookings, canCancel } = useClientBookings();

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
      case 'completed':
        return 'bg-blue-100 text-blue-800';
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

  const upcomingBookings = getUpcomingBookings();
  const pastBookings = getPastBookings();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes réservations</h1>

      {/* Réservations à venir */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Réservations à venir</h2>
        {upcomingBookings.length > 0 ? (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <Card key={booking._id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {typeof booking.coiffeur === 'object' && booking.coiffeur !== null ? (booking.coiffeur as any).name : booking.coiffeur}
                    </h3>
                    <p className="text-gray-600">
                      {typeof booking.service === 'object' && booking.service !== null ? (booking.service as any).name : booking.service}
                    </p>
                    <p className="text-gray-600">
                      {format(new Date(booking.date), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                    {booking.mode === 'domicile' && booking.address && (
                      <div className="text-gray-600 mt-2">
                        Adresse : {booking.address.street}, {booking.address.city}, {booking.address.postalCode}
                      </div>
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
                        : booking.status === 'completed'
                        ? 'Terminé'
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
                      onClick={() => handleCancelBooking(booking._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Annuler la réservation
                    </Button>
                    {/* Affichage d'une date d'annulation si disponible */}
                    {booking.cancellationReason && (
                      <p className="text-sm text-gray-500 mt-2">
                        Raison d'annulation : {booking.cancellationReason}
                      </p>
                    )}
                  </div>
                )}
                <Button onClick={() => navigate(`/coiffeur/${typeof booking.coiffeur === 'object' && booking.coiffeur !== null ? (booking.coiffeur as any)._id : booking.coiffeur}`)} className="ml-2 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">Voir le coiffeur</Button>
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
              <Card key={booking._id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {typeof booking.coiffeur === 'object' && booking.coiffeur !== null ? (booking.coiffeur as any).name : booking.coiffeur}
                    </h3>
                    <p className="text-gray-600">
                      {typeof booking.service === 'object' && booking.service !== null ? (booking.service as any).name : booking.service}
                    </p>
                    <p className="text-gray-600">
                      {format(new Date(booking.date), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                    {booking.mode === 'domicile' && booking.address && (
                      <div className="text-gray-600 mt-2">
                        Adresse : {booking.address.street}, {booking.address.city}, {booking.address.postalCode}
                      </div>
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
                <Button onClick={() => navigate(`/coiffeur/${typeof booking.coiffeur === 'object' && booking.coiffeur !== null ? (booking.coiffeur as any)._id : booking.coiffeur}`)} className="ml-2 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">Voir le coiffeur</Button>
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