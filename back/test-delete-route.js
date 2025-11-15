// Test direct de la route DELETE
// Identifie pourquoi la suppression échoue côté base

import axios from 'axios';

const BASE_URL = 'http://localhost:5000'; // Ajustez selon votre config

async function testDeleteRoute() {
  try {
    console.log('🧪 TEST DIRECT ROUTE DELETE');
    console.log('============================');
    
    // 1. Vérifier que le serveur répond
    console.log('\n1️⃣ Test de connexion au serveur...');
    try {
      const response = await axios.get(`${BASE_URL}/api/users`);
      console.log('✅ Serveur accessible, statut:', response.status);
      console.log('📊 Nombre d\'utilisateurs:', response.data.length);
      
      // Afficher les premiers utilisateurs
      if (response.data.length > 0) {
        console.log('\n👥 Utilisateurs dans la base:');
        response.data.slice(0, 3).forEach((user, index) => {
          console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user._id}`);
        });
      }
    } catch (error) {
      console.log('❌ Serveur inaccessible:', error.message);
      return;
    }
    
    // 2. Test de la route DELETE sans authentification
    console.log('\n2️⃣ Test route DELETE sans auth...');
    try {
      const testId = '507f1f77bcf86cd799439011'; // ID fictif
      await axios.delete(`${BASE_URL}/api/users/${testId}`);
      console.log('❌ ERREUR: Suppression réussie sans auth (problème de sécurité)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Route DELETE protégée (auth requise)');
      } else if (error.response?.status === 404) {
        console.log('✅ Route DELETE accessible, utilisateur non trouvé');
      } else {
        console.log('⚠️ Statut inattendu:', error.response?.status, error.response?.data);
      }
    }
    
    // 3. Vérifier la structure de la route
    console.log('\n3️⃣ Vérification de la route...');
    console.log('📍 URL testée:', `${BASE_URL}/api/users/:id`);
    console.log('🔒 Méthode: DELETE');
    console.log('🛡️ Middleware: auth (authentification requise)');
    
    // 4. Instructions de debug
    console.log('\n🔍 DIAGNOSTIC COMPLET :');
    console.log('1. Vérifiez que le serveur backend tourne sur le port 5000');
    console.log('2. Vérifiez que la route DELETE est bien définie dans back/routes/users.js');
    console.log('3. Vérifiez que le middleware auth fonctionne');
    console.log('4. Vérifiez les logs du serveur quand vous cliquez sur "Supprimer"');
    
    console.log('\n📝 COMMANDES DE DEBUG :');
    console.log('1. cd back && npm start (démarrer le serveur)');
    console.log('2. Dans un autre terminal: cd front && npm run dev');
    console.log('3. Se connecter et tester la suppression');
    console.log('4. Regarder les logs du serveur backend');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
testDeleteRoute();












