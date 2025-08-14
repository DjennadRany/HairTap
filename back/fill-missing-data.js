import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const fillMissingData = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    // Données d'adresses complètes pour tous les utilisateurs
    const completeAddresses = {
      home: {
        streetNumber: '123',
        street: 'Rue de la Paix',
        postalCode: '75001',
        city: 'Paris',
        floor: '2ème étage',
        apartment: 'Apt 4B',
        buildingCode: '1234',
        additionalInfo: 'Instructions d\'accès, interphone, etc.',
        coordinates: {
          lat: 48.8566,
          lng: 2.3522
        }
      },
      office: {
        streetNumber: '456',
        street: 'Avenue des Champs-Élysées',
        postalCode: '75008',
        city: 'Paris',
        floor: '1er étage',
        apartment: 'Bureau 12',
        buildingCode: '5678',
        additionalInfo: 'Code d\'accès au bureau',
        coordinates: {
          lat: 48.8698,
          lng: 2.3077
        }
      }
    };

    // Données de préférences complètes
    const completePreferences = {
      notifications: {
        email: true,
        sms: true,
        push: true,
        marketing: false,
        updates: true
      },
      language: 'fr',
      theme: 'light',
      timezone: 'Europe/Paris',
      currency: 'EUR',
      privacy: {
        showAddress: true,
        showPhone: false,
        showEmail: true
      }
    };

    // Données de bio complètes
    const completeBios = {
      'Alice Martin': 'Coiffeuse passionnée avec 5 ans d\'expérience. Spécialisée dans les coupes modernes et les colorations.',
      'Bob Dupont': 'Client fidèle de TapHair depuis 2 ans. J\'aime les coupes classiques et élégantes.',
      'Marie Dubois': 'Coiffeuse professionnelle avec 8 ans d\'expérience. Spécialisée dans les coupes tendance et les extensions.',
      'Pierre Martin': 'Coiffeur expert en coupes masculines et barbes. Plus de 10 ans d\'expérience dans le métier.',
      'Admin System': 'Administrateur système TapHair. Gestion des utilisateurs et de la plateforme.',
      'Malik': 'Client TapHair passionné de coiffure moderne et de style urbain.',
      'rany': 'Nouveau client TapHair, en quête de la coupe parfaite !'
    };

    // Données de téléphone complètes
    const completePhones = {
      'Bob Dupont': '0600000002',
      'Marie Dubois': '0600000003',
      'Pierre Martin': '0600000004',
      'Malik': '0600000005',
      'rany': '0600000006'
    };

    console.log('\n🔧 Début du remplissage des données manquantes...');

    // Récupérer tous les utilisateurs
    const users = await User.find({});
    console.log(`\n👥 ${users.length} utilisateurs trouvés`);

    let updatedCount = 0;

    for (const user of users) {
      let hasUpdates = false;
      const updates = {};

      // Vérifier et ajouter les adresses
      if (!user.addresses || !user.addresses.home || !user.addresses.home.street) {
        updates.addresses = completeAddresses;
        hasUpdates = true;
        console.log(`📍 Ajout d'adresses pour ${user.name}`);
      }

      // Vérifier et ajouter les préférences complètes
      if (!user.preferences || !user.preferences.timezone || !user.preferences.currency) {
        updates.preferences = {
          ...user.preferences,
          ...completePreferences
        };
        hasUpdates = true;
        console.log(`⚙️ Ajout de préférences complètes pour ${user.name}`);
      }

      // Vérifier et ajouter la bio
      if (!user.bio || user.bio === 'Non définie') {
        updates.bio = completeBios[user.name] || 'Utilisateur TapHair passionné de coiffure.';
        hasUpdates = true;
        console.log(`📝 Ajout de bio pour ${user.name}`);
      }

      // Vérifier et ajouter le téléphone
      if (!user.phone || user.phone === 'Non défini') {
        updates.phone = completePhones[user.name] || `06${Math.random().toString().slice(2, 8)}`;
        hasUpdates = true;
        console.log(`📱 Ajout de téléphone pour ${user.name}`);
      }

      // Mettre à jour l'utilisateur si nécessaire
      if (hasUpdates) {
        try {
          await User.findByIdAndUpdate(user._id, updates, { new: true });
          updatedCount++;
          console.log(`✅ ${user.name} mis à jour avec succès`);
        } catch (error) {
          console.error(`❌ Erreur lors de la mise à jour de ${user.name}:`, error.message);
        }
      } else {
        console.log(`✅ ${user.name} déjà complet, pas de mise à jour nécessaire`);
      }
    }

    console.log(`\n🎉 Remplissage terminé ! ${updatedCount} utilisateurs mis à jour.`);

    // Vérifier le résultat
    console.log('\n🔍 Vérification finale des données...');
    const finalUsers = await User.find({}).select('-password');
    
    finalUsers.forEach((user, index) => {
      console.log(`\n--- Utilisateur ${index + 1} ---`);
      console.log(`Nom: ${user.name}`);
      console.log(`Téléphone: ${user.phone || 'Non défini'}`);
      console.log(`Bio: ${user.bio || 'Non définie'}`);
      console.log(`Adresses: ${user.addresses?.home?.street ? '✅ Complètes' : '❌ Manquantes'}`);
      console.log(`Préférences: ${user.preferences?.timezone ? '✅ Complètes' : '❌ Manquantes'}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

fillMissingData();
