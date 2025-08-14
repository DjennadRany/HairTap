import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const updateCoiffeurData = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les coiffeurs
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`📊 ${coiffeurs.length} coiffeurs trouvés`);

    // Données de test pour les coiffeurs
    const testData = [
      {
        siren: '123456789',
        sirenStatus: 'verified',
        experience: 5,
        formation: 'CAP Coiffure, Brevet Professionnel',
        rib: 'FR7630001007941234567890185',
        workingMode: ['salon', 'domicile'],
        travelRadius: 15,
        specialities: ['Coupe moderne', 'Coloration', 'Lissage'],
        salonAddress: {
          street: 'Rue de la Paix',
          streetNumber: '15',
          city: 'Paris',
          postalCode: '75001',
          phone: '01 23 45 67 89',
          coordinates: { lat: 48.8566, lng: 2.3522 }
        }
      },
      {
        siren: '987654321',
        sirenStatus: 'pending',
        experience: 8,
        formation: 'CAP Coiffure, Mention Complémentaire',
        rib: 'FR7630001007949876543210185',
        workingMode: ['salon'],
        travelRadius: 0,
        specialities: ['Coiffures de mariage', 'Extensions', 'Permanente'],
        salonAddress: {
          street: 'Avenue des Champs-Élysées',
          streetNumber: '42',
          city: 'Paris',
          postalCode: '75008',
          phone: '01 98 76 54 32',
          coordinates: { lat: 48.8698, lng: 2.3077 }
        }
      },
      {
        siren: '456789123',
        sirenStatus: 'verified',
        experience: 12,
        formation: 'BTS Métiers de la coiffure',
        rib: 'FR7630001007944567891230185',
        workingMode: ['domicile'],
        travelRadius: 25,
        specialities: ['Coiffures africaines', 'Tresses', 'Locks'],
        salonAddress: null
      }
    ];

    // Mettre à jour chaque coiffeur avec des données de test
    for (let i = 0; i < coiffeurs.length; i++) {
      const coiffeur = coiffeurs[i];
      const testDataIndex = i % testData.length;
      const dataToUpdate = testData[testDataIndex];

      // Vérifier si les données existent déjà
      const needsUpdate = !coiffeur.siren || !coiffeur.experience || !coiffeur.formation;

      if (needsUpdate) {
        await User.findByIdAndUpdate(coiffeur._id, {
          $set: {
            siren: dataToUpdate.siren,
            sirenStatus: dataToUpdate.sirenStatus,
            experience: dataToUpdate.experience,
            formation: dataToUpdate.formation,
            rib: dataToUpdate.rib,
            workingMode: dataToUpdate.workingMode,
            travelRadius: dataToUpdate.travelRadius,
            specialities: dataToUpdate.specialities,
            ...(dataToUpdate.salonAddress && { salonAddress: dataToUpdate.salonAddress })
          }
        });

        console.log(`✅ Coiffeur ${coiffeur.name} mis à jour avec succès`);
      } else {
        console.log(`ℹ️ Coiffeur ${coiffeur.name} déjà à jour`);
      }
    }

    console.log('🎉 Mise à jour des données coiffeur terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

// Exécuter le script
updateCoiffeurData();
