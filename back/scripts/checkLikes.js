import mongoose from 'mongoose';
import Service from '../models/Service.js';
import dotenv from 'dotenv';

dotenv.config();

const checkLikes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les services
    const services = await Service.find({});
    console.log(`📊 ${services.length} services trouvés`);

    let correctedCount = 0;

    // Vérifier et corriger chaque service
    for (const service of services) {
      const actualLikes = service.likedBy ? service.likedBy.length : 0;
      const storedLikes = service.likes || 0;
      
      console.log(`\n🔍 Service: "${service.name}"`);
      console.log(`   Likes stockés: ${storedLikes}`);
      console.log(`   Utilisateurs qui ont liké: ${actualLikes}`);
      console.log(`   Liste likedBy:`, service.likedBy ? service.likedBy.map(id => id.toString()) : []);
      
      // Si les likes ne correspondent pas, corriger
      if (actualLikes !== storedLikes) {
        service.likes = actualLikes;
        await service.save();
        console.log(`   ✅ CORRIGÉ: likes mis à jour de ${storedLikes} à ${actualLikes}`);
        correctedCount++;
      } else {
        console.log(`   ✅ OK: likes cohérents`);
      }
    }

    console.log(`\n🎉 Vérification terminée !`);
    console.log(`📈 Services corrigés: ${correctedCount}/${services.length}`);
    
    // Afficher un résumé final
    const finalServices = await Service.find({});
    const totalLikes = finalServices.reduce((sum, service) => sum + (service.likes || 0), 0);
    console.log(`📊 Total des likes: ${totalLikes}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

checkLikes(); 