import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de correction des photos de coiffeurs
 * Assigne des vraies photos aux coiffeurs qui n'en ont pas
 */
const fixCoiffeurPhotos = async () => {
  try {
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Lister les fichiers d'images réels
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'profiles');
    const realImageFiles = [];
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      realImageFiles.push(...files.filter(f => 
        f.endsWith('.jpg') || 
        f.endsWith('.jpeg') || 
        f.endsWith('.png') || 
        f.endsWith('.webp')
      ));
    }
    
    console.log(`📸 ${realImageFiles.length} fichiers d'images réels trouvés\n`);

    if (realImageFiles.length === 0) {
      console.log('❌ Aucun fichier d\'image trouvé. Impossible de corriger.');
      process.exit(1);
    }

    // 2. Créer les URLs des images disponibles
    const imageUrls = realImageFiles.map(file => `/uploads/profiles/${file}`);
    console.log(`📋 ${imageUrls.length} URLs d'images disponibles\n`);

    // 3. Récupérer tous les coiffeurs
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`📋 ${coiffeurs.length} coiffeurs trouvés\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 4. Corriger chaque coiffeur
    for (const coiffeur of coiffeurs) {
      const photoUrl = coiffeur.photo;
      
      // Vérifier si le coiffeur a déjà une bonne photo
      let hasGoodPhoto = false;
      
      if (photoUrl && photoUrl !== '' && photoUrl !== '/default-avatar.png') {
        // Vérifier si l'URL pointe vers un fichier réel
        if (photoUrl.startsWith('/uploads/profiles/')) {
          const fileName = photoUrl.split('/').pop();
          const isRealFile = realImageFiles.some(f => f === fileName || f.includes(fileName.split('-')[0]));
          if (isRealFile) {
            hasGoodPhoto = true;
          }
        } else if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
          hasGoodPhoto = true; // URLs externes supposées valides
        }
      }
      
      // Si le coiffeur a déjà une bonne photo, le skip
      if (hasGoodPhoto) {
        skippedCount++;
        continue;
      }
      
      // Sélectionner une image aléatoire parmi les images disponibles
      const randomImageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
      
      try {
        // Mettre à jour le coiffeur
        coiffeur.photo = randomImageUrl;
        await coiffeur.save();
        console.log(`   ✅ Coiffeur "${coiffeur.name}" corrigé avec: ${randomImageUrl.split('/').pop()}`);
        fixedCount++;
      } catch (error) {
        console.error(`   ❌ Erreur lors de la correction de "${coiffeur.name}":`, error.message);
        errorCount++;
      }
    }

    // 5. Afficher le résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DE LA CORRECTION:');
    console.log('='.repeat(80));
    console.log(`   ✅ Coiffeurs corrigés: ${fixedCount}`);
    console.log(`   ⏭️  Coiffeurs déjà corrects (ignorés): ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📈 Total: ${coiffeurs.length} coiffeurs traités`);
    console.log('='.repeat(80));
    console.log('\n✅ Correction terminée avec succès !\n');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

fixCoiffeurPhotos();

