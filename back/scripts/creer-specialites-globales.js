import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';

const creerSpecialitesGlobales = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Créer le modèle GlobalSpecialty
    const globalSpecialtySchema = new mongoose.Schema({
      name: {
        type: String,
        required: true,
        unique: true,
        trim: true
      },
      category: {
        type: String,
        enum: ['coupe', 'coloration', 'brushing', 'lissage', 'permanente', 'barbe', 'soin', 'extension', 'autre'],
        default: 'autre'
      },
      aliases: [String],
      usageCount: {
        type: Number,
        default: 0
      },
      isVerified: {
        type: Boolean,
        default: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    });

    const GlobalSpecialty = mongoose.model('GlobalSpecialty', globalSpecialtySchema);

    // Spécialités à créer
    const specialites = [
      { name: 'Coloration', category: 'coloration' },
      { name: 'Balayage', category: 'coloration' },
      { name: 'Naturel', category: 'coloration' },
      { name: 'Coupe', category: 'coupe' },
      { name: 'Brushing', category: 'brushing' },
      { name: 'Volume', category: 'brushing' },
      { name: 'Mouvement', category: 'brushing' },
      { name: 'Lissage', category: 'lissage' },
      { name: 'Brésilien', category: 'lissage' },
      { name: 'Lisse', category: 'lissage' },
      { name: 'Extension', category: 'extension' },
      { name: 'Discrétion', category: 'extension' },
      { name: 'Moderne', category: 'coupe' },
      { name: 'Classique', category: 'coupe' },
      { name: 'Élégant', category: 'coupe' },
      { name: 'Coiffures de mariage', category: 'coupe' },
      { name: 'Permanente', category: 'permanente' },
      { name: 'Barbe', category: 'barbe' },
      { name: 'Soin', category: 'soin' }
    ];

    console.log('\n🔧 Création des spécialités globales...');
    
    for (const specialite of specialites) {
      try {
        const nouvelleSpecialite = new GlobalSpecialty(specialite);
        await nouvelleSpecialite.save();
        console.log(`✅ Spécialité créée: ${specialite.name} (${specialite.category})`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`ℹ️ Spécialité déjà existante: ${specialite.name}`);
        } else {
          console.log(`❌ Erreur pour ${specialite.name}:`, error.message);
        }
      }
    }

    // Vérification finale
    console.log('\n🔍 Vérification finale des spécialités...');
    const totalSpecialites = await GlobalSpecialty.countDocuments();
    console.log(`📊 Total spécialités globales: ${totalSpecialites}`);

    const specialitesCreees = await GlobalSpecialty.find().select('name category');
    specialitesCreees.forEach(spec => {
      console.log(`- ${spec.name} (${spec.category})`);
    });

    console.log('\n🎉 Spécialités globales créées avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la création des spécialités:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

creerSpecialitesGlobales();
