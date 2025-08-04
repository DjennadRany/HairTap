import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configuration
dotenv.config();

// Connexion à la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Modèle User simplifié
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  photo: String,
  _photoChanged: Boolean
}));

// Test simple
const simpleTest = async () => {
  console.log('\n🧪 TEST SIMPLE');
  console.log('==============');
  
  try {
    // 1. Vérifier les utilisateurs
    const users = await User.find({});
    console.log(`📊 Utilisateurs: ${users.length}`);
    
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.role}): ${user.photo}`);
    });
    
    // 2. Vérifier les photos
    const usersWithPhotos = users.filter(u => u.photo && u.photo !== 'default-avatar.png');
    console.log(`📸 Photos: ${usersWithPhotos.length}`);
    
    // 3. Recommandations
    console.log('\n💡 RECOMMANDATIONS:');
    console.log('1. Démarrer le serveur backend: npm run dev');
    console.log('2. Tester les uploads de photos');
    console.log('3. Vérifier les routes API');
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
};

// Fonction principale
const main = async () => {
  try {
    await connectDB();
    await simpleTest();
    console.log('\n✅ Test terminé');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

// Exécuter
main(); 