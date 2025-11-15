import WorkingSlot from '../models/WorkingSlot.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

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
    const remainingCapacity = Math.max(0, (slot.maxBookings ?? 1) - (slot.currentBookings ?? 0));

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
};
