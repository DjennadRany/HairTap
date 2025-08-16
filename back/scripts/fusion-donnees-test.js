import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import GlobalSpecialty from '../models/GlobalSpecialty.js';
import bcrypt from 'bcryptjs';

const fusionDonneesTest = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Créer les spécialités globales si elles n'existent pas
    console.log('\n🔧 Création des spécialités globales...');
    const specialitesGlobales = [
      { name: 'Coupe femme', category: 'coupe' },
      { name: 'Coupe homme', category: 'coupe' },
      { name: 'Dégradé', category: 'coupe' },
      { name: 'Moderne', category: 'coupe' },
      { name: 'Coloration', category: 'coloration' },
      { name: 'Balayage', category: 'coloration' },
      { name: 'Naturel', category: 'coloration' },
      { name: 'Brushing', category: 'brushing' },
      { name: 'Volume', category: 'brushing' },
      { name: 'Mouvement', category: 'brushing' },
      { name: 'Lissage', category: 'lissage' },
      { name: 'Brésilien', category: 'lissage' },
      { name: 'Lisse', category: 'lissage' },
      { name: 'Extension', category: 'extension' },
      { name: 'Discrétion', category: 'extension' }
    ];

    for (const specData of specialitesGlobales) {
      const existingSpec = await GlobalSpecialty.findOne({ name: specData.name });
      if (!existingSpec) {
        const newSpec = new GlobalSpecialty(specData);
        await newSpec.save();
        console.log(`✅ Spécialité créée: ${specData.name}`);
      } else {
        console.log(`ℹ️ Spécialité existante: ${specData.name}`);
      }
    }

    // 2. Créer les nouveaux coiffeurs de test
    console.log('\n👤 Création des nouveaux coiffeurs de test...');
    const nouveauxCoiffeurs = [
      {
        name: 'Marie Dubois',
        email: 'marie.dubois@taphair.com',
        password: 'Password123!',
        role: 'coiffeur',
        photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        bio: 'Spécialiste des coupes modernes et tendance. Plus de 8 ans d\'expérience.',
        phone: '0612345679',
        address: {
          street: '28 avenue des Champs',
          city: 'Paris',
          postalCode: '75008',
          coordinates: {
            lat: 48.8698,
            lng: 2.3077
          }
        },
        siren: '987654321',
        sirenStatus: 'verified',
        sirenVerificationDate: new Date('2024-01-15'),
        specialities: ['Coupe femme', 'Dégradé', 'Moderne'],
        rating: 4.8,
        totalRatings: 38,
        workingMode: ['salon', 'domicile'],
        workingHours: {
          monday: { start: '09:00', end: '19:00', isAvailable: true },
          tuesday: { start: '09:00', end: '19:00', isAvailable: true },
          wednesday: { start: '09:00', end: '19:00', isAvailable: true },
          thursday: { start: '09:00', end: '19:00', isAvailable: true },
          friday: { start: '09:00', end: '19:00', isAvailable: true },
          saturday: { start: '10:00', end: '17:00', isAvailable: true },
          sunday: { start: '10:00', end: '17:00', isAvailable: false }
        },
        travelRadius: 20,
        likes: 95,
        stats: {
          totalBookings: 89,
          completedBookings: 87,
          cancelledBookings: 2,
          averageRating: 4.8,
          profileViews: 890
        }
      },
      {
        name: 'Sophie Martin',
        email: 'sophie.martin@taphair.com',
        password: 'Password123!',
        role: 'coiffeur',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        bio: 'Experte en coloration et balayage. Plus de 12 ans d\'expérience.',
        phone: '0612345680',
        address: {
          street: '15 rue de la République',
          city: 'Lyon',
          postalCode: '69001',
          coordinates: {
            lat: 45.7640,
            lng: 4.8357
          }
        },
        siren: '456789123',
        sirenStatus: 'verified',
        sirenVerificationDate: new Date('2024-02-01'),
        specialities: ['Coloration', 'Balayage', 'Naturel'],
        rating: 4.9,
        totalRatings: 67,
        workingMode: ['salon', 'domicile'],
        workingHours: {
          monday: { start: '09:00', end: '19:00', isAvailable: true },
          tuesday: { start: '09:00', end: '19:00', isAvailable: true },
          wednesday: { start: '09:00', end: '19:00', isAvailable: true },
          thursday: { start: '09:00', end: '19:00', isAvailable: true },
          friday: { start: '09:00', end: '19:00', isAvailable: true },
          saturday: { start: '10:00', end: '17:00', isAvailable: true },
          sunday: { start: '10:00', end: '17:00', isAvailable: false }
        },
        travelRadius: 25,
        likes: 156,
        stats: {
          totalBookings: 234,
          completedBookings: 230,
          cancelledBookings: 4,
          averageRating: 4.9,
          profileViews: 1567
        }
      },
      {
        name: 'Julie Bernard',
        email: 'julie.bernard@taphair.com',
        password: 'Password123!',
        role: 'coiffeur',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        bio: 'Spécialiste du brushing et du volume. Plus de 6 ans d\'expérience.',
        phone: '0612345681',
        address: {
          street: '42 boulevard de la Mer',
          city: 'Marseille',
          postalCode: '13001',
          coordinates: {
            lat: 43.2965,
            lng: 5.3698
          }
        },
        siren: '789123456',
        sirenStatus: 'verified',
        sirenVerificationDate: new Date('2024-01-20'),
        specialities: ['Brushing', 'Volume', 'Mouvement'],
        rating: 4.7,
        totalRatings: 29,
        workingMode: ['salon', 'domicile'],
        workingHours: {
          monday: { start: '09:00', end: '19:00', isAvailable: true },
          tuesday: { start: '09:00', end: '19:00', isAvailable: true },
          wednesday: { start: '09:00', end: '19:00', isAvailable: true },
          thursday: { start: '09:00', end: '19:00', isAvailable: true },
          friday: { start: '09:00', end: '19:00', isAvailable: true },
          saturday: { start: '10:00', end: '17:00', isAvailable: true },
          sunday: { start: '10:00', end: '17:00', isAvailable: false }
        },
        travelRadius: 18,
        likes: 73,
        stats: {
          totalBookings: 67,
          completedBookings: 65,
          cancelledBookings: 2,
          averageRating: 4.7,
          profileViews: 456
        }
      },
      {
        name: 'Thomas Moreau',
        email: 'thomas.moreau@taphair.com',
        password: 'Password123!',
        role: 'coiffeur',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        bio: 'Spécialiste des coupes homme classiques et modernes. Plus de 10 ans d\'expérience.',
        phone: '0612345682',
        address: {
          street: '7 place du Capitole',
          city: 'Toulouse',
          postalCode: '31000',
          coordinates: {
            lat: 43.6047,
            lng: 1.4442
          }
        },
        siren: '321654987',
        sirenStatus: 'verified',
        sirenVerificationDate: new Date('2024-02-15'),
        specialities: ['Coupe homme', 'Classique', 'Élégant'],
        rating: 4.6,
        totalRatings: 42,
        workingMode: ['salon', 'domicile'],
        workingHours: {
          monday: { start: '09:00', end: '19:00', isAvailable: true },
          tuesday: { start: '09:00', end: '19:00', isAvailable: true },
          wednesday: { start: '09:00', end: '19:00', isAvailable: true },
          thursday: { start: '09:00', end: '19:00', isAvailable: true },
          friday: { start: '09:00', end: '19:00', isAvailable: true },
          saturday: { start: '10:00', end: '17:00', isAvailable: true },
          sunday: { start: '10:00', end: '17:00', isAvailable: false }
        },
        travelRadius: 22,
        likes: 88,
        stats: {
          totalBookings: 123,
          completedBookings: 120,
          cancelledBookings: 3,
          averageRating: 4.6,
          profileViews: 789
        }
      },
      {
        name: 'Camille Rousseau',
        email: 'camille.rousseau@taphair.com',
        password: 'Password123!',
        role: 'coiffeur',
        photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        bio: 'Experte en lissage et soins capillaires. Plus de 15 ans d\'expérience.',
        phone: '0612345683',
        address: {
          street: '23 quai de la Fosse',
          city: 'Nantes',
          postalCode: '44000',
          coordinates: {
            lat: 47.2184,
            lng: -1.5536
          }
        },
        siren: '654987321',
        sirenStatus: 'verified',
        sirenVerificationDate: new Date('2024-01-10'),
        specialities: ['Lissage', 'Brésilien', 'Lisse'],
        rating: 4.9,
        totalRatings: 89,
        workingMode: ['salon', 'domicile'],
        workingHours: {
          monday: { start: '09:00', end: '19:00', isAvailable: true },
          tuesday: { start: '09:00', end: '19:00', isAvailable: true },
          wednesday: { start: '09:00', end: '19:00', isAvailable: true },
          thursday: { start: '09:00', end: '19:00', isAvailable: true },
          friday: { start: '09:00', end: '19:00', isAvailable: true },
          saturday: { start: '10:00', end: '17:00', isAvailable: true },
          sunday: { start: '10:00', end: '17:00', isAvailable: false }
        },
        travelRadius: 30,
        likes: 234,
        stats: {
          totalBookings: 345,
          completedBookings: 340,
          cancelledBookings: 5,
          averageRating: 4.9,
          profileViews: 2345
        }
      },
      {
        name: 'Léa Dubois',
        email: 'lea.dubois@taphair.com',
        password: 'Password123!',
        role: 'coiffeur',
        photo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&h=150&fit=crop&crop=face',
        bio: 'Spécialiste des extensions et transformations capillaires. Plus de 8 ans d\'expérience.',
        phone: '0612345684',
        address: {
          street: '12 rue des Orfèvres',
          city: 'Strasbourg',
          postalCode: '67000',
          coordinates: {
            lat: 48.5734,
            lng: 7.7521
          }
        },
        siren: '147258369',
        sirenStatus: 'verified',
        sirenVerificationDate: new Date('2024-02-20'),
        specialities: ['Extension', 'Naturel', 'Discrétion'],
        rating: 4.8,
        totalRatings: 56,
        workingMode: ['salon', 'domicile'],
        workingHours: {
          monday: { start: '09:00', end: '19:00', isAvailable: true },
          tuesday: { start: '09:00', end: '19:00', isAvailable: true },
          wednesday: { start: '09:00', end: '19:00', isAvailable: true },
          thursday: { start: '09:00', end: '19:00', isAvailable: true },
          friday: { start: '09:00', end: '19:00', isAvailable: true },
          saturday: { start: '10:00', end: '17:00', isAvailable: true },
          sunday: { start: '10:00', end: '17:00', isAvailable: false }
        },
        travelRadius: 28,
        likes: 167,
        stats: {
          totalBookings: 178,
          completedBookings: 175,
          cancelledBookings: 3,
          averageRating: 4.8,
          profileViews: 1234
        }
      }
    ];

    // Créer ou mettre à jour les coiffeurs
    const coiffeursCrees = [];
    for (const coiffeurData of nouveauxCoiffeurs) {
      const existingCoiffeur = await User.findOne({ email: coiffeurData.email });
      
      if (existingCoiffeur) {
        console.log(`ℹ️ Coiffeur existant: ${coiffeurData.name}`);
        coiffeursCrees.push(existingCoiffeur);
      } else {
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(coiffeurData.password, 12);
        coiffeurData.password = hashedPassword;
        
        const newCoiffeur = new User(coiffeurData);
        await newCoiffeur.save();
        console.log(`✅ Coiffeur créé: ${coiffeurData.name}`);
        coiffeursCrees.push(newCoiffeur);
      }
    }

    // 3. Créer les services pour chaque coiffeur
    console.log('\n💇 Création des services...');
    
    // D'abord, supprimer les anciens services avec photos Unsplash
    console.log('🗑️ Suppression des anciens services avec photos Unsplash...');
    const servicesToDelete = await Service.find({
      'gallery.photoUrl': { $regex: 'unsplash', $options: 'i' }
    });
    
    for (const service of servicesToDelete) {
      await Service.findByIdAndDelete(service._id);
      console.log(`✅ Service supprimé: ${service.name}`);
    }
    
    const servicesData = [
      {
        name: 'Coupe Moderne Femme',
        description: 'Coupe tendance avec dégradé moderne, adaptée à votre visage et à votre style de vie.',
        price: 45,
        duration: 60,
        category: 'coupe',
        style: 'moderne',
        targetAudience: ['femme'],
        // Utiliser les vraies photos existantes de Marie Dubois
        examplePhotos: ['/uploads/services/service-6839ca0936ec3cfc09c649f7-1754309684774-2d47nimqhnc.jpg'],
        gallery: [{
          photoUrl: '/uploads/services/service-6839ca0936ec3cfc09c649f7-1754309684774-2d47nimqhnc.jpg',
          caption: 'Coupe moderne avec volume',
          tags: ['moderne', 'volume', 'tendance'],
          likes: 24,
          createdAt: new Date()
        }],
        likes: 24,
        views: 156,
        popularityScore: 85,
        isVerified: true
      },
      {
        name: 'Coloration Balayage',
        description: 'Balayage naturel et lumineux, technique professionnelle pour un effet soleil naturel.',
        price: 120,
        duration: 150,
        category: 'coloration',
        style: 'tendance',
        targetAudience: ['femme'],
        // Utiliser les vraies photos existantes de Marie Dubois
        examplePhotos: ['/uploads/services/service-6839ca0936ec3cfc09c649f8-1754309563571-d1aiqa2xyds.jpg'],
        gallery: [{
          photoUrl: '/uploads/services/service-6839ca0936ec3cfc09c649f8-1754309563571-d1aiqa2xyds.jpg',
          caption: 'Balayage doré naturel',
          tags: ['balayage', 'doré', 'naturel'],
          likes: 31,
          createdAt: new Date()
        }],
        likes: 31,
        views: 203,
        popularityScore: 92,
        isVerified: true
      },
      {
        name: 'Brushing Volume',
        description: 'Brushing avec volume et mouvement, pour un style glamour et volumineux.',
        price: 35,
        duration: 45,
        category: 'brushing',
        style: 'classique',
        targetAudience: ['femme'],
        // Utiliser les vraies photos existantes de Marie Dubois
        examplePhotos: ['/uploads/services/service-6839ca0936ec3cfc09c649f7-1754309684774-2d47nimqhnc.jpg'],
        gallery: [{
          photoUrl: '/uploads/services/service-6839ca0936ec3cfc09c649f7-1754309684774-2d47nimqhnc.jpg',
          caption: 'Brushing volume naturel',
          tags: ['brushing', 'volume', 'naturel'],
          likes: 18,
          createdAt: new Date()
        }],
        likes: 18,
        views: 98,
        popularityScore: 78,
        isVerified: true
      },
      {
        name: 'Coupe Homme Classique',
        description: 'Coupe homme élégante et raffinée, pour un look professionnel et soigné.',
        price: 30,
        duration: 30,
        category: 'coupe',
        style: 'classique',
        targetAudience: ['homme'],
        // Utiliser les vraies photos existantes de Pierre Martin
        examplePhotos: ['/uploads/services/service-6839ca0936ec3cfc09c649fc-1754310098383-w7hgqpo3.jpg'],
        gallery: [{
          photoUrl: '/uploads/services/service-6839ca0936ec3cfc09c649fc-1754310098383-w7hgqpo3.jpg',
          caption: 'Coupe homme classique',
          tags: ['homme', 'classique', 'élégant'],
          likes: 22,
          createdAt: new Date()
        }],
        likes: 22,
        views: 134,
        popularityScore: 81,
        isVerified: true
      },
      {
        name: 'Lissage Brésilien',
        description: 'Lissage lisse et brillant, pour des cheveux soyeux et faciles à coiffer.',
        price: 150,
        duration: 180,
        category: 'lissage',
        style: 'moderne',
        targetAudience: ['femme'],
        // Utiliser les vraies photos existantes de Marie Dubois
        examplePhotos: ['/uploads/services/service-6839ca0936ec3cfc09c649f8-1754309563571-d1aiqa2xyds.jpg'],
        gallery: [{
          photoUrl: '/uploads/services/service-6839ca0936ec3cfc09c649f8-1754309563571-d1aiqa2xyds.jpg',
          caption: 'Lissage brésilien brillant',
          tags: ['lissage', 'brésilien', 'brillant'],
          likes: 28,
          createdAt: new Date()
        }],
        likes: 28,
        views: 187,
        popularityScore: 89,
        isVerified: true
      },
      {
        name: 'Extension Cheveux',
        description: 'Extensions naturelles et discrètes, pour plus de volume et de longueur.',
        price: 200,
        duration: 240,
        category: 'autre', // Changé de 'extension' à 'autre' car pas dans l'enum
        style: 'moderne',
        targetAudience: ['femme'],
        // Utiliser les vraies photos existantes de Marie Dubois
        examplePhotos: ['/uploads/services/service-6839ca0936ec3cfc09c649f7-1754309684774-2d47nimqhnc.jpg'],
        gallery: [{
          photoUrl: '/uploads/services/service-6839ca0936ec3cfc09c649f7-1754309684774-2d47nimqhnc.jpg',
          caption: 'Extensions naturelles',
          tags: ['extension', 'naturel', 'discrétion'],
          likes: 35,
          createdAt: new Date()
        }],
        likes: 35,
        views: 245,
        popularityScore: 94,
        isVerified: true
      }
    ];

    // Associer les services aux coiffeurs
    for (let i = 0; i < servicesData.length; i++) {
      const serviceData = servicesData[i];
      const coiffeur = coiffeursCrees[i];
      
      // Vérifier si le service existe déjà
      const existingService = await Service.findOne({ 
        name: serviceData.name, 
        coiffeur: coiffeur._id 
      });
      
      if (!existingService) {
        // Récupérer les spécialités correspondantes
        const specialites = await GlobalSpecialty.find({
          name: { $in: coiffeur.specialities }
        });
        
        serviceData.coiffeur = coiffeur._id;
        serviceData.specialities = specialites.map(spec => ({
          specialtyId: spec._id,
          expertiseLevel: 4
        }));
        
        const newService = new Service(serviceData);
        await newService.save();
        console.log(`✅ Service créé: ${serviceData.name} pour ${coiffeur.name}`);
      } else {
        console.log(`ℹ️ Service existant: ${serviceData.name} pour ${coiffeur.name}`);
      }
    }

    console.log('\n🎉 Fusion des données terminée avec succès!');
    console.log(`✅ ${coiffeursCrees.length} coiffeurs disponibles`);
    console.log(`✅ ${servicesData.length} services créés`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la fusion:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

fusionDonneesTest();
