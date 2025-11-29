import User from '../models/User.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Connection from '../models/Connection.js';
import { formatTime } from '../utils/timeUtils.js';

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

  const [year, month, day] = occurrence.date.split('-').map(Number);
  const slotStart = new Date(year, month - 1, day, startHours, startMinutes, 0, 0);
  const slotEnd = new Date(year, month - 1, day, endHours, endMinutes, 0, 0);

  // Filtrer par mode : une réservation 'salon' ne bloque pas un créneau 'domicile'
  const slotModes = occurrence.supportedModes || [];
  const slotSupportsBoth = slotModes.includes('both') || (slotModes.includes('salon') && slotModes.includes('domicile'));

  return bookings
    .filter((booking) => booking && booking.date)
    .filter((booking) => !['cancelled', 'completed'].includes(booking.status))
    .filter((booking) => {
      // Filtrer par mode : seulement les réservations du même mode comptent
      if (!slotSupportsBoth && booking.mode) {
        if (!slotModes.includes(booking.mode)) {
          return false;
        }
      }
      
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
        price: booking.price || 0,
        mode: booking.mode,
        duration: booking.duration || 0,
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

  // Récupérer les créneaux depuis openingHours
  let occurrences = [];
  try {
    occurrences = await getCoiffeurAvailableSlots(coiffeurId, {
      startDate,
      endDate,
      mode,
    });
  } catch (error) {
    // Continuer même si pas de créneaux - on affichera quand même les réservations
  }

  // Récupérer les réservations avec filtrage par mode si spécifié
  const bookingQuery = {
    coiffeur: coiffeurId,
    status: { $nin: ['cancelled', 'completed'] },
    date: {
      $gte: toStartOfDay(startDate),
      $lte: endOfDay(endDate),
    },
  };
  
  // Filtrer par mode si spécifié
  if (mode) {
    bookingQuery.mode = mode;
  }
  
  const bookings = await Booking.find(bookingQuery)
    .select('_id date time duration price status mode slotId client service')
    .lean();

  // Si pas de créneaux mais des réservations, créer des occurrences factices pour afficher les réservations
  if (occurrences.length === 0 && bookings.length > 0) {
    const bookingOccurrences = bookings.map((booking) => {
      const bookingDate = new Date(booking.date);
      // Vérifier que booking.date contient bien l'heure
      if (isNaN(bookingDate.getTime())) {
        console.error('❌ [slotService] Date invalide pour booking:', booking._id, booking.date);
        return null;
      }
      // CORRECTION: booking.date contient TOUJOURS l'heure complète
      // On extrait l'heure directement de booking.date, pas de booking.time
      const bookingHours = bookingDate.getHours();
      const bookingMinutes = bookingDate.getMinutes();
      
      // Si l'heure extraite est 00:00, c'est soit vraiment minuit soit une erreur
      // On vérifie si booking.time existe et est valide pour confirmer
      let bookingTime;
      if (bookingHours === 0 && bookingMinutes === 0) {
        // Si booking.time existe et est valide (format HH:mm et pas "00:00"), l'utiliser
        if (booking.time && /^\d{2}:\d{2}$/.test(booking.time) && booking.time !== '00:00') {
          bookingTime = booking.time;
        } else {
          // Soit c'est vraiment minuit, soit une erreur - on exclut pour éviter "00h 00h"
          console.warn('⚠️ [slotService] Réservation avec heure 00:00 suspecte, exclue:', booking._id);
          return null;
        }
      } else {
        // Extraire l'heure directement de booking.date (source de vérité)
        bookingTime = formatTime(bookingHours + (bookingMinutes / 60));
      }
      
      // Double vérification : ne jamais créer d'occurrence avec "00:00"
      if (!bookingTime || bookingTime === '00:00') {
        return null;
      }
      
      const endTime = new Date(bookingDate);
      endTime.setMinutes(endTime.getMinutes() + (booking.duration || 60));
      const endHoursDecimal = endTime.getHours() + (endTime.getMinutes() / 60);
      const endTimeFormatted = formatTime(endHoursDecimal);
      
      return {
        id: `booking-${booking._id.toString()}`,
        slotId: booking.slotId?.toString() || 'no-slot',
        date: formatDate(bookingDate),
        startTime: bookingTime,
        endTime: endTimeFormatted,
        durationMinutes: booking.duration || 60,
        supportedModes: [booking.mode || 'salon'],
        maxCapacity: 1,
        remainingCapacity: 0,
        isRecurring: false,
        status: 'available',
        dayOfWeek: bookingDate.getDay(),
        serviceTypes: [],
        overlappingBookings: [{
          _id: booking._id?.toString?.() ?? booking._id,
          slotId: booking.slotId?.toString?.() ?? booking.slotId,
          status: booking.status,
          start: bookingDate,
          end: endTime,
          client: booking.client,
          service: booking.service,
          price: booking.price || 0,
          mode: booking.mode,
          duration: booking.duration || 0,
        }],
        availability: 'occupied',
        conflict: false,
      };
    }).filter(Boolean);
    
    return bookingOccurrences;
  }

  return mergeAvailability(occurrences, bookings);
};

export const getCoiffeurAvailableSlots = async (coiffeurId, options = {}) => {
  const {
    startDate = new Date(),
    endDate = addDays(new Date(), 13),
    mode,
  } = options;

  const coiffeur = await User.findById(coiffeurId).select('_id role workingMode salonAddress');
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

  // Logique différente selon le mode
  // Les créneaux bruts sont générés, la fusion avec les bookings sera faite par getAvailabilityWithBookings
  if (mode === 'domicile') {
    return await getDomicileSlots(coiffeur, normalizedStart, normalizedEnd);
  } else {
    return await getSalonSlots(coiffeur, normalizedStart, normalizedEnd, mode);
  }
};

// Générer créneaux pour service à domicile (flexible, basé sur disponibilité temps réel)
// La géolocalisation est gérée dans la recherche de coiffeurs, pas ici
const getDomicileSlots = async (coiffeur, startDate, endDate) => {
  const occurrences = [];
  const now = new Date();

  // 1. Vérifier statut de connexion et disponibilité
  const connection = await Connection.findOne({ userId: coiffeur._id });
  const timeoutMinutes = 2;
  const isOnline = connection && connection.isOnline && 
    (now.getTime() - new Date(connection.lastSeen).getTime()) < (timeoutMinutes * 60 * 1000);
  const isAvailable = connection && connection.availability && connection.availability.isAvailable;

  // Si coiffeur hors ligne ou indisponible, retourner vide
  if (!isOnline || !isAvailable) {
    return [];
  }

  // 3. Générer créneaux flexibles (8h-22h par défaut, ou selon Connection.availability.workingHours)
  const dayMapping = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
  };

  // Horaires par défaut pour domicile (8h-22h)
  const defaultStartHour = 8;
  const defaultEndHour = 22;

  for (let cursor = startDate; cursor.getTime() <= endDate.getTime(); cursor = addDays(cursor, 1)) {
    const dayOfWeek = cursor.getDay();
    const dayName = dayMapping[dayOfWeek];
    
    // Utiliser workingHours de Connection si disponible, sinon horaires par défaut
    let dayStartHour = defaultStartHour;
    let dayEndHour = defaultEndHour;
    let dayIsAvailable = true;

    if (connection?.availability?.workingHours?.[dayName]) {
      const dayHours = connection.availability.workingHours[dayName];
      if (dayHours.start && dayHours.end) {
        const [startH, startM] = dayHours.start.split(':').map(Number);
        const [endH, endM] = dayHours.end.split(':').map(Number);
        dayStartHour = startH + (startM / 60);
        dayEndHour = endH + (endM / 60);
      }
      dayIsAvailable = dayHours.isAvailable !== false;
    }

    // Si jour non disponible, passer
    if (!dayIsAvailable) {
      continue;
    }

    // Générer créneaux de 1h
    const slotDuration = 1;
    for (let slotTime = dayStartHour; slotTime < dayEndHour; slotTime += slotDuration) {
      const slotEndTime = slotTime + slotDuration;
      if (slotEndTime > dayEndHour) break;

      const startTimeStr = formatTime(slotTime);
      const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
      const slotDateTime = new Date(cursor);
      slotDateTime.setHours(startHours, startMinutes, 0, 0);
      
      // Ne pas créer de créneaux passés
      if (slotDateTime.getTime() <= now.getTime()) {
        continue;
      }

      const endTime = formatTime(slotEndTime);
      
      occurrences.push({
        id: `slot-domicile-${coiffeur._id}-${formatDate(cursor)}-${startTimeStr}`,
        slotId: null,
        date: formatDate(cursor),
        startTime: startTimeStr,
        endTime,
        durationMinutes: 60,
        supportedModes: ['domicile'],
        maxCapacity: 1,
        remainingCapacity: 1,
        isRecurring: false,
        status: 'available',
        dayOfWeek,
        serviceTypes: [],
      });
    }
  }

  occurrences.sort((a, b) => {
    if (a.date === b.date) {
      return a.startTime.localeCompare(b.startTime);
    }
    return a.date.localeCompare(b.date);
  });

  // Retourner les créneaux bruts - la fusion sera faite par getAvailabilityWithBookings
  return occurrences;
};

