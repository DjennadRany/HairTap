import mongoose from 'mongoose';
import User from '../models/User.js';
import Service from '../models/Service.js';

const updateServicesPhotos = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    // Récupérer Marie Dubois comme référence
    const marieDubois = await User.findOne({ email: 'marie.dubois@taphair.com' });
    if (!marieDubois) {
      console.log('❌ Marie Dubois non trouvée. Impossible de mettre à jour les services.');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log('✅ Marie Dubois trouvée comme référence');
    
    // Récupérer les services de Marie Dubois pour utiliser leurs photos
    const marieServices = await Service.find({ coiffeur: marieDubois._id }).limit(10);
    console.log(`✅ ${marieServices.length} services de Marie Dubois trouvés comme référence`);
    
    // Créer un mapping des catégories vers les services/photos
    const servicePhotosByCategory = {};
    marieServices.forEach(service => {
      const category = service.category || 'autre';
      if (!servicePhotosByCategory[category]) {
        servicePhotosByCategory[category] = [];
      }
      // Utiliser les photos de la galerie si disponibles, sinon examplePhotos
      const photos = service.gallery && service.gallery.length > 0
        ? service.gallery.map(g => g.mediaUrl).filter(Boolean)
        : (service.examplePhotos || []).filter(Boolean);
      if (photos.length > 0) {
        servicePhotosByCategory[category].push(...photos);
      }
    });
    
    console.log('📸 Photos par catégorie:', Object.keys(servicePhotosByCategory).map(cat => `${cat}: ${servicePhotosByCategory[cat].length} photos`).join(', '));
    
    // Récupérer tous les coiffeurs parisiens
    const parisCoiffeurs = await User.find({
      role: 'coiffeur',
      'address.city': 'Paris'
    });
    
    console.log(`\n📋 ${parisCoiffeurs.length} coiffeurs parisiens trouvés`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const coiffeur of parisCoiffeurs) {
      console.log(`\n🔍 Traitement de ${coiffeur.name}...`);
      
      // Récupérer tous les services de ce coiffeur
      const services = await Service.find({ coiffeur: coiffeur._id });
      console.log(`  📦 ${services.length} services trouvés`);
      
      for (const service of services) {
        // Vérifier si le service a déjà des photos valides
        const hasValidPhotos = (service.gallery && service.gallery.length > 0 && service.gallery[0].mediaUrl) ||
                               (service.examplePhotos && service.examplePhotos.length > 0 && service.examplePhotos[0]);
        
        if (hasValidPhotos && !service.gallery?.[0]?.mediaUrl?.includes('default')) {
          console.log(`    ⏭️  Service "${service.name}" a déjà des photos valides`);
          skippedCount++;
          continue;
        }
        
        // Utiliser les photos des services existants de Marie Dubois selon la catégorie
        const categoryPhotos = servicePhotosByCategory[service.category] || [];
        const defaultPhoto = categoryPhotos.length > 0 
          ? categoryPhotos[Math.floor(Math.random() * categoryPhotos.length)]
          : (marieServices[0]?.gallery?.[0]?.mediaUrl || marieServices[0]?.examplePhotos?.[0] || marieDubois.photo || '/default-service.jpg');
        
        // Mettre à jour le service
        service.examplePhotos = [defaultPhoto];
        service.gallery = [{
          mediaUrl: defaultPhoto,
          mediaType: 'image',
          caption: service.name,
          tags: coiffeur.specialities || [],
          likes: Math.floor(Math.random() * 20 + 5),
          createdAt: new Date()
        }];
        
        await service.save();
        console.log(`    ✅ Service "${service.name}" mis à jour avec photo`);
        updatedCount++;
      }
    }
    
    console.log('\n📊 RÉSUMÉ:');
    console.log(`  ✅ ${updatedCount} services mis à jour`);
    console.log(`  ⏭️  ${skippedCount} services déjà à jour (ignorés)`);
    console.log(`  📈 Total: ${updatedCount + skippedCount} services traités`);
    
    console.log('\n🎉 Mise à jour des photos des services terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des photos des services:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

// Exécuter le script
updateServicesPhotos();

