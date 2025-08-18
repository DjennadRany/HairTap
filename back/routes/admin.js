import express from 'express';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès non autorisé - Admin requis' });
  }
  next();
};

// GET /api/admin/dashboard/stats - Statistiques du dashboard
router.get('/dashboard/stats', auth, requireAdmin, async (req, res) => {
  try {
    console.log('📊 [ADMIN] Récupération des statistiques dashboard');

    // Compter les utilisateurs par rôle
    const totalUsers = await User.countDocuments();
    const activeCoiffeurs = await User.countDocuments({ role: 'coiffeur' });
    const totalBookings = await Booking.countDocuments();
    
    // Calculer les revenus totaux - gérer le cas où amount n'existe pas
    const bookings = await Booking.find({ status: 'completed' });
    const totalRevenue = bookings.reduce((sum, booking) => {
      // ✅ CORRIGÉ : Gérer le cas où amount n'existe pas
      const amount = booking.amount || booking.price || 0;
      return sum + amount;
    }, 0);

    // Calculer la croissance des utilisateurs (pourcentage du mois)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const coiffeursThisMonth = await User.countDocuments({
      role: 'coiffeur',
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Calculer les pourcentages de croissance
    const userGrowth = {
      clients: totalUsers > 0 ? Math.round((usersThisMonth / totalUsers) * 100) : 0,
      coiffeurs: activeCoiffeurs > 0 ? Math.round((coiffeursThisMonth / activeCoiffeurs) * 100) : 0,
      engagement: totalBookings > 0 ? Math.round((totalBookings / totalUsers) * 10) : 0 // Engagement basé sur réservations/utilisateurs
    };

    // Récupérer l'activité récente
    const recentActivity = [];

    // Nouveaux coiffeurs récents
    const recentCoiffeurs = await User.find({ 
      role: 'coiffeur',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Dernières 24h
    }).limit(3);

    recentCoiffeurs.forEach(coiffeur => {
      recentActivity.push({
        id: coiffeur._id.toString(),
        type: 'new_coiffeur',
        message: `Nouveau coiffeur inscrit: ${coiffeur.name}`,
        timestamp: coiffeur.createdAt
      });
    });

    // Réservations récentes - gérer les erreurs de population
    try {
      const recentBookings = await Booking.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).populate('clientId', 'name').populate('coiffeurId', 'name').limit(3);

      recentBookings.forEach(booking => {
        recentActivity.push({
          id: booking._id.toString(),
          type: 'booking_confirmed',
          message: `Réservation confirmée: ${booking.clientId?.name || 'Client'} → ${booking.coiffeurId?.name || 'Coiffeur'}`,
          timestamp: booking.createdAt
        });
      });
    } catch (populateError) {
      console.log('⚠️ [ADMIN] Erreur lors de la population des réservations, utilisation des données de base');
      // Fallback : utiliser les données de base sans population
      const recentBookings = await Booking.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).limit(3);

      recentBookings.forEach(booking => {
        recentActivity.push({
          id: booking._id.toString(),
          type: 'booking_confirmed',
          message: `Réservation confirmée: Client → Coiffeur`,
          timestamp: booking.createdAt
        });
      });
    }

    // Trier par date et limiter
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    recentActivity.splice(5); // Garder seulement 5 activités

    const stats = {
      totalUsers,
      activeCoiffeurs,
      totalBookings,
      totalRevenue,
      userGrowth,
      recentActivity
    };

    console.log('✅ [ADMIN] Statistiques récupérées:', stats);

    res.json(stats);

  } catch (error) {
    console.error('❌ [ADMIN] Erreur lors de la récupération des stats:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message 
    });
  }
});

// GET /api/admin/users - Récupérer tous les utilisateurs (admin seulement)
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    console.log('👥 [ADMIN] Récupération de tous les utilisateurs');

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    // ✅ CORRIGÉ : Formater les utilisateurs pour l'admin avec gestion des photos
    const formattedUsers = users.map(user => {
      // ✅ CORRIGÉ : Construire l'URL complète des photos
      let photoUrl = null;
      if (user.photo && user.photo !== '/default-avatar.png') {
        photoUrl = `http://localhost:5000/uploads/profiles/${user.photo.split('/').pop()}`;
      } else if (user.photos && user.photos.length > 0) {
        photoUrl = `http://localhost:5000/uploads/profiles/${user.photos[0].split('/').pop()}`;
      } else {
        photoUrl = 'http://localhost:5000/default-avatar.png';
      }
      
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.isBlocked ? 'blocked' : 'active', // ✅ CORRIGÉ : 'isBlocked' et non 'status'
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        photo: photoUrl // ✅ CORRIGÉ : URL complète de la photo
      };
    });
    
    console.log(`✅ [ADMIN] ${formattedUsers.length} utilisateurs récupérés`);
    res.json(formattedUsers);

  } catch (error) {
    console.error('❌ [ADMIN] Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message 
    });
  }
});

