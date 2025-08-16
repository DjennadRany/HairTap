import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';

const completerComptesCoiffeurs = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Récupérer Marie Dubois (compte complet de référence)
    console.log('\n🔍 Récupération de Marie Dubois (compte de référence)...');
    const marieDubois = await User.findOne({ 
      email: 'marie.dubois@taphair.com' 
    }).select('-password');

    if (!marieDubois) {
      console.log('❌ Marie Dubois non trouvée');
      return;
    }

    console.log(`✅ Marie Dubois trouvée: ${marieDubois.name}`);

    // 2. Récupérer les nouveaux coiffeurs
    console.log('\n🔍 Récupération des nouveaux coiffeurs...');
    const nouveauxCoiffeurs = await User.find({
      email: {
        $in: [
          'sophie.martin@taphair.com',
          'julie.bernard@taphair.com',
          'thomas.moreau@taphair.com',
          'camille.rousseau@taphair.com',
          'lea.dubois@taphair.com'
        ]
      }
    });

    console.log(`📊 Nouveaux coiffeurs trouvés: ${nouveauxCoiffeurs.length}`);

    // 3. Données aléatoires pour chaque coiffeur (STRUCTURE CORRIGÉE)
    const donneesAleatoires = [
      {
        // Sophie Martin
        salonAddress: {
          street: '15 Rue de la Paix',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
          coordinates: { lat: 48.8566, lng: 2.3522 }, // lat/lng au lieu de latitude/longitude
          openingHours: { // openingHours au lieu de workingHours
            monday: { open: '09:00', close: '18:00', closed: false },
            tuesday: { open: '09:00', close: '18:00', closed: false },
            wednesday: { open: '09:00', close: '18:00', closed: false },
            thursday: { open: '09:00', close: '18:00', closed: false },
            friday: { open: '09:00', close: '18:00', closed: false },
            saturday: { open: '09:00', close: '17:00', closed: false },
            sunday: { open: '10:00', close: '16:00', closed: true }
          }
        },
        workingMode: ['salon', 'domicile'],
        description: 'Coiffeuse passionnée spécialisée dans les coupes modernes et les colorations tendance.',
        phone: '+33 1 42 86 15 23',
        website: 'https://sophie-martin-coiffure.fr',
        socialMedia: {
          instagram: '@sophie_martin_coiffure',
          facebook: 'Sophie Martin Coiffure'
        },
        certifications: ['CAP Coiffure', 'Formation L\'Oréal'],
        experience: 8,
        education: 'École de Coiffure de Paris',
        languages: ['Français', 'Anglais'],
        stats: {
          totalClients: 1250,
          totalBookings: 3400,
          averageRating: 4.8
        },
        likes: 89,
        connectionStatus: {
          isOnline: true,
          lastSeen: new Date(),
          status: 'available',
          availability: {
            isAvailable: true,
            nextAvailable: new Date()
          }
        },
        isVerified: true,
        isActive: true
      },
      {
        // Julie Bernard
        salonAddress: {
          street: '28 Avenue des Champs-Élysées',
          city: 'Paris',
          postalCode: '75008',
          country: 'France',
          coordinates: { lat: 48.8698, lng: 2.3077 },
          openingHours: {
            monday: { open: '10:00', close: '19:00', closed: false },
            tuesday: { open: '10:00', close: '19:00', closed: false },
            wednesday: { open: '10:00', close: '19:00', closed: false },
            thursday: { open: '10:00', close: '19:00', closed: false },
            friday: { open: '10:00', close: '19:00', closed: false },
            saturday: { open: '10:00', close: '18:00', closed: false },
            sunday: { open: '11:00', close: '17:00', closed: true }
          }
        },
        workingMode: ['salon'],
        description: 'Spécialiste des coiffures de mariage et des événements spéciaux.',
        phone: '+33 1 45 62 78 91',
        website: 'https://julie-bernard-coiffure.fr',
        socialMedia: {
          instagram: '@julie_bernard_coiffure',
          facebook: 'Julie Bernard Coiffure'
        },
        certifications: ['CAP Coiffure', 'Formation Coiffures de Mariage'],
        experience: 12,
        education: 'Institut de Coiffure de Lyon',
        languages: ['Français', 'Anglais', 'Espagnol'],
        stats: {
          totalClients: 2100,
          totalBookings: 5800,
          averageRating: 4.9
        },
        likes: 156,
        connectionStatus: {
          isOnline: false,
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
          status: 'offline',
          availability: {
            isAvailable: false,
            nextAvailable: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8h from now
          }
        },
        isVerified: true,
        isActive: true
      },
      {
        // Thomas Moreau
        salonAddress: {
          street: '7 Rue du Commerce',
          city: 'Lyon',
          postalCode: '69001',
          country: 'France',
          coordinates: { lat: 45.7578, lng: 4.8320 },
          openingHours: {
            monday: { open: '08:00', close: '17:00', closed: false },
            tuesday: { open: '08:00', close: '17:00', closed: false },
            wednesday: { open: '08:00', close: '17:00', closed: false },
            thursday: { open: '08:00', close: '17:00', closed: false },
            friday: { open: '08:00', close: '17:00', closed: false },
            saturday: { open: '08:00', close: '16:00', closed: false },
            sunday: { open: '09:00', close: '15:00', closed: true }
          }
        },
        workingMode: ['domicile', 'salon'],
        description: 'Coiffeur à domicile spécialisé dans les coupes hommes et les soins capillaires.',
        phone: '+33 4 78 28 45 67',
        website: 'https://thomas-moreau-coiffure.fr',
        socialMedia: {
          instagram: '@thomas_moreau_coiffure',
          facebook: 'Thomas Moreau Coiffure'
        },
        certifications: ['CAP Coiffure', 'Formation Soins Capillaires'],
        experience: 6,
        education: 'École de Coiffure de Lyon',
        languages: ['Français', 'Anglais'],
        stats: {
          totalClients: 890,
          totalBookings: 2100,
          averageRating: 4.7
        },
        likes: 67,
        connectionStatus: {
          isOnline: true,
          lastSeen: new Date(),
          status: 'available',
          availability: {
            isAvailable: true,
            nextAvailable: new Date()
          }
        },
        isVerified: true,
        isActive: true
      },
      {
        // Camille Rousseau
        salonAddress: {
          street: '42 Boulevard de la Croix-Rousse',
          city: 'Lyon',
          postalCode: '69004',
          country: 'France',
          coordinates: { lat: 45.7797, lng: 4.8206 },
          openingHours: {
            monday: { open: '09:30', close: '18:30', closed: false },
            tuesday: { open: '09:30', close: '18:30', closed: false },
            wednesday: { open: '09:30', close: '18:30', closed: false },
            thursday: { open: '09:30', close: '18:30', closed: false },
            friday: { open: '09:30', close: '18:30', closed: false },
            saturday: { open: '09:30', close: '17:30', closed: false },
            sunday: { open: '10:30', close: '16:30', closed: true }
          }
        },
        workingMode: ['salon'],
        description: 'Coloriste créative spécialisée dans les balayages et les couleurs fashion.',
        phone: '+33 4 72 34 56 78',
        website: 'https://camille-rousseau-coiffure.fr',
        socialMedia: {
          instagram: '@camille_rousseau_coiffure',
          facebook: 'Camille Rousseau Coiffure'
        },
        certifications: ['CAP Coiffure', 'Formation L\'Oréal Couleur'],
        experience: 10,
        education: 'Institut de Coiffure de Paris',
        languages: ['Français', 'Anglais', 'Italien'],
        stats: {
          totalClients: 1680,
          totalBookings: 4200,
          averageRating: 4.8
        },
        likes: 134,
        connectionStatus: {
          isOnline: false,
          lastSeen: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1h ago
          status: 'offline',
          availability: {
            isAvailable: false,
            nextAvailable: new Date(Date.now() + 7 * 60 * 60 * 1000) // 7h from now
          }
        },
        isVerified: true,
        isActive: true
      },
      {
        // Léa Dubois
        salonAddress: {
          street: '19 Rue de la République',
          city: 'Marseille',
          postalCode: '13001',
          country: 'France',
          coordinates: { lat: 43.2965, lng: 5.3698 },
          openingHours: {
            monday: { open: '08:30', close: '17:30', closed: false },
            tuesday: { open: '08:30', close: '17:30', closed: false },
            wednesday: { open: '08:30', close: '17:30', closed: false },
            thursday: { open: '08:30', close: '17:30', closed: false },
            friday: { open: '08:30', close: '17:30', closed: false },
            saturday: { open: '08:30', close: '16:30', closed: false },
            sunday: { open: '09:30', close: '15:30', closed: true }
          }
        },
        workingMode: ['domicile'],
        description: 'Coiffeuse à domicile spécialisée dans les soins et les traitements capillaires.',
        phone: '+33 4 91 23 45 67',
        website: 'https://lea-dubois-coiffure.fr',
        socialMedia: {
          instagram: '@lea_dubois_coiffure',
          facebook: 'Léa Dubois Coiffure'
        },
        certifications: ['CAP Coiffure', 'Formation Soins et Traitements'],
        experience: 7,
        education: 'École de Coiffure de Marseille',
        languages: ['Français', 'Anglais', 'Arabe'],
        stats: {
          totalClients: 1120,
          totalBookings: 2800,
          averageRating: 4.6
        },
        likes: 78,
        connectionStatus: {
          isOnline: true,
          lastSeen: new Date(),
          status: 'available',
          availability: {
            isAvailable: true,
            nextAvailable: new Date()
          }
        },
        isVerified: true,
        isActive: true
      }
    ];

    // 4. Compléter chaque nouveau coiffeur
    console.log('\n🔧 Complétion des comptes coiffeurs...');
    
    for (let i = 0; i < nouveauxCoiffeurs.length; i++) {
      const coiffeur = nouveauxCoiffeurs[i];
      const donnees = donneesAleatoires[i];
      
      console.log(`\n🔧 Complétion de ${coiffeur.name}...`);
      
      // Mettre à jour avec les données aléatoires
      const updateData = {
        ...donnees,
        rating: Math.floor(Math.random() * 20) + 40, // 4.0 à 5.9
        totalRatings: Math.floor(Math.random() * 200) + 50, // 50 à 250 avis
        updatedAt: new Date()
      };
      
      // Mettre à jour le coiffeur
      await User.findByIdAndUpdate(coiffeur._id, updateData, { new: true });
      
      console.log(`✅ ${coiffeur.name} complété avec succès`);
      console.log(`   - Adresse: ${donnees.salonAddress.city}`);
      console.log(`   - Mode: ${donnees.workingMode.join(', ')}`);
      console.log(`   - Expérience: ${donnees.experience} ans`);
      console.log(`   - Rating: ${updateData.rating / 10}`);
    }

    // 5. Vérification finale
    console.log('\n🔍 Vérification finale...');
    const coiffeursCompletes = await User.find({
      email: {
        $in: [
          'sophie.martin@taphair.com',
          'julie.bernard@taphair.com',
          'thomas.moreau@taphair.com',
          'camille.rousseau@taphair.com',
          'lea.dubois@taphair.com'
        ]
      }
    }).select('name email salonAddress workingMode rating specialities');

    coiffeursCompletes.forEach(coiffeur => {
      console.log(`\n${coiffeur.name}:`);
      console.log(`   - Adresse: ${coiffeur.salonAddress?.city || 'N/A'}`);
      console.log(`   - Coordonnées: ${coiffeur.salonAddress?.coordinates ? '✅' : '❌'}`);
      console.log(`   - Horaires: ${coiffeur.salonAddress?.openingHours ? '✅' : '❌'}`);
      console.log(`   - Mode: ${coiffeur.workingMode?.join(', ') || 'N/A'}`);
      console.log(`   - Rating: ${coiffeur.rating ? coiffeur.rating / 10 : 'N/A'}`);
      console.log(`   - Spécialités: ${coiffeur.specialities?.length || 0}`);
    });

    console.log('\n🎉 Tous les comptes coiffeurs ont été complétés avec succès !');
    console.log('🚀 Prêt pour tester le module de filtres de recherche !');
    console.log('🗺️ Les cartes et horaires devraient maintenant s\'afficher correctement !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

completerComptesCoiffeurs();
