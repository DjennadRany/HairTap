import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration MongoDB
const mongoURI = 'mongodb://localhost:27017/taphair';

// Modèle Service
const serviceSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  duration: Number,
  category: String,
  keywords: [String],
  examplePhotos: [String],
  likes: Number,
  likedBy: [mongoose.Schema.Types.ObjectId],
  coiffeur: mongoose.Schema.Types.ObjectId,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const Service = mongoose.model('Service', serviceSchema);

async function fixServiceImages() {
  try {
    console.log('🔧 Début de la correction des images de service...');
    
    // Connexion à MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    // Récupérer tous les services
    const services = await Service.find({});
    console.log(`📊 Services trouvés: ${services.length}`);
    
    for (const service of services) {
      console.log(`\n🔍 Service: ${service.name}`);
      console.log(`   - Photos actuelles: ${service.examplePhotos?.length || 0}`);
      
      if (service.examplePhotos && service.examplePhotos.length > 0) {
        // Nettoyer les photos qui n'existent pas
        const validPhotos = [];
        
        for (const photo of service.examplePhotos) {
          // Si c'est une image externe (pexels, etc.), la supprimer
          if (photo.includes('pexels') || photo.includes('pixabay') || photo.includes('unsplash')) {
            console.log(`   ❌ Suppression de l'image externe: ${photo}`);
            continue;
          }
          
          // Si c'est une URL relative, vérifier si le fichier existe
          if (photo.startsWith('/uploads/services/')) {
            const filePath = path.join(__dirname, '..', photo.substring(1));
            if (fs.existsSync(filePath)) {
              validPhotos.push(photo);
              console.log(`   ✅ Image valide: ${photo}`);
            } else {
              console.log(`   ❌ Fichier manquant: ${photo}`);
            }
          } else {
            // Garder les autres types d'URLs
            validPhotos.push(photo);
            console.log(`   ✅ Image conservée: ${photo}`);
          }
        }
        
        // Mettre à jour le service avec les photos valides
        service.examplePhotos = validPhotos;
        await service.save();
        console.log(`   📝 Photos mises à jour: ${validPhotos.length}`);
      }
    }
    
    console.log('\n✅ Correction terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
fixServiceImages(); 