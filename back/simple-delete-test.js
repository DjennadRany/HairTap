// Test simple de suppression sans dépendances externes
// Vérifie que la route DELETE est bien définie

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 TEST SIMPLE ROUTE DELETE');
console.log('============================');

try {
  // 1. Vérifier que le fichier users.js existe
  console.log('\n1️⃣ Vérification du fichier users.js...');
  const usersRoutePath = join(process.cwd(), 'routes', 'users.js');
  const usersRouteContent = readFileSync(usersRoutePath, 'utf8');
  console.log('✅ Fichier users.js trouvé');
  
  // 2. Vérifier que la route DELETE est définie
  console.log('\n2️⃣ Vérification de la route DELETE...');
  if (usersRouteContent.includes('router.delete(\'/:id\'')) {
    console.log('✅ Route DELETE /:id trouvée');
  } else {
    console.log('❌ Route DELETE /:id NON TROUVÉE');
  }
  
  // 3. Vérifier le middleware auth
  console.log('\n3️⃣ Vérification du middleware auth...');
  if (usersRouteContent.includes('auth, async (req, res)')) {
    console.log('✅ Middleware auth appliqué');
  } else {
    console.log('❌ Middleware auth NON APPLIQUÉ');
  }
  
  // 4. Vérifier la logique de suppression
  console.log('\n4️⃣ Vérification de la logique...');
  if (usersRouteContent.includes('User.findByIdAndDelete')) {
    console.log('✅ Méthode de suppression MongoDB trouvée');
  } else {
    console.log('❌ Méthode de suppression MongoDB NON TROUVÉE');
  }
  
  // 5. Instructions de test
  console.log('\n🔍 INSTRUCTIONS DE TEST :');
  console.log('1. Gardez le serveur backend en cours');
  console.log('2. Connectez-vous avec un compte de test');
  console.log('3. Allez sur /profile et cliquez "Supprimer mon compte"');
  console.log('4. REGARDEZ LES LOGS DU SERVEUR BACKEND');
  console.log('5. Vous devriez voir : "🗑️ [DELETE /users/:id] Suppression..."');
  
  console.log('\n📝 COMMANDES :');
  console.log('Terminal 1: cd back && npm start (garder en cours)');
  console.log('Terminal 2: cd front && npm run dev');
  console.log('Puis tester la suppression via l\'interface');
  
} catch (error) {
  console.error('❌ Erreur lors de la vérification:', error.message);
}












