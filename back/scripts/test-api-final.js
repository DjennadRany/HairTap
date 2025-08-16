import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';

const testApiFinal = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Test de l'API des coiffeurs (simulation exacte du frontend)
    console.log('\n🔍 Test de l\'API des coiffeurs (simulation frontend)...');
    
    const query = { role: 'coiffeur' };
    const coiffeurs = await User.find(query)
      .select('-password')
      .sort({ rating: -1, totalRatings: -1 });

    console.log(`📊 Coiffeurs trouvés: ${coiffeurs.length}`);
    
    coiffeurs.forEach((coiffeur, index) => {
      console.log(`\n--- Coiffeur ${index + 1} ---`);
      console.log(`Nom: ${coiffeur.name}`);
      console.log(`Email: ${coiffeur.email}`);
      console.log(`Note: ${coiffeur.rating || 'N/A'}`);
      console.log(`Avis: ${coiffeur.totalRatings || 0}`);
      console.log(`Spécialités: ${coiffeur.specialities?.join(', ') || 'Aucune'}`);
      console.log(`Photo: ${coiffeur.photo ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`WorkingHours: ${coiffeur.workingHours ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`Likes: ${coiffeur.likes || '❌ Manquant'}`);
      console.log(`Stats: ${coiffeur.stats ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`Address: ${coiffeur.address ? '✅ Présent' : '❌ Manquant'}`);
    });

    // Test de l'API des services
    console.log('\n🔍 Test de l\'API des services...');
    
    const Service = mongoose.model('Service');
    const services = await Service.find({})
      .populate('coiffeur', 'name rating address photo bio');

    console.log(`📊 Services trouvés: ${services.length}`);
    
    services.slice(0, 5).forEach((service, index) => {
      console.log(`\n--- Service ${index + 1} ---`);
      console.log(`Nom: ${service.name}`);
      console.log(`Prix: ${service.price}€`);
      console.log(`Catégorie: ${service.category}`);
      console.log(`Coiffeur: ${service.coiffeur?.name || 'N/A'}`);
      console.log(`Photos: ${service.examplePhotos?.length || 0}`);
      console.log(`Galerie: ${service.gallery?.length || 0}`);
    });

    console.log('\n🎯 RÉSUMÉ:');
    console.log(`✅ ${coiffeurs.length} coiffeurs disponibles pour l'API`);
    console.log(`✅ ${services.length} services disponibles pour l'API`);
    console.log('🎉 L\'API devrait maintenant retourner tous les nouveaux coiffeurs !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

testApiFinal();
