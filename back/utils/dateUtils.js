/**
 * Utilitaires pour la manipulation des dates dans le système de réservation (Backend)
 * Utilise date-fns pour une gestion cohérente des dates
 */

import { 
  parse, 
  format, 
  addMinutes, 
  isBefore, 
  isAfter,
  areIntervalsOverlapping
} from 'date-fns';

/**
 * Parse une date et une heure en un objet Date
 * @param {string} date - Date au format YYYY-MM-DD
 * @param {string} time - Heure au format HH:MM
 * @returns {Date} Date object
 */
export const parseBookingDateTime = (date, time) => {
  try {
    if (!date || !time) {
      throw new Error('Date et heure requises');
    }
    
    // Format: YYYY-MM-DD HH:MM
    const dateTimeString = `${date} ${time}`;
    return parse(dateTimeString, 'yyyy-MM-dd HH:mm', new Date());
  } catch (error) {
    throw new Error(`Erreur lors du parsing de la date: ${date} ${time} - ${error.message}`);
  }
};

/**
 * Calcule l'heure de fin d'une réservation
 * @param {Date} startDate - Date de début
 * @param {number} duration - Durée en minutes
 * @returns {Date} Date de fin
 */
export const calculateEndTime = (startDate, duration) => {
  if (!startDate || !duration) {
    throw new Error('Date de début et durée requises');
  }
  return addMinutes(startDate, duration);
};

/**
 * Vérifie si deux créneaux se chevauchent
 * @param {Date} start1 - Date de début du créneau 1
 * @param {Date} end1 - Date de fin du créneau 1
 * @param {Date} start2 - Date de début du créneau 2
 * @param {Date} end2 - Date de fin du créneau 2
 * @returns {boolean} true si les créneaux se chevauchent
 */
export const areSlotsOverlapping = (start1, end1, start2, end2) => {
  try {
    return areIntervalsOverlapping(
      { start: start1, end: end1 },
      { start: start2, end: end2 }
    );
  } catch (error) {
    console.error('Erreur lors de la vérification de chevauchement:', error);
    return false;
  }
};

/**
 * Vérifie si une date est dans le futur
 * @param {Date} date - Date à vérifier
 * @returns {boolean} true si la date est dans le futur
 */
export const isFutureDate = (date) => {
  if (!date) return false;
  return isAfter(date, new Date());
};

/**
 * Vérifie si une date est valide
 * @param {Date} date - Date à vérifier
 * @returns {boolean} true si la date est valide
 */
export const isValidDate = (date) => {
  if (!date) return false;
  return !isNaN(date.getTime());
};

/**
 * Formate une date pour l'affichage
 * @param {Date} date - Date à formater
 * @param {string} formatStr - Format de sortie (par défaut: 'dd/MM/yyyy')
 * @returns {string} Date formatée
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValidDate(dateObj)) return '';
  return format(dateObj, formatStr);
};

/**
 * Formate une heure pour l'affichage
 * @param {Date} date - Date contenant l'heure
 * @param {string} formatStr - Format de sortie (par défaut: 'HH:mm')
 * @returns {string} Heure formatée
 */
export const formatTime = (date, formatStr = 'HH:mm') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValidDate(dateObj)) return '';
  return format(dateObj, formatStr);
};

/**
 * Calcule les heures restantes jusqu'à une date
 * @param {Date|string} date - Date cible
 * @returns {number} Nombre d'heures restantes
 */
export const getHoursUntil = (date) => {
  if (!date) return 0;
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  if (!isValidDate(targetDate)) return 0;
  
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
};

/**
 * Vérifie si une date est dans les 48 prochaines heures
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean} true si la date est dans les 48 prochaines heures
 */
export const isWithin48Hours = (date) => {
  if (!date) return false;
  const hoursUntil = getHoursUntil(date);
  return hoursUntil >= 0 && hoursUntil <= 48;
};

/**
 * Vérifie si une date est dans les 24 prochaines heures
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean} true si la date est dans les 24 prochaines heures
 */
export const isWithin24Hours = (date) => {
  if (!date) return false;
  const hoursUntil = getHoursUntil(date);
  return hoursUntil >= 0 && hoursUntil <= 24;
};

