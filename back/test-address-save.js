import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';

async function testAddressSave() {
  try {
    console.log('🔧 Test de sauvegarde d\'adresses...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Créer un utilisateur de test
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      addresses: {
        home: {
          street: '123 Rue de la Paix',
          streetNumber: '123',
          city: 'Paris',
          postalCode: '75001',
          floor: '2',
          apartment: 'A',
          coordinates: {
            lat: 48.8566,
            lng: 2.3522
          }
        },
        office: {
          street: '456 Avenue des Champs',
          streetNumber: '456',
          city: 'Paris',
          postalCode: '75008',
          floor: '1',
          apartment: 'B',
          coordinates: {
            lat: 48.8698,
            lng: 2.3077
          }
        }
      }
    });
    
    await testUser.save();
    console.log('✅ Utilisateur de test créé:', testUser._id);
    
    // Tester la mise à jour
    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      {
        $set: {
          addresses: {
            home: {
              street: '789 Boulevard Saint-Germain',
              streetNumber: '789',
              city: 'Paris',
              postalCode: '75006',
              coordinates: {
                lat: 48.8534,
                lng: 2.3488
              }
            }
          }
        }
      },
      { new: true, runValidators: true }
    );
    
    console.log('✅ Utilisateur mis à jour');
    console.log('📊 Adresses sauvegardées:', JSON.stringify(updatedUser.addresses, null, 2));
    
    // Nettoyer
    await User.findByIdAndDelete(testUser._id);
    console.log('🧹 Utilisateur de test supprimé');
    
    console.log('🎉 Test réussi !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

testAddressSave(); 