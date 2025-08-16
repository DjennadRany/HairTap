import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';

const analyserCompteComplet = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Analyser un compte existant COMPLET
    console.log('\n🔍 Analyse COMPLÈTE d\'un compte existant (Marie Dubois)...');
    const marieDubois = await User.findOne({ email: 'marie.dubois@taphair.com' });
    
    if (marieDubois) {
      console.log('📋 Structure COMPLÈTE du compte Marie Dubois:');
      console.log('==============================================');
      
      // Champs de base
      console.log('\n📝 CHAMPS DE BASE:');
      console.log(`- _id: ${marieDubois._id}`);
      console.log(`- name: ${marieDubois.name}`);
      console.log(`- email: ${marieDubois.email}`);
      console.log(`- role: ${marieDubois.role}`);
      console.log(`- password: ${marieDubois.password ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- createdAt: ${marieDubois.createdAt}`);
      console.log(`- updatedAt: ${marieDubois.updatedAt}`);
      
      // Profil
      console.log('\n👤 PROFIL:');
      console.log(`- photo: ${marieDubois.photo || '❌ Manquant'}`);
      console.log(`- bio: ${marieDubois.bio || '❌ Manquant'}`);
      console.log(`- phone: ${marieDubois.phone || '❌ Manquant'}`);
      console.log(`- birthDate: ${marieDubois.birthDate || '❌ Manquant'}`);
      console.log(`- gender: ${marieDubois.gender || '❌ Manquant'}`);
      
      // Adresse
      console.log('\n📍 ADRESSE:');
      if (marieDubois.address) {
        console.log(`- address: ✅ Présent`);
        console.log(`  - street: ${marieDubois.address.street || '❌ Manquant'}`);
        console.log(`  - city: ${marieDubois.address.city || '❌ Manquant'}`);
        console.log(`  - postalCode: ${marieDubois.address.postalCode || '❌ Manquant'}`);
        console.log(`  - country: ${marieDubois.address.country || '❌ Manquant'}`);
        console.log(`  - coordinates: ${marieDubois.address.coordinates ? '✅ Présent' : '❌ Manquant'}`);
        if (marieDubois.address.coordinates) {
          console.log(`    - longitude: ${marieDubois.address.coordinates[0]}`);
          console.log(`    - latitude: ${marieDubois.address.coordinates[1]}`);
        }
      } else {
        console.log(`- address: ❌ Manquant`);
      }
      
      // Professionnel
      console.log('\n💼 PROFESSIONNEL:');
      console.log(`- siren: ${marieDubois.siren || '❌ Manquant'}`);
      console.log(`- sirenStatus: ${marieDubois.sirenStatus || '❌ Manquant'}`);
      console.log(`- specialities: ${marieDubois.specialities?.join(', ') || '❌ Manquant'}`);
      console.log(`- workingMode: ${marieDubois.workingMode?.join(', ') || '❌ Manquant'}`);
      console.log(`- travelRadius: ${marieDubois.travelRadius || '❌ Manquant'}`);
      console.log(`- isAvailable: ${marieDubois.isAvailable}`);
      console.log(`- isVerified: ${marieDubois.isVerified}`);
      
      // Horaires
      console.log('\n🕐 HORAIRES:');
      if (marieDubois.workingHours) {
        console.log(`- workingHours: ✅ Présent`);
        Object.entries(marieDubois.workingHours).forEach(([day, hours]) => {
          console.log(`  - ${day}: ${hours.start} - ${hours.end} (${hours.isAvailable ? 'Disponible' : 'Fermé'})`);
        });
      } else {
        console.log(`- workingHours: ❌ Manquant`);
      }
      
      // Évaluations
      console.log('\n⭐ ÉVALUATIONS:');
      console.log(`- rating: ${marieDubois.rating || '❌ Manquant'}`);
      console.log(`- totalRatings: ${marieDubois.totalRatings || '❌ Manquant'}`);
      console.log(`- reviews: ${marieDubois.reviews?.length || 0}`);
      
      // Statistiques
      console.log('\n📊 STATISTIQUES:');
      if (marieDubois.stats) {
        console.log(`- stats: ✅ Présent`);
        console.log(`  - totalBookings: ${marieDubois.stats.totalBookings || 0}`);
        console.log(`  - completedBookings: ${marieDubois.stats.completedBookings || 0}`);
        console.log(`  - cancelledBookings: ${marieDubois.stats.cancelledBookings || 0}`);
        console.log(`  - averageRating: ${marieDubois.stats.averageRating || 0}`);
        console.log(`  - profileViews: ${marieDubois.stats.profileViews || 0}`);
        console.log(`  - lastActive: ${marieDubois.stats.lastActive || '❌ Manquant'}`);
      } else {
        console.log(`- stats: ❌ Manquant`);
      }
      
      // Social
      console.log('\n❤️ SOCIAL:');
      console.log(`- likes: ${marieDubois.likes || '❌ Manquant'}`);
      console.log(`- followers: ${marieDubois.followers || '❌ Manquant'}`);
      console.log(`- following: ${marieDubois.following || '❌ Manquant'}`);
      
      // Préférences
      console.log('\n⚙️ PRÉFÉRENCES:');
      console.log(`- language: ${marieDubois.language || '❌ Manquant'}`);
      console.log(`- timezone: ${marieDubois.timezone || '❌ Manquant'}`);
      console.log(`- notifications: ${marieDubois.notifications ? '✅ Présent' : '❌ Manquant'}`);
      
      // Sécurité
      console.log('\n🔒 SÉCURITÉ:');
      console.log(`- isActive: ${marieDubois.isActive}`);
      console.log(`- emailVerified: ${marieDubois.emailVerified}`);
      console.log(`- phoneVerified: ${marieDubois.phoneVerified}`);
      console.log(`- lastLogin: ${marieDubois.lastLogin || '❌ Manquant'}`);
      
      // Champs personnalisés
      console.log('\n🔧 CHAMPS PERSONNALISÉS:');
      console.log(`- customFields: ${marieDubois.customFields ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- tags: ${marieDubois.tags?.join(', ') || '❌ Manquant'}`);
      console.log(`- notes: ${marieDubois.notes || '❌ Manquant'}`);
      
    } else {
      console.log('❌ Marie Dubois non trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

analyserCompteComplet();
