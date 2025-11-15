/**
 * Utilitaires pour la manipulation des dates dans le système de réservation
 * Utilise date-fns pour une gestion cohérente des dates
 */

import { 
  parse, 
  format, 
  addMinutes, 
  addDays, 
  isBefore, 
  isAfter, 
  isSameDay,
  startOfDay,
  endOfDay,
  areIntervalsOverlapping,
  type Interval
} from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Parse une date et une heure en un objet Date
 * @param date - Date au format YYYY-MM-DD
 * @param time - Heure au format HH:MM
 * @returns Date object
 */
export const parseBookingDateTime = (date: string, time: string): Date => {
  try {
    return parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
  } catch (error) {
    throw new Error(`Erreur lors du parsing de la date: ${date} ${time}`);
  }
};

/**
 * Calcule l'heure de fin d'une réservation
 * @param startDate - Date de début
 * @param duration - Durée en minutes
 * @returns Date de fin
 */
export const calculateEndTime = (startDate: Date, duration: number): Date => {
  return addMinutes(startDate, duration);
};

/**
 * Vérifie si deux créneaux se chevauchent
 * @param start1 - Date de début du créneau 1
 * @param end1 - Date de fin du créneau 1
 * @param start2 - Date de début du créneau 2
 * @param end2 - Date de fin du créneau 2
 * @returns true si les créneaux se chevauchent
 */
export const areSlotsOverlapping = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  const interval1: Interval = { start: start1, end: end1 };
  const interval2: Interval = { start: start2, end: end2 };
  return areIntervalsOverlapping(interval1, interval2);
};

/**
 * Vérifie si une date est dans le futur
 * @param date - Date à vérifier
 * @returns true si la date est dans le futur
 */
export const isFutureDate = (date: Date): boolean => {
  return isAfter(date, new Date());
};

/**
 * Vérifie si une date est valide
 * @param date - Date à vérifier
 * @returns true si la date est valide
 */
export const isValidDate = (date: Date): boolean => {
  return !isNaN(date.getTime());
};

/**
 * Formate une date pour l'affichage
 * @param date - Date à formater
 * @param formatStr - Format de sortie (par défaut: 'dd/MM/yyyy')
 * @returns Date formatée
 */
export const formatDate = (date: Date | string, formatStr: string = 'dd/MM/yyyy'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: fr });
};

/**
 * Formate une heure pour l'affichage
 * @param date - Date contenant l'heure
 * @param formatStr - Format de sortie (par défaut: 'HH:mm')
 * @returns Heure formatée
 */
export const formatTime = (date: Date | string, formatStr: string = 'HH:mm'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: fr });
};

/**
 * Formate une date et une heure pour l'affichage
 * @param date - Date à formater
 * @returns Date et heure formatées
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy à HH:mm', { locale: fr });
};

/**
 * Génère un tableau de dates pour les 7 prochains jours
 * @param startDate - Date de départ (par défaut: aujourd'hui)
 * @returns Tableau de dates au format YYYY-MM-DD
 */
export const generateNext7Days = (startDate: Date = new Date()): string[] => {
  return Array.from({ length: 7 }, (_, i) => 
    format(addDays(startDate, i), 'yyyy-MM-dd')
  );
};

/**
 * Génère les créneaux horaires disponibles
 * @param startHour - Heure de début (par défaut: 9, 0 = 00h00)
 * @param endHour - Heure de fin (par défaut: 17, 24 = 00h00 du lendemain = 24h/24h)
 * @param interval - Intervalle en minutes (par défaut: 60)
 * @returns Tableau d'heures au format HH:MM
 */
export const generateTimeSlots = (
  startHour: number = 9,
  endHour: number = 17,
  interval: number = 60
): string[] => {
  const slots: string[] = [];
  
  // ✅ CORRIGÉ: Gérer les créneaux 24h/24h (00h-00h) pour mode domicile
  // Si startHour = 0 et endHour = 24, on génère de 00h00 à 23h59
  const actualStartHour = startHour === 0 ? 0 : startHour;
  const actualEndHour = endHour === 24 ? 24 : endHour;
  
  // Calculer le nombre total de minutes
  let totalMinutes: number;
  if (actualStartHour === 0 && actualEndHour === 24) {
    // Mode 24h/24h : de 00h00 à 23h59 (1440 minutes)
    totalMinutes = 24 * 60;
  } else if (actualEndHour === 24) {
    // De startHour à minuit
    totalMinutes = (24 - actualStartHour) * 60;
  } else {
    totalMinutes = (actualEndHour - actualStartHour) * 60;
  }
  
  const numberOfSlots = Math.floor(totalMinutes / interval);
  
  for (let i = 0; i < numberOfSlots; i++) {
    const minutes = actualStartHour * 60 + i * interval;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    // ✅ CORRIGÉ: Gérer les heures >= 24 (minuit)
    if (hours >= 24) {
      // Si on dépasse 24h, on s'arrête (ne pas inclure 00:00 du lendemain)
      break;
    }
    
    // ✅ CORRIGÉ: Pour mode 24h/24h, ne pas inclure 00:00 du lendemain
    // Le dernier créneau sera 23:00 (si interval = 60) ou 23:30 (si interval = 30)
    if (actualStartHour === 0 && actualEndHour === 24 && hours === 24) {
      break;
    }
    
    slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
  }
  
  return slots;
};

