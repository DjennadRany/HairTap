import mongoose from 'mongoose';
import Booking from './models/Booking.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';

async function testBooking() {
  try {
    console.log('🧪 Test de création de réservation...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Créer un utilisateur de test (client)
    const testClient = new User({
      name: 'Test Client',
      email: 'client@test.com',
      password: 'password123',
      role: 'user'
    });
    await testClient.save();
    console.log('✅ Client de test créé:', testClient._id);
    
    // Créer un coiffeur de test
    const testCoiffeur = new User({
      name: 'Test Coiffeur',
      email: 'coiffeur@test.com',
      password: 'password123',
      role: 'coiffeur',
      workingMode: ['salon', 'domicile']
    });
    await testCoiffeur.save();
    console.log('✅ Coiffeur de test créé:', testCoiffeur._id);
    
    // Créer une réservation de test
    const testBooking = new Booking({
      client: testClient._id,
      coiffeur: testCoiffeur._id,
      service: 'Coupe homme',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
      duration: 60,
      price: 30,
      mode: 'salon',
      address: {
        street: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001'
      },
      notes: 'Test de réservation'
    });
    
    await testBooking.save();
    console.log('✅ Réservation de test créée:', testBooking._id);
    
    // Vérifier la réservation
    const savedBooking = await Booking.findById(testBooking._id)
      .populate('client', 'name email')
      .populate('coiffeur', 'name email');
    
    console.log('📊 Réservation sauvegardée:', {
      id: savedBooking._id,
      client: savedBooking.client.name,
      coiffeur: savedBooking.coiffeur.name,
      service: savedBooking.service,
      date: savedBooking.date,
      mode: savedBooking.mode,
      address: savedBooking.address
    });
    
    // Nettoyer
    await Booking.findByIdAndDelete(testBooking._id);
    await User.findByIdAndDelete(testClient._id);
    await User.findByIdAndDelete(testCoiffeur._id);
    console.log('🧹 Données de test supprimées');
    
    console.log('🎉 Test réussi !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

testBooking(); 