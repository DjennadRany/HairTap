import mongoose from 'mongoose';
import User from '../models/User.js';
import Service from '../models/Service.js';
import fs from 'fs';
import path from 'path';

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
};

// Vérifier si une image existe
const checkImageExists = (imagePath) => {
  try {
    return fs.existsSync(path.join(process.cwd(), imagePath.substring(1)));
  } catch (error) {
    return false;
  }
};

// Nettoyer les photos invalides
const cleanInvalidPhotos = async () => {
  console.log('🧹 Nettoyage des photos invalides...');
  
  try {
    // Nettoyer les photos de profil
    const users = await User.find({});
    let cleanedUsers = 0;
    
    for (const user of users) {
      if (user.photo && user.photo !== 'default-avatar.png') {
        if (!checkImageExists(user.photo)) {
          console.log(`⚠️ Photo invalide trouvée pour ${user.name}: ${user.photo}`);
          user.photo = 'default-avatar.png';
          await user.save();
          cleanedUsers++;
        }
      }
    }
    
    console.log(`✅ ${cleanedUsers} utilisateurs nettoyés`);
    
    // Nettoyer les photos de services
    const services = await Service.find({});
    let cleanedServices = 0;
    
    for (const service of services) {
      if (service.examplePhotos && service.examplePhotos.length > 0) {
        const validPhotos = service.examplePhotos.filter(photo => {
          if (!photo || photo.startsWith('blob:')) return false;
          return checkImageExists(photo);
        });
        
        if (validPhotos.length !== service.examplePhotos.length) {
          console.log(`⚠️ Photos invalides trouvées pour le service ${service.name}`);
          service.examplePhotos = validPhotos;
          await service.save();
          cleanedServices++;
        }
      }
    }
    
    console.log(`✅ ${cleanedServices} services nettoyés`);
    
  } catch (error) {
    console.error('❌ Erreur nettoyage photos:', error);
  }
};

// Corriger les compteurs de likes
const fixLikeCounters = async () => {
  console.log('🔢 Correction des compteurs de likes...');
  
  try {
    const services = await Service.find({});
    let fixedServices = 0;
    
    for (const service of services) {
      const actualLikes = service.likedBy ? service.likedBy.length : 0;
      
      if (service.likes !== actualLikes) {
        console.log(`⚠️ Compteur de likes incorrect pour ${service.name}: ${service.likes} vs ${actualLikes}`);
        service.likes = actualLikes;
        await service.save();
        fixedServices++;
      }
    }
    
    console.log(`✅ ${fixedServices} services corrigés`);
    
  } catch (error) {
    console.error('❌ Erreur correction compteurs:', error);
  }
};

// Afficher les statistiques
const showStats = async () => {
  console.log('📊 Statistiques:');
  
  const users = await User.countDocuments();
  const coiffeurs = await User.countDocuments({ role: 'coiffeur' });
  const services = await Service.countDocuments();
  const servicesWithPhotos = await Service.countDocuments({ 
    examplePhotos: { $exists: true, $ne: [] } 
  });
  
  console.log(`👥 Utilisateurs: ${users}`);
  console.log(`💇 Coiffeurs: ${coiffeurs}`);
  console.log(`✂️ Services: ${services}`);
  console.log(`🖼️ Services avec photos: ${servicesWithPhotos}`);
};

// Script principal
const main = async () => {
  console.log('🚀 Test et nettoyage des photos...');
  
  await connectDB();
  
  await cleanInvalidPhotos();
  await fixLikeCounters();
  await showStats();
  
  console.log('✅ Test terminé !');
  process.exit(0);
};

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error);
  process.exit(1);
});

// Lancer le script
main().catch((error) => {
  console.error('❌ Erreur script:', error);
  process.exit(1);
}); 