/**
 * ✅ NOUVEAU: Génère les créneaux horaires selon les heures d'ouverture du coiffeur
 * @param openingHours - Heures d'ouverture du coiffeur (salonAddress.openingHours)
 * @param date - Date pour laquelle générer les créneaux
 * @param interval - Intervalle en minutes (par défaut: 60)
 * @returns Tableau d'heures au format HH:MM
 */
export const generateTimeSlotsFromOpeningHours = (
  openingHours: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  } | null | undefined,
  date: Date | string,
  interval: number = 60
): string[] => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dayOfWeek = dateObj.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  
  // Mapper le jour de la semaine JavaScript (0-6) vers les clés d'ouverture
  const dayMap: Record<number, keyof typeof openingHours> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
  };
  
  const dayKey = dayMap[dayOfWeek];
  const dayHours = openingHours?.[dayKey];
  
  // Si pas d'heures d'ouverture ou jour fermé, retourner créneaux par défaut (9h-19h)
  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) {
    return generateTimeSlots(9, 19, interval);
  }
  
  // Parser les heures d'ouverture (format HH:MM)
  const [openHour, openMinute] = dayHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
  
  const startHour = openHour;
  const endHour = closeHour;
  
  // Générer les créneaux selon les heures d'ouverture
  return generateTimeSlots(startHour, endHour, interval);
};

/**
 * ✅ NOUVEAU: Génère les créneaux horaires selon les WorkingSlots du coiffeur
 * @param workingSlots - Créneaux de travail du coiffeur
 * @param date - Date pour laquelle générer les créneaux
 * @param interval - Intervalle en minutes (par défaut: 60)
 * @param mode - Mode de réservation ('salon' | 'domicile') pour filtrer les créneaux
 * @returns Tableau d'heures au format HH:MM
 */
export const generateTimeSlotsFromWorkingSlots = (
  workingSlots: Array<{
    dayOfWeek: number;
    startTime: number;
    endTime: number;
    status: string;
    availableAt?: 'salon' | 'domicile' | 'both';
    exceptions?: Array<{ date: string }>;
  }>,
  date: Date | string,
  interval: number = 60,
  mode?: 'salon' | 'domicile'
): string[] => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dayOfWeek = dateObj.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Trouver les créneaux de travail pour ce jour
  const daySlots = workingSlots.filter(slot => {
    // Vérifier le jour de la semaine
    if (slot.dayOfWeek !== dayOfWeek) return false;
    
    // ✅ NOUVEAU: Filtrer selon le mode de réservation (salon ou domicile)
    if (mode) {
      if (slot.availableAt === 'salon' && mode === 'domicile') return false;
      if (slot.availableAt === 'domicile' && mode === 'salon') return false;
      // Si availableAt === 'both', on garde le créneau
    }
    
    // Vérifier le statut
    if (slot.status !== 'available' && slot.status !== 'booked') return false;
    
    // Vérifier les exceptions
    if (slot.exceptions?.some(exception => exception.date === dateStr)) return false;
    
    return true;
  });
  
  // Si pas de créneaux de travail, retourner créneaux par défaut selon le mode
  if (daySlots.length === 0) {
    // ✅ CORRIGÉ: Pour domicile, mode 24h/24h (00h-00h) selon v0.7.17
    if (mode === 'domicile') {
      return generateTimeSlots(0, 24, interval); // 00h-00h (24h/24h)
    }
    // Pour salon, créneaux par défaut (9h-19h)
    return generateTimeSlots(9, 19, interval);
  }
  
  // Générer les créneaux selon les créneaux de travail
  const allSlots: Set<string> = new Set();
  
  daySlots.forEach(slot => {
    // ✅ NOUVEAU: Gérer les créneaux qui vont jusqu'à minuit (endTime = 24)
    let endTime = slot.endTime;
    if (endTime === 0) {
      // Si endTime = 0, cela signifie minuit (00h)
      endTime = 24;
    }
    const slots = generateTimeSlots(slot.startTime, endTime, interval);
    slots.forEach(s => allSlots.add(s));
  });
  
  // Trier les créneaux par heure
  return Array.from(allSlots).sort();
};

