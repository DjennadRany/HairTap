import { describe, it, expect } from 'vitest';
import { validateBookingRules } from '../../hooks/useBookingValidation';
import type { Booking } from '../../services/api/bookings';
import type { CoiffeurSlotDTO } from '../../services/api/coiffeurs';

describe('validateBookingRules', () => {
  const baseSlot: CoiffeurSlotDTO = {
    id: 'slot-1-2024-05-01',
    slotId: 'slot-1',
    date: '2024-05-01',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    supportedModes: ['salon', 'domicile'],
    maxCapacity: 1,
    remainingCapacity: 1,
    isRecurring: true,
    status: 'available',
    dayOfWeek: 3,
    serviceTypes: [],
  };

  const baseContext = {
    existingBookings: [] as Booking[],
    coiffeurModes: ['salon', 'domicile'],
  };

  it('rejette les modes non proposés par le coiffeur', () => {
    const result = validateBookingRules(
      { ...baseContext, coiffeurModes: ['salon'] },
      {
        bookingMode: 'domicile',
        serviceDuration: 45,
        selectedDate: '2024-05-01',
        selectedTime: '10:00',
      }
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Le coiffeur ne propose pas ce mode de réservation.');
  });

  it('rejette les créneaux qui ne supportent pas le mode', () => {
    const slot: CoiffeurSlotDTO = {
      ...baseSlot,
      supportedModes: ['salon'],
    };

    const result = validateBookingRules(baseContext, {
      bookingMode: 'domicile',
      serviceDuration: 45,
      selectedDate: '2024-05-01',
      selectedTime: '10:00',
      slot,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Ce créneau ne permet pas la réservation dans ce mode.');
  });

  it('rejette les services plus longs que le créneau', () => {
    const result = validateBookingRules(baseContext, {
      bookingMode: 'salon',
      serviceDuration: 120,
      selectedDate: '2024-05-01',
      selectedTime: '10:00',
      slot: baseSlot,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('La durée du service dépasse la durée disponible du créneau.');
  });

  it('détecte les chevauchements de réservations existantes', () => {
    const existingBooking: Booking = {
      _id: 'booking-1',
      client: 'client-1',
      coiffeur: 'coiffeur-1',
      service: 'Coupe',
      serviceId: 'service-1',
      slotId: 'slot-1',
      coiffeurId: 'coiffeur-1',
      clientId: 'client-1',
      date: '2024-05-01T10:00:00',
      time: '10:00',
      duration: 60,
      status: 'pending',
      paymentStatus: 'pending',
      price: 50,
      mode: 'salon',
      notes: '',
      createdAt: '2024-04-01T10:00:00',
      updatedAt: '2024-04-01T10:00:00',
    };

    const context = {
      ...baseContext,
      existingBookings: [existingBooking],
    };

    const result = validateBookingRules(context, {
      bookingMode: 'salon',
      serviceDuration: 30,
      selectedDate: '2024-05-01',
      selectedTime: '10:30',
      slot: baseSlot,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Ce créneau chevauche une réservation existante.');
  });

  it('valide une réservation lorsque toutes les règles sont respectées', () => {
    const result = validateBookingRules(baseContext, {
      bookingMode: 'salon',
      serviceDuration: 45,
      selectedDate: '2024-05-02',
      selectedTime: '11:00',
      slot: {
        ...baseSlot,
        id: 'slot-2-2024-05-02',
        slotId: 'slot-2',
        date: '2024-05-02',
        startTime: '11:00',
        endTime: '12:00',
      },
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
