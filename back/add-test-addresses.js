import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';

async function addTestAddresses() {
  try {
    console.log('🧪 Ajout d\'adresses de test...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Trouver l'utilisateur Alice Martin
    const user = await User.findOne({ email: 'alice.martin@test.com' });
    
    if (!user) {
      console.log('❌ Utilisateur Alice Martin non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:', user.name);
    
    // Ajouter des adresses de test
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        addresses: {
          home: {
            street: 'Boulevard de Picpus',
            streetNumber: '79b',
            city: 'Paris',
            postalCode: '75012',
            floor: '2',
            apartment: 'A',
            buildingCode: '1234',
            additionalInfo: 'Interphone: Martin',
            coordinates: {
              lat: 48.847258,
              lng: 2.398618
            }
          },
          office: {
            street: 'Rue de la Roquette',
            streetNumber: '45',
            city: 'Paris',
            postalCode: '75011',
            floor: '1',
            apartment: '',
            buildingCode: '',
            additionalInfo: 'Bureau au rez-de-chaussée',
            coordinates: {
              lat: 48.8566,
              lng: 2.3522
            }
          }
        }
      },
      { new: true }
    );
    
    console.log('✅ Adresses ajoutées avec succès');
    console.log('📊 Adresses sauvegardées:', JSON.stringify(updatedUser.addresses, null, 2));
    
    console.log('🎉 Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

addTestAddresses(); 