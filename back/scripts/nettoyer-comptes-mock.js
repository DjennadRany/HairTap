import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';

const nettoyerComptesMock = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Identifier les comptes mock à supprimer
    console.log('\n🗑️ Identification des comptes mock à supprimer...');
    
    const comptesASupprimer = [
      'sophie.martin@taphair.com',
      'julie.bernard@taphair.com', 
      'thomas.moreau@taphair.com',
      'camille.rousseau@taphair.com',
      'lea.dubois@taphair.com'
    ];

    // 2. Supprimer chaque compte mock
    console.log('\n🗑️ Suppression des comptes mock...');
    
    for (const email of comptesASupprimer) {
      const compte = await User.findOne({ email });
      
      if (compte) {
        console.log(`🗑️ Suppression de ${compte.name} (${email})...`);
        await User.findByIdAndDelete(compte._id);
        console.log(`✅ ${compte.name} supprimé`);
      } else {
        console.log(`ℹ️ ${email} n'existe pas déjà`);
      }
    }

    // 3. Vérifier ce qui reste
    console.log('\n🔍 Vérification des comptes restants...');
    const coiffeursRestants = await User.find({ role: 'coiffeur' }).select('name email');
    
    console.log(`📊 Coiffeurs restants: ${coiffeursRestants.length}`);
    coiffeursRestants.forEach(coiffeur => {
      console.log(`- ${coiffeur.name} (${coiffeur.email})`);
    });

    console.log('\n🎉 Nettoyage terminé !');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

nettoyerComptesMock();
