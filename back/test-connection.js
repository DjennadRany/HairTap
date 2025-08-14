import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';

async function testConnection() {
  try {
    console.log('🔌 Test de connexion MongoDB...');
    console.log('URI:', MONGO_URI);
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connecté avec succès !');
    
    // Tester la collection User
    const User = mongoose.model('User', new mongoose.Schema({}));
    const userCount = await User.countDocuments();
    console.log('👥 Nombre d\'utilisateurs dans la base:', userCount);
    
    // Tester si le champ phone existe
    const sampleUser = await User.findOne({});
    if (sampleUser) {
      console.log('📱 Champs disponibles:', Object.keys(sampleUser.toObject()));
    }
    
    await mongoose.disconnect();
    console.log('✅ Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
}

testConnection();
