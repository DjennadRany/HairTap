import { useCallback, useMemo } from 'react';
import type { Booking } from '../services/api/bookings';
import type { CoiffeurSlotDTO, CoiffeurSlotMode } from '../services/api/coiffeurs';

export interface BookingValidationContext {
  existingBookings: Booking[];
  coiffeurModes: string[];
}

export interface BookingValidationInput {
  bookingMode: CoiffeurSlotMode;
  serviceDuration: number;
  selectedDate: string;
  selectedTime: string;
  slot?: CoiffeurSlotDTO;
}

export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
}

const DEFAULT_MODES: CoiffeurSlotMode[] = ['salon', 'domicile'];

const parseDateTime = (date: string, time: string) => {
  const instance = new Date(`${date}T${time}`);
  return Number.isNaN(instance.getTime()) ? null : instance;
};

const hasOverlap = (existing: Booking[], start: Date, end: Date) => {
  return existing.some((booking) => {
    if (!booking.date || typeof booking.duration !== 'number') {
      return false;
    }

    const bookingStart = new Date(booking.date);
    if (Number.isNaN(bookingStart.getTime())) {
      return false;
    }

    const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
    return bookingStart < end && bookingEnd > start;
  });
};

export const validateBookingRules = (
  context: BookingValidationContext,
  input: BookingValidationInput
): BookingValidationResult => {
  const errors: string[] = [];
  const allowedModes = context.coiffeurModes?.length ? context.coiffeurModes : DEFAULT_MODES;

  if (!allowedModes.includes(input.bookingMode)) {
    errors.push('Le coiffeur ne propose pas ce mode de réservation.');
  }

  const startDate = parseDateTime(input.selectedDate, input.selectedTime);
  if (!startDate) {
    errors.push('Date ou heure de réservation invalide.');
    return { isValid: false, errors };
  }

  const endDate = new Date(startDate.getTime() + input.serviceDuration * 60000);

  if (input.slot) {
    if (!input.slot.supportedModes.includes(input.bookingMode)) {
      errors.push('Ce créneau ne permet pas la réservation dans ce mode.');
    }

    if (input.slot.durationMinutes < input.serviceDuration) {
      errors.push('La durée du service dépasse la durée disponible du créneau.');
    }

    if (input.slot.remainingCapacity !== undefined && input.slot.remainingCapacity <= 0) {
      errors.push('Ce créneau n\'est plus disponible.');
    }

    if (input.slot.date !== input.selectedDate || input.slot.startTime !== input.selectedTime) {
      errors.push('Le créneau sélectionné ne correspond pas à la date ou à l\'heure choisie.');
    }
  }

  if (hasOverlap(context.existingBookings || [], startDate, endDate)) {
    errors.push('Ce créneau chevauche une réservation existante.');
  }

  return { isValid: errors.length === 0, errors };
};

export const useBookingValidation = (context: BookingValidationContext) => {
  const memoizedContext = useMemo(() => ({
    existingBookings: context.existingBookings || [],
    coiffeurModes: context.coiffeurModes || [],
  }), [context.existingBookings, context.coiffeurModes]);

  const validateBooking = useCallback((input: BookingValidationInput) => {
    return validateBookingRules(memoizedContext, input);
  }, [memoizedContext]);

  const canUseSlot = useCallback((slot: CoiffeurSlotDTO, bookingMode: CoiffeurSlotMode, serviceDuration: number) => {
    return validateBookingRules(memoizedContext, {
      bookingMode,
      serviceDuration,
      selectedDate: slot.date,
      selectedTime: slot.startTime,
      slot,
    });
  }, [memoizedContext]);

  return {
    validateBooking,
    canUseSlot,
  };
};