// Générer créneaux pour service en salon (horaires fixes)
const getSalonSlots = async (coiffeur, startDate, endDate, mode) => {
  const occurrences = [];
  const openingHours = coiffeur.salonAddress?.openingHours;
  
  if (!openingHours) {
    return [];
  }

  const dayMapping = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
  };

  const now = new Date();

  for (let cursor = startDate; cursor.getTime() <= endDate.getTime(); cursor = addDays(cursor, 1)) {
    const dayOfWeek = cursor.getDay();
    const dayName = dayMapping[dayOfWeek];
    const dayHours = openingHours[dayName];

    if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) {
      continue;
    }

    const [openHours, openMinutes] = dayHours.open.split(':').map(Number);
    const [closeHours, closeMinutes] = dayHours.close.split(':').map(Number);
    
    const openTime = openHours + (openMinutes / 60);
    const closeTime = closeHours + (closeMinutes / 60);

    const slotDuration = 1;
    for (let slotTime = openTime; slotTime < closeTime; slotTime += slotDuration) {
      const slotEndTime = slotTime + slotDuration;
      if (slotEndTime > closeTime) break;

      const startTimeStr = formatTime(slotTime);
      const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
      const slotDateTime = new Date(cursor);
      slotDateTime.setHours(startHours, startMinutes, 0, 0);
      if (slotDateTime.getTime() <= now.getTime()) {
        continue;
      }

      const supportsMode = !mode || 
        (coiffeur.workingMode && (
          coiffeur.workingMode.includes('both') ||
          coiffeur.workingMode.includes(mode)
        ));

      if (!supportsMode) {
        continue;
      }

      const occurrenceDate = new Date(cursor);
      const startTime = startTimeStr;
      const endTime = formatTime(slotEndTime);
      
      let supportedModes = ['salon'];
      if (coiffeur.workingMode) {
        if (Array.isArray(coiffeur.workingMode)) {
          if (coiffeur.workingMode.includes('both') || coiffeur.workingMode.includes('domicile')) {
            supportedModes = ['salon', 'domicile'];
          } else {
            supportedModes = coiffeur.workingMode;
          }
        } else if (coiffeur.workingMode === 'both') {
          supportedModes = ['salon', 'domicile'];
        } else {
          supportedModes = [coiffeur.workingMode];
        }
      }
      
      occurrences.push({
        id: `slot-${coiffeur._id}-${formatDate(occurrenceDate)}-${startTime}`,
        slotId: null,
        date: formatDate(occurrenceDate),
        startTime,
        endTime,
        durationMinutes: 60,
        supportedModes,
        maxCapacity: 1,
        remainingCapacity: 1,
        isRecurring: true,
        status: 'available',
        dayOfWeek,
        serviceTypes: [],
      });
    }
  }

  occurrences.sort((a, b) => {
    if (a.date === b.date) {
      return a.startTime.localeCompare(b.startTime);
    }
    return a.date.localeCompare(b.date);
  });

  // Retourner les créneaux bruts - la fusion sera faite par getAvailabilityWithBookings
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
