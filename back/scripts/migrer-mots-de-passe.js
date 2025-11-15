import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

/**
 * Script de migration pour hasher tous les mots de passe en clair
 * Restaure également le mot de passe de Marie Dubois à 'marie123'
 */
const migrerMotsDePasse = async () => {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer tous les utilisateurs avec leurs mots de passe
    const users = await User.find({}).select('+password');
    
    console.log(`📊 Total d'utilisateurs trouvés: ${users.length}\n`);
    console.log('═'.repeat(80));
    console.log('MIGRATION DES MOTS DE PASSE');
    console.log('═'.repeat(80));
    console.log('');

    let hashedCount = 0;
    let plainTextCount = 0;
    let updatedCount = 0;
    const plainTextUsers = [];

    // Analyser chaque utilisateur
    for (const user of users) {
      if (!user.password) {
        console.log(`⚠️ ${user.email}: Pas de mot de passe`);
        continue;
      }

      // Vérifier si le mot de passe est déjà un hash bcrypt
      const isHash = /^\$2[ayb]\$\d{2}\$/.test(user.password);

      if (isHash) {
        hashedCount++;
      } else {
        plainTextCount++;
        plainTextUsers.push({
          email: user.email,
          name: user.name,
          currentPassword: user.password
        });
      }
    }

    console.log(`📈 Statistiques:`);
    console.log(`   - Mots de passe déjà hashés: ${hashedCount}`);
    console.log(`   - Mots de passe en clair: ${plainTextCount}`);
    console.log('');

    if (plainTextCount === 0) {
      console.log('✅ Tous les mots de passe sont déjà hashés !');
    } else {
      console.log('🔧 Hashage des mots de passe en clair...\n');
      
      // Hasher tous les mots de passe en clair
      for (const userInfo of plainTextUsers) {
        const user = await User.findOne({ email: userInfo.email }).select('+password');
        if (user) {
          const plainPassword = user.password;
          // Hasher le mot de passe
          user.password = plainPassword; // Le middleware va hasher
          await user.save();
          updatedCount++;
          console.log(`✅ ${userInfo.name} (${userInfo.email}): Mot de passe hashé`);
        }
      }
    }

    // Restaurer le mot de passe de Marie Dubois à 'marie123'
    console.log('\n🔧 Restauration du mot de passe de Marie Dubois...');
    const marieDubois = await User.findOne({ email: 'marie.dubois@taphair.com' }).select('+password');
    
    if (marieDubois) {
      marieDubois.password = 'marie123'; // Le middleware va hasher
      await marieDubois.save();
      console.log('✅ Mot de passe de Marie Dubois restauré à "marie123" (hashé)');
    } else {
      console.log('⚠️ Marie Dubois non trouvée');
    }

    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const finalUsers = await User.find({}).select('+password');
    let finalPlainTextCount = 0;
    
    for (const user of finalUsers) {
      if (user.password && !/^\$2[ayb]\$\d{2}\$/.test(user.password)) {
        finalPlainTextCount++;
        console.log(`⚠️ ${user.email}: Toujours en clair (${user.password})`);
      }
    }

    console.log('\n═'.repeat(80));
    console.log('RÉSUMÉ DE LA MIGRATION');
    console.log('═'.repeat(80));
    console.log(`Total utilisateurs: ${users.length}`);
    console.log(`Mots de passe hashés avant: ${hashedCount}`);
    console.log(`Mots de passe en clair avant: ${plainTextCount}`);
    console.log(`Mots de passe mis à jour: ${updatedCount}`);
    console.log(`Mots de passe en clair restants: ${finalPlainTextCount}`);
    console.log('');

    if (finalPlainTextCount === 0) {
      console.log('✅ Migration terminée avec succès ! Tous les mots de passe sont hashés.');
    } else {
      console.log(`⚠️ Attention: ${finalPlainTextCount} mot(s) de passe encore en clair.`);
    }

    // Déconnexion
    await mongoose.disconnect();
    console.log('\n✅ Script terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

// Exécuter le script
migrerMotsDePasse();



