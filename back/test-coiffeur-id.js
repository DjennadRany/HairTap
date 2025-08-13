import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const testId = '6839ca0736ec3cfc09c649ec';

async function testCoiffeurId() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');

    // Vérifier si l'ID existe
    const user = await User.findById(testId);
    
    if (user) {
      console.log('✅ Utilisateur trouvé:', {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo
      });
      
      if (user.role === 'coiffeur') {
        console.log('✅ C\'est bien un coiffeur');
      } else {
        console.log('⚠️ Ce n\'est PAS un coiffeur, rôle:', user.role);
      }
    } else {
      console.log('❌ Aucun utilisateur trouvé avec cet ID');
      
      // Lister tous les coiffeurs
      const coiffeurs = await User.find({ role: 'coiffeur' }).select('_id name email');
      console.log('📋 Coiffeurs disponibles:', coiffeurs);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

testCoiffeurId();
