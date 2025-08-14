import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const testUserData = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    // Récupérer tous les utilisateurs
    const users = await User.find({}).select('-password');
    console.log(`\n👥 ${users.length} utilisateurs trouvés:`);
    
    users.forEach((user, index) => {
      console.log(`\n--- Utilisateur ${index + 1} ---`);
      console.log(`ID: ${user._id}`);
      console.log(`Nom: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Rôle: ${user.role}`);
      console.log(`Téléphone: ${user.phone || 'Non défini'}`);
      console.log(`Bio: ${user.bio || 'Non définie'}`);
      console.log(`Adresses:`, JSON.stringify(user.addresses, null, 2));
      console.log(`Préférences:`, JSON.stringify(user.preferences, null, 2));
      console.log(`Photo: ${user.photo || 'Non définie'}`);
    });
    
    // Vérifier spécifiquement les adresses
    console.log('\n🔍 Vérification des adresses:');
    users.forEach((user, index) => {
      if (user.addresses) {
        console.log(`\n📍 Utilisateur ${index + 1} (${user.name}):`);
        console.log('- Adresses:', Object.keys(user.addresses));
        
        if (user.addresses.home) {
          const homeData = Object.values(user.addresses.home).filter(val => val && val.trim());
          console.log('- Home (champs remplis):', homeData.length > 0 ? homeData : 'Aucun');
        }
        
        if (user.addresses.office) {
          const officeData = Object.values(user.addresses.office).filter(val => val && val.trim());
          console.log('- Office (champs remplis):', officeData.length > 0 ? officeData : 'Aucun');
        }
      } else {
        console.log(`\n❌ Utilisateur ${index + 1} (${user.name}): Pas d'adresses`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

testUserData();
