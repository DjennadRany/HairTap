// Script pour vérifier le compte admin
// Confirme que le rôle admin est bien défini en base

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/taphair';

async function checkAdminAccount() {
  try {
    console.log('🔍 VÉRIFICATION COMPTE ADMIN');
    console.log('=============================');
    
    // 1. Connexion à MongoDB
    console.log('\n1️⃣ Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // 2. Importer le modèle User
    console.log('\n2️⃣ Import du modèle User...');
    const User = (await import('./models/User.js')).default;
    console.log('✅ Modèle User importé');
    
    // 3. Vérifier le compte admin
    console.log('\n3️⃣ Vérification du compte admin...');
    const adminUser = await User.findOne({ email: 'admin@taphair.com' });
    
    if (!adminUser) {
      console.log('❌ Compte admin@taphair.com NON TROUVÉ');
      return;
    }
    
    console.log('✅ Compte admin trouvé:', {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      roleType: typeof adminUser.role
    });
    
    // 4. Vérifier tous les comptes et leurs rôles
    console.log('\n4️⃣ Vérification de tous les comptes...');
    const allUsers = await User.find({}).select('name email role');
    
    console.log('📊 Tous les comptes:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Rôle: "${user.role}" [${typeof user.role}]`);
    });
    
    // 5. Vérifier les rôles uniques
    console.log('\n5️⃣ Rôles uniques dans la base:');
    const uniqueRoles = [...new Set(allUsers.map(u => u.role))];
    console.log('🎭 Rôles trouvés:', uniqueRoles);
    
    // 6. Vérifier la validation du schéma
    console.log('\n6️⃣ Test de création d\'un compte admin...');
    try {
      const testAdmin = new User({
        name: 'Test Admin',
        email: 'test-admin@example.com',
        password: 'test123',
        role: 'admin'
      });
      
      // Valider sans sauvegarder
      await testAdmin.validate();
      console.log('✅ Validation du schéma admin: SUCCÈS');
    } catch (validationError) {
      console.log('❌ Validation du schéma admin: ÉCHEC');
      console.log('Erreur:', validationError.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la vérification
checkAdminAccount();
