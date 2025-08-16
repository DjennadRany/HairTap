import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

const testApiCoiffeurs = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Vérifier combien de coiffeurs existent
    console.log('\n🔍 Vérification des coiffeurs dans la base...');
    const allCoiffeurs = await User.find({ role: 'coiffeur' }).select('name email specialities');
    console.log(`📊 Total coiffeurs: ${allCoiffeurs.length}`);
    allCoiffeurs.forEach(coiffeur => {
      console.log(`- ${coiffeur.name} (${coiffeur.email}) - Spécialités: ${coiffeur.specialities.join(', ')}`);
    });

    // 2. Vérifier combien de services existent
    console.log('\n🔍 Vérification des services dans la base...');
    const allServices = await Service.find({ isActive: true }).select('name coiffeur category');
    console.log(`📊 Total services: ${allServices.length}`);
    allServices.forEach(service => {
      console.log(`- ${service.name} (Catégorie: ${service.category}) - Coiffeur: ${service.coiffeur}`);
    });

    // 3. Tester la requête de l'API (simulation)
    console.log('\n🔍 Test de la requête API (simulation)...');
    const query = { role: 'coiffeur' };
    const coiffeurs = await User.find(query)
      .select('-password')
      .sort({ rating: -1, totalRatings: -1 });
    
    console.log(`📊 Coiffeurs trouvés par l'API: ${coiffeurs.length}`);
    coiffeurs.forEach(coiffeur => {
      console.log(`- ${coiffeur.name} - Note: ${coiffeur.rating || 'N/A'} - Avis: ${coiffeur.totalRatings || 0}`);
    });

    // 4. Vérifier les services avec population
    console.log('\n🔍 Test de la population des services...');
    const servicesWithCoiffeur = await Service.find({ isActive: true })
      .populate('coiffeur', 'name rating address photo bio');
    
    console.log(`📊 Services avec coiffeur: ${servicesWithCoiffeur.length}`);
    servicesWithCoiffeur.slice(0, 3).forEach(service => {
      console.log(`- ${service.name} - Coiffeur: ${service.coiffeur?.name || 'N/A'} - Note: ${service.coiffeur?.rating || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

testApiCoiffeurs();
