import { Booking } from '../hooks/useClientBookings';

export class BookingAggregate {
  static isUpcoming(booking: Booking, now: Date = new Date()): boolean {
    return (
      new Date(booking.date) > now &&
      (booking.status === 'pending' || booking.status === 'confirmed')
    );
  }

  static isPast(booking: Booking, now: Date = new Date()): boolean {
    return (
      new Date(booking.date) <= now ||
      booking.status === 'cancelled' ||
      booking.status === 'completed'
    );
  }

  static hasConflict(bookings: Booking[], newBooking: Booking): boolean {
    // Conflit strict : même coiffeur, même date/heure, non annulée
    return bookings.some(
      (b) =>
        b.coiffeurId === newBooking.coiffeurId &&
        b.date === newBooking.date &&
        b.status !== 'cancelled'
    );
  }

  static canCancel(booking: Booking, now: Date = new Date()): boolean {
    if (booking.status === 'cancelled') return false;
    const deadline = new Date(booking.cancellationDeadline);
    return now < deadline;
  }

  // Pour aller plus loin : gestion des chevauchements horaires
  static hasOverlap(bookings: Booking[], newBooking: Booking, serviceDurationMinutes: number): boolean {
    const newStart = new Date(newBooking.date).getTime();
    const newEnd = newStart + serviceDurationMinutes * 60 * 1000;
    return bookings.some((b) => {
      if (b.coiffeurId !== newBooking.coiffeurId || b.status === 'cancelled') return false;
      const bStart = new Date(b.date).getTime();
      // TODO: récupérer la vraie durée du service pour chaque booking
      const bEnd = bStart + serviceDurationMinutes * 60 * 1000;
      return (newStart < bEnd && newEnd > bStart);
    });
  }

  static hasClientConflict(bookings: Booking[], newBooking: Booking): boolean {
    // Conflit : même date/heure, non annulée, quel que soit le coiffeur
    return bookings.some(
      (b) =>
        b.date === newBooking.date &&
        b.status !== 'cancelled'
    );
  }
} 