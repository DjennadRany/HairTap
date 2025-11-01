// Script pour vérifier TOUS les comptes existants
// Voir quels rôles sont réellement en base

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/taphair';

async function checkAllAccounts() {
  try {
    console.log('🔍 VÉRIFICATION DE TOUS LES COMPTES');
    console.log('====================================');
    
    // 1. Connexion à MongoDB
    console.log('\n1️⃣ Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // 2. Importer le modèle User
    console.log('\n2️⃣ Import du modèle User...');
    const User = (await import('./models/User.js')).default;
    console.log('✅ Modèle User importé');
    
    // 3. Vérifier TOUS les comptes
    console.log('\n3️⃣ Vérification de TOUS les comptes...');
    const allUsers = await User.find({}).select('name email role createdAt');
    
    if (allUsers.length === 0) {
      console.log('❌ AUCUN COMPTE TROUVÉ dans la base !');
      return;
    }
    
    console.log(`✅ ${allUsers.length} compte(s) trouvé(s)`);
    
    // 4. Afficher tous les comptes
    console.log('\n4️⃣ Détail de tous les comptes:');
    console.log('================================');
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Sans nom'}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎭 Rôle: "${user.role}" [${typeof user.role}]`);
      console.log(`   📅 Créé: ${user.createdAt}`);
      console.log('   ---');
    });
    
    // 5. Analyser les rôles
    console.log('\n5️⃣ Analyse des rôles:');
    console.log('======================');
    
    const roleCounts = {};
    allUsers.forEach(user => {
      const role = user.role || 'undefined';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} compte(s)`);
    });
    
    // 6. Vérifier le schéma User
    console.log('\n6️⃣ Vérification du schéma User...');
    try {
      const testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'test123',
        role: 'client'
      });
      
      await testUser.validate();
      console.log('✅ Schéma User valide');
      
      // Vérifier les valeurs autorisées pour role
      console.log('\n7️⃣ Valeurs autorisées pour le champ role:');
      console.log('==========================================');
      
      // Essayer différents rôles
      const testRoles = ['client', 'coiffeur', 'admin', 'user'];
      
      testRoles.forEach(async (testRole) => {
        try {
          const testRoleUser = new User({
            name: `Test ${testRole}`,
            email: `test-${testRole}@example.com`,
            password: 'test123',
            role: testRole
          });
          
          await testRoleUser.validate();
          console.log(`   ✅ Rôle "${testRole}": VALIDE`);
        } catch (error) {
          console.log(`   ❌ Rôle "${testRole}": INVALIDE - ${error.message}`);
        }
      });
      
    } catch (validationError) {
      console.log('❌ Schéma User invalide:', validationError.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la vérification
checkAllAccounts();
