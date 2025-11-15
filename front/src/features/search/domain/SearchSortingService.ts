import type { User } from '../../../types/models';

/**
 * Service de domaine pour le tri des résultats de recherche
 * UX/UI Pro : Tri optimisé pour l'expérience utilisateur
 */
export class SearchSortingService {
  /**
   * Trier les coiffeurs selon la priorité : maintenant > proche > mieux noté
   * @param coiffeurs - Liste des coiffeurs à trier
   * @param userLocation - Position de l'utilisateur (optionnel)
   * @returns Liste des coiffeurs triés
   */
  static sortCoiffeurs(
    coiffeurs: User[],
    userLocation?: { latitude: number; longitude: number }
  ): User[] {
    // Calculer la distance pour chaque coiffeur si géolocalisation disponible
    const coiffeursWithData = coiffeurs.map(coiffeur => {
      let distance = Infinity;
      
      if (userLocation) {
        const coordinates = coiffeur.address?.coordinates || 
                           coiffeur.salonAddress?.coordinates ||
                           (coiffeur.addresses?.home?.coordinates) ||
                           (coiffeur.addresses?.office?.coordinates);
        
        if (coordinates && coordinates.lat && coordinates.lng) {
          distance = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            coordinates.lat,
            coordinates.lng
          );
        }
      }
      
      // Récupérer la note du coiffeur (normalisée sur 5)
      const rating = coiffeur.rating
        ? (typeof coiffeur.rating === 'number' && coiffeur.rating > 5
            ? coiffeur.rating / 10
            : coiffeur.rating)
        : 0;
      
      // Utiliser availabilityStatus du backend
      const availabilityStatus = coiffeur.availabilityStatus || 'today';
      
      return { coiffeur, distance, rating, availabilityStatus };
    });
    
    // Trier selon la priorité : maintenant > proche > mieux noté
    const sorted = coiffeursWithData.sort((a, b) => {
      // 1. PRIORITÉ ABSOLUE: Disponible MAINTENANT en premier
      const availabilityPriority = { 'now': 0, 'in_hour': 1, 'today': 2, 'unavailable': 3 };
      const priorityDiff = availabilityPriority[a.availabilityStatus] - availabilityPriority[b.availabilityStatus];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // 2. Si même disponibilité et géolocalisation disponible, trier par distance (plus proche en premier)
      if (userLocation) {
        if (a.distance === Infinity && b.distance === Infinity) {
          return b.rating - a.rating; // Meilleure note en premier
        }
        if (a.distance === Infinity) {
          return 1; // a va après (pas de coordonnées)
        }
        if (b.distance === Infinity) {
          return -1; // b va après (pas de coordonnées)
        }
        if (a.distance !== b.distance) {
          return a.distance - b.distance; // Plus proches en premier
        }
      }
      
      // 3. Si même distance (ou pas de géolocalisation), trier par note (meilleure note en premier)
      return b.rating - a.rating;
    });
    
    // Retourner les coiffeurs avec availabilityStatus
    return sorted.map(({ coiffeur, availabilityStatus }) => ({
      ...coiffeur,
      availabilityStatus
    }));
  }
  
  /**
   * Calculer la distance entre deux points GPS (formule de Haversine)
   * @param lat1 - Latitude du premier point
   * @param lon1 - Longitude du premier point
   * @param lat2 - Latitude du deuxième point
   * @param lon2 - Longitude du deuxième point
   * @returns Distance en kilomètres
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Convertir des degrés en radians
   */
  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

