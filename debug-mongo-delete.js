// Script de debug pour la suppression MongoDB
// Teste directement la suppression en base de données

const mongoose = require('mongoose');

// Configuration MongoDB (ajustez selon votre config)
const MONGODB_URI = 'mongodb://localhost:27017/taphair'; // Ajustez l'URI

async function debugMongoDelete() {
  try {
    console.log('🔍 DEBUG SUPPRESSION MONGODB');
    console.log('==============================');
    
    // 1. Connexion à MongoDB
    console.log('\n1️⃣ Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // 2. Importer le modèle User
    console.log('\n2️⃣ Import du modèle User...');
    const User = require('./back/models/User.js'); // Ajustez le chemin
    console.log('✅ Modèle User importé');
    
    // 3. Vérifier l'utilisateur avant suppression
    console.log('\n3️⃣ Vérification de l\'utilisateur...');
    const userToDelete = await User.findOne({ email: 'rany.d22@gmail.com' });
    
    if (!userToDelete) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:', {
      id: userToDelete._id,
      name: userToDelete.name,
      email: userToDelete.email,
      role: userToDelete.role
    });
    
    // 4. Vérifier les références
    console.log('\n4️⃣ Vérification des références...');
    
    // Vérifier les réservations
    const Booking = require('./back/models/Booking.js');
    const bookings = await Booking.find({ 
      $or: [
        { client: userToDelete._id },
        { coiffeur: userToDelete._id }
      ]
    });
    console.log('📅 Réservations liées:', bookings.length);
    
    // Vérifier les services
    const Service = require('./back/models/Service.js');
    const services = await Service.find({ coiffeur: userToDelete._id });
    console.log('💇 Services liés:', services.length);
    
    // Vérifier les avis
    const Review = require('./back/models/Review.js');
    const reviews = await Review.find({ 
      $or: [
        { client: userToDelete._id },
        { coiffeur: userToDelete._id }
      ]
    });
    console.log('⭐ Avis liés:', reviews.length);
    
    // 5. Tenter la suppression
    console.log('\n5️⃣ Tentative de suppression...');
    try {
      const deleteResult = await User.findByIdAndDelete(userToDelete._id);
      console.log('✅ Suppression réussie:', deleteResult);
    } catch (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError.message);
      
      // 6. Vérifier les contraintes
      console.log('\n6️⃣ Vérification des contraintes...');
      if (deleteError.code === 11000) {
        console.log('🔒 Erreur de contrainte unique');
      } else if (deleteError.message.includes('foreign key')) {
        console.log('🔗 Erreur de clé étrangère');
      } else {
        console.log('⚠️ Autre type d\'erreur');
      }
    }
    
    // 7. Vérifier après suppression
    console.log('\n7️⃣ Vérification après suppression...');
    const userAfterDelete = await User.findById(userToDelete._id);
    if (!userAfterDelete) {
      console.log('✅ Utilisateur bien supprimé de la base');
    } else {
      console.log('❌ Utilisateur toujours présent:', userAfterDelete._id);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  } finally {
    // Fermer la connexion
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le debug
debugMongoDelete();
