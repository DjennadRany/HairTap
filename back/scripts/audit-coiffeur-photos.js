import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script d'audit des photos de coiffeurs
 * Identifie les coiffeurs avec des photos manquantes ou incorrectes
 */
const auditCoiffeurPhotos = async () => {
  try {
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Lister les fichiers d'images réels dans /back/uploads/profiles/
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
    
    console.log(`📸 ${realImageFiles.length} fichiers d'images réels trouvés dans /back/uploads/profiles/`);
    if (realImageFiles.length > 0) {
      console.log(`   Exemples: ${realImageFiles.slice(0, 5).join(', ')}...\n`);
    }

    // 2. Récupérer tous les coiffeurs
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`📋 ${coiffeurs.length} coiffeurs trouvés\n`);

    // 3. Analyser chaque coiffeur
    const coiffeursWithGoodPhotos = [];
    const coiffeursWithBadPhotos = [];
    const coiffeursWithoutPhotos = [];

    for (const coiffeur of coiffeurs) {
      const photoUrl = coiffeur.photo;
      
      // Vérifier si le coiffeur a une photo
      if (!photoUrl || photoUrl === '' || photoUrl === '/default-avatar.png') {
        coiffeursWithoutPhotos.push({
          _id: coiffeur._id,
          name: coiffeur.name,
          email: coiffeur.email,
          currentPhoto: photoUrl || 'null'
        });
        continue;
      }
      
      // Vérifier si l'URL pointe vers un fichier réel
      let hasGoodPhoto = false;
      
      // Si c'est une URL relative qui commence par /uploads/profiles/
      if (photoUrl.startsWith('/uploads/profiles/')) {
        const fileName = photoUrl.split('/').pop();
        const isRealFile = realImageFiles.some(f => f === fileName || f.includes(fileName.split('-')[0]));
        
        if (isRealFile) {
          hasGoodPhoto = true;
        }
      }
      // Si c'est une URL relative qui commence par /uploads/
      else if (photoUrl.startsWith('/uploads/')) {
        const fileName = photoUrl.split('/').pop();
        const isRealFile = realImageFiles.some(f => f === fileName || f.includes(fileName.split('-')[0]));
        
        if (isRealFile) {
          hasGoodPhoto = true;
        }
      }
      // Si c'est une URL externe (http/https)
      else if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
        hasGoodPhoto = true; // On suppose que les URLs externes sont valides
      }
      // Si c'est un nom de fichier simple
      else if (photoUrl.includes('.jpg') || photoUrl.includes('.png') || photoUrl.includes('.jpeg') || photoUrl.includes('.webp')) {
        const isRealFile = realImageFiles.some(f => f === photoUrl || f.includes(photoUrl.split('-')[0]));
        if (isRealFile) {
          hasGoodPhoto = true;
        }
      }
      
      if (hasGoodPhoto) {
        coiffeursWithGoodPhotos.push({
          _id: coiffeur._id,
          name: coiffeur.name,
          email: coiffeur.email,
          photoUrl: photoUrl
        });
      } else {
        coiffeursWithBadPhotos.push({
          _id: coiffeur._id,
          name: coiffeur.name,
          email: coiffeur.email,
          currentPhoto: photoUrl
        });
      }
    }

    // 4. Afficher le rapport
    console.log('📊 RAPPORT D\'AUDIT DES PHOTOS DE COIFFEURS\n');
    console.log('='.repeat(80));
    console.log(`✅ Coiffeurs avec bonnes photos: ${coiffeursWithGoodPhotos.length}`);
    console.log(`❌ Coiffeurs avec mauvaises photos: ${coiffeursWithBadPhotos.length}`);
    console.log(`⚠️  Coiffeurs sans photos: ${coiffeursWithoutPhotos.length}`);
    console.log('='.repeat(80));

    // Afficher les coiffeurs avec mauvaises photos
    if (coiffeursWithBadPhotos.length > 0) {
      console.log('\n❌ COIFFEURS AVEC MAUVAISES PHOTOS:\n');
      coiffeursWithBadPhotos.slice(0, 10).forEach((coiffeur, index) => {
        console.log(`   ${index + 1}. ${coiffeur.name} (${coiffeur.email})`);
        console.log(`      Photo actuelle: ${coiffeur.currentPhoto}`);
      });
      if (coiffeursWithBadPhotos.length > 10) {
        console.log(`   ... et ${coiffeursWithBadPhotos.length - 10} autres`);
      }
    }

    // Afficher les coiffeurs sans photos
    if (coiffeursWithoutPhotos.length > 0) {
      console.log('\n⚠️  COIFFEURS SANS PHOTOS:\n');
      coiffeursWithoutPhotos.slice(0, 10).forEach((coiffeur, index) => {
        console.log(`   ${index + 1}. ${coiffeur.name} (${coiffeur.email})`);
      });
      if (coiffeursWithoutPhotos.length > 10) {
        console.log(`   ... et ${coiffeursWithoutPhotos.length - 10} autres`);
      }
    }

    // 5. Sauvegarder le rapport
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalCoiffeurs: coiffeurs.length,
        coiffeursWithGoodPhotos: coiffeursWithGoodPhotos.length,
        coiffeursWithBadPhotos: coiffeursWithBadPhotos.length,
        coiffeursWithoutPhotos: coiffeursWithoutPhotos.length,
        realImageFilesCount: realImageFiles.length
      },
      coiffeursWithBadPhotos: coiffeursWithBadPhotos,
      coiffeursWithoutPhotos: coiffeursWithoutPhotos,
      realImageFiles: realImageFiles
    };

    const reportFile = path.join(__dirname, '..', '..', 'backups', `audit-photos-coiffeurs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
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

auditCoiffeurPhotos();

