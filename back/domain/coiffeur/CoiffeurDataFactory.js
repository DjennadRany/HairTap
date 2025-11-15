import Review from '../../models/Review.js';
import Service from '../../models/Service.js';
import User from '../../models/User.js';
import Booking from '../../models/Booking.js';

/**
 * Factory Pattern pour créer des données variées de coiffeurs
 * Basé sur les données existantes des coiffeurs complets
 */
class CoiffeurDataFactory {
  /**
   * Créer des avis avec notes variées basés sur les avis existants
   * @param {string} coiffeurId - ID du coiffeur
   * @param {number} count - Nombre d'avis à créer (5-100)
   * @param {Array} existingReviews - Avis existants pour référence
   * @returns {Promise<Array>} Avis créés
   */
  static async createReviews(coiffeurId, count = 10, existingReviews = []) {
    const reviews = [];
    
    // Générer des notes variées (3.5-5.0)
    const ratings = [3.5, 4.0, 4.5, 5.0];
    const comments = [
      'Excellent service, très professionnel !',
      'Très satisfait, je recommande vivement.',
      'Service de qualité, coiffeur à l\'écoute.',
      'Parfait, je reviendrai sans hésitation.',
      'Très bon travail, résultat impeccable.',
      'Service rapide et efficace, merci !',
      'Très contente, résultat conforme à mes attentes.',
      'Professionnel et sympa, je recommande.',
      'Service de qualité, prix raisonnable.',
      'Excellent rapport qualité/prix, très satisfait.'
    ];
    
    // Si des avis existants sont fournis, utiliser leurs commentaires comme référence
    const referenceComments = existingReviews.length > 0
      ? existingReviews.map(r => r.comment)
      : comments;
    
    // Récupérer tous les clients existants pour créer des avis réalistes
    const clients = await User.find({ role: 'client' }).limit(100);
    
    // Récupérer les réservations terminées du coiffeur
    const completedBookings = await Booking.find({
      coiffeur: coiffeurId,
      status: 'completed'
    }).limit(count);
    
    // Si pas assez de réservations terminées, créer des avis fictifs
    for (let i = 0; i < count; i++) {
      const rating = ratings[Math.floor(Math.random() * ratings.length)];
      const comment = referenceComments[Math.floor(Math.random() * referenceComments.length)];
      
      // Utiliser un client existant ou créer un avis sans client spécifique
      const client = clients.length > 0
        ? clients[Math.floor(Math.random() * clients.length)]._id
        : null;
      
      // Utiliser une réservation terminée si disponible
      const booking = completedBookings[i] || null;
      
      // Si pas de réservation, créer un avis sans réservation (pour les tests)
      const review = new Review({
        client: client || new User({ role: 'client', name: `Client ${i + 1}`, email: `client${i + 1}@test.com` })._id,
        coiffeur: coiffeurId,
        booking: booking ? booking._id : new Booking({ status: 'completed' })._id,
        rating: rating,
        comment: comment,
        isVerified: Math.random() > 0.3 // 70% des avis vérifiés
      });
      
      reviews.push(review);
    }
    
    return reviews;
  }
  
