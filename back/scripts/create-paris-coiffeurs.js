import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Service from '../models/Service.js';
import WorkingSlot from '../models/WorkingSlot.js';

/**
 * Script pour créer 10 coiffeurs à Paris et Île-de-France
 * Basé sur la structure de Marie Dubois (compte de référence)
 */
const createParisCoiffeurs = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    // Récupérer Marie Dubois comme référence
    const marieDubois = await User.findOne({ email: 'marie.dubois@taphair.com' });
    if (!marieDubois) {
      console.log('❌ Marie Dubois non trouvée. Impossible de créer les coiffeurs de référence.');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log('✅ Marie Dubois trouvée comme référence');
    
    // ✅ CORRECTION: Récupérer les services de Marie Dubois pour utiliser leurs photos
    const marieServices = await Service.find({ coiffeur: marieDubois._id }).limit(10);
    console.log(`✅ ${marieServices.length} services de Marie Dubois trouvés comme référence`);
    
    // Créer un mapping des catégories vers les services/photos
    const servicePhotosByCategory = {};
    marieServices.forEach(service => {
      const category = service.category || 'autre';
      if (!servicePhotosByCategory[category]) {
        servicePhotosByCategory[category] = [];
      }
      // Utiliser les photos de la galerie si disponibles, sinon examplePhotos
      const photos = service.gallery && service.gallery.length > 0
        ? service.gallery.map(g => g.mediaUrl).filter(Boolean)
        : (service.examplePhotos || []).filter(Boolean);
      if (photos.length > 0) {
        servicePhotosByCategory[category].push(...photos);
      }
    });
    
    // Coordonnées Paris et Île-de-France
    const parisCoords = [
      { lat: 48.8566, lng: 2.3522, city: 'Paris', arrondissement: '1er' },
      { lat: 48.8606, lng: 2.3376, city: 'Paris', arrondissement: '2e' },
      { lat: 48.8630, lng: 2.3444, city: 'Paris', arrondissement: '3e' },
      { lat: 48.8556, lng: 2.3522, city: 'Paris', arrondissement: '4e' },
      { lat: 48.8444, lng: 2.3408, city: 'Paris', arrondissement: '5e' },
      { lat: 48.8444, lng: 2.3408, city: 'Paris', arrondissement: '6e' },
      { lat: 48.8566, lng: 2.3194, city: 'Paris', arrondissement: '7e' },
      { lat: 48.8846, lng: 2.3186, city: 'Paris', arrondissement: '8e' },
      { lat: 48.8800, lng: 2.3300, city: 'Paris', arrondissement: '9e' },
      { lat: 48.8765, lng: 2.3594, city: 'Paris', arrondissement: '10e' },
    ];
    
    const coiffeursData = [
      {
        name: 'Sophie Laurent',
        email: 'sophie.laurent@taphair.com',
        arrondissement: '1er',
        specialities: ['coupe', 'coloration', 'brushing'],
        workingMode: ['salon', 'domicile'],
        photo: marieDubois.photo || '/default-avatar.png'
      },
      {
        name: 'Julien Moreau',
        email: 'julien.moreau@taphair.com',
        arrondissement: '2e',
        specialities: ['coupe', 'barbe', 'soin'],
        workingMode: ['salon'],
        photo: marieDubois.photo || '/default-avatar.png'
      },
      {
        name: 'Emma Bernard',
        email: 'emma.bernard@taphair.com',
        arrondissement: '3e',
        specialities: ['coupe', 'lissage', 'extension'],
        workingMode: ['salon', 'domicile'],
        photo: marieDubois.photo || '/default-avatar.png'
      },
      {
        name: 'Thomas Petit',
        email: 'thomas.petit@taphair.com',
        arrondissement: '4e',
        specialities: ['coupe', 'coloration', 'brushing'],
        workingMode: ['salon'],
        photo: marieDubois.photo || '/default-avatar.png'
      },
      {
        name: 'Léa Martin',
        email: 'lea.martin@taphair.com',
        arrondissement: '5e',
        specialities: ['coupe', 'permanente', 'soin'],
        workingMode: ['salon', 'domicile'],
        photo: marieDubois.photo || '/default-avatar.png'
      },
      {
        name: 'Antoine Rousseau',
        email: 'antoine.rousseau@taphair.com',
        arrondissement: '6e',
        specialities: ['coupe', 'barbe', 'soin'],
        workingMode: ['salon'],
        photo: marieDubois.photo || '/default-avatar.png'
      },
      {
        name: 'Camille Dubois',
        email: 'camille.dubois@taphair.com',
        arrondissement: '7e',
        specialities: ['coupe', 'coloration', 'lissage'],
        workingMode: ['salon', 'domicile'],
        photo: marieDubois.photo || '/default-avatar.png'
      },
      {
        name: 'Maxime Lefebvre',
        email: 'maxime.lefebvre@taphair.com',
        arrondissement: '8e',
        specialities: ['coupe', 'barbe', 'brushing'],
        workingMode: ['salon'],
        photo: marieDubois.photo || '/default-avatar.png'
      },
      {
        name: 'Clara Simon',
        email: 'clara.simon@taphair.com',
        arrondissement: '9e',
        specialities: ['coupe', 'coloration', 'extension'],
        workingMode: ['salon', 'domicile'],
        photo: marieDubois.photo || '/default-avatar.png'
      },
      {
        name: 'Nicolas Girard',
        email: 'nicolas.girard@taphair.com',
        arrondissement: '10e',
        specialities: ['coupe', 'barbe', 'soin'],
        workingMode: ['salon'],
        photo: marieDubois.photo || '/default-avatar.png'
      }
    ];
    
    const password = await bcrypt.hash('password123', 10);
    let createdCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < coiffeursData.length; i++) {
      const coiffeurData = coiffeursData[i];
      const coords = parisCoords[i];
      
      // Vérifier si le coiffeur existe déjà
      const existing = await User.findOne({ email: coiffeurData.email });
      if (existing) {
        console.log(`⏭️  ${coiffeurData.name} existe déjà. Passage au suivant...`);
        skippedCount++;
        continue;
      }
      
      // Créer le coiffeur avec la même structure que Marie Dubois
      const newCoiffeur = new User({
        name: coiffeurData.name,
        email: coiffeurData.email,
        password: password,
        role: 'coiffeur',
        photo: coiffeurData.photo,
        bio: `Coiffeur professionnel dans le ${coords.arrondissement} arrondissement de Paris. Spécialisé en ${coiffeurData.specialities.join(', ')}.`,
        phone: `+33 6 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)}`,
        address: {
          street: `${Math.floor(Math.random() * 200 + 1)} Rue de la République`,
          streetNumber: `${Math.floor(Math.random() * 200 + 1)}`,
          city: coords.city,
          postalCode: `7500${i + 1}`,
          coordinates: {
            lat: coords.lat + (Math.random() * 0.01 - 0.005), // Variation légère
            lng: coords.lng + (Math.random() * 0.01 - 0.005)
          }
        },
        salonAddress: {
          street: `${Math.floor(Math.random() * 200 + 1)} Rue de la République`,
          streetNumber: `${Math.floor(Math.random() * 200 + 1)}`,
          city: coords.city,
          postalCode: `7500${i + 1}`,
          phone: `+33 1 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)}`,
          coordinates: {
            lat: coords.lat + (Math.random() * 0.01 - 0.005),
            lng: coords.lng + (Math.random() * 0.01 - 0.005)
          },
          openingHours: {
            monday: { open: '09:00', close: '18:00', closed: false },
            tuesday: { open: '09:00', close: '18:00', closed: false },
            wednesday: { open: '09:00', close: '18:00', closed: false },
            thursday: { open: '09:00', close: '18:00', closed: false },
            friday: { open: '09:00', close: '18:00', closed: false },
            saturday: { open: '09:00', close: '17:00', closed: false },
            sunday: { open: '10:00', close: '16:00', closed: false }
          }
        },
        specialities: coiffeurData.specialities,
        workingMode: coiffeurData.workingMode,
        travelRadius: coiffeurData.workingMode.includes('domicile') ? 15 : 0,
        siren: `${Math.floor(Math.random() * 900000000 + 100000000)}`,
        sirenStatus: 'verified',
        experience: Math.floor(Math.random() * 15 + 5),
        formation: 'École de coiffure professionnelle',
        rating: 4.0 + Math.random() * 1.0, // Entre 4.0 et 5.0
        totalRatings: Math.floor(Math.random() * 50 + 10),
        isAvailable: true,
        isVerified: true,
        connectionStatus: {
          isOnline: Math.random() > 0.5,
          lastSeen: new Date(),
          status: Math.random() > 0.5 ? 'online' : 'offline'
        },
        workingHours: {
          monday: { start: '09:00', end: '18:00', isAvailable: true },
          tuesday: { start: '09:00', end: '18:00', isAvailable: true },
          wednesday: { start: '09:00', end: '18:00', isAvailable: true },
          thursday: { start: '09:00', end: '18:00', isAvailable: true },
          friday: { start: '09:00', end: '18:00', isAvailable: true },
          saturday: { start: '09:00', end: '17:00', isAvailable: true },
          sunday: { start: '10:00', end: '16:00', isAvailable: false }
        },
        stats: {
          totalBookings: Math.floor(Math.random() * 100 + 20),
          completedBookings: Math.floor(Math.random() * 80 + 15),
          cancelledBookings: Math.floor(Math.random() * 10 + 1),
          averageRating: 4.0 + Math.random() * 1.0,
          profileViews: Math.floor(Math.random() * 500 + 100)
        },
        likes: Math.floor(Math.random() * 50 + 10),
        isActive: true,
        emailVerified: true
      });
      
      await newCoiffeur.save();
      console.log(`✅ ${coiffeurData.name} créé (${coords.arrondissement} arrondissement)`);
      
      // Créer des services pour ce coiffeur (comme Marie Dubois)
      const servicesData = [
        { name: 'Coupe femme', price: 35 + Math.floor(Math.random() * 15), duration: 45, category: 'coupe' },
        { name: 'Coupe homme', price: 25 + Math.floor(Math.random() * 10), duration: 30, category: 'coupe' },
        { name: 'Coloration complète', price: 60 + Math.floor(Math.random() * 30), duration: 120, category: 'coloration' },
        { name: 'Brushing', price: 20 + Math.floor(Math.random() * 10), duration: 30, category: 'brushing' },
        { name: 'Lissage brésilien', price: 80 + Math.floor(Math.random() * 40), duration: 180, category: 'lissage' }
      ];
      
      for (const serviceData of servicesData) {
        // Vérifier si le service existe déjà
        const existingService = await Service.findOne({
          coiffeur: newCoiffeur._id,
          name: serviceData.name
        });
        
        if (!existingService) {
          // ✅ CORRECTION: Utiliser les photos des services existants de Marie Dubois selon la catégorie
          const categoryPhotos = servicePhotosByCategory[serviceData.category] || [];
          const defaultPhoto = categoryPhotos.length > 0 
            ? categoryPhotos[Math.floor(Math.random() * categoryPhotos.length)]
            : (marieServices[0]?.gallery?.[0]?.mediaUrl || marieServices[0]?.examplePhotos?.[0] || marieDubois.photo || '/default-service.jpg');
          
          const service = new Service({
            coiffeur: newCoiffeur._id,
            name: serviceData.name,
            description: `Service ${serviceData.name} par ${coiffeurData.name}`,
            price: serviceData.price,
            duration: serviceData.duration,
            category: serviceData.category,
            isActive: true,
            examplePhotos: [defaultPhoto],
            gallery: [{
              mediaUrl: defaultPhoto,
              mediaType: 'image',
              caption: serviceData.name,
              tags: coiffeurData.specialities,
              likes: Math.floor(Math.random() * 20 + 5),
              createdAt: new Date()
            }],
            likes: Math.floor(Math.random() * 20 + 5),
            views: Math.floor(Math.random() * 100 + 20),
            popularityScore: Math.random() * 100
          });
          
          await service.save();
        }
      }
      
      // Créer des working slots pour ce coiffeur
      const slotsToCreate = [];
      
      // Lundi-Vendredi (1-5): 9h-18h
      for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
        slotsToCreate.push({
          coiffeurId: newCoiffeur._id,
          dayOfWeek,
          startTime: 9,
          endTime: 18,
          serviceTypes: coiffeurData.specialities,
          availableAt: coiffeurData.workingMode.includes('domicile') ? 'both' : 'salon',
          status: 'available',
          maxBookings: 3,
          currentBookings: 0,
          isRecurring: true,
          exceptions: []
        });
      }
      
      // Samedi (6): 9h-17h
      slotsToCreate.push({
        coiffeurId: newCoiffeur._id,
        dayOfWeek: 6,
        startTime: 9,
        endTime: 17,
        serviceTypes: coiffeurData.specialities,
        availableAt: coiffeurData.workingMode.includes('domicile') ? 'both' : 'salon',
        status: 'available',
        maxBookings: 3,
        currentBookings: 0,
        isRecurring: true,
        exceptions: []
      });
      
      await WorkingSlot.insertMany(slotsToCreate);
      console.log(`  ✅ ${slotsToCreate.length} working slots créés pour ${coiffeurData.name}`);
      
      createdCount++;
    }
    
    console.log('\n📊 RÉSUMÉ:');
    console.log(`  ✅ ${createdCount} coiffeurs créés à Paris`);
    console.log(`  ⏭️  ${skippedCount} coiffeurs déjà existants (ignorés)`);
    console.log(`  📈 Total: ${createdCount + skippedCount} coiffeurs traités`);
    
    console.log('\n🎉 Création des coiffeurs parisiens terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des coiffeurs parisiens:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

// Exécuter le script
createParisCoiffeurs();

