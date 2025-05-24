import { useSelector } from 'react-redux';
import { selectBookings } from '../store/slices/bookingSlice';
import type { Booking } from '../store/slices/bookingSlice';

const CoiffeurRevenuePage = () => {
  const bookings = useSelector(selectBookings);

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
      .reduce((total, booking) => total + booking.totalPrice, 0);
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
      .reduce((total, booking) => total + booking.totalPrice, 0);
  };

  const monthlyRevenue = calculateMonthlyRevenue(bookings);
  const yearlyRevenue = calculateYearlyRevenue(bookings);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes revenus</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">
            Revenus du mois
          </h2>
          <p className="text-3xl font-bold text-accent">{monthlyRevenue}€</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">
            Revenus de l'année
          </h2>
          <p className="text-3xl font-bold text-accent">{yearlyRevenue}€</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-6 border-b">
          Historique des paiements
        </h2>
        <div className="divide-y">
          {bookings
            .filter(booking => booking.status === 'confirmed')
            .map(booking => (
              <div key={booking.id} className="p-6 flex justify-between items-center">
                <div>
                  <p className="font-semibold">Réservation #{booking.id}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <p className="text-lg font-bold text-accent">
                  {booking.totalPrice}€
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CoiffeurRevenuePage; 