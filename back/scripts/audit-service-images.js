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
 * Script d'audit des images de services
 * Identifie les vraies URLs d'images et les services qui ont de mauvaises photos
 */
const auditServiceImages = async () => {
  try {
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Récupérer tous les services
    const services = await Service.find({}).populate('coiffeur', 'name email');
    console.log(`📋 ${services.length} services trouvés\n`);

    // 2. Lister les fichiers d'images réels dans /back/uploads/services/
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'services');
    const realImageFiles = [];
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      realImageFiles.push(...files.filter(f => 
        f.endsWith('.jpg') || 
        f.endsWith('.jpeg') || 
        f.endsWith('.png') || 
        f.endsWith('.webp') ||
        f.endsWith('.mp4')
      ));
    }
    
    console.log(`📸 ${realImageFiles.length} fichiers d'images réels trouvés dans /back/uploads/services/`);
    console.log(`   Exemples: ${realImageFiles.slice(0, 5).join(', ')}...\n`);

    // 3. Analyser chaque service
    const servicesWithGoodImages = [];
    const servicesWithBadImages = [];
    const servicesWithoutImages = [];
    const imageUrlMap = new Map(); // Map pour stocker les URLs valides par catégorie

    for (const service of services) {
      const coiffeurName = service.coiffeur?.name || 'Inconnu';
      const category = service.category || 'autre';
      
      // Vérifier les images du service
      let hasGoodImage = false;
      let hasBadImage = false;
      let imageUrl = null;
      
      // Vérifier gallery
      if (service.gallery && service.gallery.length > 0) {
        const firstImage = service.gallery[0];
        imageUrl = firstImage.mediaUrl || firstImage.photoUrl;
        
        if (imageUrl) {
          // Vérifier si l'URL pointe vers un fichier réel
          const fileName = imageUrl.split('/').pop();
          const isRealFile = realImageFiles.some(f => f.includes(fileName) || fileName.includes(f.split('-')[0]));
          
          if (isRealFile || imageUrl.startsWith('/uploads/services/') || imageUrl.includes('service-')) {
            hasGoodImage = true;
            
            // Stocker l'URL par catégorie pour réutilisation
            if (!imageUrlMap.has(category)) {
              imageUrlMap.set(category, []);
            }
            imageUrlMap.get(category).push(imageUrl);
          } else if (imageUrl.includes('default') || imageUrl.includes('avatar') || !imageUrl.startsWith('/uploads/')) {
            hasBadImage = true;
          }
        }
      }
      
      // Vérifier examplePhotos
      if (!hasGoodImage && service.examplePhotos && service.examplePhotos.length > 0) {
        imageUrl = service.examplePhotos[0];
        
        if (imageUrl) {
          const fileName = imageUrl.split('/').pop();
          const isRealFile = realImageFiles.some(f => f.includes(fileName) || fileName.includes(f.split('-')[0]));
          
          if (isRealFile || imageUrl.startsWith('/uploads/services/') || imageUrl.includes('service-')) {
            hasGoodImage = true;
            
            if (!imageUrlMap.has(category)) {
              imageUrlMap.set(category, []);
            }
            imageUrlMap.get(category).push(imageUrl);
          } else if (imageUrl.includes('default') || imageUrl.includes('avatar') || !imageUrl.startsWith('/uploads/')) {
            hasBadImage = true;
          }
        }
      }
      
      // Classer le service
      if (hasGoodImage) {
        servicesWithGoodImages.push({
          _id: service._id,
          name: service.name,
          coiffeur: coiffeurName,
          category: category,
          imageUrl: imageUrl
        });
      } else if (hasBadImage) {
        servicesWithBadImages.push({
          _id: service._id,
          name: service.name,
          coiffeur: coiffeurName,
          category: category,
          currentImageUrl: imageUrl
        });
      } else {
        servicesWithoutImages.push({
          _id: service._id,
          name: service.name,
          coiffeur: coiffeurName,
          category: category
        });
      }
    }

    // 4. Afficher le rapport
    console.log('📊 RAPPORT D\'AUDIT DES IMAGES DE SERVICES\n');
    console.log('='.repeat(80));
    console.log(`✅ Services avec bonnes images: ${servicesWithGoodImages.length}`);
    console.log(`❌ Services avec mauvaises images: ${servicesWithBadImages.length}`);
    console.log(`⚠️  Services sans images: ${servicesWithoutImages.length}`);
    console.log('='.repeat(80));

    // Afficher les URLs valides par catégorie
    console.log('\n📸 URLs D\'IMAGES VALIDES PAR CATÉGORIE:\n');
    imageUrlMap.forEach((urls, category) => {
      const uniqueUrls = [...new Set(urls)];
      console.log(`   ${category}: ${uniqueUrls.length} URLs valides`);
      if (uniqueUrls.length > 0) {
        console.log(`      Exemples: ${uniqueUrls.slice(0, 3).join(', ')}`);
      }
    });

    // Afficher les services avec mauvaises images
    if (servicesWithBadImages.length > 0) {
      console.log('\n❌ SERVICES AVEC MAUVAISES IMAGES:\n');
      servicesWithBadImages.slice(0, 10).forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.name} (${service.coiffeur}) - Catégorie: ${service.category}`);
        console.log(`      URL actuelle: ${service.currentImageUrl}`);
      });
      if (servicesWithBadImages.length > 10) {
        console.log(`   ... et ${servicesWithBadImages.length - 10} autres`);
      }
    }

    // Afficher les services sans images
    if (servicesWithoutImages.length > 0) {
      console.log('\n⚠️  SERVICES SANS IMAGES:\n');
      servicesWithoutImages.slice(0, 10).forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.name} (${service.coiffeur}) - Catégorie: ${service.category}`);
      });
      if (servicesWithoutImages.length > 10) {
        console.log(`   ... et ${servicesWithoutImages.length - 10} autres`);
      }
    }

    // 5. Sauvegarder le rapport
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalServices: services.length,
        servicesWithGoodImages: servicesWithGoodImages.length,
        servicesWithBadImages: servicesWithBadImages.length,
        servicesWithoutImages: servicesWithoutImages.length,
        realImageFilesCount: realImageFiles.length
      },
      imageUrlsByCategory: Object.fromEntries(imageUrlMap),
      servicesWithBadImages: servicesWithBadImages,
      servicesWithoutImages: servicesWithoutImages,
      realImageFiles: realImageFiles
    };

    const reportFile = path.join(__dirname, '..', '..', 'backups', `audit-images-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n💾 Rapport sauvegardé dans: ${reportFile}`);

    console.log('\n✅ Audit terminé avec succès !\n');

    return report;

  } catch (error) {
    console.error('❌ Erreur lors de l\'audit:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

auditServiceImages();

