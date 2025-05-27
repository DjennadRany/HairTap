import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGO_URI = 'mongodb://localhost:27017/taphair'; // adapte si besoin
const EMAIL = 'alice.client@test.com'; // l'email à corriger
const NEW_PASSWORD = 'Test1234'; // le mot de passe que tu veux

async function resetPassword() {
  await mongoose.connect(MONGO_URI);
  const user = await User.findOne({ email: EMAIL });
  if (!user) {
    console.log('Utilisateur non trouvé');
    process.exit(1);
  }
  user.password = NEW_PASSWORD; // Stockage en clair pour les tests
  await user.save();
  console.log(`Mot de passe réinitialisé pour ${EMAIL} : ${NEW_PASSWORD}`);
  process.exit(0);
}

resetPassword(); 