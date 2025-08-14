import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const checkCoiffeurData = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les coiffeurs
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`📊 ${coiffeurs.length} coiffeurs trouvés\n`);

    // Afficher les données détaillées de chaque coiffeur
    coiffeurs.forEach((coiffeur, index) => {
      console.log(`👤 COIFFEUR ${index + 1}: ${coiffeur.name}`);
      console.log(`   📧 Email: ${coiffeur.email}`);
      console.log(`   📱 Téléphone: ${coiffeur.phone || '❌ Non renseigné'}`);
      console.log(`   📝 Bio: ${coiffeur.bio ? '✅ Renseignée' : '❌ Non renseignée'}`);
      console.log(`   🏢 SIREN: ${coiffeur.siren || '❌ Non renseigné'}`);
      console.log(`   ✅ Statut SIREN: ${coiffeur.sirenStatus || '❌ Non renseigné'}`);
      console.log(`   💳 RIB: ${coiffeur.rib || '❌ Non renseigné'}`);
      console.log(`   ⏰ Expérience: ${coiffeur.experience || '❌ Non renseigné'} an(s)`);
      console.log(`   🎓 Formation: ${coiffeur.formation || '❌ Non renseigné'}`);
      console.log(`   🏠 Mode de travail: ${coiffeur.workingMode?.length ? coiffeur.workingMode.join(', ') : '❌ Non renseigné'}`);
      console.log(`   🚗 Rayon de déplacement: ${coiffeur.travelRadius || '❌ Non renseigné'} km`);
      console.log(`   ✨ Spécialités: ${coiffeur.specialities?.length ? coiffeur.specialities.join(', ') : '❌ Non renseigné'}`);
      
      if (coiffeur.salonAddress?.street) {
        console.log(`   🏪 Adresse salon: ${coiffeur.salonAddress.streetNumber || ''} ${coiffeur.salonAddress.street}, ${coiffeur.salonAddress.postalCode} ${coiffeur.salonAddress.city}`);
        console.log(`   📞 Téléphone salon: ${coiffeur.salonAddress.phone || '❌ Non renseigné'}`);
      } else {
        console.log(`   🏪 Adresse salon: ❌ Non renseignée`);
      }
      
      console.log(`   📊 Note: ${coiffeur.rating || 0}/5 (${coiffeur.totalRatings || 0} avis)`);
      console.log(`   📅 Créé le: ${coiffeur.createdAt}`);
      console.log('   ' + '─'.repeat(80));
    });

    // Statistiques globales
    console.log('\n📈 STATISTIQUES GLOBALES:');
    const stats = {
      total: coiffeurs.length,
      avecBio: coiffeurs.filter(c => c.bio).length,
      avecSiren: coiffeurs.filter(c => c.siren).length,
      avecRib: coiffeurs.filter(c => c.rib).length,
      avecExperience: coiffeurs.filter(c => c.experience).length,
      avecFormation: coiffeurs.filter(c => c.formation).length,
      avecSpecialites: coiffeurs.filter(c => c.specialities?.length).length,
      avecAdresseSalon: coiffeurs.filter(c => c.salonAddress?.street).length,
      avecTelephone: coiffeurs.filter(c => c.phone).length,
      sirenVerifies: coiffeurs.filter(c => c.sirenStatus === 'verified').length,
      modeSalon: coiffeurs.filter(c => c.workingMode?.includes('salon')).length,
      modeDomicile: coiffeurs.filter(c => c.workingMode?.includes('domicile')).length
    };

    console.log(`   📊 Total coiffeurs: ${stats.total}`);
    console.log(`   📝 Avec bio: ${stats.avecBio}/${stats.total} (${Math.round(stats.avecBio/stats.total*100)}%)`);
    console.log(`   🏢 Avec SIREN: ${stats.avecSiren}/${stats.total} (${Math.round(stats.avecSiren/stats.total*100)}%)`);
    console.log(`   ✅ SIREN vérifiés: ${stats.sirenVerifies}/${stats.avecSiren} (${stats.avecSiren ? Math.round(stats.sirenVerifies/stats.avecSiren*100) : 0}%)`);
    console.log(`   💳 Avec RIB: ${stats.avecRib}/${stats.total} (${Math.round(stats.avecRib/stats.total*100)}%)`);
    console.log(`   ⏰ Avec expérience: ${stats.avecExperience}/${stats.total} (${Math.round(stats.avecExperience/stats.total*100)}%)`);
    console.log(`   🎓 Avec formation: ${stats.avecFormation}/${stats.total} (${Math.round(stats.avecFormation/stats.total*100)}%)`);
    console.log(`   ✨ Avec spécialités: ${stats.avecSpecialites}/${stats.total} (${Math.round(stats.avecSpecialites/stats.total*100)}%)`);
    console.log(`   🏪 Avec adresse salon: ${stats.avecAdresseSalon}/${stats.total} (${Math.round(stats.avecAdresseSalon/stats.total*100)}%)`);
    console.log(`   📱 Avec téléphone: ${stats.avecTelephone}/${stats.total} (${Math.round(stats.avecTelephone/stats.total*100)}%)`);
    console.log(`   🏠 Mode salon: ${stats.modeSalon}/${stats.total} (${Math.round(stats.modeSalon/stats.total*100)}%)`);
    console.log(`   🚗 Mode domicile: ${stats.modeDomicile}/${stats.total} (${Math.round(stats.modeDomicile/stats.total*100)}%)`);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
};

// Exécuter le script
checkCoiffeurData();
