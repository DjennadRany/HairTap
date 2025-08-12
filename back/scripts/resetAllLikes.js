import mongoose from 'mongoose';
import Service from '../models/Service.js';
import dotenv from 'dotenv';

dotenv.config();

const resetAllLikes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les services
    const services = await Service.find({});
    console.log(`📊 ${services.length} services trouvés`);

    let resetCount = 0;

    // Remettre tous les likes à zéro
    for (const service of services) {
      console.log(`\n🔍 Service: "${service.name}"`);
      console.log(`   Likes avant: ${service.likes || 0}`);
      console.log(`   Utilisateurs qui ont liké: ${service.likedBy ? service.likedBy.length : 0}`);
      
      // Remettre à zéro
      service.likes = 0;
      service.likedBy = [];
      await service.save();
      
      console.log(`   ✅ RÉINITIALISÉ: likes = 0, likedBy = []`);
      resetCount++;
    }

    console.log(`\n🎉 Réinitialisation terminée !`);
    console.log(`📈 Services réinitialisés: ${resetCount}/${services.length}`);
    
    // Vérifier que tout est bien à zéro
    const finalServices = await Service.find({});
    const totalLikes = finalServices.reduce((sum, service) => sum + (service.likes || 0), 0);
    console.log(`📊 Total des likes après reset: ${totalLikes}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

resetAllLikes(); 