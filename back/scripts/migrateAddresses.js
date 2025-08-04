const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/database');

async function migrateAddresses() {
  try {
    console.log('🔧 Connexion à MongoDB...');
    await mongoose.connect(config.mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Trouver tous les utilisateurs avec une adresse
    const usersWithAddress = await User.find({
      address: { $exists: true, $ne: null },
      'address.street': { $exists: true, $ne: '' }
    });

    console.log(`📊 ${usersWithAddress.length} utilisateurs avec adresse trouvés`);

    for (const user of usersWithAddress) {
      console.log(`🔧 Migration pour ${user.name} (${user.email})`);
      
      // Migrer user.address vers user.addresses.home
      if (user.address && user.address.street) {
        user.addresses = {
          home: {
            street: user.address.street,
            streetNumber: user.address.streetNumber || '',
            city: user.address.city || '',
            postalCode: user.address.postalCode || '',
            floor: user.address.floor || '',
            apartment: user.address.apartment || '',
            buildingCode: user.address.buildingCode || '',
            additionalInfo: user.address.additionalInfo || '',
            coordinates: user.address.coordinates || null
          }
        };

        // Garder l'ancienne adresse pour compatibilité
        // user.address = null; // Optionnel: supprimer l'ancienne

        await user.save();
        console.log(`✅ Adresse migrée pour ${user.name}:`, user.addresses.home);
      }
    }

    console.log('✅ Migration terminée !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    process.exit(1);
  }
}

migrateAddresses(); 