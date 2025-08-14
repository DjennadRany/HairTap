import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const completeCoiffeurData = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les coiffeurs
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`📊 ${coiffeurs.length} coiffeurs trouvés`);

    // Données complètes pour les coiffeurs
    const completeData = [
      {
        bio: 'Coiffeuse passionnée avec 5 ans d\'expérience. Spécialisée dans les coupes modernes et les colorations tendance. J\'aime créer des looks uniques qui reflètent la personnalité de chaque client.',
        siren: '123456789',
        sirenStatus: 'verified',
        experience: 5,
        formation: 'CAP Coiffure, Brevet Professionnel',
        rib: 'FR7630001007941234567890185',
        workingMode: ['salon', 'domicile'],
        travelRadius: 15,
        specialities: ['Coupe moderne', 'Coloration', 'Lissage', 'Mèches', 'Balayage'],
        salonAddress: {
          street: 'Rue de la Paix',
          streetNumber: '15',
          city: 'Paris',
          postalCode: '75001',
          phone: '01 23 45 67 89',
          coordinates: { lat: 48.8566, lng: 2.3522 }
        },
        phone: '06 12 34 56 78'
      },
      {
        bio: 'Coiffeur expérimenté spécialisé dans les coiffures de mariage et les extensions. Plus de 8 ans d\'expérience dans la création de looks sophistiqués pour les occasions spéciales.',
        siren: '987654321',
        sirenStatus: 'pending',
        experience: 8,
        formation: 'CAP Coiffure, Mention Complémentaire',
        rib: 'FR7630001007949876543210185',
        workingMode: ['salon'],
        travelRadius: 0,
        specialities: ['Coiffures de mariage', 'Extensions', 'Permanente', 'Chignons', 'Tresses'],
        salonAddress: {
          street: 'Avenue des Champs-Élysées',
          streetNumber: '42',
          city: 'Paris',
          postalCode: '75008',
          phone: '01 98 76 54 32',
          coordinates: { lat: 48.8698, lng: 2.3077 }
        },
        phone: '06 98 76 54 32'
      },
      {
        bio: 'Spécialiste des coiffures africaines avec 12 ans d\'expérience. Expert en tresses, locks et soins capillaires naturels. Je me déplace à domicile pour votre confort.',
        siren: '456789123',
        sirenStatus: 'verified',
        experience: 12,
        formation: 'BTS Métiers de la coiffure',
        rib: 'FR7630001007944567891230185',
        workingMode: ['domicile'],
        travelRadius: 25,
        specialities: ['Coiffures africaines', 'Tresses', 'Locks', 'Soins naturels', 'Extensions afro'],
        salonAddress: null,
        phone: '06 45 67 89 12'
      },
      {
        bio: 'Coiffeuse créative spécialisée dans les coupes colorées et les styles avant-gardistes. J\'aime repousser les limites de la coiffure pour créer des looks uniques et audacieux.',
        siren: '789123456',
        sirenStatus: 'verified',
        experience: 6,
        formation: 'CAP Coiffure, Formation continue',
        rib: 'FR7630001007947891234560185',
        workingMode: ['salon', 'domicile'],
        travelRadius: 20,
        specialities: ['Coupes colorées', 'Styles avant-gardistes', 'Coiffures punk', 'Dreadlocks', 'Frisures'],
        salonAddress: {
          street: 'Rue du Faubourg Saint-Antoine',
          streetNumber: '78',
          city: 'Paris',
          postalCode: '75012',
          phone: '01 34 56 78 90',
          coordinates: { lat: 48.8566, lng: 2.3522 }
        },
        phone: '06 34 56 78 90'
      },
      {
        bio: 'Coiffeur senior avec 15 ans d\'expérience dans la coiffure classique et moderne. Spécialiste des coupes hommes et des soins capillaires professionnels.',
        siren: '321654987',
        sirenStatus: 'verified',
        experience: 15,
        formation: 'CAP Coiffure, Brevet Professionnel, Formation continue',
        rib: 'FR7630001007943216549870185',
        workingMode: ['salon'],
        travelRadius: 0,
        specialities: ['Coupes hommes', 'Soins capillaires', 'Coiffures classiques', 'Barbe', 'Shampoing'],
        salonAddress: {
          street: 'Boulevard Haussmann',
          streetNumber: '125',
          city: 'Paris',
          postalCode: '75008',
          phone: '01 56 78 90 12',
          coordinates: { lat: 48.8698, lng: 2.3077 }
        },
        phone: '06 56 78 90 12'
      }
    ];

    // Mettre à jour chaque coiffeur avec des données complètes
    for (let i = 0; i < coiffeurs.length; i++) {
      const coiffeur = coiffeurs[i];
      const dataIndex = i % completeData.length;
      const dataToAdd = completeData[dataIndex];

      // Identifier les champs manquants
      const missingFields = {};
      
      if (!coiffeur.bio) missingFields.bio = dataToAdd.bio;
      if (!coiffeur.siren) missingFields.siren = dataToAdd.siren;
      if (!coiffeur.sirenStatus) missingFields.sirenStatus = dataToAdd.sirenStatus;
      if (!coiffeur.experience) missingFields.experience = dataToAdd.experience;
      if (!coiffeur.formation) missingFields.formation = dataToAdd.formation;
      if (!coiffeur.rib) missingFields.rib = dataToAdd.rib;
      if (!coiffeur.workingMode || coiffeur.workingMode.length === 0) missingFields.workingMode = dataToAdd.workingMode;
      if (!coiffeur.travelRadius) missingFields.travelRadius = dataToAdd.travelRadius;
      if (!coiffeur.specialities || coiffeur.specialities.length === 0) missingFields.specialities = dataToAdd.specialities;
      if (!coiffeur.phone) missingFields.phone = dataToAdd.phone;
      
      // Adresse du salon seulement si elle n'existe pas
      if (!coiffeur.salonAddress?.street && dataToAdd.salonAddress) {
        missingFields.salonAddress = dataToAdd.salonAddress;
      }

      // Mettre à jour seulement si il y a des champs manquants
      if (Object.keys(missingFields).length > 0) {
        await User.findByIdAndUpdate(coiffeur._id, {
          $set: missingFields
        });

        console.log(`✅ Coiffeur ${coiffeur.name} complété avec:`, Object.keys(missingFields));
      } else {
        console.log(`ℹ️ Coiffeur ${coiffeur.name} déjà complet`);
      }
    }

    console.log('🎉 Complétion des données coiffeur terminée !');

    // Afficher un résumé
    const updatedCoiffeurs = await User.find({ role: 'coiffeur' });
    console.log('\n📊 RÉSUMÉ DES DONNÉES:');
    updatedCoiffeurs.forEach((coiffeur, index) => {
      console.log(`\n${index + 1}. ${coiffeur.name}:`);
      console.log(`   - Bio: ${coiffeur.bio ? '✅' : '❌'}`);
      console.log(`   - SIREN: ${coiffeur.siren ? '✅' : '❌'}`);
      console.log(`   - Expérience: ${coiffeur.experience ? '✅' : '❌'}`);
      console.log(`   - Formation: ${coiffeur.formation ? '✅' : '❌'}`);
      console.log(`   - RIB: ${coiffeur.rib ? '✅' : '❌'}`);
      console.log(`   - Spécialités: ${coiffeur.specialities?.length ? '✅' : '❌'}`);
      console.log(`   - Adresse salon: ${coiffeur.salonAddress?.street ? '✅' : '❌'}`);
      console.log(`   - Téléphone: ${coiffeur.phone ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la complétion:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

// Exécuter le script
completeCoiffeurData();
