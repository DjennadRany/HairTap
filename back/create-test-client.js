// Script pour créer un compte client de test
// Permet de tester la suppression sans toucher au compte principal

import mongoose from 'mongoose';

// Configuration MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/taphair';

async function createTestClient() {
  try {
    console.log('🔧 CRÉATION COMPTE CLIENT DE TEST');
    console.log('==================================');
    
    // 1. Connexion à MongoDB
    console.log('\n1️⃣ Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // 2. Importer le modèle User
    console.log('\n2️⃣ Import du modèle User...');
    const User = (await import('./models/User.js')).default;
    console.log('✅ Modèle User importé');
    
    // 3. Vérifier si le compte de test existe déjà
    console.log('\n3️⃣ Vérification compte existant...');
    const existingUser = await User.findOne({ email: 'test-client@example.com' });
    
    if (existingUser) {
      console.log('⚠️ Compte de test existe déjà, suppression...');
      await User.findByIdAndDelete(existingUser._id);
      console.log('✅ Ancien compte supprimé');
    }
    
    // 4. Créer le nouveau compte de test
    console.log('\n4️⃣ Création du compte de test...');
    const testClient = new User({
      name: 'Client Test',
      email: 'test-client@example.com',
      password: '$2a$12$testpassword', // Mot de passe hashé simple
      role: 'user',
      photo: '/default-avatar.png',
      specialities: [],
      rating: 0,
      totalRatings: 0,
      workingMode: [],
      travelRadius: 10,
      likes: 0,
      favorites: [],
      isBlocked: false,
      blockedUsers: [],
      bookingAddresses: [],
      gallery: [],
      addresses: {
        home: {
          streetNumber: '123',
          street: 'Rue de Test',
          postalCode: '75001',
          city: 'Paris',
          floor: '',
          apartment: '',
          buildingCode: '',
          additionalInfo: ''
        }
      }
    });
    
    const savedClient = await testClient.save();
    console.log('✅ Compte client de test créé:', {
      id: savedClient._id,
      name: savedClient.name,
      email: savedClient.email,
      role: savedClient.role
    });
    
    // 5. Afficher les informations de connexion
    console.log('\n5️⃣ INFORMATIONS DE CONNEXION :');
    console.log('📧 Email: test-client@example.com');
    console.log('🔑 Mot de passe: test123');
    console.log('👤 Rôle: Client');
    
    console.log('\n6️⃣ INSTRUCTIONS DE TEST :');
    console.log('1. Connectez-vous avec test-client@example.com / test123');
    console.log('2. Allez sur /profile');
    console.log('3. Cliquez sur "Supprimer mon compte"');
    console.log('4. Confirmez la suppression');
    console.log('5. Vérifiez dans MongoDB Compass que le compte a disparu');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la création
createTestClient();











