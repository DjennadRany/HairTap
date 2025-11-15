import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de backup de la base de données MongoDB
 * Crée un backup JSON de toutes les collections importantes
 */
const backupDatabase = async () => {
  try {
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', '..', 'backups');
    
    // Créer le dossier backups s'il n'existe pas
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    const backup = {
      timestamp: new Date().toISOString(),
      collections: {}
    };

    // Collections à sauvegarder
    const collectionsToBackup = [
      'users',
      'services',
      'bookings',
      'working slots',
      'reviews',
      'favorites',
      'notifications',
      'bookingvalidations',
      'incidents'
    ];

    console.log('\n📦 Début du backup...\n');

    for (const collectionName of collectionsToBackup) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          console.log(`📋 Backup de "${collectionName}" (${count} documents)...`);
          const documents = await collection.find({}).toArray();
          backup.collections[collectionName] = documents;
          console.log(`   ✅ ${documents.length} documents sauvegardés`);
        } else {
          console.log(`   ⏭️  Collection "${collectionName}" vide (ignorée)`);
        }
      } catch (error) {
        console.error(`   ❌ Erreur lors du backup de "${collectionName}":`, error.message);
      }
    }

    // Sauvegarder le backup dans un fichier JSON
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');
    
    const fileSize = (fs.statSync(backupFile).size / 1024 / 1024).toFixed(2);
    console.log(`\n✅ Backup terminé avec succès !`);
    console.log(`📁 Fichier: ${backupFile}`);
    console.log(`📊 Taille: ${fileSize} MB`);

    // Afficher le résumé
    console.log('\n📊 RÉSUMÉ DU BACKUP:');
    Object.keys(backup.collections).forEach(collectionName => {
      const count = backup.collections[collectionName].length;
      console.log(`   - ${collectionName}: ${count} documents`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du backup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

backupDatabase();

