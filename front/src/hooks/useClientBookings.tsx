import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { mockClientBookings } from '../features/search/domain/mockData';
import { BookingAggregate } from '../domain/BookingAggregate';

export interface Booking {
  id: string;
  clientId: string;
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

const STORAGE_KEY = 'client_bookings';

function getInitialBookings(): Booking[] {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      console.log('[useClientBookings] Chargement depuis localStorage:', parsed);
      return parsed;
    } catch {
      console.log('[useClientBookings] Erreur parsing localStorage, fallback mock');
      return mockClientBookings;
    }
  }
  console.log('[useClientBookings] Fallback mock (pas de localStorage)');
  return mockClientBookings;
}

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
  const [bookings, setBookings] = useState<Booking[]>(getInitialBookings());
  const [loading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings]);

  const addBooking = useCallback((booking: Booking) => {
    if (BookingAggregate.hasClientConflict(bookings, booking)) {
      setError('Vous avez déjà une réservation à cette date et heure, veuillez annuler l\'autre réservation avant de continuer.');
      return;
    }
    setBookings((prev) => [booking, ...prev]);
  }, [bookings]);

  const cancelBooking = useCallback((bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'cancelled', paymentStatus: 'refunded' }
          : b
      )
    );
  }, []);

  const getUpcomingBookings = useCallback(() => {
    const now = new Date();
    return bookings.filter((b) => BookingAggregate.isUpcoming(b, now));
  }, [bookings]);

  const getPastBookings = useCallback(() => {
    const now = new Date();
    return bookings.filter((b) => BookingAggregate.isPast(b, now));
  }, [bookings]);

  const canCancel = useCallback((booking: Booking) => {
    return BookingAggregate.canCancel(booking);
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