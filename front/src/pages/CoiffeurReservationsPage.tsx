import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Booking {
  id: string;
  client: Client;
  service: string;
  date: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  mode: 'salon' | 'domicile';
  address?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

const CoiffeurReservationsPage = () => {
  const user = useSelector(selectCurrentUser);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/bookings/coiffeur/${user?.id}`
        );
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        setError('Erreur lors du chargement des réservations');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: 'confirmed' }
              : booking
          )
        );
      } else {
        setError('Erreur lors de la confirmation de la réservation');
      }
    } catch (error) {
      setError('Erreur lors de la confirmation de la réservation');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: 'cancelled' }
              : booking
          )
        );
      } else {
        setError('Erreur lors de l\'annulation de la réservation');
      }
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

  const filterBookings = (bookings: Booking[]) => {
    let filtered = [...bookings];

    // Filtre par statut
    if (filter !== 'all') {
      filtered = filtered.filter((booking) => booking.status === filter);
    }

    // Filtre par date
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(
          (booking) =>
            format(new Date(booking.date), 'yyyy-MM-dd') ===
            format(now, 'yyyy-MM-dd')
        );
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        filtered = filtered.filter(
          (booking) => new Date(booking.date) >= weekStart
        );
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(
          (booking) => new Date(booking.date) >= monthStart
        );
        break;
    }

    // Tri par date
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

  const filteredBookings = filterBookings(bookings);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des réservations</h1>
        <div className="flex gap-4">
          {/* Filtres */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmés</option>
            <option value="cancelled">Annulés</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-semibold text-lg">
                      {booking.client.name}
                    </h3>
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
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusBadgeClass(
                        booking.paymentStatus
                      )}`}
                    >
                      {booking.paymentStatus === 'paid'
                        ? 'Payé'
                        : booking.paymentStatus === 'pending'
                        ? 'En attente'
                        : 'Remboursé'}
                    </span>
                  </div>
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
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Contact : {booking.client.email}
                      {booking.client.phone && ` • ${booking.client.phone}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{booking.price}€</p>
                  {booking.status === 'pending' && (
                    <div className="mt-4 space-x-2">
                      <Button
                        onClick={() => handleConfirmBooking(booking.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Confirmer
                      </Button>
                      <Button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      >
                        Refuser
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
            ))
          ) : (
          <p className="text-center text-gray-600">Aucune réservation trouvée</p>
          )}
      </div>
    </div>
  );
};

export default CoiffeurReservationsPage; 