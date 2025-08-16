import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import Service from '../models/Service.js';

const testApiServices = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Vérifier le nombre total de services
    const totalServices = await Service.countDocuments();
    console.log(`📊 Total services dans la base: ${totalServices}`);

    // 2. Récupérer tous les services avec population
    const services = await Service.find()
      .populate('coiffeur', 'name rating')
      .populate('specialities.specialtyId', 'name category')
      .limit(5);

    console.log('\n🔍 Services trouvés:');
    services.forEach((service, index) => {
      console.log(`\n${index + 1}. Service: ${service.name}`);
      console.log(`   - Prix: ${service.price}€`);
      console.log(`   - Catégorie: ${service.category}`);
      console.log(`   - Coiffeur: ${service.coiffeur?.name || 'N/A'}`);
      console.log(`   - Rating: ${service.coiffeur?.rating || 'N/A'}`);
      
      if (service.examplePhotos && service.examplePhotos.length > 0) {
        console.log(`   - Photos d'exemple: ${service.examplePhotos.length}`);
        service.examplePhotos.forEach((photo, i) => {
          console.log(`     * ${photo}`);
        });
      }
      
      if (service.gallery && service.gallery.length > 0) {
        console.log(`   - Photos galerie: ${service.gallery.length}`);
        service.gallery.forEach((item, i) => {
          console.log(`     * ${item.photoUrl} - ${item.caption}`);
        });
      }
      
      if (service.specialities && service.specialities.length > 0) {
        console.log(`   - Spécialités: ${service.specialities.length}`);
        service.specialities.forEach((spec, i) => {
          console.log(`     * ${spec.specialtyId?.name || 'N/A'} (niveau ${spec.expertiseLevel})`);
        });
      }
    });

    // 3. Vérifier les services des nouveaux coiffeurs
    const nouveauxCoiffeurs = await mongoose.model('User').find({
      email: {
        $in: [
          'sophie.martin@taphair.com',
          'julie.bernard@taphair.com',
          'thomas.moreau@taphair.com',
          'camille.rousseau@taphair.com',
          'lea.dubois@taphair.com'
        ]
      }
    }).select('_id name');

    console.log('\n🔍 Services des nouveaux coiffeurs:');
    for (const coiffeur of nouveauxCoiffeurs) {
      const servicesCoiffeur = await Service.find({ coiffeur: coiffeur._id });
      console.log(`\n${coiffeur.name}:`);
      if (servicesCoiffeur.length > 0) {
        servicesCoiffeur.forEach(service => {
          console.log(`  - ${service.name} (${service.price}€)`);
          console.log(`    Photos: ${service.examplePhotos?.length || 0} example, ${service.gallery?.length || 0} gallery`);
        });
      } else {
        console.log(`  - Aucun service`);
      }
    }

    console.log('\n🎉 Test terminé !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

testApiServices();
