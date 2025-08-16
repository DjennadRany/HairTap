import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

const creerServicesSimple = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Récupérer les nouveaux coiffeurs
    console.log('\n🔍 Récupération des nouveaux coiffeurs...');
    const nouveauxCoiffeurs = await User.find({
      email: {
        $in: [
          'sophie.martin@taphair.com',
          'julie.bernard@taphair.com',
          'thomas.moreau@taphair.com',
          'camille.rousseau@taphair.com',
          'lea.dubois@taphair.com'
        ]
      }
    }).select('_id name email specialities');

    console.log(`📊 Nouveaux coiffeurs trouvés: ${nouveauxCoiffeurs.length}`);

    // 2. Photos existantes (utiliser des photos qui existent vraiment)
    const photosExistantes = [
      '/uploads/services/service-6839ca0936ec3cfc09c649f7-1754309684774-2d47nimqhnc.jpg',
      '/uploads/services/service-6839ca0936ec3cfc09c649f8-1754309405962-l5ooi921qgh.jpg',
      '/uploads/services/service-6839ca0936ec3cfc09c649f8-1754309563571-d1aiqa2xyds.jpg'
    ];

    // 3. Supprimer les anciens services
    console.log('\n🗑️ Suppression des anciens services...');
    for (const coiffeur of nouveauxCoiffeurs) {
      await Service.deleteMany({ coiffeur: coiffeur._id });
    }

    // 4. Créer des services simples pour chaque coiffeur
    console.log('\n🔧 Création des services...');
    
    for (let i = 0; i < nouveauxCoiffeurs.length; i++) {
      const coiffeur = nouveauxCoiffeurs[i];
      const photoIndex = i % photosExistantes.length;
      
      console.log(`\n🔧 Création de service pour ${coiffeur.name}...`);
      
      const nouveauService = new Service({
        name: `Service ${coiffeur.name}`,
        description: `Service personnalisé de ${coiffeur.name}`,
        price: 50 + (i * 10),
        category: 'coupe',
        duration: 60,
        examplePhotos: [photosExistantes[photoIndex]],
        gallery: [{
          photoUrl: photosExistantes[photoIndex],
          caption: `Service de ${coiffeur.name}`,
          tags: ['coupe', 'personnalisé'],
          isBeforeAfter: false,
          likes: Math.floor(Math.random() * 50) + 20,
          createdAt: new Date()
        }],
        views: Math.floor(Math.random() * 200) + 100,
        shares: Math.floor(Math.random() * 30) + 10,
        availability: 'immédiat',
        estimatedWaitTime: 15,
        isVerified: true,
        popularityScore: Math.floor(Math.random() * 100) + 50,
        coiffeur: coiffeur._id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await nouveauService.save();
      console.log(`✅ Service créé: ${nouveauService.name} - ${nouveauService.price}€`);
      console.log(`  - Photo: ${photosExistantes[photoIndex]}`);
    }

    // 5. Vérification finale
    console.log('\n🔍 Vérification finale...');
    const totalServices = await Service.countDocuments();
    const servicesNouveauxCoiffeurs = await Service.find({
      coiffeur: { $in: nouveauxCoiffeurs.map(c => c._id) }
    }).populate('coiffeur', 'name');

    console.log(`📊 Total services dans la base: ${totalServices}`);
    console.log(`📊 Services des nouveaux coiffeurs: ${servicesNouveauxCoiffeurs.length}`);
    
    servicesNouveauxCoiffeurs.forEach(service => {
      console.log(`- ${service.name} (${service.coiffeur.name}) - ${service.price}€`);
    });

    console.log('\n🎉 Services créés avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

creerServicesSimple();
