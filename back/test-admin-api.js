import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Service from './models/Service.js';
import Booking from './models/Booking.js';

dotenv.config();

const testAdminAPI = async () => {
  try {
    console.log('🔍 [TEST] Test de l\'API Admin');
    
    // Connexion à la base de données
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    console.log('🔌 [TEST] Tentative de connexion à:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ [TEST] Connecté à MongoDB');
    
    // Test 1: Compter les utilisateurs
    console.log('\n📊 [TEST] Test 1: Compter les utilisateurs');
    const totalUsers = await User.countDocuments();
    console.log(`Total utilisateurs: ${totalUsers}`);
    
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    console.log('Utilisateurs par rôle:', usersByRole);
    
    // Test 2: Compter les services
    console.log('\n✂️ [TEST] Test 2: Compter les services');
    const totalServices = await Service.countDocuments();
    console.log(`Total services: ${totalServices}`);
    
    // Test 3: Compter les réservations
    console.log('\n📅 [TEST] Test 3: Compter les réservations');
    const totalBookings = await Booking.countDocuments();
    console.log(`Total réservations: ${totalBookings}`);
    
    // Test 4: Vérifier la structure des modèles
    console.log('\n🏗️ [TEST] Test 4: Structure des modèles');
    
    const sampleUser = await User.findOne();
    if (sampleUser) {
      console.log('Structure User:', Object.keys(sampleUser.toObject()));
      console.log('Rôle du premier utilisateur:', sampleUser.role);
    }
    
    const sampleService = await Service.findOne();
    if (sampleService) {
      console.log('Structure Service:', Object.keys(sampleService.toObject()));
    }
    
    const sampleBooking = await Booking.findOne();
    if (sampleBooking) {
      console.log('Structure Booking:', Object.keys(sampleBooking.toObject()));
    }
    
    console.log('\n✅ [TEST] Tests terminés avec succès');
    
  } catch (error) {
    console.error('❌ [TEST] Erreur lors des tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 [TEST] Déconnecté de MongoDB');
  }
};

testAdminAPI();
