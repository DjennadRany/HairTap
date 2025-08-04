import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';

async function checkPhotoUpload() {
  try {
    console.log('🔍 Vérification de l\'upload de photo...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connexion à la base de données établie');

    // Récupérer tous les utilisateurs avec leurs photos
    const users = await User.find({}).select('name email photo _photoChanged');
    
    console.log('\n📊 Photos de profil dans la base de données:');
    users.forEach(user => {
      console.log(`👤 ${user.name} (${user.email}):`);
      console.log(`   📸 Photo: ${user.photo}`);
      console.log(`   🔄 Photo changée: ${user._photoChanged}`);
      console.log('');
    });

    // Vérifier les fichiers sur le disque
    const fs = await import('fs');
    const path = await import('path');
    const profilesPath = path.join(process.cwd(), 'uploads', 'profiles');
    
    if (fs.existsSync(profilesPath)) {
      const files = fs.readdirSync(profilesPath);
      console.log('📁 Fichiers dans uploads/profiles/:');
      files.forEach(file => {
        console.log(`   📄 ${file}`);
      });
    } else {
      console.log('❌ Dossier uploads/profiles/ non trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

checkPhotoUpload(); 