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

async function checkServiceImages() {
  try {
    console.log('🔍 Vérification des images de service...');
    
    // Connexion à MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    // Récupérer tous les services
    const services = await Service.find({});
    console.log(`📊 Services trouvés: ${services.length}`);
    
    for (const service of services) {
      console.log(`\n📸 Service: ${service.name}`);
      console.log(`   - ID: ${service._id}`);
      console.log(`   - Photos d'exemple: ${service.examplePhotos?.length || 0}`);
      
      if (service.examplePhotos && service.examplePhotos.length > 0) {
        service.examplePhotos.forEach((photo, index) => {
          console.log(`   - Photo ${index + 1}: "${photo}"`);
          
          // Tester si l'URL est accessible
          const fullUrl = `http://localhost:5000${photo}`;
          console.log(`     🔗 URL complète: ${fullUrl}`);
        });
      } else {
        console.log(`   - Aucune photo d'exemple`);
      }
    }
    
    console.log('\n✅ Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
checkServiceImages(); 