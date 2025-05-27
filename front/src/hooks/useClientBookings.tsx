import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { bookingService, Booking } from '../services/api/bookings';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

const STORAGE_KEY = 'client_bookings';

interface ClientBookingsContextType {
  bookings: Booking[];
  loading: boolean;
  error: string;
  addBooking: (booking: Booking) => void;
  cancelBooking: (bookingId: string) => void;
  setError: (err: string) => void;
  getUpcomingBookings: () => Booking[];
  getPastBookings: () => Booking[];
  canCancel: (booking: Booking) => boolean;
}

const ClientBookingsContext = createContext<ClientBookingsContextType | undefined>(undefined);

export const ClientBookingsProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    if (!user) return; // NE PAS FETCH SI PAS CONNECTÉ
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getClientBookings();
        setBookings(data);
        setError('');
      } catch (err) {
        setError('Erreur lors du chargement des réservations');
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  const addBooking = useCallback(async (booking: Booking) => {
    try {
      const newBooking = await bookingService.createBooking({
        coiffeur: booking.coiffeur,
        service: booking.service,
        date: booking.date,
        mode: booking.mode,
        address: booking.address,
        notes: booking.notes
      });
      setBookings(prev => [newBooking, ...prev]);
      setError('');
    } catch (err) {
      setError('Erreur lors de la création de la réservation');
      console.error('Error creating booking:', err);
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId: string) => {
    try {
      const updatedBooking = await bookingService.cancelBooking(bookingId, 'Annulé par le client');
      setBookings(prev =>
        prev.map(b => b._id === bookingId ? updatedBooking : b)
      );
      setError('');
    } catch (err) {
      setError('Erreur lors de l\'annulation de la réservation');
      console.error('Error cancelling booking:', err);
    }
  }, []);

  const getUpcomingBookings = useCallback(() => {
    const now = new Date();
    return bookings.filter(b => new Date(b.date) > now && b.status !== 'cancelled');
  }, [bookings]);

  const getPastBookings = useCallback(() => {
    const now = new Date();
    return bookings.filter(b => new Date(b.date) <= now || b.status === 'cancelled');
  }, [bookings]);

  const canCancel = useCallback((booking: Booking) => {
    const bookingDate = new Date(booking.date);
    const now = new Date();
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilBooking >= 24 && booking.status === 'pending';
  }, []);

  return (
    <ClientBookingsContext.Provider value={{ bookings, loading, error, addBooking, cancelBooking, setError, getUpcomingBookings, getPastBookings, canCancel }}>
      {children}
    </ClientBookingsContext.Provider>
  );
};

export function useClientBookings() {
  const context = useContext(ClientBookingsContext);
  if (!context) {
    throw new Error('useClientBookings doit être utilisé dans un ClientBookingsProvider');
  }
  return context;
} 