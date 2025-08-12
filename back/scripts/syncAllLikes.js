import mongoose from 'mongoose';
import Service from '../models/Service.js';
import dotenv from 'dotenv';

dotenv.config();

const syncAllLikes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les services
    const services = await Service.find({});
    console.log(`📊 ${services.length} services trouvés`);

    let syncedCount = 0;

    // Synchroniser chaque service
    for (const service of services) {
      const actualLikes = service.likedBy ? service.likedBy.length : 0;
      const storedLikes = service.likes || 0;
      
      console.log(`\n🔍 Service: "${service.name}"`);
      console.log(`   Likes stockés: ${storedLikes}`);
      console.log(`   Likes réels (likedBy.length): ${actualLikes}`);
      
      if (actualLikes !== storedLikes) {
        // Synchroniser les likes
        await service.syncLikes();
        console.log(`   ✅ SYNCHRONISÉ: likes mis à jour de ${storedLikes} à ${actualLikes}`);
        syncedCount++;
      } else {
        console.log(`   ✅ OK: likes déjà synchronisés`);
      }
    }

    console.log(`\n🎉 Synchronisation terminée !`);
    console.log(`📈 Services synchronisés: ${syncedCount}/${services.length}`);
    
    // Afficher un résumé final
    const finalServices = await Service.find({});
    const totalLikes = finalServices.reduce((sum, service) => {
      return sum + (service.likedBy ? service.likedBy.length : 0);
    }, 0);
    console.log(`📊 Total des likes: ${totalLikes}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

syncAllLikes(); 