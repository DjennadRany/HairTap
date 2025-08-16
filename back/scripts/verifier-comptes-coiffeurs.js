import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

const verifierComptesCoiffeurs = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Vérifier tous les coiffeurs
    console.log('\n🔍 Vérification de tous les coiffeurs...');
    const coiffeurs = await User.find({ role: 'coiffeur' }).select('_id name email photo address workingHours rating specialities');
    
    console.log(`📊 Total coiffeurs trouvés: ${coiffeurs.length}`);
    
    coiffeurs.forEach((coiffeur, index) => {
      console.log(`\n${index + 1}. ${coiffeur.name} (${coiffeur.email})`);
      
      // Vérifier les champs obligatoires
      const champsManquants = [];
      if (!coiffeur.photo) champsManquants.push('photo');
      if (!coiffeur.address) champsManquants.push('address');
      if (!coiffeur.workingHours) champsManquants.push('workingHours');
      if (!coiffeur.rating) champsManquants.push('rating');
      if (!coiffeur.specialities || coiffeur.specialities.length === 0) champsManquants.push('specialities');
      
      if (champsManquants.length > 0) {
        console.log(`   ❌ Champs manquants: ${champsManquants.join(', ')}`);
      } else {
        console.log(`   ✅ Compte complet`);
      }
      
      // Vérifier les services
      Service.countDocuments({ coiffeur: coiffeur._id })
        .then(count => {
          console.log(`   📸 Services: ${count}`);
        })
        .catch(err => {
          console.log(`   ❌ Erreur services: ${err.message}`);
        });
    });

    // 2. Vérifier les nouveaux coiffeurs spécifiquement
    console.log('\n🔍 Vérification des nouveaux coiffeurs...');
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
    }).select('_id name email photo address workingHours rating specialities');

    console.log(`📊 Nouveaux coiffeurs trouvés: ${nouveauxCoiffeurs.length}`);
    
    nouveauxCoiffeurs.forEach((coiffeur, index) => {
      console.log(`\n${index + 1}. ${coiffeur.name} (${coiffeur.email})`);
      
      // Vérifier les champs obligatoires
      const champsManquants = [];
      if (!coiffeur.photo) champsManquants.push('photo');
      if (!coiffeur.address) champsManquants.push('address');
      if (!coiffeur.workingHours) champsManquants.push('workingHours');
      if (!coiffeur.rating) champsManquants.push('rating');
      if (!coiffeur.specialities || coiffeur.specialities.length === 0) champsManquants.push('specialities');
      
      if (champsManquants.length > 0) {
        console.log(`   ❌ Champs manquants: ${champsManquants.join(', ')}`);
      } else {
        console.log(`   ✅ Compte complet`);
      }
      
      // Vérifier les services
      Service.countDocuments({ coiffeur: coiffeur._id })
        .then(count => {
          console.log(`   📸 Services: ${count}`);
        })
        .catch(err => {
          console.log(`   ❌ Erreur services: ${err.message}`);
        });
    });

    console.log('\n🎉 Vérification terminée !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

verifierComptesCoiffeurs();
