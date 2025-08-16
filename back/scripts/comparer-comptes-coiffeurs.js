import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

const comparerComptesCoiffeurs = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Récupérer Marie Dubois (compte complet de référence)
    console.log('\n🔍 Récupération de Marie Dubois (compte de référence)...');
    const marieDubois = await User.findOne({ 
      email: 'marie.dubois@taphair.com' 
    }).select('-password');

    if (!marieDubois) {
      console.log('❌ Marie Dubois non trouvée');
      return;
    }

    console.log(`✅ Marie Dubois trouvée: ${marieDubois.name}`);
    console.log('📋 Structure complète de son compte:');
    console.log(JSON.stringify(marieDubois, null, 2));

    // 2. Récupérer les nouveaux coiffeurs
    console.log('\n🔍 Récupération des nouveaux coiffeurs...');
    const nouveauxCoiffeurs = await User.find({
      email: {
        $in: [
          'sophie.martin@taphair.com',
          'julie.bernard@taphair.com',
          'thomas.moreau@taphair.com',
          'camille.rousseau@taphair.com',
          'lea.dubois@taphair.com'
        ]
      }
    }).select('-password');

    console.log(`📊 Nouveaux coiffeurs trouvés: ${nouveauxCoiffeurs.length}`);

    // 3. Comparer chaque nouveau coiffeur avec Marie Dubois
    nouveauxCoiffeurs.forEach((coiffeur, index) => {
      console.log(`\n${index + 1}. COMPARAISON: ${coiffeur.name} (${coiffeur.email})`);
      console.log('=' .repeat(60));
      
      // Vérifier chaque champ important
      const champsAComparer = [
        'photo', 'address', 'workingHours', 'rating', 'specialities',
        'workingMode', 'description', 'phone', 'website', 'socialMedia',
        'certifications', 'experience', 'education', 'languages',
        'stats', 'likes', 'connectionStatus', 'isVerified', 'isActive'
      ];

      champsAComparer.forEach(champ => {
        const valeurMarie = marieDubois[champ];
        const valeurCoiffeur = coiffeur[champ];
        
        if (valeurMarie && !valeurCoiffeur) {
          console.log(`   ❌ ${champ}: MANQUANT (Marie a: ${JSON.stringify(valeurMarie)})`);
        } else if (!valeurMarie && valeurCoiffeur) {
          console.log(`   ⚠️  ${champ}: PRÉSENT mais pas chez Marie (${JSON.stringify(valeurCoiffeur)})`);
        } else if (valeurMarie && valeurCoiffeur) {
          if (JSON.stringify(valeurMarie) === JSON.stringify(valeurCoiffeur)) {
            console.log(`   ✅ ${champ}: IDENTIQUE`);
          } else {
            console.log(`   🔄 ${champ}: DIFFÉRENT`);
            console.log(`      Marie: ${JSON.stringify(valeurMarie)}`);
            console.log(`      ${coiffeur.name}: ${JSON.stringify(valeurCoiffeur)}`);
          }
        } else {
          console.log(`   ➖ ${champ}: ABSENT des deux côtés`);
        }
      });

      // Vérifier les services
      Service.countDocuments({ coiffeur: coiffeur._id })
        .then(count => {
          console.log(`   📸 Services: ${count}`);
        })
        .catch(err => {
          console.log(`   ❌ Erreur services: ${err.message}`);
        });
    });

    // 4. Résumé des champs manquants
    console.log('\n📊 RÉSUMÉ DES CHAMPS MANQUANTS:');
    console.log('=' .repeat(60));
    
    const champsManquantsParCoiffeur = {};
    
    nouveauxCoiffeurs.forEach(coiffeur => {
      const champsManquants = [];
      const champsAComparer = [
        'photo', 'address', 'workingHours', 'rating', 'specialities',
        'workingMode', 'description', 'phone', 'website', 'socialMedia',
        'certifications', 'experience', 'education', 'languages',
        'stats', 'likes', 'connectionStatus', 'isVerified', 'isActive'
      ];

      champsAComparer.forEach(champ => {
        const valeurMarie = marieDubois[champ];
        const valeurCoiffeur = coiffeur[champ];
        
        if (valeurMarie && !valeurCoiffeur) {
          champsManquants.push(champ);
        }
      });

      champsManquantsParCoiffeur[coiffeur.name] = champsManquants;
      
      if (champsManquants.length > 0) {
        console.log(`\n${coiffeur.name}:`);
        champsManquants.forEach(champ => {
          console.log(`   ❌ ${champ}`);
        });
      } else {
        console.log(`\n${coiffeur.name}: ✅ COMPLET`);
      }
    });

    console.log('\n🎉 Comparaison terminée !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

comparerComptesCoiffeurs();
