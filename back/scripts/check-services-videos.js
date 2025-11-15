import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import Service from '../models/Service.js';

/**
 * Script pour vérifier les services avec vidéos dans la base de données
 */
const checkServicesVideos = async () => {
  try {
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    const services = await Service.find({});
    console.log(`📋 ${services.length} services trouvés\n`);

    let servicesWithVideos = 0;
    let servicesWithoutGallery = 0;
    let servicesWithImagesOnly = 0;
    let totalVideos = 0;

    console.log('📊 ANALYSE DES SERVICES:\n');
    console.log('='.repeat(80));

    for (const service of services) {
      if (!service.gallery || service.gallery.length === 0) {
        servicesWithoutGallery++;
        continue;
      }

      const videos = service.gallery.filter(item => item.mediaType === 'video');
      const images = service.gallery.filter(item => item.mediaType === 'image' || !item.mediaType);

      if (videos.length > 0) {
        servicesWithVideos++;
        totalVideos += videos.length;
        console.log(`✅ ${service.name} (${service.coiffeur}):`);
        console.log(`   - Vidéos: ${videos.length}`);
        console.log(`   - Images: ${images.length}`);
        videos.forEach((video, index) => {
          console.log(`   - Vidéo ${index + 1}: ${video.mediaUrl || video.photoUrl || 'N/A'}`);
        });
      } else {
        servicesWithImagesOnly++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ:');
    console.log('='.repeat(80));
    console.log(`   ✅ Services avec vidéos: ${servicesWithVideos}`);
    console.log(`   📸 Services avec images uniquement: ${servicesWithImagesOnly}`);
    console.log(`   ⚠️  Services sans galerie: ${servicesWithoutGallery}`);
    console.log(`   🎥 Total vidéos: ${totalVideos}`);
    console.log('='.repeat(80));

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

checkServicesVideos();

