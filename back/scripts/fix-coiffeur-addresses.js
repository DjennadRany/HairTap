import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const fixCoiffeurAddresses = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les coiffeurs
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`📊 ${coiffeurs.length} coiffeurs trouvés\n`);

    for (const coiffeur of coiffeurs) {
      console.log(`🔍 Traitement de ${coiffeur.name}...`);
      
      let needsUpdate = false;
      const updateData = {};

      // 1. VÉRIFIER ET CORRIGER L'ADRESSE DU SALON
      if (coiffeur.salonAddress?.street) {
        console.log(`   ✅ Adresse salon présente: ${coiffeur.salonAddress.street}`);
        
        // S'assurer que les coordonnées sont présentes
        if (!coiffeur.salonAddress.coordinates) {
          console.log(`   📍 Ajout de coordonnées pour l'adresse salon...`);
          updateData['salonAddress.coordinates'] = { lat: 48.8566, lng: 2.3522 }; // Paris par défaut
          needsUpdate = true;
        }
      } else {
        console.log(`   ❌ Adresse salon manquante`);
      }

      // 2. SUPPRIMER L'ANCIEN CHAMP 'address' OBSOLÈTE
      if (coiffeur.address) {
        console.log(`   🗑️ Suppression de l'ancien champ 'address': ${coiffeur.address.street}`);
        updateData.address = undefined;
        needsUpdate = true;
      }

      // 3. VÉRIFIER ET CORRIGER LE MODE DE TRAVAIL
      if (!coiffeur.workingMode || coiffeur.workingMode.length === 0) {
        console.log(`   🏠 Ajout du mode de travail par défaut: salon`);
        updateData.workingMode = ['salon'];
        needsUpdate = true;
      } else {
        console.log(`   ✅ Mode de travail: ${coiffeur.workingMode.join(', ')}`);
      }

      // 4. VÉRIFIER ET CORRIGER LE RAYON DE DÉPLACEMENT
      if (!coiffeur.travelRadius && coiffeur.workingMode?.includes('domicile')) {
        console.log(`   🚗 Ajout du rayon de déplacement par défaut: 15 km`);
        updateData.travelRadius = 15;
        needsUpdate = true;
      } else if (coiffeur.travelRadius) {
        console.log(`   ✅ Rayon de déplacement: ${coiffeur.travelRadius} km`);
      }

      // 5. VÉRIFIER ET CORRIGER LES HORAIRES
      if (!coiffeur.workingHours) {
        console.log(`   🕐 Ajout des horaires de travail par défaut`);
        updateData.workingHours = {
          monday: { start: '09:00', end: '18:00', isAvailable: true },
          tuesday: { start: '09:00', end: '18:00', isAvailable: true },
          wednesday: { start: '09:00', end: '18:00', isAvailable: true },
          thursday: { start: '09:00', end: '18:00', isAvailable: true },
          friday: { start: '09:00', end: '18:00', isAvailable: true },
          saturday: { start: '09:00', end: '17:00', isAvailable: true },
          sunday: { start: '10:00', end: '16:00', isAvailable: false }
        };
        needsUpdate = true;
      } else {
        console.log(`   ✅ Horaires de travail présents`);
      }

      // 6. VÉRIFIER ET CORRIGER LES SERVICES
      if (!coiffeur.services || coiffeur.services.length === 0) {
        console.log(`   ✂️ Ajout de services par défaut`);
        updateData.services = [
          {
            name: 'Coupe homme',
            description: 'Coupe classique ou moderne',
            duration: 30,
            priceHT: 25,
            tags: ['coupe', 'homme']
          },
          {
            name: 'Coupe femme',
            description: 'Coupe et brushing',
            duration: 60,
            priceHT: 45,
            tags: ['coupe', 'femme', 'brushing']
          }
        ];
        needsUpdate = true;
      } else {
        console.log(`   ✅ Services présents: ${coiffeur.services.length}`);
      }

      // Mettre à jour si nécessaire
      if (needsUpdate) {
        // Si on doit supprimer l'ancien champ address, utiliser $unset
        if (updateData.address === undefined) {
          delete updateData.address;
          await User.findByIdAndUpdate(coiffeur._id, { 
            $set: updateData,
            $unset: { address: 1 }
          }, { new: true });
        } else {
          await User.findByIdAndUpdate(coiffeur._id, { $set: updateData }, { new: true });
        }
        console.log(`   ✅ ${coiffeur.name} mis à jour avec succès`);
      } else {
        console.log(`   ℹ️ ${coiffeur.name} déjà à jour`);
      }

      console.log('   ' + '─'.repeat(60));
    }

    console.log('🎉 Nettoyage des adresses coiffeur terminé !');

    // Afficher un résumé final
    const updatedCoiffeurs = await User.find({ role: 'coiffeur' });
    console.log('\n📊 RÉSUMÉ FINAL:');
    updatedCoiffeurs.forEach((coiffeur, index) => {
      console.log(`\n${index + 1}. ${coiffeur.name}:`);
      console.log(`   - Adresse salon: ${coiffeur.salonAddress?.street ? '✅' : '❌'}`);
      console.log(`   - Coordonnées salon: ${coiffeur.salonAddress?.coordinates ? '✅' : '❌'}`);
      console.log(`   - Mode de travail: ${coiffeur.workingMode?.length ? '✅' : '❌'}`);
      console.log(`   - Rayon déplacement: ${coiffeur.travelRadius ? '✅' : '❌'}`);
      console.log(`   - Horaires: ${coiffeur.workingHours ? '✅' : '❌'}`);
      console.log(`   - Services: ${coiffeur.services?.length ? '✅' : '❌'}`);
      console.log(`   - Ancien champ 'address': ${coiffeur.address ? '❌' : '✅'}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

// Exécuter le script
fixCoiffeurAddresses();