// GET /api/admin/users/geographic - Récupérer les coordonnées géographiques des utilisateurs
router.get('/users/geographic', auth, requireAdmin, async (req, res) => {
  try {
    console.log('🗺️ [ADMIN] Récupération des coordonnées géographiques des utilisateurs');

    const users = await User.find({}).select('name role address').sort({ createdAt: -1 });
    
    // Formater les utilisateurs avec leurs coordonnées
    const formattedUsers = users.map(user => {
      let coordinates = null;
      let city = null;
      
      // Extraire les coordonnées de l'adresse
      if (user.address && user.address.coordinates) {
        const coords = user.address.coordinates;
        
        // ✅ CORRIGÉ : Gérer tous les formats de coordonnées possibles
        if (coords.lat !== undefined && coords.lng !== undefined) {
          // Format standard: { lat: 48.8566, lng: 2.3522 }
          coordinates = { lat: coords.lat, lng: coords.lng };
        } else if (coords.latitude !== undefined && coords.longitude !== undefined) {
          // Format alternatif: { latitude: 48.8566, longitude: 2.3522 }
          coordinates = { lat: coords.latitude, lng: coords.longitude };
        } else if (coords.x !== undefined && coords.y !== undefined) {
          // Format alternatif: { x: 48.8566, y: 2.3522 }
          coordinates = { lat: coords.x, lng: coords.y };
        } else if (Array.isArray(coords) && coords.length >= 2) {
          // Format array: [48.8566, 2.3522] ou [lng, lat]
          coordinates = { lat: coords[1], lng: coords[0] };
        } else if (typeof coords === 'string') {
          // Format string: "48.8566,2.3522"
          const parts = coords.split(',').map(p => parseFloat(p.trim()));
          if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            coordinates = { lat: parts[0], lng: parts[1] };
          }
        }
        
        // Vérifier que les coordonnées sont valides
        if (coordinates && (
          isNaN(coordinates.lat) || 
          isNaN(coordinates.lng) || 
          coordinates.lat < -90 || 
          coordinates.lat > 90 || 
          coordinates.lng < -180 || 
          coordinates.lng > 180
        )) {
          coordinates = null;
        }
      }
      
      // Extraire la ville
      if (user.address && user.address.city) {
        city = user.address.city;
      }
      
      return {
        _id: user._id,
        name: user.name,
        role: user.role,
        coordinates,
        city
      };
    }).filter(user => user.coordinates); // Filtrer seulement les utilisateurs avec des coordonnées valides
    
    console.log(`✅ [ADMIN] ${formattedUsers.length} utilisateurs avec coordonnées valides récupérés`);
    res.json(formattedUsers);

  } catch (error) {
    console.error('❌ [ADMIN] Erreur lors de la récupération des coordonnées:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des coordonnées géographiques',
      error: error.message 
    });
  }
});

// GET /api/admin/services - Récupérer tous les services (admin seulement)
router.get('/services', auth, requireAdmin, async (req, res) => {
  try {
    console.log('✂️ [ADMIN] Récupération de tous les services');

    const services = await Service.find({})
      .populate('coiffeur', 'name') // ✅ CORRIGÉ : 'coiffeur' et non 'coiffeurId'
      .sort({ createdAt: -1 });

    // Formater les services pour l'admin
    const formattedServices = services.map(service => {
      // ✅ CORRIGÉ : Construire l'URL complète des photos de service
      let imageUrl = null;
      if (service.examplePhotos && service.examplePhotos.length > 0) {
        const photoName = service.examplePhotos[0].split('/').pop();
        imageUrl = `http://localhost:5000/uploads/services/${photoName}`;
      } else if (service.gallery && service.gallery.length > 0) {
        const photoName = service.gallery[0].photoUrl.split('/').pop();
        imageUrl = `http://localhost:5000/uploads/services/${photoName}`;
      }
      
      return {
        _id: service._id,
        name: service.name,
        description: service.description,
        price: service.price,
        category: service.category,
        status: service.isActive ? 'active' : 'pending', // ✅ CORRIGÉ : 'isActive' et non 'status'
        coiffeurId: service.coiffeur?._id || service.coiffeur,
        coiffeurName: service.coiffeur?.name || 'Coiffeur inconnu',
        createdAt: service.createdAt,
        image: imageUrl // ✅ CORRIGÉ : URL complète de l'image
      };
    });
    
    console.log(`✅ [ADMIN] ${formattedServices.length} services récupérés`);
    res.json(formattedServices);

  } catch (error) {
    console.error('❌ [ADMIN] Erreur lors de la récupération des services:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des services',
      error: error.message 
    });
  }
});

// GET /api/admin/bookings - Récupérer toutes les réservations (admin seulement)
router.get('/bookings', auth, requireAdmin, async (req, res) => {
  try {
    console.log('📅 [ADMIN] Récupération de toutes les réservations');

    const bookings = await Booking.find({})
      .populate('clientId', 'name')
      .populate('coiffeurId', 'name')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 });

    // Formater les réservations pour l'admin
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      clientId: booking.clientId._id,
      clientName: booking.clientId.name,
      coiffeurId: booking.coiffeurId._id,
      coiffeurName: booking.coiffeurId.name,
      serviceId: booking.serviceId._id,
      serviceName: booking.serviceId.name,
      status: booking.status,
      amount: booking.amount,
      createdAt: booking.createdAt,
      scheduledDate: booking.scheduledDate
    }));
    
    console.log(`✅ [ADMIN] ${formattedBookings.length} réservations récupérées`);
    res.json(formattedBookings);

  } catch (error) {
    console.error('❌ [ADMIN] Erreur lors de la récupération des réservations:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des réservations',
      error: error.message 
    });
  }
});

export default router;
