import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Service from './models/Service.js';
import Booking from './models/Booking.js';

dotenv.config();

const app = express();
app.use(express.json());

// Test simple de l'API admin sans authentification
app.get('/test/admin/stats', async (req, res) => {
  try {
    console.log('📊 [TEST] Test de l\'API admin stats');
    
    // Connexion à la base de données
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    await mongoose.connect(mongoURI);
    
    // Compter les utilisateurs par rôle
    const totalUsers = await User.countDocuments();
    const activeCoiffeurs = await User.countDocuments({ role: 'coiffeur' });
    const totalBookings = await Booking.countDocuments();
    
    // Calculer les revenus totaux
    const bookings = await Booking.find({ status: 'completed' });
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
    
    const stats = {
      totalUsers,
      activeCoiffeurs,
      totalBookings,
      totalRevenue,
      userGrowth: {
        clients: totalUsers > 0 ? Math.round((totalUsers / totalUsers) * 100) : 0,
        coiffeurs: activeCoiffeurs > 0 ? Math.round((activeCoiffeurs / activeCoiffeurs) * 100) : 0,
        engagement: totalBookings > 0 ? Math.round((totalBookings / totalUsers) * 10) : 0
      },
      recentActivity: []
    };
    
    console.log('✅ [TEST] Stats calculées:', stats);
    res.json(stats);
    
  } catch (error) {
    console.error('❌ [TEST] Erreur:', error);
    res.status(500).json({ 
      message: 'Erreur lors du calcul des stats',
      error: error.message 
    });
  }
});

app.get('/test/admin/users', async (req, res) => {
  try {
    console.log('👥 [TEST] Test de l\'API admin users');
    
    // Connexion à la base de données
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    await mongoose.connect(mongoURI);
    
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    console.log(`✅ [TEST] ${users.length} utilisateurs récupérés`);
    res.json(users);
    
  } catch (error) {
    console.error('❌ [TEST] Erreur:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message 
    });
  }
});

app.get('/test/admin/services', async (req, res) => {
  try {
    console.log('✂️ [TEST] Test de l\'API admin services');
    
    // Connexion à la base de données
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    await mongoose.connect(mongoURI);
    
    const services = await Service.find({})
      .populate('coiffeur', 'name')
      .sort({ createdAt: -1 });
    
    // Formater les services pour l'admin
    const formattedServices = services.map(service => ({
      _id: service._id,
      name: service.name,
      description: service.description,
      price: service.price,
      category: service.category,
      status: service.isActive ? 'active' : 'pending',
      coiffeurId: service.coiffeur?._id || service.coiffeur,
      coiffeurName: service.coiffeur?.name || 'Coiffeur inconnu',
      createdAt: service.createdAt,
      image: service.examplePhotos?.[0] || null
    }));
    
    console.log(`✅ [TEST] ${formattedServices.length} services récupérés`);
    res.json(formattedServices);
    
  } catch (error) {
    console.error('❌ [TEST] Erreur:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des services',
      error: error.message 
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🧪 [TEST] Serveur de test démarré sur http://localhost:${PORT}`);
  console.log('📊 Test stats: http://localhost:5001/test/admin/stats');
  console.log('👥 Test users: http://localhost:5001/test/admin/users');
  console.log('✂️ Test services: http://localhost:5001/test/admin/services');
});
