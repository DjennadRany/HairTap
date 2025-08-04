import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';

async function checkUserAddresses() {
  try {
    console.log('🔍 Vérification des adresses utilisateur...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Trouver l'utilisateur Alice Martin
    const user = await User.findOne({ email: 'alice.martin@test.com' });
    
    if (!user) {
      console.log('❌ Utilisateur Alice Martin non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:', user.name);
    console.log('📊 Données utilisateur complètes:', JSON.stringify(user, null, 2));
    
    if (user.addresses) {
      console.log('🏠 Adresses trouvées:');
      console.log('   Home:', user.addresses.home);
      console.log('   Office:', user.addresses.office);
    } else {
      console.log('❌ Aucune adresse trouvée');
    }
    
    console.log('🎉 Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

checkUserAddresses(); 