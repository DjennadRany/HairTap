import mongoose from 'mongoose';

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

async function cleanTestImage() {
  try {
    console.log('🧹 Nettoyage de l\'image de test...');
    
    // Connexion à MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    // Récupérer tous les services
    const services = await Service.find({});
    console.log(`📊 Services trouvés: ${services.length}`);
    
    for (const service of services) {
      console.log(`\n🔍 Service: ${service.name}`);
      
      if (service.examplePhotos && service.examplePhotos.length > 0) {
        // Supprimer les images de test
        const cleanPhotos = service.examplePhotos.filter(photo => 
          !photo.includes('test-service')
        );
        
        if (cleanPhotos.length !== service.examplePhotos.length) {
          service.examplePhotos = cleanPhotos;
          await service.save();
          console.log(`   ✅ Images nettoyées: ${cleanPhotos.length} restantes`);
        } else {
          console.log(`   ℹ️ Aucune image de test trouvée`);
        }
      }
    }
    
    console.log('\n✅ Nettoyage terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
cleanTestImage(); 