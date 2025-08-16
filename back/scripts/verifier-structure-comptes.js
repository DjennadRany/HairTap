import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';

const verifierStructureComptes = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Analyser un compte existant en détail
    console.log('\n🔍 Analyse d\'un compte existant (Marie Dubois)...');
    const marieDubois = await User.findOne({ email: 'marie.dubois@taphair.com' });
    
    if (marieDubois) {
      console.log('📋 Structure du compte Marie Dubois:');
      console.log(`- _id: ${marieDubois._id}`);
      console.log(`- name: ${marieDubois.name}`);
      console.log(`- email: ${marieDubois.email}`);
      console.log(`- role: ${marieDubois.role}`);
      console.log(`- password: ${marieDubois.password ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- photo: ${marieDubois.photo || '❌ Manquant'}`);
      console.log(`- bio: ${marieDubois.bio || '❌ Manquant'}`);
      console.log(`- phone: ${marieDubois.phone || '❌ Manquant'}`);
      console.log(`- address: ${marieDubois.address ? '✅ Présent' : '❌ Manquant'}`);
      if (marieDubois.address) {
        console.log(`  - street: ${marieDubois.address.street}`);
        console.log(`  - city: ${marieDubois.address.city}`);
        console.log(`  - coordinates: ${marieDubois.address.coordinates ? '✅ Présent' : '❌ Manquant'}`);
      }
      console.log(`- siren: ${marieDubois.siren || '❌ Manquant'}`);
      console.log(`- sirenStatus: ${marieDubois.sirenStatus || '❌ Manquant'}`);
      console.log(`- specialities: ${marieDubois.specialities?.join(', ') || '❌ Manquant'}`);
      console.log(`- rating: ${marieDubois.rating || '❌ Manquant'}`);
      console.log(`- totalRatings: ${marieDubois.totalRatings || '❌ Manquant'}`);
      console.log(`- workingMode: ${marieDubois.workingMode?.join(', ') || '❌ Manquant'}`);
      console.log(`- workingHours: ${marieDubois.workingHours ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- travelRadius: ${marieDubois.travelRadius || '❌ Manquant'}`);
      console.log(`- likes: ${marieDubois.likes || '❌ Manquant'}`);
      console.log(`- stats: ${marieDubois.stats ? '✅ Présent' : '❌ Manquant'}`);
      if (marieDubois.stats) {
        console.log(`  - totalBookings: ${marieDubois.stats.totalBookings}`);
        console.log(`  - completedBookings: ${marieDubois.stats.completedBookings}`);
        console.log(`  - averageRating: ${marieDubois.stats.averageRating}`);
        console.log(`  - profileViews: ${marieDubois.stats.profileViews}`);
      }
    }

    // Vérifier un nouveau compte
    console.log('\n🔍 Analyse d\'un nouveau compte (Sophie Martin)...');
    const sophieMartin = await User.findOne({ email: 'sophie.martin@taphair.com' });
    
    if (sophieMartin) {
      console.log('📋 Structure du compte Sophie Martin:');
      console.log(`- _id: ${sophieMartin._id}`);
      console.log(`- name: ${sophieMartin.name}`);
      console.log(`- email: ${sophieMartin.email}`);
      console.log(`- role: ${sophieMartin.role}`);
      console.log(`- password: ${sophieMartin.password ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- photo: ${sophieMartin.photo || '❌ Manquant'}`);
      console.log(`- bio: ${sophieMartin.bio || '❌ Manquant'}`);
      console.log(`- phone: ${sophieMartin.phone || '❌ Manquant'}`);
      console.log(`- address: ${sophieMartin.address ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- siren: ${sophieMartin.siren || '❌ Manquant'}`);
      console.log(`- sirenStatus: ${sophieMartin.sirenStatus || '❌ Manquant'}`);
      console.log(`- specialities: ${sophieMartin.specialities?.join(', ') || '❌ Manquant'}`);
      console.log(`- rating: ${sophieMartin.rating || '❌ Manquant'}`);
      console.log(`- totalRatings: ${sophieMartin.totalRatings || '❌ Manquant'}`);
      console.log(`- workingMode: ${sophieMartin.workingMode?.join(', ') || '❌ Manquant'}`);
      console.log(`- workingHours: ${sophieMartin.workingHours ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- travelRadius: ${sophieMartin.travelRadius || '❌ Manquant'}`);
      console.log(`- likes: ${sophieMartin.likes || '❌ Manquant'}`);
      console.log(`- stats: ${sophieMartin.stats ? '✅ Présent' : '❌ Manquant'}`);
    }

    // Vérifier pourquoi l'API ne retourne pas les nouveaux coiffeurs
    console.log('\n🔍 Test de l\'API des coiffeurs...');
    const allCoiffeurs = await User.find({ role: 'coiffeur' }).select('name email rating totalRatings');
    console.log(`📊 Total coiffeurs trouvés: ${allCoiffeurs.length}`);
    allCoiffeurs.forEach(coiffeur => {
      console.log(`- ${coiffeur.name}: Note ${coiffeur.rating || 'N/A'}, Avis ${coiffeur.totalRatings || 0}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

verifierStructureComptes();
