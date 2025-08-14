#!/usr/bin/env node

/**
 * Script de Seed Utilisateur Test - TapHair
 * Basé sur le schéma User détecté dans back/models/User.js
 */

import User from '../back/models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair';

const testUsers = [
  {
    name: 'Alice Martin',
    email: 'alice.martin@test.com',
    password: 'Test123!',
    role: 'user',
    photo: 'https://randomuser.me/api/portraits/women/1.jpg',
    bio: 'Utilisatrice de test',
    phone: '+33123456789'
  },
  {
    name: 'Bob Dupont',
    email: 'bob.dupont@test.com',
    password: 'Test123!',
    role: 'coiffeur',
    photo: 'https://randomuser.me/api/portraits/men/1.jpg',
    bio: 'Coiffeur de test',
    phone: '+33987654321',
    siren: '123456789',
    sirenStatus: 'verified',
    experience: 5
  }
];

async function seedTestUsers() {
  try {
    console.log('🌱 Démarrage du seed des utilisateurs de test...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Nettoyer les utilisateurs de test existants
    const emailsToDelete = testUsers.map(user => user.email);
    await User.deleteMany({ email: { $in: emailsToDelete } });
    
    // Créer les nouveaux utilisateurs de test
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Utilisateur créé: ${user.name} (${user.email}) - Rôle: ${user.role}`);
    }
    
    console.log('\n🔑 CRÉDENTIALS DE TEST');
    console.log('======================');
    testUsers.forEach(user => {
      console.log(`${user.name} (${user.role}):`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Mot de passe: ${user.password}`);
      console.log('');
    });
    
    console.log('🎉 Seed terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedTestUsers();
