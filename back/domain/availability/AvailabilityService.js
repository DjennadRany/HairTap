import WorkingSlot from '../../models/WorkingSlot.js';
import Booking from '../../models/Booking.js';

/**
 * Service de domaine pour calculer la disponibilité en temps réel
 * Utilise WorkingSlot existant pour les réservations
 */
class AvailabilityService {
  /**
   * Calculer le statut de disponibilité d'un coiffeur pour une date donnée
   * @param {string} coiffeurId - ID du coiffeur
   * @param {Date|string} date - Date pour laquelle calculer la disponibilité
   * @returns {Promise<'now' | 'in_hour' | 'today' | 'unavailable'>} Statut de disponibilité
   */
  async calculateAvailabilityStatus(coiffeurId, date = null) {
    try {
      const now = new Date();
      const targetDate = date ? new Date(date) : now;
      
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Si la date cible est différente d'aujourd'hui, retourner 'today' ou 'unavailable'
      const isToday = targetDate.toDateString() === now.toDateString();
      if (!isToday) {
        // Vérifier si le coiffeur a des créneaux disponibles pour cette date
        const dayOfWeek = targetDate.getDay();
        const dateString = targetDate.toISOString().split('T')[0];
        const availableSlots = await WorkingSlot.getAvailableSlots(
          coiffeurId,
          dayOfWeek,
          dateString
        );
        
        if (!availableSlots || availableSlots.length === 0) {
          return 'unavailable';
        }
        return 'today';
      }
      
      // Récupérer les working slots disponibles pour aujourd'hui
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayOfWeek = now.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
      
      const availableSlots = await WorkingSlot.getAvailableSlots(
        coiffeurId,
        dayOfWeek,
        today
      );
      
      if (!availableSlots || availableSlots.length === 0) {
        return 'unavailable';
      }
      
      // Récupérer les réservations actives du coiffeur pour aujourd'hui
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      
      const activeBookings = await Booking.find({
        coiffeur: coiffeurId,
        date: {
          $gte: todayStart,
          $lte: todayEnd
        },
        status: { $in: ['pending', 'confirmed'] }
      });
      
      let hasNow = false; // Disponible maintenant (dans l'heure actuelle)
      let hasInHour = false; // Disponible dans l'heure qui vient
      let hasToday = false; // Disponible dans la journée
      
      // Vérifier tous les créneaux disponibles
      for (const slot of availableSlots) {
        if (slot.status !== 'available') continue;
        if (slot.currentBookings >= slot.maxBookings) continue;
        
        const slotStartHour = slot.startTime;
        const slotEndHour = slot.endTime;
        
        // Vérifier si ce créneau n'est pas déjà réservé
        const isBooked = activeBookings.some(booking => {
          if (!booking.date) return false;
          const bookingDate = new Date(booking.date);
          const bookingHour = bookingDate.getHours();
          return bookingHour >= slotStartHour &&
                 bookingHour < slotEndHour &&
                 bookingDate.toDateString() === now.toDateString();
        });
        
        if (isBooked) continue; // Créneau déjà réservé
        
        // Vérifier si disponible maintenant (dans l'heure actuelle)
        if (slotStartHour === currentHour || 
            (slotStartHour < currentHour && slotEndHour > currentHour)) {
          hasNow = true;
        }
        
        // Vérifier si disponible dans l'heure qui vient
        if (slotStartHour > currentHour && slotStartHour <= currentHour + 1) {
          hasInHour = true;
        }
        
        // Vérifier si disponible dans la journée (aujourd'hui)
        if (slotStartHour >= currentHour && slotStartHour <= 23) {
          hasToday = true;
        }
      }
      
      // Retourner le type de disponibilité le plus prioritaire
      if (hasNow) return 'now';
      if (hasInHour) return 'in_hour';
      if (hasToday) return 'today';
      return 'unavailable';
    } catch (error) {
      console.error(`❌ [AvailabilityService] Erreur calcul disponibilité pour ${coiffeurId}:`, error);
      // En cas d'erreur, on considère comme disponible aujourd'hui pour ne pas exclure le coiffeur
      return 'today';
    }
  }
  
  /**
   * Calculer le statut de disponibilité pour plusieurs coiffeurs
   * @param {Array<string>} coiffeurIds - IDs des coiffeurs
   * @param {Date|string} date - Date pour laquelle calculer la disponibilité
   * @returns {Promise<Object>} Mapping coiffeurId -> availabilityStatus
   */
  async calculateAvailabilityStatusForMultiple(coiffeurIds, date = null) {
    const results = {};
    
    // Calculer en parallèle pour tous les coiffeurs
    const promises = coiffeurIds.map(async (coiffeurId) => {
      const status = await this.calculateAvailabilityStatus(coiffeurId, date);
      return { coiffeurId, status };
    });
    
    const statuses = await Promise.all(promises);
    
    statuses.forEach(({ coiffeurId, status }) => {
      results[coiffeurId] = status;
    });
    
    return results;
  }
}

export default new AvailabilityService();

