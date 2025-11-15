import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import Service from '../models/Service.js';

/**
 * Script pour vérifier si les services avec vidéos ont isActive: true
 */
const checkServicesActive = async () => {
  try {
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    const services = await Service.find({});
    console.log(`📋 ${services.length} services trouvés\n`);

    let servicesWithVideosActive = 0;
    let servicesWithVideosInactive = 0;
    let servicesWithoutVideosActive = 0;
    let servicesWithoutVideosInactive = 0;

    console.log('📊 ANALYSE DES SERVICES:\n');
    console.log('='.repeat(80));

    for (const service of services) {
      const hasVideos = service.gallery && service.gallery.some(item => item.mediaType === 'video');
      const isActive = service.isActive !== false; // isActive peut être undefined, true, ou false

      if (hasVideos) {
        if (isActive) {
          servicesWithVideosActive++;
        } else {
          servicesWithVideosInactive++;
          console.log(`❌ ${service.name} (${service.coiffeur}):`);
          console.log(`   - isActive: ${isActive}`);
          console.log(`   - Vidéos: ${service.gallery.filter(item => item.mediaType === 'video').length}`);
        }
      } else {
        if (isActive) {
          servicesWithoutVideosActive++;
        } else {
          servicesWithoutVideosInactive++;
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ:');
    console.log('='.repeat(80));
    console.log(`   ✅ Services avec vidéos ET actifs: ${servicesWithVideosActive}`);
    console.log(`   ❌ Services avec vidéos MAIS inactifs: ${servicesWithVideosInactive}`);
    console.log(`   📸 Services sans vidéos ET actifs: ${servicesWithoutVideosActive}`);
    console.log(`   ⚠️  Services sans vidéos ET inactifs: ${servicesWithoutVideosInactive}`);
    console.log('='.repeat(80));

    if (servicesWithVideosInactive > 0) {
      console.log('\n⚠️  PROBLÈME IDENTIFIÉ:');
      console.log(`   ${servicesWithVideosInactive} services avec vidéos sont inactifs et ne seront pas retournés par l'API`);
      console.log('   Ces services doivent être activés pour apparaître dans la galerie');
    }

    console.log('\n✅ Analyse terminée avec succès !\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

checkServicesActive();

