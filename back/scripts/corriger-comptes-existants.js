import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const corrigerComptesExistants = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Corriger les nouveaux comptes coiffeurs
    console.log('\n🔧 Correction des nouveaux comptes coiffeurs...');
    
    const nouveauxCoiffeurs = [
      {
        email: 'sophie.martin@taphair.com',
        updates: {
          password: 'Password123!',
          photo: '/uploads/profiles/profile-6839ca0736ec3cfc09c649ec-1754302518557-i4afh60or3b.jpg', // Photo de Marie Dubois temporairement
          workingHours: {
            monday: { start: '09:00', end: '19:00', isAvailable: true },
            tuesday: { start: '09:00', end: '19:00', isAvailable: true },
            wednesday: { start: '09:00', end: '19:00', isAvailable: true },
            thursday: { start: '09:00', end: '19:00', isAvailable: true },
            friday: { start: '09:00', end: '19:00', isAvailable: true },
            saturday: { start: '10:00', end: '17:00', isAvailable: true },
            sunday: { start: '10:00', end: '17:00', isAvailable: false }
          },
          likes: 156,
          stats: {
            totalBookings: 234,
            completedBookings: 230,
            cancelledBookings: 4,
            averageRating: 4.9,
            profileViews: 1567
          }
        }
      },
      {
        email: 'julie.bernard@taphair.com',
        updates: {
          password: 'Password123!',
          photo: '/uploads/profiles/profile-6839ca0736ec3cfc09c649ec-1754302518557-i4afh60or3b.jpg',
          workingHours: {
            monday: { start: '09:00', end: '19:00', isAvailable: true },
            tuesday: { start: '09:00', end: '19:00', isAvailable: true },
            wednesday: { start: '09:00', end: '19:00', isAvailable: true },
            thursday: { start: '09:00', end: '19:00', isAvailable: true },
            friday: { start: '09:00', end: '19:00', isAvailable: true },
            saturday: { start: '10:00', end: '17:00', isAvailable: true },
            sunday: { start: '10:00', end: '17:00', isAvailable: false }
          },
          likes: 73,
          stats: {
            totalBookings: 67,
            completedBookings: 65,
            cancelledBookings: 2,
            averageRating: 4.7,
            profileViews: 456
          }
        }
      },
      {
        email: 'thomas.moreau@taphair.com',
        updates: {
          password: 'Password123!',
          photo: '/uploads/profiles/profile-6839ca0736ec3cfc09c649ed-1754310179416-mhjy4dqcnw9.jpg', // Photo de Pierre Martin
          workingHours: {
            monday: { start: '09:00', end: '19:00', isAvailable: true },
            tuesday: { start: '09:00', end: '19:00', isAvailable: true },
            wednesday: { start: '09:00', end: '19:00', isAvailable: true },
            thursday: { start: '09:00', end: '19:00', isAvailable: true },
            friday: { start: '09:00', end: '19:00', isAvailable: true },
            saturday: { start: '10:00', end: '17:00', isAvailable: true },
            sunday: { start: '10:00', end: '17:00', isAvailable: false }
          },
          likes: 88,
          stats: {
            totalBookings: 123,
            completedBookings: 120,
            cancelledBookings: 3,
            averageRating: 4.6,
            profileViews: 789
          }
        }
      },
      {
        email: 'camille.rousseau@taphair.com',
        updates: {
          password: 'Password123!',
          photo: '/uploads/profiles/profile-6839ca0736ec3cfc09c649ec-1754302518557-i4afh60or3b.jpg',
          workingHours: {
            monday: { start: '09:00', end: '19:00', isAvailable: true },
            tuesday: { start: '09:00', end: '19:00', isAvailable: true },
            wednesday: { start: '09:00', end: '19:00', isAvailable: true },
            thursday: { start: '09:00', end: '19:00', isAvailable: true },
            friday: { start: '09:00', end: '19:00', isAvailable: true },
            saturday: { start: '10:00', end: '17:00', isAvailable: true },
            sunday: { start: '10:00', end: '17:00', isAvailable: false }
          },
          likes: 234,
          stats: {
            totalBookings: 345,
            completedBookings: 340,
            cancelledBookings: 5,
            averageRating: 4.9,
            profileViews: 2345
          }
        }
      },
      {
        email: 'lea.dubois@taphair.com',
        updates: {
          password: 'Password123!',
          photo: '/uploads/profiles/profile-6839ca0736ec3cfc09c649ec-1754302518557-i4afh60or3b.jpg',
          workingHours: {
            monday: { start: '09:00', end: '19:00', isAvailable: true },
            tuesday: { start: '09:00', end: '19:00', isAvailable: true },
            wednesday: { start: '09:00', end: '19:00', isAvailable: true },
            thursday: { start: '09:00', end: '19:00', isAvailable: true },
            friday: { start: '09:00', end: '19:00', isAvailable: true },
            saturday: { start: '10:00', end: '17:00', isAvailable: true },
            sunday: { start: '10:00', end: '17:00', isAvailable: false }
          },
          likes: 167,
          stats: {
            totalBookings: 178,
            completedBookings: 175,
            cancelledBookings: 3,
            averageRating: 4.8,
            profileViews: 1234
          }
        }
      }
    ];

    // Mettre à jour chaque compte
    for (const coiffeurData of nouveauxCoiffeurs) {
      const coiffeur = await User.findOne({ email: coiffeurData.email });
      
      if (coiffeur) {
        console.log(`\n🔧 Mise à jour de ${coiffeur.name}...`);
        
        // Hasher le mot de passe si présent
        if (coiffeurData.updates.password) {
          coiffeurData.updates.password = await bcrypt.hash(coiffeurData.updates.password, 12);
        }
        
        // Mettre à jour le compte
        Object.assign(coiffeur, coiffeurData.updates);
        await coiffeur.save();
        
        console.log(`✅ ${coiffeur.name} mis à jour avec succès`);
        console.log(`  - Password: ${coiffeurData.updates.password ? '✅ Ajouté' : '❌ Manquant'}`);
        console.log(`  - Photo: ${coiffeurData.updates.photo ? '✅ Ajouté' : '❌ Manquant'}`);
        console.log(`  - WorkingHours: ${coiffeurData.updates.workingHours ? '✅ Ajouté' : '❌ Manquant'}`);
        console.log(`  - Likes: ${coiffeurData.updates.likes || '❌ Manquant'}`);
        console.log(`  - Stats: ${coiffeurData.updates.stats ? '✅ Ajouté' : '❌ Manquant'}`);
      } else {
        console.log(`❌ Coiffeur non trouvé: ${coiffeurData.email}`);
      }
    }

    // 2. Vérifier que tous les comptes ont maintenant les bons champs
    console.log('\n🔍 Vérification finale des comptes...');
    const allCoiffeurs = await User.find({ role: 'coiffeur' }).select('name email password photo workingHours likes stats');
    
    console.log(`📊 Total coiffeurs: ${allCoiffeurs.length}`);
    allCoiffeurs.forEach(coiffeur => {
      console.log(`\n👤 ${coiffeur.name} (${coiffeur.email})`);
      console.log(`- Password: ${coiffeur.password ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- Photo: ${coiffeur.photo ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- WorkingHours: ${coiffeur.workingHours ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- Likes: ${coiffeur.likes || '❌ Manquant'}`);
      console.log(`- Stats: ${coiffeur.stats ? '✅ Présent' : '❌ Manquant'}`);
    });

    console.log('\n🎉 Correction des comptes terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

corrigerComptesExistants();
