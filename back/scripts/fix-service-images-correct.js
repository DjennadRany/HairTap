import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de correction des images de services
 * Utilise les VRAIES URLs d'images depuis /back/uploads/services/
 */
const fixServiceImages = async () => {
  try {
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Lister les fichiers d'images réels
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'services');
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

    // 2. Créer un mapping des catégories vers les images disponibles
    // Pour l'instant, on va utiliser toutes les images disponibles
    const imageUrls = realImageFiles.map(file => `/uploads/services/${file}`);
    console.log(`📋 ${imageUrls.length} URLs d'images disponibles\n`);

    // 3. Récupérer tous les services
    const services = await Service.find({}).populate('coiffeur', 'name');
    console.log(`📋 ${services.length} services trouvés\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 4. Corriger chaque service
    for (const service of services) {
      const coiffeurName = service.coiffeur?.name || 'Inconnu';
      const category = service.category || 'autre';
      
      // Vérifier si le service a déjà une bonne image
      let hasGoodImage = false;
      let currentImageUrl = null;
      
      if (service.gallery && service.gallery.length > 0) {
        const firstImage = service.gallery[0];
        currentImageUrl = firstImage.mediaUrl || firstImage.photoUrl;
        
        if (currentImageUrl && 
            (currentImageUrl.startsWith('/uploads/services/') || 
             currentImageUrl.includes('service-') ||
             (currentImageUrl.includes('.jpg') && !currentImageUrl.includes('default')))) {
          hasGoodImage = true;
        }
      }
      
      if (!hasGoodImage && service.examplePhotos && service.examplePhotos.length > 0) {
        currentImageUrl = service.examplePhotos[0];
        
        if (currentImageUrl && 
            (currentImageUrl.startsWith('/uploads/services/') || 
             currentImageUrl.includes('service-') ||
             (currentImageUrl.includes('.jpg') && !currentImageUrl.includes('default')))) {
          hasGoodImage = true;
        }
      }
      
      // Si le service a déjà une bonne image, le skip
      if (hasGoodImage) {
        skippedCount++;
        continue;
      }
      
      // Sélectionner une image aléatoire parmi les images disponibles
      const randomImageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
      
      try {
        // Mettre à jour le service
        service.examplePhotos = [randomImageUrl];
        
        if (!service.gallery || service.gallery.length === 0) {
          service.gallery = [{
            mediaUrl: randomImageUrl,
            mediaType: 'image',
            caption: service.name,
            tags: service.specialities?.map(s => s.name || s) || [],
            likes: Math.floor(Math.random() * 20 + 5),
            createdAt: new Date()
          }];
        } else {
          // Mettre à jour la première image de la galerie
          service.gallery[0].mediaUrl = randomImageUrl;
          service.gallery[0].mediaType = 'image';
        }
        
        await service.save();
        console.log(`   ✅ Service "${service.name}" (${coiffeurName}) corrigé avec: ${randomImageUrl.split('/').pop()}`);
        fixedCount++;
      } catch (error) {
        console.error(`   ❌ Erreur lors de la correction de "${service.name}":`, error.message);
        errorCount++;
      }
    }

    // 5. Afficher le résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DE LA CORRECTION:');
    console.log('='.repeat(80));
    console.log(`   ✅ Services corrigés: ${fixedCount}`);
    console.log(`   ⏭️  Services déjà corrects (ignorés): ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📈 Total: ${services.length} services traités`);
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

fixServiceImages();

