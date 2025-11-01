import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const testCoordinatesStructure = async () => {
  try {
    console.log('🗺️ [TEST] Test de la structure des coordonnées');
    
    // Connexion à la base de données
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    await mongoose.connect(mongoURI);
    console.log('✅ [TEST] Connecté à MongoDB');
    
    // Test 1: Vérifier la structure exacte des coordonnées
    console.log('\n👥 [TEST] Structure des coordonnées:');
    const usersWithAddress = await User.find({
      'address.coordinates': { $exists: true }
    }).select('name role address.coordinates').limit(5);
    
    usersWithAddress.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name} (${user.role}):`);
      console.log('  Coordonnées brutes:', JSON.stringify(user.address.coordinates, null, 2));
      console.log('  Type:', typeof user.address.coordinates);
      console.log('  Clés:', Object.keys(user.address.coordinates || {}));
      
      if (user.address.coordinates) {
        console.log('  lat existe:', 'lat' in user.address.coordinates);
        console.log('  lng existe:', 'lng' in user.address.coordinates);
        console.log('  lat valeur:', user.address.coordinates.lat);
        console.log('  lng valeur:', user.address.coordinates.lng);
      }
    });
    
    // Test 2: Vérifier s'il y a d'autres noms de champs
    console.log('\n🔍 [TEST] Recherche de champs alternatifs:');
    const sampleUser = await User.findOne({
      'address.coordinates': { $exists: true }
    });
    
    if (sampleUser && sampleUser.address.coordinates) {
      const coords = sampleUser.address.coordinates;
      console.log('Champs trouvés dans coordinates:', Object.keys(coords));
      console.log('Valeurs:', Object.values(coords));
      
      // Vérifier les types
      Object.keys(coords).forEach(key => {
        console.log(`  ${key}: ${typeof coords[key]} = ${coords[key]}`);
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

testCoordinatesStructure();
