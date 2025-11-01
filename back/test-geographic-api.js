import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const testGeographicAPI = async () => {
  try {
    console.log('🗺️ [TEST] Test de l\'API géographique');
    
    // Connexion à la base de données
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    await mongoose.connect(mongoURI);
    console.log('✅ [TEST] Connecté à MongoDB');
    
    // Test 1: Vérifier les utilisateurs avec adresses
    console.log('\n👥 [TEST] Utilisateurs avec adresses:');
    const users = await User.find({}).select('name role address').limit(10);
    
    users.forEach(user => {
      console.log(`\n${user.name} (${user.role}):`);
      if (user.address) {
        console.log(`  Ville: ${user.address.city || 'Non spécifiée'}`);
        if (user.address.coordinates) {
          console.log(`  Coordonnées: ${user.address.coordinates.lat}, ${user.address.coordinates.lng}`);
        } else {
          console.log(`  Coordonnées: Non spécifiées`);
        }
      } else {
        console.log(`  Adresse: Non spécifiée`);
      }
    });
    
    // Test 2: Compter les utilisateurs avec coordonnées
    const usersWithCoordinates = await User.countDocuments({
      'address.coordinates': { $exists: true, $ne: null }
    });
    
    const usersWithCity = await User.countDocuments({
      'address.city': { $exists: true, $ne: null }
    });
    
    console.log(`\n📊 [TEST] Statistiques géographiques:`);
    console.log(`  Utilisateurs avec coordonnées: ${usersWithCoordinates}`);
    console.log(`  Utilisateurs avec ville: ${usersWithCity}`);
    console.log(`  Total utilisateurs: ${users.length}`);
    
    console.log('\n✅ [TEST] Tests géographiques terminés');
    
  } catch (error) {
    console.error('❌ [TEST] Erreur lors des tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 [TEST] Déconnecté de MongoDB');
  }
};

testGeographicAPI();











