import User from '../../models/User.js';
import Review from '../../models/Review.js';
import Service from '../../models/Service.js';
import CoiffeurDataFactory from './CoiffeurDataFactory.js';

/**
 * Service de domaine pour enrichir les données des coiffeurs
 * Utilise la Factory Pattern pour créer des données variées
 */
class CoiffeurDataEnrichmentService {
  /**
   * Vérifier si un coiffeur a déjà des données complètes
   * @param {string} coiffeurId - ID du coiffeur
   * @returns {Promise<boolean>} True si le coiffeur a déjà des données complètes
   */
  async hasCompleteData(coiffeurId) {
    const reviews = await Review.find({ coiffeur: coiffeurId });
    const services = await Service.find({ coiffeur: coiffeurId });
    const coiffeur = await User.findById(coiffeurId);
    
    // Un coiffeur a des données complètes s'il a :
    // - Au moins 5 avis
    // - Au moins 3 services
    // - Un rating > 0
    const hasEnoughReviews = reviews.length >= 5;
    const hasEnoughServices = services.length >= 3;
    const hasRating = coiffeur && coiffeur.rating > 0;
    
    return hasEnoughReviews && hasEnoughServices && hasRating;
  }
  
  /**
   * Enrichir un coiffeur avec des données variées
   * @param {string} coiffeurId - ID du coiffeur
   * @param {Object} options - Options d'enrichissement
   * @returns {Promise<Object>} Résultat de l'enrichissement
   */
  async enrichCoiffeur(coiffeurId, options = {}) {
    const {
      minReviews = 5,
      maxReviews = 100,
      minServices = 3,
      maxServices = 5
    } = options;
    
    // Vérifier si le coiffeur a déjà des données complètes
    const hasComplete = await this.hasCompleteData(coiffeurId);
    if (hasComplete) {
      return {
        success: false,
        message: 'Le coiffeur a déjà des données complètes',
        skipped: true
      };
    }
    
    const coiffeur = await User.findById(coiffeurId);
    if (!coiffeur || coiffeur.role !== 'coiffeur') {
      return {
        success: false,
        message: 'Coiffeur non trouvé'
      };
    }
    
    // Récupérer les services existants de tous les coiffeurs pour référence
    const allServices = await Service.find({}).limit(100);
    
    // Récupérer les avis existants pour référence
    const allReviews = await Review.find({}).limit(50);
    
    const results = {
      reviewsCreated: 0,
      servicesCreated: 0,
      errors: []
    };
    
    // 1. Créer des services si le coiffeur n'en a pas assez
    const existingServices = await Service.find({ coiffeur: coiffeurId });
    if (existingServices.length < minServices) {
      try {
        const servicesToCreate = maxServices - existingServices.length;
        const newServices = await CoiffeurDataFactory.createServices(
          coiffeurId,
          allServices,
          servicesToCreate
        );
        
        for (const service of newServices) {
          await service.save();
          results.servicesCreated++;
        }
      } catch (error) {
        results.errors.push(`Erreur création services: ${error.message}`);
      }
    }
    
    // 2. Créer des avis si le coiffeur n'en a pas assez
    const existingReviews = await Review.find({ coiffeur: coiffeurId });
    if (existingReviews.length < minReviews) {
      try {
        const reviewsToCreate = Math.floor(Math.random() * (maxReviews - minReviews + 1)) + minReviews - existingReviews.length;
        const newReviews = await CoiffeurDataFactory.createReviews(
          coiffeurId,
          reviewsToCreate,
          allReviews
        );
        
        for (const review of newReviews) {
          await review.save();
          results.reviewsCreated++;
        }
        
        // Le middleware post('save') de Review.js mettra à jour rating et totalRatings automatiquement
      } catch (error) {
        results.errors.push(`Erreur création avis: ${error.message}`);
      }
    }
    
    return {
      success: true,
      coiffeurId: coiffeurId,
      coiffeurName: coiffeur.name,
      ...results
    };
  }
  
  /**
   * Enrichir tous les coiffeurs qui n'ont pas de données complètes
   * @param {Object} options - Options d'enrichissement
   * @returns {Promise<Object>} Résultat global
   */
  async enrichAllCoiffeurs(options = {}) {
    const coiffeurs = await User.find({ role: 'coiffeur' });
    const results = {
      total: coiffeurs.length,
      enriched: 0,
      skipped: 0,
      errors: 0,
      details: []
    };
    
    for (const coiffeur of coiffeurs) {
      try {
        const result = await this.enrichCoiffeur(coiffeur._id, options);
        if (result.success) {
          if (result.skipped) {
            results.skipped++;
          } else {
            results.enriched++;
          }
          results.details.push(result);
        } else {
          results.errors++;
          results.details.push(result);
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          coiffeurId: coiffeur._id,
          coiffeurName: coiffeur.name,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

export default new CoiffeurDataEnrichmentService();

