import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Configuration
dotenv.config();

// Connexion à la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Modèle User
const User = mongoose.model('User', new mongoose.Schema({
  photo: String,
  _photoChanged: Boolean
}));

// Fonction pour diagnostiquer les photos
const diagnosePhotos = async () => {
  console.log('\n🔍 DIAGNOSTIC DES PHOTOS');
  console.log('========================');
  
  const users = await User.find({});
  console.log(`📊 Total utilisateurs: ${users.length}`);
  
  let withPhotos = 0;
  let withoutPhotos = 0;
  let invalidPhotos = 0;
  let validPhotos = 0;
  
  for (const user of users) {
    if (user.photo && user.photo !== 'default-avatar.png') {
      withPhotos++;
      
      // Vérifier si le fichier existe
      if (user.photo.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), user.photo.substring(1));
        if (fs.existsSync(filePath)) {
          validPhotos++;
          console.log(`✅ Photo valide: ${user.photo} (${user.name || user.email})`);
        } else {
          invalidPhotos++;
          console.log(`❌ Photo manquante: ${user.photo} (${user.name || user.email})`);
        }
      } else {
        invalidPhotos++;
        console.log(`⚠️ URL invalide: ${user.photo} (${user.name || user.email})`);
      }
    } else {
      withoutPhotos++;
    }
  }
  
  console.log('\n📈 STATISTIQUES:');
  console.log(`- Utilisateurs avec photo: ${withPhotos}`);
  console.log(`- Utilisateurs sans photo: ${withoutPhotos}`);
  console.log(`- Photos valides: ${validPhotos}`);
  console.log(`- Photos invalides: ${invalidPhotos}`);
  
  return { withPhotos, withoutPhotos, validPhotos, invalidPhotos };
};

// Fonction pour corriger les photos
const fixPhotos = async () => {
  console.log('\n🔧 CORRECTION DES PHOTOS');
  console.log('========================');
  
  const users = await User.find({});
  let fixed = 0;
  let errors = 0;
  
  for (const user of users) {
    try {
      if (user.photo && user.photo !== 'default-avatar.png') {
        // Vérifier si le fichier existe
        if (user.photo.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), user.photo.substring(1));
          if (!fs.existsSync(filePath)) {
            // Corriger la photo manquante
            await User.findByIdAndUpdate(user._id, {
              photo: 'default-avatar.png',
              _photoChanged: true
            });
            console.log(`🔧 Photo corrigée pour: ${user.name || user.email}`);
            fixed++;
          }
        } else {
          // URL invalide, la corriger
          await User.findByIdAndUpdate(user._id, {
            photo: 'default-avatar.png',
            _photoChanged: true
          });
          console.log(`🔧 URL corrigée pour: ${user.name || user.email}`);
          fixed++;
        }
      }
    } catch (error) {
      console.error(`❌ Erreur correction ${user.name || user.email}:`, error);
      errors++;
    }
  }
  
  console.log(`\n✅ Correction terminée: ${fixed} photos corrigées, ${errors} erreurs`);
};

// Fonction pour créer des images par défaut
const createDefaultImages = () => {
  console.log('\n🖼️ CRÉATION DES IMAGES PAR DÉFAUT');
  console.log('==================================');
  
  const publicDir = path.join(process.cwd(), 'public');
  const defaultAvatarPath = path.join(publicDir, 'default-avatar.png');
  const defaultServicePath = path.join(publicDir, 'default-service-image.png');
  
  // Créer le dossier public s'il n'existe pas
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('📁 Dossier public créé');
  }
  
  // Créer des images par défaut simples (1x1 pixel PNG)
  const defaultImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  
  if (!fs.existsSync(defaultAvatarPath)) {
    fs.writeFileSync(defaultAvatarPath, defaultImage);
    console.log('✅ Image par défaut créée: default-avatar.png');
  }
  
  if (!fs.existsSync(defaultServicePath)) {
    fs.writeFileSync(defaultServicePath, defaultImage);
    console.log('✅ Image par défaut créée: default-service-image.png');
  }
};

// Fonction principale
const main = async () => {
  try {
    await connectDB();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'diagnose':
        await diagnosePhotos();
        break;
      case 'fix':
        await fixPhotos();
        break;
      case 'create-defaults':
        createDefaultImages();
        break;
      case 'all':
        await diagnosePhotos();
        await fixPhotos();
        createDefaultImages();
        break;
      default:
        console.log('Usage: node fixPhotos.js [diagnose|fix|create-defaults|all]');
        console.log('  diagnose: Diagnostiquer les problèmes de photos');
        console.log('  fix: Corriger les photos manquantes');
        console.log('  create-defaults: Créer les images par défaut');
        console.log('  all: Exécuter toutes les opérations');
    }
    
    console.log('\n✅ Script terminé');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

// Exécuter le script
main(); 