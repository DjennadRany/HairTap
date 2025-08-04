import mongoose from 'mongoose';
import Booking from './models/Booking.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';

async function cleanTestBookings() {
  try {
    console.log('🧹 Nettoyage des réservations de test...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Supprimer toutes les réservations de test (avec des notes contenant "test")
    const result = await Booking.deleteMany({
      notes: { $regex: /test/i }
    });
    
    console.log(`✅ ${result.deletedCount} réservations de test supprimées`);
    
    // Afficher les réservations restantes
    const remainingBookings = await Booking.find({}).populate('client', 'name').populate('coiffeur', 'name');
    console.log('📊 Réservations restantes:', remainingBookings.length);
    
    remainingBookings.forEach(booking => {
      console.log(`  - ${booking.client?.name} → ${booking.coiffeur?.name} (${booking.date})`);
    });
    
    console.log('🎉 Nettoyage terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

cleanTestBookings(); 