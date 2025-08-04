import mongoose from 'mongoose';
import Service from '../models/Service.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Script de migration des images
async function migrateImages() {
  try {
    console.log('🔧 Début de la migration des images...');
    
    // Connexion à la base de données
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Nettoyer les URLs blob dans les services
    const services = await Service.find({});
    let updatedServices = 0;

    for (const service of services) {
      let hasChanges = false;
      
      // Nettoyer les examplePhotos
      if (service.examplePhotos && service.examplePhotos.length > 0) {
        const cleanedPhotos = service.examplePhotos.filter(url => {
          // Garder seulement les URLs valides (pas de blob)
          return url && !url.startsWith('blob:') && (url.startsWith('http') || url.startsWith('/'));
        });
        
        if (cleanedPhotos.length !== service.examplePhotos.length) {
          service.examplePhotos = cleanedPhotos;
          hasChanges = true;
        }
      }

      // Nettoyer les likes si nécessaire
      if (!service.likes) {
        service.likes = 0;
        hasChanges = true;
      }

      if (!service.likedBy) {
        service.likedBy = [];
        hasChanges = true;
      }

      if (hasChanges) {
        await service.save();
        updatedServices++;
      }
    }

    console.log(`✅ ${updatedServices} services mis à jour`);

    // Nettoyer les photos de profil
    const users = await User.find({});
    let updatedUsers = 0;

    for (const user of users) {
      if (user.photo && user.photo.startsWith('blob:')) {
        user.photo = null; // Supprimer les URLs blob
        await user.save();
        updatedUsers++;
      }
    }

    console.log(`✅ ${updatedUsers} utilisateurs mis à jour`);

    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la migration si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateImages();
}

export default migrateImages; 