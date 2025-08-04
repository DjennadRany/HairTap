import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Configuration
dotenv.config();

// Connexion à la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Modèles
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  photo: String,
  _photoChanged: Boolean,
  favorites: [mongoose.Schema.Types.ObjectId],
  address: {
    street: String,
    city: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  workingHours: Object,
  services: Array,
  rating: Number,
  totalRatings: Number,
  specialities: [String],
  workingMode: [String],
  sirenStatus: String,
  bio: String,
  phone: String,
  gallery: Array,
  createdAt: Date,
  updatedAt: Date
}));

const Service = mongoose.model('Service', new mongoose.Schema({
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
}));

const Booking = mongoose.model('Booking', new mongoose.Schema({
  client: mongoose.Schema.Types.ObjectId,
  coiffeur: mongoose.Schema.Types.ObjectId,
  service: String,
  date: Date,
  duration: Number,
  status: String,
  paymentStatus: String,
  price: Number,
  mode: String,
  address: Object,
  notes: String,
  cancellationReason: String,
  createdAt: Date,
  updatedAt: Date
}));

// Fonction pour corriger les photos
const fixPhotos = async () => {
  console.log('\n🔧 CORRECTION DES PHOTOS');
  console.log('========================');
  
  const users = await User.find({});
  let fixed = 0;
  let errors = 0;
  
  for (const user of users) {
    try {
      if (user.photo && user.photo !== 'default-avatar.png') {
        // Vérifier si le fichier existe
        if (user.photo.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), user.photo.substring(1));
          if (!fs.existsSync(filePath)) {
            // Corriger la photo manquante
            await User.findByIdAndUpdate(user._id, {
              photo: 'default-avatar.png',
              _photoChanged: true
            });
            console.log(`🔧 Photo corrigée pour: ${user.name || user.email}`);
            fixed++;
          }
        } else if (!user.photo.startsWith('http')) {
          // URL invalide, la corriger
          await User.findByIdAndUpdate(user._id, {
            photo: 'default-avatar.png',
            _photoChanged: true
          });
          console.log(`🔧 URL corrigée pour: ${user.name || user.email}`);
          fixed++;
        }
      }
    } catch (error) {
      console.error(`❌ Erreur correction ${user.name || user.email}:`, error);
      errors++;
    }
  }
  
  console.log(`\n✅ Correction terminée: ${fixed} photos corrigées, ${errors} erreurs`);
};

// Fonction pour corriger les favoris
const fixFavorites = async () => {
  console.log('\n❤️ CORRECTION DES FAVORIS');
  console.log('==========================');
  
  const users = await User.find({ favorites: { $exists: true, $ne: [] } });
  let fixed = 0;
  let errors = 0;
  
  for (const user of users) {
    try {
      const validFavorites = [];
      
      for (const favoriteId of user.favorites) {
        // Vérifier si le coiffeur favori existe
        const coiffeur = await User.findById(favoriteId);
        if (coiffeur && coiffeur.role === 'coiffeur') {
          validFavorites.push(favoriteId);
        }
      }
      
      // Mettre à jour avec seulement les favoris valides
      if (validFavorites.length !== user.favorites.length) {
        await User.findByIdAndUpdate(user._id, {
          favorites: validFavorites
        });
        console.log(`🔧 Favoris corrigés pour: ${user.name || user.email} (${user.favorites.length - validFavorites.length} supprimés)`);
        fixed++;
      }
    } catch (error) {
      console.error(`❌ Erreur correction favoris ${user.name || user.email}:`, error);
      errors++;
    }
  }
  
  console.log(`\n✅ Correction terminée: ${fixed} utilisateurs corrigés, ${errors} erreurs`);
};

// Fonction pour corriger les services
const fixServices = async () => {
  console.log('\n🎯 CORRECTION DES SERVICES');
  console.log('==========================');
  
  // Vérifier les services orphelins
  const services = await Service.find({});
  let fixed = 0;
  let errors = 0;
  
  for (const service of services) {
    try {
      // Vérifier si le coiffeur existe
      const coiffeur = await User.findById(service.coiffeur);
      if (!coiffeur) {
        // Supprimer le service orphelin
        await Service.findByIdAndDelete(service._id);
        console.log(`🔧 Service orphelin supprimé: ${service.name}`);
        fixed++;
      }
    } catch (error) {
      console.error(`❌ Erreur correction service ${service.name}:`, error);
      errors++;
    }
  }
  
  console.log(`\n✅ Correction terminée: ${fixed} services corrigés, ${errors} erreurs`);
};

// Fonction pour corriger les réservations
const fixBookings = async () => {
  console.log('\n📅 CORRECTION DES RÉSERVATIONS');
  console.log('===============================');
  
  const bookings = await Booking.find({});
  let fixed = 0;
  let errors = 0;
  
  for (const booking of bookings) {
    try {
      // Vérifier si le client existe
      const client = await User.findById(booking.client);
      if (!client) {
        console.log(`⚠️ Réservation avec client inexistant: ${booking._id}`);
        errors++;
        continue;
      }
      
      // Vérifier si le coiffeur existe
      const coiffeur = await User.findById(booking.coiffeur);
      if (!coiffeur) {
        console.log(`⚠️ Réservation avec coiffeur inexistant: ${booking._id}`);
        errors++;
        continue;
      }
      
      // Corriger les statuts invalides
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(booking.status)) {
        await Booking.findByIdAndUpdate(booking._id, {
          status: 'pending'
        });
        console.log(`🔧 Statut corrigé pour réservation: ${booking._id}`);
        fixed++;
      }
      
      // Corriger les modes invalides
      const validModes = ['salon', 'domicile'];
      if (booking.mode && !validModes.includes(booking.mode)) {
        await Booking.findByIdAndUpdate(booking._id, {
          mode: 'salon'
        });
        console.log(`🔧 Mode corrigé pour réservation: ${booking._id}`);
        fixed++;
      }
    } catch (error) {
      console.error(`❌ Erreur correction réservation ${booking._id}:`, error);
      errors++;
    }
  }
  
  console.log(`\n✅ Correction terminée: ${fixed} réservations corrigées, ${errors} erreurs`);
};

