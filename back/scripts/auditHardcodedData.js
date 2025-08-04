import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

// Modèle User
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  photo: String,
  _photoChanged: Boolean
}));

// Fonction pour auditer les données hardcodées
const auditHardcodedData = async () => {
  console.log('\n🔍 AUDIT DES DONNÉES HARDCODÉES');
  console.log('==================================');
  
  try {
    // 1. Vérifier les utilisateurs dans la base
    const users = await User.find({});
    console.log(`📊 Utilisateurs dans la base: ${users.length}`);
    
    const usersWithPhotos = users.filter(user => 
      user.photo && user.photo !== 'default-avatar.png'
    );
    
    console.log(`📸 Utilisateurs avec photos: ${usersWithPhotos.length}`);
    
    // 2. Lister les vraies photos
    console.log('\n📋 PHOTOS RÉELLES DANS LA BASE:');
    usersWithPhotos.forEach(user => {
      console.log(`  - ${user.name || user.email}: ${user.photo}`);
    });
    
    // 3. Vérifier les fichiers sur le disque
    console.log('\n📁 VÉRIFICATION DES FICHIERS:');
    const uploadsDir = path.join(process.cwd(), 'uploads', 'profiles');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`  📂 Fichiers dans uploads/profiles/: ${files.length}`);
      files.forEach(file => {
        console.log(`    - ${file}`);
      });
    } else {
      console.log('  ❌ Dossier uploads/profiles/ non trouvé');
    }
    
    // 4. Vérifier la cohérence base/fichiers
    console.log('\n🔗 COHÉRENCE BASE/FICHIERS:');
    let coherent = 0;
    let incoherent = 0;
    
    for (const user of usersWithPhotos) {
      if (user.photo.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), user.photo.substring(1));
        const fileExists = fs.existsSync(filePath);
        
        if (fileExists) {
          console.log(`  ✅ ${user.name || user.email}: Fichier existe`);
          coherent++;
        } else {
          console.log(`  ❌ ${user.name || user.email}: Fichier manquant`);
          incoherent++;
        }
      }
    }
    
    console.log(`\n📊 RÉSULTAT: ${coherent} cohérents, ${incoherent} incohérents`);
    
    // 5. Recommandations
    console.log('\n💡 RECOMMANDATIONS:');
    if (incoherent > 0) {
      console.log('  🔧 Corriger les photos manquantes dans la base');
    }
    console.log('  ✅ Utiliser uniquement les données de la base');
    console.log('  ✅ Éviter les URLs hardcodées');
    console.log('  ✅ Tester avec les vraies données');
    
  } catch (error) {
    console.error('❌ Erreur audit:', error);
  }
};

// Fonction pour nettoyer les données incohérentes
const cleanInconsistentData = async () => {
  console.log('\n🧹 NETTOYAGE DES DONNÉES INCOHÉRENTES');
  console.log('=======================================');
  
  try {
    const users = await User.find({});
    let cleaned = 0;
    
    for (const user of users) {
      if (user.photo && user.photo !== 'default-avatar.png' && user.photo.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), user.photo.substring(1));
        const fileExists = fs.existsSync(filePath);
        
        if (!fileExists) {
          // Corriger la photo manquante
          await User.findByIdAndUpdate(user._id, {
            photo: 'default-avatar.png',
            _photoChanged: true
          });
          console.log(`🔧 Photo corrigée pour: ${user.name || user.email}`);
          cleaned++;
        }
      }
    }
    
    console.log(`\n✅ Nettoyage terminé: ${cleaned} photos corrigées`);
    
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
  }
};

// Fonction principale
const main = async () => {
  try {
    await connectDB();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'audit':
        await auditHardcodedData();
        break;
      case 'clean':
        await cleanInconsistentData();
        break;
      case 'all':
        await auditHardcodedData();
        await cleanInconsistentData();
        break;
      default:
        console.log('Usage: node auditHardcodedData.js [audit|clean|all]');
        console.log('  audit: Auditer les données hardcodées');
        console.log('  clean: Nettoyer les données incohérentes');
        console.log('  all: Audit + nettoyage');
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