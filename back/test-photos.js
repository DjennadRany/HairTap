import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Service from './models/Service.js';

dotenv.config();

const testPhotos = async () => {
  try {
    console.log('🔍 [TEST] Test des chemins de photos');
    
    // Connexion à la base de données
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    await mongoose.connect(mongoURI);
    console.log('✅ [TEST] Connecté à MongoDB');
    
    // Test 1: Vérifier les photos des utilisateurs
    console.log('\n👥 [TEST] Photos des utilisateurs:');
    const users = await User.find({}).select('name photo photos');
    
    users.forEach(user => {
      console.log(`\n${user.name}:`);
      console.log(`  photo: ${user.photo}`);
      console.log(`  photos: ${JSON.stringify(user.photos)}`);
      
      // Tester la construction de l'URL
      let photoUrl = null;
      if (user.photo && user.photo !== '/default-avatar.png') {
        const photoName = user.photo.split('/').pop();
        photoUrl = `http://localhost:5000/uploads/profiles/${photoName}`;
        console.log(`  → URL construite: ${photoUrl}`);
      } else if (user.photos && user.photos.length > 0) {
        const photoName = user.photos[0].split('/').pop();
        photoUrl = `http://localhost:5000/uploads/profiles/${photoName}`;
        console.log(`  → URL construite: ${photoUrl}`);
      } else {
        photoUrl = 'http://localhost:5000/default-avatar.png';
        console.log(`  → URL par défaut: ${photoUrl}`);
      }
    });
    
    // Test 2: Vérifier les photos des services
    console.log('\n✂️ [TEST] Photos des services:');
    const services = await Service.find({}).select('name examplePhotos gallery');
    
    services.forEach(service => {
      console.log(`\n${service.name}:`);
      console.log(`  examplePhotos: ${JSON.stringify(service.examplePhotos)}`);
      console.log(`  gallery: ${JSON.stringify(service.gallery)}`);
      
      // Tester la construction de l'URL
      let imageUrl = null;
      if (service.examplePhotos && service.examplePhotos.length > 0) {
        const photoName = service.examplePhotos[0].split('/').pop();
        imageUrl = `http://localhost:5000/uploads/services/${photoName}`;
        console.log(`  → URL construite: ${imageUrl}`);
      } else if (service.gallery && service.gallery.length > 0) {
        const photoName = service.gallery[0].photoUrl.split('/').pop();
        imageUrl = `http://localhost:5000/uploads/services/${photoName}`;
        console.log(`  → URL construite: ${imageUrl}`);
      }
      
      if (!imageUrl) {
        console.log(`  → Aucune photo trouvée`);
      }
    });
    
    console.log('\n✅ [TEST] Tests des photos terminés');
    
  } catch (error) {
    console.error('❌ [TEST] Erreur lors des tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 [TEST] Déconnecté de MongoDB');
  }
};

testPhotos();
