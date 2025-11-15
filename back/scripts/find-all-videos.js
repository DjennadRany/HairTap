import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import Service from '../models/Service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script pour trouver toutes les vidéos disponibles (base de données + fichiers système)
 */
const findAllVideos = async () => {
  try {
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Récupérer toutes les vidéos de la base de données
    const services = await Service.find({});
    const videosInDB = new Set();
    const videosByService = {};

    services.forEach(service => {
      if (service.gallery && service.gallery.length > 0) {
        service.gallery.forEach(item => {
          if (item.mediaType === 'video' && item.mediaUrl) {
            videosInDB.add(item.mediaUrl);
            if (!videosByService[item.mediaUrl]) {
              videosByService[item.mediaUrl] = [];
            }
            videosByService[item.mediaUrl].push({
              serviceName: service.name,
              coiffeurId: service.coiffeur
            });
          }
        });
      }
    });

    console.log('📊 VIDÉOS DANS LA BASE DE DONNÉES:');
    console.log('='.repeat(80));
    console.log(`   Total vidéos uniques: ${videosInDB.size}`);
    Array.from(videosInDB).forEach((url, index) => {
      const services = videosByService[url];
      console.log(`\n   ${index + 1}. ${url}`);
      console.log(`      Utilisée dans ${services.length} service(s):`);
      services.forEach(s => {
        console.log(`         - ${s.serviceName} (coiffeur: ${s.coiffeurId})`);
      });
    });

    // 2. Récupérer toutes les vidéos dans le système de fichiers
    const uploadsDir = path.join(__dirname, '../../uploads/services');
    const videoFiles = [];

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (['.mp4', '.webm', '.ogg', '.avi', '.mov'].includes(ext)) {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          videoFiles.push({
            filename: file,
            path: `/uploads/services/${file}`,
            size: stats.size,
            sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
          });
        }
      });
    }

    console.log('\n\n📁 VIDÉOS DANS LE SYSTÈME DE FICHIERS:');
    console.log('='.repeat(80));
    console.log(`   Total fichiers vidéo: ${videoFiles.length}`);
    videoFiles.forEach((video, index) => {
      console.log(`\n   ${index + 1}. ${video.filename}`);
      console.log(`      Chemin: ${video.path}`);
      console.log(`      Taille: ${video.sizeMB} MB`);
      const inDB = videosInDB.has(video.path);
      console.log(`      ${inDB ? '✅ Utilisée dans la base' : '⚠️  NON utilisée dans la base'}`);
    });

    // 3. Identifier les vidéos non utilisées
    const unusedVideos = videoFiles.filter(v => !videosInDB.has(v.path));
    console.log('\n\n⚠️  VIDÉOS NON UTILISÉES (disponibles pour diversification):');
    console.log('='.repeat(80));
    if (unusedVideos.length > 0) {
      unusedVideos.forEach((video, index) => {
        console.log(`   ${index + 1}. ${video.filename} (${video.sizeMB} MB)`);
      });
    } else {
      console.log('   Aucune vidéo non utilisée trouvée');
    }

    // 4. Résumé
    console.log('\n\n📊 RÉSUMÉ:');
    console.log('='.repeat(80));
    console.log(`   ✅ Vidéos dans la base: ${videosInDB.size}`);
    console.log(`   📁 Vidéos dans le système: ${videoFiles.length}`);
    console.log(`   ⚠️  Vidéos non utilisées: ${unusedVideos.length}`);
    console.log('='.repeat(80));

    console.log('\n✅ Analyse terminée avec succès !\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

findAllVideos();

