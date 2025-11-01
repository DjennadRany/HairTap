import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const testGeographicSimple = async () => {
  try {
    console.log('🗺️ [TEST] Test simple de l\'API géographique');
    
    // Connexion à la base de données
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    await mongoose.connect(mongoURI);
    console.log('✅ [TEST] Connecté à MongoDB');
    
    // Test 1: Vérifier la structure des utilisateurs
    console.log('\n👥 [TEST] Structure des utilisateurs:');
    const sampleUser = await User.findOne().select('name role address');
    
    if (sampleUser) {
      console.log('Utilisateur exemple:', {
        name: sampleUser.name,
        role: sampleUser.role,
        address: sampleUser.address
      });
      
      if (sampleUser.address) {
        console.log('Adresse trouvée:', {
          city: sampleUser.address.city,
          coordinates: sampleUser.address.coordinates,
          hasCoordinates: !!sampleUser.address.coordinates
        });
      } else {
        console.log('Aucune adresse trouvée');
      }
    }
    
    // Test 2: Compter les utilisateurs avec coordonnées
    const usersWithCoordinates = await User.countDocuments({
      'address.coordinates': { $exists: true, $ne: null }
    });
    
    const totalUsers = await User.countDocuments();
    
    console.log(`\n📊 [TEST] Résultats:`);
    console.log(`  Total utilisateurs: ${totalUsers}`);
    console.log(`  Avec coordonnées: ${usersWithCoordinates}`);
    console.log(`  Pourcentage: ${totalUsers > 0 ? Math.round((usersWithCoordinates / totalUsers) * 100) : 0}%`);
    
    // Test 3: Lister quelques utilisateurs avec coordonnées
    if (usersWithCoordinates > 0) {
      console.log('\n📍 [TEST] Utilisateurs avec coordonnées:');
      const usersWithCoords = await User.find({
        'address.coordinates': { $exists: true, $ne: null }
      }).select('name role address.city address.coordinates').limit(5);
      
      usersWithCoords.forEach(user => {
        console.log(`  ${user.name} (${user.role}): ${user.address.city} - ${user.address.coordinates.lat}, ${user.address.coordinates.lng}`);
      });
    }
    
    console.log('\n✅ [TEST] Test terminé');
    
  } catch (error) {
    console.error('❌ [TEST] Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 [TEST] Déconnecté de MongoDB');
  }
};

testGeographicSimple();











