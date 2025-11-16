import WorkingSlot from '../models/WorkingSlot.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => new Date(date.getTime() + days * MS_PER_DAY);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (value) => {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const parseTimeString = (timeString) => {
  if (!timeString) return { hours: 0, minutes: 0 };
  const [hours, minutes] = timeString.split(':').map((part) => Number.parseInt(part, 10));
  return { hours: Number.isFinite(hours) ? hours : 0, minutes: Number.isFinite(minutes) ? minutes : 0 };
};

const slotSupportsMode = (slot, mode) => {
  if (!mode) return true;
  if (slot.availableAt === 'both') return true;
  return slot.availableAt === mode;
};

const hasExceptionOnDate = (slot, date) => {
  if (!Array.isArray(slot.exceptions) || slot.exceptions.length === 0) {
    return false;
  }
  return slot.exceptions.some((exception) => {
    if (!exception?.date) return false;
    const exceptionDate = new Date(exception.date);
    exceptionDate.setHours(0, 0, 0, 0);
    return exceptionDate.getTime() === date.getTime();
  });
};

const buildSlotOccurrences = (slot, options) => {
  const { startDate, endDate, mode } = options;
  const occurrences = [];
  const slotStartDate = toStartOfDay(startDate);
  const slotEndDate = toStartOfDay(endDate);

  for (let cursor = slotStartDate; cursor.getTime() <= slotEndDate.getTime(); cursor = addDays(cursor, 1)) {
    if (cursor.getDay() !== slot.dayOfWeek) {
      continue;
    }

    if (!slotSupportsMode(slot, mode)) {
      continue;
    }

    if (hasExceptionOnDate(slot, cursor)) {
      continue;
    }

    const occurrenceDate = new Date(cursor);
    const startTime = formatTime(slot.startTime);
    const endTime = formatTime(slot.endTime);
    const supportedModes = slot.availableAt === 'both'
      ? ['salon', 'domicile']
      : [slot.availableAt];
    const durationMinutes = Math.max(0, Math.round((slot.endTime - slot.startTime) * 60));
    const remainingCapacity = typeof slot.getRemainingCapacity === 'function'
      ? slot.getRemainingCapacity()
      : Math.max(0, (slot.maxBookings ?? 1) - (slot.currentBookings ?? 0));

    occurrences.push({
      id: `${slot._id.toString()}-${formatDate(occurrenceDate)}`,
      slotId: slot._id.toString(),
      date: formatDate(occurrenceDate),
      startTime,
      endTime,
      durationMinutes,
      supportedModes,
      maxCapacity: slot.maxBookings ?? 1,
      remainingCapacity,
      isRecurring: Boolean(slot.isRecurring),
      status: slot.status,
      dayOfWeek: slot.dayOfWeek,
      serviceTypes: slot.serviceTypes ?? [],
    });
  }

  return occurrences;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const computeAvailabilityState = (occurrence, overlappingBookings) => {
  if (['maintenance', 'unavailable'].includes(occurrence.status)) {
    return 'unavailable';
  }

  const effectiveRemaining = Math.max(
    0,
    (occurrence.remainingCapacity ?? occurrence.maxCapacity ?? 1) - overlappingBookings.length
  );

  const capacity = occurrence.maxCapacity ?? 1;
  const conflict = overlappingBookings.length > capacity;

  return {
    availability: effectiveRemaining > 0 ? 'free' : 'occupied',
    remainingCapacity: effectiveRemaining,
    conflict,
  };
};

const filterOverlappingBookings = (occurrence, bookings = []) => {
  const { hours: startHours, minutes: startMinutes } = parseTimeString(occurrence.startTime);
  const { hours: endHours, minutes: endMinutes } = parseTimeString(occurrence.endTime);

  const slotStart = new Date(`${occurrence.date}T00:00:00.000Z`);
  slotStart.setUTCHours(startHours, startMinutes, 0, 0);
  const slotEnd = new Date(`${occurrence.date}T00:00:00.000Z`);
  slotEnd.setUTCHours(endHours, endMinutes, 0, 0);

  return bookings
    .filter((booking) => booking && booking.date)
    .filter((booking) => !['cancelled', 'completed'].includes(booking.status))
    .filter((booking) => {
      const bookingStart = new Date(booking.date);
      const bookingEnd = new Date(bookingStart.getTime() + (booking.duration ?? 0) * 60000);

      return bookingStart < slotEnd && bookingEnd > slotStart;
    })
    .map((booking) => {
      const bookingStart = new Date(booking.date);
      const bookingEnd = new Date(bookingStart.getTime() + (booking.duration ?? 0) * 60000);

      return {
        _id: booking._id?.toString?.() ?? booking._id,
        slotId: booking.slotId?.toString?.() ?? booking.slotId,
        status: booking.status,
        start: bookingStart,
        end: bookingEnd,
        client: booking.client,
        service: booking.service,
      };
    });
};

export const mergeAvailability = (occurrences = [], bookings = []) => {
  return occurrences.map((occurrence) => {
    const overlappingBookings = filterOverlappingBookings(occurrence, bookings);
    const { availability, remainingCapacity, conflict } = computeAvailabilityState(
      occurrence,
      overlappingBookings
    );

    return {
      ...occurrence,
      overlappingBookings,
      remainingCapacity,
      availability,
      conflict,
    };
  });
};

export const getAvailabilityWithBookings = async (coiffeurId, options = {}) => {
  const {
    startDate = new Date(),
    endDate = addDays(new Date(), 13),
    mode,
  } = options;

  const occurrences = await getCoiffeurAvailableSlots(coiffeurId, {
    startDate,
    endDate,
    mode,
  });

  const bookings = await Booking.find({
    coiffeur: coiffeurId,
    status: { $nin: ['cancelled', 'completed'] },
    date: {
      $gte: toStartOfDay(startDate),
      $lte: endOfDay(endDate),
    },
  }).lean();

  return mergeAvailability(occurrences, bookings);
};

export const getCoiffeurAvailableSlots = async (coiffeurId, options = {}) => {
  const {
    startDate = new Date(),
    endDate = addDays(new Date(), 13),
    mode,
  } = options;

  const coiffeur = await User.findById(coiffeurId).select('_id role workingMode');
  if (!coiffeur || coiffeur.role !== 'coiffeur') {
    const error = new Error('Coiffeur non trouvé');
    error.status = 404;
    throw error;
  }

  const normalizedStart = toStartOfDay(startDate);
  const normalizedEnd = toStartOfDay(endDate);

  if (normalizedEnd.getTime() < normalizedStart.getTime()) {
    const error = new Error('La date de fin doit être postérieure à la date de début');
    error.status = 400;
    throw error;
  }

  const slots = await WorkingSlot.getCoiffeurSlots(coiffeurId, false);
  const occurrences = slots.flatMap((slot) => buildSlotOccurrences(slot, {
    startDate: normalizedStart,
    endDate: normalizedEnd,
    mode,
  }));

  occurrences.sort((a, b) => {
    if (a.date === b.date) {
      return a.startTime.localeCompare(b.startTime);
    }
    return a.date.localeCompare(b.date);
  });

  return occurrences;
};

export const ensureServiceDurationFitsSlot = (serviceDuration, slot) => {
  if (!slot) return true;
  return serviceDuration <= slot.durationMinutes;
};

export const fetchServiceForBooking = async (serviceId, coiffeurId) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    const error = new Error('Service introuvable');
    error.status = 404;
    throw error;
  }

  if (service.coiffeur.toString() !== coiffeurId.toString()) {
    const error = new Error('Service ne correspond pas au coiffeur');
    error.status = 400;
    throw error;
  }

  return service;
};

export default {
  getCoiffeurAvailableSlots,
  ensureServiceDurationFitsSlot,
  fetchServiceForBooking,
  mergeAvailability,
  getAvailabilityWithBookings,
};