// Fonction pour créer les index de performance
const createIndexes = async () => {
  console.log('\n📊 CRÉATION DES INDEX');
  console.log('=====================');
  
  try {
    // Index pour les utilisateurs
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ 'address.city': 1 });
    await User.collection.createIndex({ rating: -1 });
    await User.collection.createIndex({ createdAt: -1 });
    
    // Index pour les services
    await Service.collection.createIndex({ coiffeur: 1 });
    await Service.collection.createIndex({ category: 1 });
    await Service.collection.createIndex({ isActive: 1 });
    await Service.collection.createIndex({ likes: -1 });
    await Service.collection.createIndex({ price: 1 });
    
    // Index pour les réservations
    await Booking.collection.createIndex({ client: 1 });
    await Booking.collection.createIndex({ coiffeur: 1 });
    await Booking.collection.createIndex({ status: 1 });
    await Booking.collection.createIndex({ date: 1 });
    
    console.log('✅ Index créés avec succès');
  } catch (error) {
    console.error('❌ Erreur création index:', error);
  }
};

// Fonction pour diagnostiquer les données
const diagnoseData = async () => {
  console.log('\n🔍 DIAGNOSTIC COMPLET');
  console.log('=====================');
  
  try {
    // Statistiques générales
    const usersCount = await User.countDocuments();
    const coiffeursCount = await User.countDocuments({ role: 'coiffeur' });
    const clientsCount = await User.countDocuments({ role: 'user' });
    const servicesCount = await Service.countDocuments();
    const bookingsCount = await Booking.countDocuments();
    
    console.log(`📊 STATISTIQUES:`);
    console.log(`- Total utilisateurs: ${usersCount}`);
    console.log(`- Coiffeurs: ${coiffeursCount}`);
    console.log(`- Clients: ${clientsCount}`);
    console.log(`- Services: ${servicesCount}`);
    console.log(`- Réservations: ${bookingsCount}`);
    
    // Problèmes identifiés
    const usersWithoutRole = await User.countDocuments({ role: { $exists: false } });
    const usersWithoutEmail = await User.countDocuments({ email: { $exists: false } });
    const usersWithInvalidPhotos = await User.countDocuments({
      photo: { $exists: true, $ne: null, $ne: 'default-avatar.png' },
      $or: [
        { photo: { $regex: /^blob:/ } },
        { photo: { $regex: /^data:/ } }
      ]
    });
    
    // Corriger la requête pour les services orphelins
    const orphanedServices = await Service.countDocuments({
      coiffeur: { $exists: true, $ne: null }
    });
    
    // Vérifier manuellement les services orphelins
    const allServices = await Service.find({});
    let orphanedCount = 0;
    for (const service of allServices) {
      const coiffeur = await User.findById(service.coiffeur);
      if (!coiffeur) {
        orphanedCount++;
      }
    }
    
    console.log(`\n⚠️ PROBLÈMES IDENTIFIÉS:`);
    if (usersWithoutRole > 0) console.log(`- Utilisateurs sans rôle: ${usersWithoutRole}`);
    if (usersWithoutEmail > 0) console.log(`- Utilisateurs sans email: ${usersWithoutEmail}`);
    if (usersWithInvalidPhotos > 0) console.log(`- Photos invalides: ${usersWithInvalidPhotos}`);
    if (orphanedCount > 0) console.log(`- Services orphelins: ${orphanedCount}`);
    
    if (usersWithoutRole === 0 && usersWithoutEmail === 0 && usersWithInvalidPhotos === 0 && orphanedCount === 0) {
      console.log('✅ Aucun problème critique identifié');
    }
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  }
};

// Fonction principale
const main = async () => {
  try {
    await connectDB();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'diagnose':
        await diagnoseData();
        break;
      case 'fix-photos':
        await fixPhotos();
        break;
      case 'fix-favorites':
        await fixFavorites();
        break;
      case 'fix-services':
        await fixServices();
        break;
      case 'fix-bookings':
        await fixBookings();
        break;
      case 'create-indexes':
        await createIndexes();
        break;
      case 'fix-all':
        await diagnoseData();
        await fixPhotos();
        await fixFavorites();
        await fixServices();
        await fixBookings();
        await createIndexes();
        break;
      default:
        console.log('Usage: node fixAllData.js [diagnose|fix-photos|fix-favorites|fix-services|fix-bookings|create-indexes|fix-all]');
        console.log('  diagnose: Diagnostiquer les données');
        console.log('  fix-photos: Corriger les photos');
        console.log('  fix-favorites: Corriger les favoris');
        console.log('  fix-services: Corriger les services');
        console.log('  fix-bookings: Corriger les réservations');
        console.log('  create-indexes: Créer les index de performance');
        console.log('  fix-all: Exécuter toutes les corrections');
    }
    
    console.log('\n✅ Script terminé');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

// Exécuter le script
main(); 