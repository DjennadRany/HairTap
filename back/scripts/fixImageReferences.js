import mongoose from 'mongoose';
import User from '../models/User.js';
import Service from '../models/Service.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';

class ImageReferenceFixer {
  constructor() {
    this.stats = {
      usersProcessed: 0,
      servicesProcessed: 0,
      invalidImagesFixed: 0,
      errors: 0
    };
  }

  async connect() {
    try {
      await mongoose.connect(mongoURI);
      console.log('✅ Connexion à la base de données établie');
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('🔌 Connexion à la base de données fermée');
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error);
    }
  }

  // Vérifier si une image existe physiquement
  checkImageExists(imageUrl) {
    if (!imageUrl || imageUrl === 'default-avatar.png') {
      return true; // Image par défaut, considérée comme valide
    }

    if (imageUrl.startsWith('blob:')) {
      return false; // URL blob invalide
    }

    // Extraire le chemin du fichier
    const filePath = path.join(process.cwd(), imageUrl.substring(1));
    return fs.existsSync(filePath);
  }

  // Nettoyer les photos de profil invalides
  async fixProfilePhotos() {
    console.log('\n🖼️  Nettoyage des photos de profil...');
    
    try {
      const users = await User.find({});
      
      for (const user of users) {
        try {
          let hasChanges = false;

          // Vérifier si la photo existe
          if (user.photo && !this.checkImageExists(user.photo)) {
            console.log(`🧹 Photo invalide détectée pour ${user.name}: ${user.photo}`);
            user.photo = 'default-avatar.png';
            hasChanges = true;
            this.stats.invalidImagesFixed++;
          }

          if (hasChanges) {
            await user.save();
            this.stats.usersProcessed++;
            console.log(`✅ Photo corrigée pour ${user.name}`);
          }
        } catch (error) {
          console.error(`❌ Erreur pour ${user.name}:`, error.message);
          this.stats.errors++;
        }
      }
    } catch (error) {
      console.error('❌ Erreur nettoyage photos profil:', error);
      this.stats.errors++;
    }
  }

  // Nettoyer les photos de service invalides
  async fixServicePhotos() {
    console.log('\n✂️  Nettoyage des photos de service...');
    
    try {
      const services = await Service.find({});
      
      for (const service of services) {
        try {
          let hasChanges = false;

          // Vérifier chaque photo de service
          if (service.examplePhotos && service.examplePhotos.length > 0) {
            const validPhotos = service.examplePhotos.filter(photo => 
              this.checkImageExists(photo)
            );
            
            if (validPhotos.length !== service.examplePhotos.length) {
              const removedCount = service.examplePhotos.length - validPhotos.length;
              console.log(`🧹 ${removedCount} photos invalides supprimées pour ${service.name}`);
              service.examplePhotos = validPhotos;
              hasChanges = true;
              this.stats.invalidImagesFixed += removedCount;
            }
          }

          if (hasChanges) {
            await service.save();
            this.stats.servicesProcessed++;
            console.log(`✅ Photos corrigées pour ${service.name}`);
          }
        } catch (error) {
          console.error(`❌ Erreur pour service ${service.name}:`, error.message);
          this.stats.errors++;
        }
      }
    } catch (error) {
      console.error('❌ Erreur nettoyage photos service:', error);
      this.stats.errors++;
    }
  }

  // Afficher les statistiques
  printStats() {
    console.log('\n📊 Statistiques du nettoyage:');
    console.log(`👥 Utilisateurs traités: ${this.stats.usersProcessed}`);
    console.log(`✂️  Services traités: ${this.stats.servicesProcessed}`);
    console.log(`🧹 Images invalides corrigées: ${this.stats.invalidImagesFixed}`);
    console.log(`❌ Erreurs: ${this.stats.errors}`);
  }

  // Exécuter le nettoyage
  async runFix() {
    console.log('🚀 Début du nettoyage des références d\'images...');
    
    try {
      await this.connect();
      
      // Exécuter les corrections
      await this.fixProfilePhotos();
      await this.fixServicePhotos();
      
      // Afficher les statistiques
      this.printStats();
      
      console.log('\n✅ Nettoyage terminé avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// Exécuter le nettoyage
const imageFixer = new ImageReferenceFixer();
imageFixer.runFix(); 