import { renderHook, act } from '@testing-library/react-hooks';
import { useClientBookings, Booking } from '../useClientBookings';

// Mock du localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) { return store[key] || null; },
    setItem(key: string, value: string) { store[key] = value; },
    removeItem(key: string) { delete store[key]; },
    clear() { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useClientBookings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('ajoute une réservation et la retrouve', () => {
    const { result } = renderHook(() => useClientBookings());
    const booking: Booking = {
      id: 'test-1',
      coiffeurId: 1,
      coiffeurName: 'Test Coiffeur',
      service: 'Coupe',
      date: '2024-01-01T10:00',
      price: 30,
      status: 'confirmed',
      mode: 'salon',
      paymentStatus: 'paid',
      cancellationDeadline: '2024-01-01T00:00',
    };
    act(() => {
      result.current.addBooking(booking);
    });
    expect(result.current.bookings[0]).toMatchObject(booking);
    // Persistance
    const stored = JSON.parse(window.localStorage.getItem('client_bookings')!);
    expect(stored[0]).toMatchObject(booking);
  });

  it('annule une réservation', () => {
    const { result } = renderHook(() => useClientBookings());
    const booking: Booking = {
      id: 'test-2',
      coiffeurId: 2,
      coiffeurName: 'Test Coiffeur',
      service: 'Brushing',
      date: '2024-01-02T11:00',
      price: 40,
      status: 'confirmed',
      mode: 'salon',
      paymentStatus: 'paid',
      cancellationDeadline: '2024-01-02T00:00',
    };
    act(() => {
      result.current.addBooking(booking);
      result.current.cancelBooking('test-2');
    });
    expect(result.current.bookings[0].status).toBe('cancelled');
    expect(result.current.bookings[0].paymentStatus).toBe('refunded');
  });

  it('retourne le mock si localStorage indisponible', () => {
    const original = window.localStorage;
    // Simule une indisponibilité
    Object.defineProperty(window, 'localStorage', { value: undefined });
    const { result } = renderHook(() => useClientBookings());
    expect(result.current.bookings.length).toBeGreaterThan(0);
    // Restore
    Object.defineProperty(window, 'localStorage', { value: original });
  });
}); 