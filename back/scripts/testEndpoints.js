import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

// Configuration
dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';

// Connexion à la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Modèle User pour les tests
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  photo: String,
  favorites: [mongoose.Schema.Types.ObjectId]
}));

// Fonction pour tester les endpoints
const testEndpoints = async () => {
  console.log('\n🔍 TEST DES ENDPOINTS');
  console.log('=====================');

  let token = null;
  let testUserId = null;
  let testCoiffeurId = null;

  try {
    // 1. Test de connexion
    console.log('\n1️⃣ Test de connexion...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Serveur accessible');

    // 2. Test d'authentification
    console.log('\n2️⃣ Test d\'authentification...');
    try {
      const authResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      token = authResponse.data.token;
      testUserId = authResponse.data.user._id;
      console.log('✅ Authentification réussie');
    } catch (error) {
      console.log('⚠️ Authentification échouée (normal si pas de compte test)');
    }

    // 3. Test des routes coiffeurs
    console.log('\n3️⃣ Test des routes coiffeurs...');
    
    // GET /coiffeurs
    try {
      const coiffeursResponse = await axios.get(`${API_BASE_URL}/coiffeurs`);
      console.log(`✅ GET /coiffeurs - ${coiffeursResponse.data.length} coiffeurs trouvés`);
      
      if (coiffeursResponse.data.length > 0) {
        testCoiffeurId = coiffeursResponse.data[0]._id;
      }
    } catch (error) {
      console.log('❌ GET /coiffeurs - Erreur:', error.response?.data?.message || error.message);
    }

    // POST /coiffeurs/favorites (avec token)
    if (token && testCoiffeurId) {
      try {
        const favoritesResponse = await axios.post(`${API_BASE_URL}/coiffeurs/favorites`, {
          coiffeurIds: [testCoiffeurId]
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ POST /coiffeurs/favorites - Fonctionne');
      } catch (error) {
        console.log('❌ POST /coiffeurs/favorites - Erreur:', error.response?.data?.message || error.message);
      }
    }

    // 4. Test des routes favoris
    console.log('\n4️⃣ Test des routes favoris...');
    
    if (token) {
      // GET /favorites
      try {
        const favoritesResponse = await axios.get(`${API_BASE_URL}/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ GET /favorites - Fonctionne');
      } catch (error) {
        console.log('❌ GET /favorites - Erreur:', error.response?.data?.message || error.message);
      }

      // POST /favorites/:coiffeurId
      if (testCoiffeurId) {
        try {
          const addFavoriteResponse = await axios.post(`${API_BASE_URL}/favorites/${testCoiffeurId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ POST /favorites/:coiffeurId - Fonctionne');
        } catch (error) {
          console.log('❌ POST /favorites/:coiffeurId - Erreur:', error.response?.data?.message || error.message);
        }
      }
    }

    // 5. Test des routes users
    console.log('\n5️⃣ Test des routes users...');
    
    if (token && testUserId) {
      // GET /users/:id
      try {
        const userResponse = await axios.get(`${API_BASE_URL}/users/${testUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ GET /users/:id - Fonctionne');
      } catch (error) {
        console.log('❌ GET /users/:id - Erreur:', error.response?.data?.message || error.message);
      }
    }

    // 6. Test des routes services
    console.log('\n6️⃣ Test des routes services...');
    
    if (testCoiffeurId) {
      // GET /coiffeurs/:id/services
      try {
        const servicesResponse = await axios.get(`${API_BASE_URL}/coiffeurs/${testCoiffeurId}/services`);
        console.log(`✅ GET /coiffeurs/:id/services - ${servicesResponse.data.length} services trouvés`);
      } catch (error) {
        console.log('❌ GET /coiffeurs/:id/services - Erreur:', error.response?.data?.message || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
};

// Fonction pour diagnostiquer les données
const diagnoseData = async () => {
  console.log('\n🔍 DIAGNOSTIC DES DONNÉES');
  console.log('==========================');

  try {
    // Compter les utilisateurs
    const usersCount = await User.countDocuments();
    console.log(`📊 Total utilisateurs: ${usersCount}`);

    // Compter les coiffeurs
    const coiffeursCount = await User.countDocuments({ role: 'coiffeur' });
    console.log(`✂️ Total coiffeurs: ${coiffeursCount}`);

    // Compter les clients
    const clientsCount = await User.countDocuments({ role: 'user' });
    console.log(`👤 Total clients: ${clientsCount}`);

    // Vérifier les favoris
    const usersWithFavorites = await User.countDocuments({ 
      favorites: { $exists: true, $ne: [] } 
    });
    console.log(`❤️ Utilisateurs avec favoris: ${usersWithFavorites}`);

    // Vérifier les photos
    const usersWithPhotos = await User.countDocuments({ 
      photo: { $exists: true, $ne: null, $ne: 'default-avatar.png' } 
    });
    console.log(`🖼️ Utilisateurs avec photos: ${usersWithPhotos}`);

    // Trouver les problèmes potentiels
    console.log('\n🔍 PROBLÈMES POTENTIELS:');
    
    // Utilisateurs sans rôle
    const usersWithoutRole = await User.countDocuments({ role: { $exists: false } });
    if (usersWithoutRole > 0) {
      console.log(`⚠️ Utilisateurs sans rôle: ${usersWithoutRole}`);
    }

    // Utilisateurs sans email
    const usersWithoutEmail = await User.countDocuments({ email: { $exists: false } });
    if (usersWithoutEmail > 0) {
      console.log(`⚠️ Utilisateurs sans email: ${usersWithoutEmail}`);
    }

    // Favoris invalides (références vers des utilisateurs inexistants)
    const usersWithFavoritesData = await User.find({ 
      favorites: { $exists: true, $ne: [] } 
    }).select('favorites');

    let invalidFavorites = 0;
    for (const user of usersWithFavoritesData) {
      for (const favoriteId of user.favorites) {
        const favoriteExists = await User.findById(favoriteId);
        if (!favoriteExists) {
          invalidFavorites++;
        }
      }
    }

    if (invalidFavorites > 0) {
      console.log(`⚠️ Références de favoris invalides: ${invalidFavorites}`);
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
      case 'test':
        await testEndpoints();
        break;
      case 'diagnose':
        await diagnoseData();
        break;
      case 'all':
        await testEndpoints();
        await diagnoseData();
        break;
      default:
        console.log('Usage: node testEndpoints.js [test|diagnose|all]');
        console.log('  test: Tester tous les endpoints');
        console.log('  diagnose: Diagnostiquer les données');
        console.log('  all: Exécuter tous les tests');
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