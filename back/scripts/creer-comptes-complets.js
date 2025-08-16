import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const creerComptesComplets = async () => {
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

    // 2. Nouveaux comptes à créer (COMPLETS)
    const nouveauxComptes = [
      {
        name: 'Sophie Martin',
        email: 'sophie.martin@taphair.com',
        phone: '0612345680',
        bio: 'Experte en coloration et balayage. Plus de 12 ans d\'expérience.',
        siren: '456789123',
        specialities: ['Coloration', 'Balayage', 'Naturel'],
        rating: 4.9,
        totalRatings: 67,
        workingMode: ['salon', 'domicile'],
        travelRadius: 20,
        photo: '/uploads/profiles/profile-6839ca0736ec3cfc09c649ec-1754302518557-i4afh60or3b.jpg'
      },
      {
        name: 'Julie Bernard',
        email: 'julie.bernard@taphair.com',
        phone: '0612345681',
        bio: 'Spécialiste du brushing et des coiffures de mariage. Créativité et élégance.',
        siren: '456789124',
        specialities: ['Brushing', 'Volume', 'Mouvement'],
        rating: 4.7,
        totalRatings: 29,
        workingMode: ['salon', 'domicile'],
        travelRadius: 15,
        photo: '/uploads/profiles/profile-6839ca0736ec3cfc09c649ec-1754302518557-i4afh60or3b.jpg'
      },
      {
        name: 'Thomas Moreau',
        email: 'thomas.moreau@taphair.com',
        phone: '0612345682',
        bio: 'Coiffeur spécialisé dans les coupes hommes. Style classique et moderne.',
        siren: '456789125',
        specialities: ['Coupe homme', 'Classique', 'Élégant'],
        rating: 4.6,
        totalRatings: 42,
        workingMode: ['salon', 'domicile'],
        travelRadius: 25,
        photo: '/uploads/profiles/profile-6839ca0736ec3cfc09c649ed-1754310179416-mhjy4dqcnw9.jpg'
      },
      {
        name: 'Camille Rousseau',
        email: 'camille.rousseau@taphair.com',
        phone: '0612345683',
        bio: 'Artiste de la couleur et du lissage. Techniques brésiliennes et japonaises.',
        siren: '456789126',
        specialities: ['Lissage', 'Brésilien', 'Lisse'],
        rating: 4.9,
        totalRatings: 89,
        workingMode: ['salon', 'domicile'],
        travelRadius: 30,
        photo: '/uploads/profiles/profile-6839ca0736ec3cfc09c649ec-1754302518557-i4afh60or3b.jpg'
      },
      {
        name: 'Léa Dubois',
        email: 'lea.dubois@taphair.com',
        phone: '0612345684',
        bio: 'Spécialiste des extensions naturelles et discrètes. Volume et longueur garantis.',
        siren: '456789127',
        specialities: ['Extension', 'Naturel', 'Discrétion'],
        rating: 4.8,
        totalRatings: 56,
        workingMode: ['salon', 'domicile'],
        travelRadius: 18,
        photo: '/uploads/profiles/profile-6839ca0736ec3cfc09c649ec-1754302518557-i4afh60or3b.jpg'
      }
    ];

    // 3. Créer chaque nouveau compte COMPLET
    console.log('\n🔧 Création des nouveaux comptes COMPLETS...');
    
    for (const nouveauCompte of nouveauxComptes) {
      console.log(`\n🔧 Création de ${nouveauCompte.name}...`);
      
      // Copier TOUS les champs du modèle
      const compteComplet = {
        // Champs spécifiques du nouveau compte
        name: nouveauCompte.name,
        email: nouveauCompte.email,
        phone: nouveauCompte.phone,
        bio: nouveauCompte.bio,
        siren: nouveauCompte.siren,
        specialities: nouveauCompte.specialities,
        rating: nouveauCompte.rating,
        totalRatings: nouveauCompte.totalRatings,
        workingMode: nouveauCompte.workingMode,
        travelRadius: nouveauCompte.travelRadius,
        photo: nouveauCompte.photo,
        
        // Copier TOUS les autres champs du modèle
        role: 'coiffeur',
        password: await bcrypt.hash('Password123!', 12),
        createdAt: compteModele.createdAt,
        updatedAt: new Date(),
        
        // Adresse (copier du modèle)
        address: {
          street: compteModele.address?.street,
          city: compteModele.address?.city,
          postalCode: compteModele.address?.postalCode,
          country: compteModele.address?.country,
          coordinates: compteModele.address?.coordinates
        },
        
        // Horaires (standard)
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
          totalBookings: Math.floor(Math.random() * 300) + 50,
          completedBookings: Math.floor(Math.random() * 280) + 45,
          cancelledBookings: Math.floor(Math.random() * 20) + 1,
          averageRating: nouveauCompte.rating,
          profileViews: Math.floor(Math.random() * 2000) + 500,
          lastActive: new Date()
        },
        
        // Social
        likes: Math.floor(Math.random() * 200) + 50,
        followers: Math.floor(Math.random() * 100) + 20,
        following: Math.floor(Math.random() * 50) + 10,
        
        // Sécurité et statut
        sirenStatus: 'verified',
        isAvailable: true,
        isVerified: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        lastLogin: new Date(),
        
        // Préférences
        language: 'fr',
        timezone: 'Europe/Paris',
        notifications: true
      };

      // Créer le compte
      const compteCree = new User(compteComplet);
      await compteCree.save();
      
      console.log(`✅ ${nouveauCompte.name} créé avec succès`);
      console.log(`  - Email: ${nouveauCompte.email}`);
      console.log(`  - Password: Password123!`);
      console.log(`  - Structure: ✅ COMPLÈTE (copiée du modèle)`);
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
    });

    console.log('\n🎉 Nouveaux comptes COMPLETS créés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

creerComptesComplets();
