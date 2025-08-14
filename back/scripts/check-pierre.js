import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const checkPierre = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair');
    console.log('✅ Connecté à MongoDB');

    const pierre = await User.findOne({ email: 'pierre.martin@taphair.com' });
    
    if (!pierre) {
      console.log('❌ Pierre Martin non trouvé');
      return;
    }

    console.log('👤 Pierre Martin:');
    console.log('   - workingHours:', pierre.workingHours);
    console.log('   - services:', pierre.services);
    console.log('   - workingMode:', pierre.workingMode);
    console.log('   - travelRadius:', pierre.travelRadius);
    console.log('   - address:', pierre.address);
    console.log('   - salonAddress:', pierre.salonAddress);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

checkPierre();
