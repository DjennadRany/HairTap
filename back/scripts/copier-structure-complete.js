import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const copierStructureComplete = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Récupérer le compte modèle (Marie Dubois)
    console.log('\n🔍 Récupération du compte modèle (Marie Dubois)...');
    const compteModele = await User.findOne({ email: 'marie.dubois@taphair.com' });
    
    if (!compteModele) {
      console.log('❌ Compte modèle non trouvé');
      return;
    }

    console.log(`✅ Compte modèle trouvé: ${compteModele.name}`);

    // 2. Liste des comptes mock à corriger
    const comptesMock = [
      'sophie.martin@taphair.com',
      'julie.bernard@taphair.com', 
      'thomas.moreau@taphair.com',
      'camille.rousseau@taphair.com',
      'lea.dubois@taphair.com'
    ];

    // 3. Copier TOUS les champs manquants
    console.log('\n🔧 Copie de la structure complète...');
    
    for (const email of comptesMock) {
      const compteMock = await User.findOne({ email });
      
      if (compteMock) {
        console.log(`\n🔧 Mise à jour de ${compteMock.name}...`);
        
        // Copier TOUS les champs du modèle
        const updates = {
          // Champs de base
          createdAt: compteModele.createdAt,
          updatedAt: new Date(),
          
          // Profil
          birthDate: compteModele.birthDate,
          gender: compteModele.gender,
          
          // Adresse complète
          address: {
            street: compteModele.address?.street,
            city: compteModele.address?.city,
            postalCode: compteModele.address?.postalCode,
            country: compteModele.address?.country,
            coordinates: compteModele.address?.coordinates
          },
          
          // Professionnel
          isAvailable: compteModele.isAvailable,
          isVerified: compteModele.isVerified,
          
          // Horaires
          workingHours: {
            monday: { start: '09:00', end: '19:00', isAvailable: true },
            tuesday: { start: '09:00', end: '19:00', isAvailable: true },
            wednesday: { start: '09:00', end: '19:00', isAvailable: true },
            thursday: { start: '09:00', end: '19:00', isAvailable: true },
            friday: { start: '09:00', end: '19:00', isAvailable: true },
            saturday: { start: '10:00', end: '17:00', isAvailable: true },
            sunday: { start: '10:00', end: '17:00', isAvailable: false }
          },
          
          // Statistiques
          stats: {
            totalBookings: compteMock.stats?.totalBookings || 0,
            completedBookings: compteMock.stats?.completedBookings || 0,
            cancelledBookings: compteMock.stats?.cancelledBookings || 0,
            averageRating: compteMock.stats?.averageRating || 0,
            profileViews: compteMock.stats?.profileViews || 0,
            lastActive: new Date()
          },
          
          // Social
          followers: compteModele.followers,
          following: compteModele.following,
          
          // Préférences
          language: compteModele.language,
          timezone: compteModele.timezone,
          notifications: compteModele.notifications,
          
          // Sécurité
          isActive: compteModele.isActive,
          emailVerified: compteModele.emailVerified,
          phoneVerified: compteModele.phoneVerified,
          lastLogin: compteModele.lastLogin,
          
          // Champs personnalisés
          customFields: compteModele.customFields,
          tags: compteModele.tags,
          notes: compteModele.notes
        };

        // Ajouter le mot de passe si manquant
        if (!compteMock.password) {
          updates.password = await bcrypt.hash('Password123!', 12);
        }

        // Appliquer TOUS les updates
        Object.assign(compteMock, updates);
        await compteMock.save();
        
        console.log(`✅ ${compteMock.name} mis à jour avec succès`);
        console.log(`  - Structure complète copiée`);
        console.log(`  - Password: ${updates.password ? '✅ Ajouté' : '✅ Déjà présent'}`);
        console.log(`  - WorkingHours: ✅ Ajouté`);
        console.log(`  - Stats: ✅ Mis à jour`);
        console.log(`  - Tous les champs: ✅ Copiés`);
        
      } else {
        console.log(`❌ Compte mock non trouvé: ${email}`);
      }
    }

    // 4. Vérification finale
    console.log('\n🔍 Vérification finale de tous les comptes...');
    const allCoiffeurs = await User.find({ role: 'coiffeur' }).select('name email password workingHours stats address');
    
    console.log(`📊 Total coiffeurs: ${allCoiffeurs.length}`);
    allCoiffeurs.forEach(coiffeur => {
      console.log(`\n👤 ${coiffeur.name} (${coiffeur.email})`);
      console.log(`- Password: ${coiffeur.password ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- WorkingHours: ${coiffeur.workingHours ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- Stats: ${coiffeur.stats ? '✅ Présent' : '❌ Manquant'}`);
      console.log(`- Address: ${coiffeur.address ? '✅ Présent' : '❌ Manquant'}`);
      
      if (coiffeur.workingHours) {
        console.log(`  - Jours disponibles: ${Object.keys(coiffeur.workingHours).filter(day => coiffeur.workingHours[day].isAvailable).length}/7`);
      }
    });

    console.log('\n🎉 Structure complète copiée sur tous les comptes !');

  } catch (error) {
    console.error('❌ Erreur lors de la copie:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

copierStructureComplete();
