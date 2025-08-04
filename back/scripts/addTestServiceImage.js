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

async function addTestImage() {
  try {
    console.log('🖼️ Ajout d\'une image de test...');
    
    // Connexion à MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    // Créer une image SVG de test
    const svgContent = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <circle cx="150" cy="100" r="50" fill="#4f46e5" opacity="0.7"/>
      <text x="150" y="110" text-anchor="middle" font-family="Arial" font-size="16" fill="#374151">
        Service Test
      </text>
      <text x="150" y="130" text-anchor="middle" font-family="Arial" font-size="12" fill="#6b7280">
        Image de test
      </text>
    </svg>`;
    
    // Créer le dossier uploads/services s'il n'existe pas
    const uploadDir = path.join(__dirname, '..', 'uploads', 'services');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('📁 Dossier uploads/services créé');
    }
    
    // Sauvegarder l'image SVG
    const fileName = `test-service-${Date.now()}.svg`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, svgContent);
    console.log(`💾 Image sauvegardée: ${fileName}`);
    
    // Trouver le premier service et ajouter l'image
    const service = await Service.findOne({});
    if (service) {
      console.log(`📝 Ajout de l'image au service: ${service.name}`);
      
      if (!service.examplePhotos) {
        service.examplePhotos = [];
      }
      
      service.examplePhotos.push(`/uploads/services/${fileName}`);
      await service.save();
      
      console.log(`✅ Image ajoutée au service: ${service.name}`);
      console.log(`   - URL: /uploads/services/${fileName}`);
    } else {
      console.log('❌ Aucun service trouvé');
    }
    
    console.log('\n✅ Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
addTestImage(); 