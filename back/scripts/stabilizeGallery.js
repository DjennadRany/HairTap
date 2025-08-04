import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de la base de données
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';

// Script de stabilisation des images de galerie
async function stabilizeGallery() {
  try {
    console.log('🔒 Début de la stabilisation des images de galerie...');
    
    // Connexion à la base de données
    await mongoose.connect(mongoURI);
    console.log('✅ Connexion à la base de données établie');

    // Récupérer tous les coiffeurs
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`📊 ${coiffeurs.length} coiffeurs trouvés`);

    let stabilizedCount = 0;
    let errorCount = 0;

    for (const coiffeur of coiffeurs) {
      try {
        console.log(`🔍 Traitement du coiffeur: ${coiffeur.name} (${coiffeur._id})`);
        
        let hasChanges = false;
        
        // Stabiliser la galerie existante
        if (coiffeur.gallery && coiffeur.gallery.length > 0) {
          coiffeur.gallery.forEach(image => {
            // S'assurer que chaque image a les flags de stabilité
            if (!image._stable) {
              image._stable = true;
              hasChanges = true;
            }
            if (!image._addedAt) {
              image._addedAt = new Date();
              hasChanges = true;
            }
            // S'assurer que l'URL est valide
            if (!image.url || image.url.length === 0) {
              console.log(`⚠️  Image invalide trouvée pour ${coiffeur.name}, suppression...`);
              hasChanges = true;
            }
          });
          
          // Nettoyer les images invalides
          const originalLength = coiffeur.gallery.length;
          coiffeur.gallery = coiffeur.gallery.filter(img => img.url && img.url.length > 0);
          if (coiffeur.gallery.length !== originalLength) {
            hasChanges = true;
            console.log(`🧹 ${originalLength - coiffeur.gallery.length} images invalides supprimées pour ${coiffeur.name}`);
          }
        }
        
        // S'assurer que la photo de profil est stable
        if (coiffeur.photo && coiffeur.photo !== 'default-avatar.png') {
          coiffeur._photoChanged = false; // Marquer comme stable
          hasChanges = true;
        }
        
        if (hasChanges) {
          await coiffeur.save();
          stabilizedCount++;
          console.log(`✅ Galerie stabilisée pour ${coiffeur.name}`);
        } else {
          console.log(`✅ ${coiffeur.name} déjà stable`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${coiffeur.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Résumé de la stabilisation:');
    console.log(`✅ Galeries stabilisées: ${stabilizedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Total traité: ${coiffeurs.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la stabilisation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

// Script de vérification de la stabilité
async function verifyGalleryStability() {
  try {
    console.log('🔍 Vérification de la stabilité des galeries...');
    
    // Connexion à la base de données
    await mongoose.connect(mongoURI);
    console.log('✅ Connexion à la base de données établie');

    const coiffeurs = await User.find({ role: 'coiffeur' });
    let stableGalleries = 0;
    let unstableGalleries = 0;
    let totalImages = 0;

    for (const coiffeur of coiffeurs) {
      let isStable = true;
      
      if (coiffeur.gallery && coiffeur.gallery.length > 0) {
        coiffeur.gallery.forEach(image => {
          totalImages++;
          if (!image._stable || !image._addedAt || !image.url) {
            isStable = false;
          }
        });
        
        if (isStable) {
          stableGalleries++;
        } else {
          unstableGalleries++;
          console.log(`⚠️  Galerie instable pour ${coiffeur.name}`);
        }
      }
    }

    console.log('\n📊 Rapport de stabilité:');
    console.log(`✅ Galeries stables: ${stableGalleries}`);
    console.log(`❌ Galeries instables: ${unstableGalleries}`);
    console.log(`🖼️  Total d'images: ${totalImages}`);
    console.log(`📈 Total coiffeurs: ${coiffeurs.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

// Exécution du script selon les arguments
const command = process.argv[2];

switch (command) {
  case 'stabilize':
    stabilizeGallery();
    break;
  case 'verify':
    verifyGalleryStability();
    break;
  default:
    console.log('Usage: node stabilizeGallery.js [stabilize|verify]');
    console.log('  stabilize - Stabiliser les images de galerie existantes');
    console.log('  verify    - Vérifier la stabilité des galeries');
    break;
} 