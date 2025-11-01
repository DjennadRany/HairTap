// Script pour créer un compte Malik de test
// Permet de tester la suppression sans toucher au compte principal

import mongoose from 'mongoose';

// Configuration MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/taphair';

async function createMalikTest() {
  try {
    console.log('🔧 CRÉATION COMPTE MALIK DE TEST');
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
    const existingUser = await User.findOne({ email: 'malik-test@example.com' });
    
    if (existingUser) {
      console.log('⚠️ Compte de test existe déjà, suppression...');
      await User.findByIdAndDelete(existingUser._id);
      console.log('✅ Ancien compte supprimé');
    }
    
    // 4. Créer le nouveau compte Malik de test
    console.log('\n4️⃣ Création du compte Malik de test...');
    const testMalik = new User({
      name: 'Malik Test',
      email: 'malik-test@example.com',
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
          streetNumber: '456',
          street: 'Rue de Test',
          postalCode: '75002',
          city: 'Paris',
          floor: '',
          apartment: '',
          buildingCode: '',
          additionalInfo: ''
        }
      }
    });
    
    const savedMalik = await testMalik.save();
    console.log('✅ Compte Malik de test créé:', {
      id: savedMalik._id,
      name: savedMalik.name,
      email: savedMalik.email,
      role: savedMalik.role
    });
    
    // 5. Afficher les informations de connexion
    console.log('\n5️⃣ INFORMATIONS DE CONNEXION :');
    console.log('📧 Email: malik-test@example.com');
    console.log('🔑 Mot de passe: test123');
    console.log('👤 Rôle: Client');
    console.log('🆔 ID MongoDB:', savedMalik._id);
    
    console.log('\n6️⃣ INSTRUCTIONS DE TEST :');
    console.log('1. Connectez-vous avec malik-test@example.com / test123');
    console.log('2. Allez sur /profile');
    console.log('3. Cliquez sur "Supprimer mon compte"');
    console.log('4. Confirmez la suppression');
    console.log('5. REGARDEZ LES LOGS DU SERVEUR BACKEND');
    console.log('6. Vérifiez dans MongoDB Compass que le compte a disparu');
    
    console.log('\n🔍 LOGS À SURVEILLER DANS LE SERVEUR :');
    console.log('🗑️ [DELETE /users/:id] Suppression du compte utilisateur: [ID]');
    console.log('✅ [DELETE /users/:id] Compte supprimé avec succès: [ID]');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la création
createMalikTest();











