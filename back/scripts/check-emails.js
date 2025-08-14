import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const checkEmails = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');

    const users = await User.find({}, 'email');
    console.log('📧 Emails dans la base:');
    users.forEach(user => {
      console.log(`   - ${user.email}`);
    });

    console.log(`\n📊 Total: ${users.length} utilisateurs`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

checkEmails();