  /**
   * Créer des services avec photos variées basés sur les services existants
   * @param {string} coiffeurId - ID du coiffeur
   * @param {Array} existingServices - Services existants pour référence (photos, catégories)
   * @param {number} count - Nombre de services à créer (par défaut: 3-5)
   * @returns {Promise<Array>} Services créés
   */
  static async createServices(coiffeurId, existingServices = [], count = null) {
    const services = [];
    
    // Si le coiffeur a déjà des services, ne pas en créer de nouveaux
    const existingCoiffeurServices = await Service.find({ coiffeur: coiffeurId });
    if (existingCoiffeurServices.length > 0) {
      return []; // Le coiffeur a déjà des services
    }
    
    // Si pas de services de référence, utiliser les services de Marie Dubois
    let referenceServices = existingServices;
    if (referenceServices.length === 0) {
      const marieDubois = await User.findOne({ email: 'marie.dubois@taphair.com' });
      if (marieDubois) {
        referenceServices = await Service.find({ coiffeur: marieDubois._id });
      }
    }
    
    if (referenceServices.length === 0) {
      console.warn('⚠️ Aucun service de référence trouvé');
      return [];
    }
    
    // Créer un mapping des catégories vers les photos/vidéos
    const mediaByCategory = {};
    referenceServices.forEach(service => {
      const category = service.category || 'autre';
      if (!mediaByCategory[category]) {
        mediaByCategory[category] = [];
      }
      
      // Récupérer les photos/vidéos de la galerie
      if (service.gallery && service.gallery.length > 0) {
        service.gallery.forEach(item => {
          if (item.mediaUrl) {
            mediaByCategory[category].push({
              mediaUrl: item.mediaUrl,
              mediaType: item.mediaType || 'image',
              caption: item.caption || service.name
            });
          }
        });
      }
      
      // Récupérer les photos d'exemple
      if (service.examplePhotos && service.examplePhotos.length > 0) {
        service.examplePhotos.forEach(photo => {
          if (photo) {
            mediaByCategory[category].push({
              mediaUrl: photo,
              mediaType: 'image',
              caption: service.name
            });
          }
        });
      }
    });
    
    // Déterminer le nombre de services à créer
    const servicesToCreate = count || Math.floor(Math.random() * 3) + 3; // 3-5 services
    
    // Créer des services variés basés sur les services de référence
    const categories = Object.keys(mediaByCategory);
    const serviceNames = {
      'coupe': ['Coupe moderne', 'Coupe courte', 'Coupe longue', 'Coupe dégradée', 'Coupe pixie'],
      'coloration': ['Coloration complète', 'Balayage', 'Mèches', 'Ombré', 'Shatush'],
      'lissage': ['Lissage brésilien', 'Lissage japonais', 'Lissage coréen', 'Lissage progressif'],
      'brushing': ['Brushing volume', 'Brushing lisse', 'Brushing ondulé'],
      'autre': ['Coiffure de mariage', 'Extension cheveux', 'Soin capillaire', 'Permanente']
    };
    
    const prices = {
      'coupe': [30, 40, 50, 60],
      'coloration': [60, 80, 100, 120],
      'lissage': [80, 100, 120, 150],
      'brushing': [25, 35, 45],
      'autre': [50, 70, 90, 110]
    };
    
    const durations = {
      'coupe': [30, 45, 60],
      'coloration': [90, 120, 150],
      'lissage': [120, 150, 180],
      'brushing': [30, 45],
      'autre': [60, 90, 120]
    };
    
    for (let i = 0; i < servicesToCreate; i++) {
      // Sélectionner une catégorie aléatoire
      const category = categories[Math.floor(Math.random() * categories.length)] || 'coupe';
      
      // Sélectionner un nom de service pour cette catégorie
      const categoryNames = serviceNames[category] || serviceNames['autre'];
      const serviceName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
      
      // Sélectionner un prix et une durée pour cette catégorie
      const categoryPrices = prices[category] || prices['autre'];
      const categoryDurations = durations[category] || durations['autre'];
      const price = categoryPrices[Math.floor(Math.random() * categoryPrices.length)];
      const duration = categoryDurations[Math.floor(Math.random() * categoryDurations.length)];
      
      // Sélectionner des photos/vidéos pour cette catégorie
      const categoryMedia = mediaByCategory[category] || [];
      const selectedMedia = [];
      
      // Sélectionner 1-3 médias (photos ou vidéos) pour ce service
      const mediaCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < mediaCount && j < categoryMedia.length; j++) {
        const randomMedia = categoryMedia[Math.floor(Math.random() * categoryMedia.length)];
        selectedMedia.push({
          mediaUrl: randomMedia.mediaUrl,
          mediaType: randomMedia.mediaType || 'image',
          caption: randomMedia.caption || serviceName,
          tags: [category],
          likes: Math.floor(Math.random() * 20 + 5),
          createdAt: new Date()
        });
      }
      
      // Si pas de média sélectionné, utiliser le premier média disponible
      if (selectedMedia.length === 0 && categoryMedia.length > 0) {
        selectedMedia.push({
          mediaUrl: categoryMedia[0].mediaUrl,
          mediaType: categoryMedia[0].mediaType || 'image',
          caption: serviceName,
          tags: [category],
          likes: Math.floor(Math.random() * 20 + 5),
          createdAt: new Date()
        });
      }
      
      // Créer le service
      const service = new Service({
        coiffeur: coiffeurId,
        name: serviceName,
        description: `Service de ${serviceName.toLowerCase()} professionnel.`,
        price: price,
        duration: duration,
        category: category,
        specialities: [category],
        images: selectedMedia.length > 0 ? [selectedMedia[0].mediaUrl] : [],
        examplePhotos: selectedMedia.filter(m => m.mediaType === 'image').map(m => m.mediaUrl),
        gallery: selectedMedia,
        popularityScore: Math.random() * 100,
        likes: Math.floor(Math.random() * 20 + 5),
        views: Math.floor(Math.random() * 100 + 20),
        isActive: true
      });
      
      services.push(service);
    }
    
    return services;
  }
}

export default CoiffeurDataFactory;

