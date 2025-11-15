// Script de debug pour la suppression de compte
// Identifie pourquoi la suppression ne fonctionne pas

const axios = require('axios');

const BASE_URL = 'http://localhost:5000'; // Ajustez selon votre configuration

async function debugDeleteAccount() {
  try {
    console.log('🔍 DEBUG DE LA SUPPRESSION DE COMPTE');
    console.log('=====================================');
    
    // Test 1: Vérifier que le serveur répond
    console.log('\n1️⃣ Test de connexion au serveur...');
    try {
      const response = await axios.get(`${BASE_URL}/api/users`);
      console.log('✅ Serveur accessible, statut:', response.status);
    } catch (error) {
      console.log('❌ Serveur inaccessible:', error.message);
      return;
    }
    
    // Test 2: Vérifier la route DELETE existe
    console.log('\n2️⃣ Test de la route DELETE...');
    try {
      // Test avec un ID fictif mais format valide
      const testId = '507f1f77bcf86cd799439011'; // Format MongoDB valide
      await axios.delete(`${BASE_URL}/api/users/${testId}`);
      console.log('❌ Erreur: La suppression a réussi avec un ID fictif');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Route DELETE accessible, authentification requise');
      } else if (error.response?.status === 404) {
        console.log('✅ Route DELETE accessible, utilisateur non trouvé (normal)');
      } else {
        console.log('⚠️ Statut inattendu:', error.response?.status, error.response?.data);
      }
    }
    
    // Test 3: Vérifier la structure de la base de données
    console.log('\n3️⃣ Vérification de la base de données...');
    try {
      const response = await axios.get(`${BASE_URL}/api/users`);
      console.log('✅ Liste des utilisateurs récupérée');
      console.log('📊 Nombre d\'utilisateurs:', response.data.length);
      
      if (response.data.length > 0) {
        const firstUser = response.data[0];
        console.log('👤 Premier utilisateur:', {
          id: firstUser._id,
          name: firstUser.name,
          role: firstUser.role,
          email: firstUser.email
        });
      }
    } catch (error) {
      console.log('❌ Impossible de récupérer la liste des utilisateurs:', error.response?.status);
    }
    
    console.log('\n🔍 DIAGNOSTIC :');
    console.log('1. Vérifiez les logs du serveur backend');
    console.log('2. Vérifiez que la route DELETE est bien appelée');
    console.log('3. Vérifiez que l\'ID de l\'utilisateur est correct');
    console.log('4. Vérifiez que l\'utilisateur est bien authentifié');
    
    console.log('\n📝 COMMANDES DE DEBUG :');
    console.log('1. Dans le terminal backend, regardez les logs');
    console.log('2. Vérifiez que vous voyez : "🗑️ [DELETE /users/:id] Suppression du compte utilisateur:"');
    console.log('3. Vérifiez qu\'il n\'y a pas d\'erreur MongoDB');
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message);
  }
}

// Exécuter le debug
debugDeleteAccount();
