import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair';

// Fonction pour détecter si un nom ressemble à un nom de personne
function isLikelyPersonName(name) {
  if (!name || typeof name !== 'string') return false;
  
  const patterns = [
    /^Service\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/i,
    /^Service\s+[A-Z][a-z]+$/i,
    /^[A-Z][a-z]+\s+[A-Z][a-z]+$/i,
    /^[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/i,
  ];
  
  return patterns.some(pattern => pattern.test(name.trim()));
}

// Fonction pour vérifier si un nom de service correspond à un nom de coiffeur
function matchesCoiffeurName(serviceName, coiffeurName) {
  if (!serviceName || !coiffeurName) return false;
  
  const serviceLower = serviceName.toLowerCase().trim();
  const coiffeurLower = coiffeurName.toLowerCase().trim();
  
  if (serviceLower.includes(coiffeurLower)) return true;
  if (serviceLower === coiffeurLower) return true;
  if (serviceLower === `service ${coiffeurLower}`) return true;
  
  const coiffeurWords = coiffeurLower.split(/\s+/);
  const serviceWords = serviceLower.split(/\s+/);
  
  const matchingWords = coiffeurWords.filter(word => 
    serviceWords.some(sw => sw.includes(word) || word.includes(sw))
  );
  
  return matchingWords.length >= 2;
}

// Mapping des catégories vers des noms de service par défaut
const defaultServiceNames = {
  coupe: ['Coupe courte', 'Coupe moyenne', 'Coupe longue', 'Coupe homme', 'Coupe femme'],
  coloration: ['Coloration complète', 'Coloration racines', 'Balayage', 'Ombré', 'Mèches'],
  brushing: ['Brushing', 'Brushing long', 'Brushing court'],
  lissage: ['Lissage brésilien', 'Lissage japonais', 'Lissage kératine'],
  permanente: ['Permanente', 'Permanente boucles moyennes', 'Permanente boucles serrées'],
  barbe: ['Coupe barbe', 'Rasage barbe', 'Entretien barbe'],
  soin: ['Soin cheveux', 'Masque hydratant', 'Soin réparateur'],
  autre: ['Service personnalisé', 'Prestation sur mesure']
};

// Fonction pour générer un nom de service à partir de la catégorie
function generateServiceNameFromCategory(category, existingServices = []) {
  const defaults = defaultServiceNames[category] || defaultServiceNames.autre;
  
  // Si des services existent déjà, trouver un nom qui n'est pas utilisé
  const existingNames = existingServices.map(s => s.name.toLowerCase());
  
  for (const defaultName of defaults) {
    if (!existingNames.includes(defaultName.toLowerCase())) {
      return defaultName;
    }
  }
  
  // Si tous les noms par défaut sont utilisés, ajouter un numéro
  let counter = 1;
  let suggestedName = defaults[0];
  while (existingNames.includes(`${suggestedName.toLowerCase()} ${counter}`)) {
    counter++;
  }
  
  return counter > 1 ? `${suggestedName} ${counter}` : suggestedName;
}

// Fonction pour trouver le service correspondant d'un booking
async function findServiceForBooking(booking) {
  // Chercher un service du coiffeur avec la même catégorie, prix et durée
  const services = await Service.find({
    coiffeur: booking.coiffeur,
    price: booking.price,
    duration: booking.duration
  }).sort({ createdAt: 1 });
  
  if (services.length > 0) {
    // Retourner le premier service qui n'a pas un nom de coiffeur
    const validService = services.find(s => !isLikelyPersonName(s.name));
    if (validService) {
      return validService;
    }
    // Sinon, retourner le premier service (on le corrigera après)
    return services[0];
  }
  
  // Si aucun service trouvé, chercher juste par coiffeur et catégorie
  const servicesByCategory = await Service.find({
    coiffeur: booking.coiffeur
  }).sort({ createdAt: 1 });
  
  if (servicesByCategory.length > 0) {
    const validService = servicesByCategory.find(s => !isLikelyPersonName(s.name));
    if (validService) {
      return validService;
    }
    return servicesByCategory[0];
  }
  
  return null;
}

async function correctionAutomatique() {
  console.log('🔧 CORRECTION AUTOMATIQUE DE LA BASE DE DONNÉES\n');
  console.log('='.repeat(80));
  
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. CORRECTION DES SERVICES
    console.log('📊 ÉTAPE 1 : CORRECTION DES SERVICES\n');
    
    const services = await Service.find({}).populate('coiffeur', 'name');
    const servicesProblemes = [];

    for (const service of services) {
      const coiffeurName = service.coiffeur?.name || 'Inconnu';
      const serviceName = service.name;
      
      if (isLikelyPersonName(serviceName) && matchesCoiffeurName(serviceName, coiffeurName)) {
        servicesProblemes.push(service);
      }
    }

    console.log(`📋 Services à corriger : ${servicesProblemes.length}\n`);

    let servicesCorriges = 0;
    const servicesCorrigesMap = new Map(); // Pour mapper l'ancien nom au nouveau nom

    for (const service of servicesProblemes) {
      const coiffeurName = service.coiffeur?.name || 'Inconnu';
      const ancienNom = service.name;
      const category = service.category || 'autre';
      
      // Récupérer tous les services du même coiffeur pour éviter les doublons
      const servicesCoiffeur = await Service.find({
        coiffeur: service.coiffeur._id
      });
      
      const nouveauNom = generateServiceNameFromCategory(category, servicesCoiffeur);
      
      try {
        service.name = nouveauNom;
        // Sauvegarder sans validation stricte pour éviter les erreurs de validation sur gallery
        await service.save({ validateBeforeSave: false });
        
        servicesCorrigesMap.set(ancienNom, nouveauNom);
        
        console.log(`✅ Service ${service._id} : "${ancienNom}" → "${nouveauNom}"`);
        console.log(`   Coiffeur: ${coiffeurName}, Catégorie: ${category}`);
        servicesCorriges++;
      } catch (error) {
        console.error(`❌ Erreur lors de la correction du service ${service._id}:`, error.message);
      }
    }

    console.log(`\n📊 Services corrigés : ${servicesCorriges}/${servicesProblemes.length}\n`);

    // 2. CORRECTION DES BOOKINGS
    console.log('='.repeat(80));
    console.log('📊 ÉTAPE 2 : CORRECTION DES RÉSERVATIONS (BOOKINGS)\n');
    
    const bookings = await Booking.find({}).populate('coiffeur', 'name');
    const bookingsProblemes = [];

    for (const booking of bookings) {
      const coiffeurName = booking.coiffeur?.name || 'Inconnu';
      const serviceName = booking.service;
      
      if (isLikelyPersonName(serviceName) && matchesCoiffeurName(serviceName, coiffeurName)) {
        bookingsProblemes.push(booking);
      }
    }

    console.log(`📋 Réservations à corriger : ${bookingsProblemes.length}\n`);

    let bookingsCorriges = 0;

    for (const booking of bookingsProblemes) {
      const coiffeurName = booking.coiffeur?.name || 'Inconnu';
      const ancienNom = booking.service;
      
      // Vérifier d'abord si on a déjà corrigé un service avec ce nom
      if (servicesCorrigesMap.has(ancienNom)) {
        const nouveauNom = servicesCorrigesMap.get(ancienNom);
        booking.service = nouveauNom;
        await booking.save();
        console.log(`✅ Booking ${booking._id} : "${ancienNom}" → "${nouveauNom}" (via service corrigé)`);
        bookingsCorriges++;
        continue;
      }
      
      // Sinon, chercher le service correspondant du coiffeur
      const servicesCoiffeur = await Service.find({
        coiffeur: booking.coiffeur._id
      }).sort({ createdAt: 1 });
      
      // Trouver un service qui n'a pas un nom de coiffeur
      let serviceCorrespondant = servicesCoiffeur.find(s => 
        !isLikelyPersonName(s.name)
      );
      
      // Si aucun service valide trouvé, utiliser le premier service et le corriger
      if (!serviceCorrespondant && servicesCoiffeur.length > 0) {
        serviceCorrespondant = servicesCoiffeur[0];
        // Si ce service a aussi un nom de coiffeur, générer un nouveau nom
        if (isLikelyPersonName(serviceCorrespondant.name)) {
          const ancienNomService = serviceCorrespondant.name;
          const category = serviceCorrespondant.category || 'autre';
          const nouveauNom = generateServiceNameFromCategory(category, servicesCoiffeur);
          serviceCorrespondant.name = nouveauNom;
          await serviceCorrespondant.save({ validateBeforeSave: false });
          servicesCorrigesMap.set(ancienNomService, nouveauNom);
          console.log(`   ℹ️  Service ${serviceCorrespondant._id} corrigé : "${ancienNomService}" → "${nouveauNom}"`);
        }
      }
      
      if (serviceCorrespondant) {
        const nouveauNom = serviceCorrespondant.name;
        booking.service = nouveauNom;
        await booking.save();
        console.log(`✅ Booking ${booking._id} : "${ancienNom}" → "${nouveauNom}" (via service correspondant)`);
        bookingsCorriges++;
      } else {
        // Si aucun service trouvé, utiliser un nom par défaut basé sur la catégorie
        // On va chercher un service du coiffeur pour déterminer la catégorie
        const servicesCoiffeur = await Service.find({
          coiffeur: booking.coiffeur
        }).limit(1);
        
        if (servicesCoiffeur.length > 0) {
          const category = servicesCoiffeur[0].category || 'autre';
          const nouveauNom = generateServiceNameFromCategory(category);
          booking.service = nouveauNom;
          await booking.save();
          console.log(`✅ Booking ${booking._id} : "${ancienNom}" → "${nouveauNom}" (nom par défaut)`);
          bookingsCorriges++;
        } else {
          console.log(`⚠️  Booking ${booking._id} : Impossible de trouver un service pour "${ancienNom}"`);
        }
      }
    }

    console.log(`\n📊 Réservations corrigées : ${bookingsCorriges}/${bookingsProblemes.length}\n`);

    // 3. RÉSUMÉ FINAL
    console.log('='.repeat(80));
    console.log('📊 RÉSUMÉ DE LA CORRECTION');
    console.log('='.repeat(80));
    
    console.log(`\n✅ CORRECTIONS EFFECTUÉES :`);
    console.log(`   - Services corrigés : ${servicesCorriges}/${servicesProblemes.length}`);
    console.log(`   - Réservations corrigées : ${bookingsCorriges}/${bookingsProblemes.length}`);
    console.log(`   - Total corrigé : ${servicesCorriges + bookingsCorriges}/${servicesProblemes.length + bookingsProblemes.length}`);
    
    if (servicesCorriges === servicesProblemes.length && bookingsCorriges === bookingsProblemes.length) {
      console.log('\n🎉 Toutes les corrections ont été effectuées avec succès !');
    } else {
      console.log('\n⚠️  Certaines corrections n\'ont pas pu être effectuées.');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ CORRECTION TERMINÉE');
    console.log('='.repeat(80));
    
    await mongoose.disconnect();
    console.log('\n👋 Déconnexion de MongoDB');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

// Exécuter la correction
correctionAutomatique()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });

