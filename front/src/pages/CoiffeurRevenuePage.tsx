import { useEffect, useState } from 'react';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Booking, User } from '../types/models';
import { useAppSelector } from '../store/hooks';

const CoiffeurRevenuePage = () => {
  const user = useAppSelector(selectCurrentUser) as User | null;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'coiffeur') return;
    const fetchData = async () => {
      setLoading(true);
      try {
        // À remplacer par un vrai appel API bookings du coiffeur
        // const bookings = await bookingService.getBookingsByCoiffeur(user._id);
        setBookings([]); // TODO: brancher sur bookings API
      } catch (e) {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const calculateMonthlyRevenue = (bookings: Booking[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return bookings
      .filter(booking => {
        const bookingDate = new Date(booking.date);
        return (
          bookingDate.getMonth() === currentMonth &&
          bookingDate.getFullYear() === currentYear &&
          booking.status === 'confirmed'
        );
      })
      .reduce((total, booking) => total + booking.price, 0);
  };

  const calculateYearlyRevenue = (bookings: Booking[]) => {
    const currentYear = new Date().getFullYear();
    return bookings
      .filter(booking => {
        const bookingDate = new Date(booking.date);
        return (
          bookingDate.getFullYear() === currentYear &&
          booking.status === 'confirmed'
        );
      })
      .reduce((total, booking) => total + booking.price, 0);
  };

  const monthlyRevenue = calculateMonthlyRevenue(bookings);
  const yearlyRevenue = calculateYearlyRevenue(bookings);

  if (!user || user.role !== 'coiffeur') {
    return <div className="container mx-auto px-4 py-8">Erreur : accès réservé aux coiffeurs connectés.</div>;
  }
  if (loading) {
    return <div className="container mx-auto px-4 py-8">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes revenus</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-fashion-light-gray rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">
            Revenus du mois
          </h2>
          <p className="text-3xl font-bold text-accent">{monthlyRevenue}€</p>
        </div>
        <div className="bg-fashion-light-gray rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">
            Revenus de l'année
          </h2>
          <p className="text-3xl font-bold text-accent">{yearlyRevenue}€</p>
        </div>
      </div>
      <div className="bg-fashion-light-gray rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-6 border-b">
          Historique des paiements
        </h2>
        <div className="divide-y">
          {bookings
            .filter(booking => booking.status === 'confirmed')
            .map(booking => (
              <div key={booking._id} className="p-6 flex justify-between items-center">
                <div>
                  <p className="font-semibold">Réservation #{booking._id}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <p className="text-lg font-bold text-accent">
                  {booking.price}€
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CoiffeurRevenuePage; 