/**
 * Vérifie si un créneau est disponible
 * @param date - Date du créneau
 * @param time - Heure du créneau
 * @param duration - Durée en minutes
 * @param existingBookings - Réservations existantes
 * @returns true si le créneau est disponible
 */
export const isSlotAvailable = (
  date: string,
  time: string,
  duration: number,
  existingBookings: Array<{ date: Date | string; duration: number }>
): boolean => {
  try {
    const bookingStart = parseBookingDateTime(date, time);
    const bookingEnd = calculateEndTime(bookingStart, duration);
    
    return !existingBookings.some(booking => {
      const existingStart = typeof booking.date === 'string' 
        ? new Date(booking.date) 
        : booking.date;
      const existingEnd = calculateEndTime(existingStart, booking.duration);
      
      return areSlotsOverlapping(bookingStart, bookingEnd, existingStart, existingEnd);
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de disponibilité:', error);
    return false;
  }
};

/**
 * Calcule les heures restantes jusqu'à une date
 * @param date - Date cible
 * @returns Nombre d'heures restantes
 */
export const getHoursUntil = (date: Date | string): number => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
};

/**
 * Vérifie si une date est dans les 48 prochaines heures
 * @param date - Date à vérifier
 * @returns true si la date est dans les 48 prochaines heures
 */
export const isWithin48Hours = (date: Date | string): boolean => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const hoursUntil = getHoursUntil(targetDate);
  return hoursUntil >= 0 && hoursUntil <= 48;
};

/**
 * Vérifie si une date est dans les 24 prochaines heures
 * @param date - Date à vérifier
 * @returns true si la date est dans les 24 prochaines heures
 */
export const isWithin24Hours = (date: Date | string): boolean => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const hoursUntil = getHoursUntil(targetDate);
  return hoursUntil >= 0 && hoursUntil <= 24;
};

/**
 * Vérifie si une date de booking est aujourd'hui
 * @param bookingDate - Date du booking
 * @returns true si la date est aujourd'hui
 */
export const isToday = (bookingDate: Date | string): boolean => {
  const date = typeof bookingDate === 'string' ? new Date(bookingDate) : bookingDate;
  return isSameDay(date, new Date());
};

/**
 * Vérifie si une réservation est passée (date + heure)
 * @param bookingDate - Date du booking (avec heure)
 * @param duration - Durée en minutes (optionnel, pour vérifier si la prestation est terminée)
 * @returns true si la réservation est passée
 */
export const isBookingPast = (bookingDate: Date | string, duration: number = 0): boolean => {
  const date = typeof bookingDate === 'string' ? new Date(bookingDate) : bookingDate;
  const now = new Date();
  
  // Si on a une durée, vérifier si la prestation est terminée
  if (duration > 0) {
    const endTime = addMinutes(date, duration);
    return endTime <= now;
  }
  
  // Sinon, vérifier si la date/heure de début est passée
  return date <= now;
};

/**
 * Vérifie si on peut confirmer le début de prestation
 * Le bouton doit apparaître uniquement le jour du RDV, à l'heure ou proche
 * @param bookingDate - Date du booking
 * @param duration - Durée en minutes
 * @returns true si on peut confirmer le début
 */
export const canConfirmServiceStart = (bookingDate: Date | string, duration: number = 0): boolean => {
  const date = typeof bookingDate === 'string' ? new Date(bookingDate) : bookingDate;
  const now = new Date();
  
  // Vérifier si c'est aujourd'hui
  if (!isToday(date)) {
    return false;
  }
  
  // Vérifier si on est dans la fenêtre de confirmation :
  // - 10 minutes avant l'heure prévue
  // - Jusqu'à 1 heure après l'heure prévue
  const minutesBefore = 10;
  const minutesAfter = 60;
  
  const startWindow = addMinutes(date, -minutesBefore);
  const endWindow = addMinutes(date, minutesAfter);
  
  return now >= startWindow && now <= endWindow;
};

/**
 * Vérifie si on peut confirmer la fin de prestation
 * Le bouton doit apparaître uniquement le jour du RDV, après l'heure de fin estimée
 * @param bookingDate - Date du booking
 * @param duration - Durée en minutes
 * @returns true si on peut confirmer la fin
 */
export const canConfirmServiceEnd = (bookingDate: Date | string, duration: number): boolean => {
  const date = typeof bookingDate === 'string' ? new Date(bookingDate) : bookingDate;
  const now = new Date();
  
  // Vérifier si c'est aujourd'hui
  if (!isToday(date)) {
    return false;
  }
  
  // Vérifier si on est après l'heure de fin estimée
  const endTime = addMinutes(date, duration);
  const minutesBefore = 5; // 5 minutes avant la fin estimée
  
  const startWindow = addMinutes(endTime, -minutesBefore);
  
  return now >= startWindow;
};

