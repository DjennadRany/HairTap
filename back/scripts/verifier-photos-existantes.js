import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import Service from '../models/Service.js';

const verifierPhotosExistantes = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les services avec leurs photos
    const services = await Service.find().select('name examplePhotos gallery');
    
    console.log('\n🔍 Photos disponibles dans la base :');
    
    const photosUniques = new Set();
    
    services.forEach(service => {
      console.log(`\n📸 Service: ${service.name}`);
      
      if (service.examplePhotos && service.examplePhotos.length > 0) {
        service.examplePhotos.forEach(photo => {
          photosUniques.add(photo);
          console.log(`  - examplePhotos: ${photo}`);
        });
      }
      
      if (service.gallery && service.gallery.length > 0) {
        service.gallery.forEach(item => {
          if (item.photoUrl) {
            photosUniques.add(item.photoUrl);
            console.log(`  - gallery: ${item.photoUrl}`);
          }
        });
      }
    });
    
    console.log('\n📊 Liste complète des photos uniques :');
    const photosArray = Array.from(photosUniques);
    photosArray.forEach((photo, index) => {
      console.log(`${index + 1}. ${photo}`);
    });
    
    console.log(`\n🎯 Total photos uniques: ${photosArray.length}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

verifierPhotosExistantes();
