// Script de test pour la suppression de compte
// À exécuter avec Node.js pour tester la route backend

const axios = require('axios');

const BASE_URL = 'http://localhost:5000'; // Ajustez selon votre configuration

async function testDeleteAccount() {
  try {
    console.log('🧪 Test de la route de suppression de compte...');
    
    // Test 1: Suppression sans authentification (doit échouer)
    console.log('\n1️⃣ Test sans authentification...');
    try {
      await axios.delete(`${BASE_URL}/api/users/123456789012345678901234`);
      console.log('❌ Erreur: La suppression a réussi sans authentification');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correct: Authentification requise');
      } else {
        console.log('⚠️ Erreur inattendue:', error.response?.status, error.response?.data);
      }
    }
    
    // Test 2: Suppression avec ID invalide (doit échouer)
    console.log('\n2️⃣ Test avec ID invalide...');
    try {
      await axios.delete(`${BASE_URL}/api/users/invalid-id`);
      console.log('❌ Erreur: La suppression a réussi avec un ID invalide');
    } catch (error) {
      if (error.response?.status === 500 || error.response?.status === 400) {
        console.log('✅ Correct: ID invalide rejeté');
      } else {
        console.log('⚠️ Erreur inattendue:', error.response?.status, error.response?.data);
      }
    }
    
    console.log('\n🎯 Tests terminés !');
    console.log('📝 Pour tester avec authentification, connectez-vous via l\'interface web');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testDeleteAccount();
}

module.exports = { testDeleteAccount };
