import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

const creerServicesAvecVraiesPhotos = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Récupérer les nouveaux coiffeurs
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
    }).select('_id name email specialities');

    console.log(`📊 Nouveaux coiffeurs trouvés: ${nouveauxCoiffeurs.length}`);

    // 2. Récupérer les spécialités globales
    console.log('\n🔍 Récupération des spécialités globales...');
    let GlobalSpecialty;
    try {
      GlobalSpecialty = mongoose.model('GlobalSpecialty');
    } catch (error) {
      const globalSpecialtySchema = new mongoose.Schema({
        name: { type: String, required: true, unique: true, trim: true },
        category: { type: String, enum: ['coupe', 'coloration', 'brushing', 'lissage', 'permanente', 'barbe', 'soin', 'extension', 'autre'], default: 'autre' },
        aliases: [String],
        usageCount: { type: Number, default: 0 },
        isVerified: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });
      GlobalSpecialty = mongoose.model('GlobalSpecialty', globalSpecialtySchema);
    }
    
    const specialitesGlobales = await GlobalSpecialty.find().select('_id name category');
    console.log(`📊 Spécialités globales trouvées: ${specialitesGlobales.length}`);

    // 3. Photos existantes dans la base (utiliser les vraies photos)
    const photosExistantes = [
      '/uploads/services/service-6839ca0936ec3cfc09c649f7-1754309684774-2d47nimqhnc.jpg',
      '/uploads/services/service-6839ca0936ec3cfc09c649f8-1754309405962-l5ooi921qgh.jpg',
      '/uploads/services/service-6839ca0936ec3cfc09c649f8-1754309563571-d1aiqa2xyds.jpg',
      '/uploads/services/service-6839ca0936ec3cfc09c649f8-1754309563571-d1aiqa2xyds.jpg',
      '/uploads/services/service-6839ca0936ec3cfc09c649f8-1754309563571-d1aiqa2xyds.jpg'
    ];

    // 4. Supprimer les anciens services des nouveaux coiffeurs (sans photos)
    console.log('\n🗑️ Suppression des anciens services sans photos...');
    for (const coiffeur of nouveauxCoiffeurs) {
      const anciensServices = await Service.find({ coiffeur: coiffeur._id });
      if (anciensServices.length > 0) {
        console.log(`🗑️ Suppression de ${anciensServices.length} services pour ${coiffeur.name}`);
        await Service.deleteMany({ coiffeur: coiffeur._id });
      }
    }

    // 5. Créer de nouveaux services avec de vraies photos
    console.log('\n🔧 Création de nouveaux services avec de vraies photos...');
    
    for (const coiffeur of nouveauxCoiffeurs) {
      console.log(`\n🔧 Création de services pour ${coiffeur.name}...`);
      
      // Services basés sur les spécialités du coiffeur
      const servicesACreer = [];
      
      if (coiffeur.specialities.includes('Coloration')) {
        const specialiteColoration = specialitesGlobales.find(s => s.name === 'Coloration');
        if (specialiteColoration) {
          servicesACreer.push({
            name: 'Coloration Professionnelle',
            description: 'Coloration personnalisée avec des produits de qualité professionnelle. Résultat durable et éclatant.',
            price: 85,
            category: 'coloration',
            duration: 120,
            specialities: [{
              specialtyId: specialiteColoration._id,
              expertiseLevel: 4
            }],
            examplePhotos: [photosExistantes[0]],
            gallery: [{
              photoUrl: photosExistantes[0],
              caption: 'Coloration professionnelle - Résultat éclatant',
              tags: ['coloration', 'professionnel', 'durable'],
              isBeforeAfter: false,
              likes: Math.floor(Math.random() * 50) + 20,
              createdAt: new Date()
            }],
            views: Math.floor(Math.random() * 200) + 100,
            shares: Math.floor(Math.random() * 30) + 10,
            availability: 'immédiat',
            estimatedWaitTime: 15,
            isVerified: true,
            popularityScore: Math.floor(Math.random() * 100) + 50
          });
        }
      }
      
      if (coiffeur.specialities.includes('Coupe')) {
        const specialiteCoupe = specialitesGlobales.find(s => s.name === 'Coupe');
        if (specialiteCoupe) {
          servicesACreer.push({
            name: 'Coupe et Brushing',
            description: 'Coupe personnalisée suivie d\'un brushing professionnel pour un style parfait.',
            price: 65,
            category: 'coupe',
            duration: 90,
            specialities: [{
              specialtyId: specialiteCoupe._id,
              expertiseLevel: 4
            }],
            examplePhotos: [photosExistantes[1]],
            gallery: [{
              photoUrl: photosExistantes[1],
              caption: 'Coupe et brushing - Style parfait',
              tags: ['coupe', 'brushing', 'style'],
              isBeforeAfter: false,
              likes: Math.floor(Math.random() * 50) + 20,
              createdAt: new Date()
            }],
            views: Math.floor(Math.random() * 200) + 100,
            shares: Math.floor(Math.random() * 30) + 10,
            availability: 'immédiat',
            estimatedWaitTime: 10,
            isVerified: true,
            popularityScore: Math.floor(Math.random() * 100) + 50
          });
        }
      }
      
      if (coiffeur.specialities.includes('Lissage')) {
        const specialiteLissage = specialitesGlobales.find(s => s.name === 'Lissage');
        if (specialiteLissage) {
          servicesACreer.push({
            name: 'Lissage Brésilien',
            description: 'Lissage professionnel pour des cheveux lisses et brillants. Résultat durable jusqu\'à 6 mois.',
            price: 150,
            category: 'lissage',
            duration: 180,
            specialities: [{
              specialtyId: specialiteLissage._id,
              expertiseLevel: 5
            }],
            examplePhotos: [photosExistantes[2]],
            gallery: [{
              photoUrl: photosExistantes[2],
              caption: 'Lissage brésilien - Cheveux lisses et brillants',
              tags: ['lissage', 'brésilien', 'durable'],
              isBeforeAfter: false,
              likes: Math.floor(Math.random() * 50) + 20,
              createdAt: new Date()
            }],
            views: Math.floor(Math.random() * 200) + 100,
            shares: Math.floor(Math.random() * 30) + 10,
            availability: 'immédiat',
            estimatedWaitTime: 20,
            isVerified: true,
            popularityScore: Math.floor(Math.random() * 100) + 50
          });
        }
      }
      
      if (coiffeur.specialities.includes('Extension')) {
        const specialiteExtension = specialitesGlobales.find(s => s.name === 'Extension');
        if (specialiteExtension) {
          servicesACreer.push({
            name: 'Extensions Naturelles',
            description: 'Extensions discrètes et naturelles pour plus de volume et de longueur.',
            price: 200,
            category: 'autre',
            duration: 240,
            specialities: [{
              specialtyId: specialiteExtension._id,
              expertiseLevel: 5
            }],
            examplePhotos: [photosExistantes[3]],
            gallery: [{
              photoUrl: photosExistantes[3],
              caption: 'Extensions naturelles - Volume et longueur',
              tags: ['extension', 'naturel', 'volume'],
              isBeforeAfter: false,
              likes: Math.floor(Math.random() * 50) + 20,
              createdAt: new Date()
            }],
            views: Math.floor(Math.random() * 200) + 100,
            shares: Math.floor(Math.random() * 30) + 10,
            availability: 'immédiat',
            estimatedWaitTime: 25,
            isVerified: true,
            popularityScore: Math.floor(Math.random() * 100) + 50
          });
        }
      }
      
      // Créer les services
      for (const serviceData of servicesACreer) {
        const nouveauService = new Service({
          ...serviceData,
          coiffeur: coiffeur._id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await nouveauService.save();
        console.log(`✅ Service créé: ${serviceData.name} - ${serviceData.price}€`);
        console.log(`  - Photo: ${serviceData.examplePhotos[0]}`);
      }
    }

    // 6. Vérification finale
    console.log('\n🔍 Vérification finale des services...');
    const totalServices = await Service.countDocuments();
    const servicesNouveauxCoiffeurs = await Service.find({
      coiffeur: { $in: nouveauxCoiffeurs.map(c => c._id) }
    }).populate('coiffeur', 'name');

    console.log(`📊 Total services dans la base: ${totalServices}`);
    console.log(`📊 Services des nouveaux coiffeurs: ${servicesNouveauxCoiffeurs.length}`);
    
    servicesNouveauxCoiffeurs.forEach(service => {
      console.log(`- ${service.name} (${service.coiffeur.name}) - ${service.price}€`);
      console.log(`  - Photo: ${service.examplePhotos[0]}`);
      console.log(`  - Galerie: ${service.gallery[0]?.photoUrl}`);
    });

    console.log('\n🎉 Services créés avec succès avec de vraies photos !');

  } catch (error) {
    console.error('❌ Erreur lors de la création des services:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

creerServicesAvecVraiesPhotos();
