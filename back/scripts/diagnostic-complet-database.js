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
  
  // Patterns de noms de personnes
  const patterns = [
    /^Service\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/i, // "Service Camille Rousseau"
    /^Service\s+[A-Z][a-z]+$/i, // "Service Camille"
    /^[A-Z][a-z]+\s+[A-Z][a-z]+$/i, // "Camille Rousseau" (sans "Service")
    /^[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/i, // "Jean Pierre Dupont"
  ];
  
  return patterns.some(pattern => pattern.test(name.trim()));
}

// Fonction pour vérifier si un nom de service correspond à un nom de coiffeur
function matchesCoiffeurName(serviceName, coiffeurName) {
  if (!serviceName || !coiffeurName) return false;
  
  const serviceLower = serviceName.toLowerCase().trim();
  const coiffeurLower = coiffeurName.toLowerCase().trim();
  
  // Vérifier si le nom du service contient le nom du coiffeur
  if (serviceLower.includes(coiffeurLower)) return true;
  
  // Vérifier si le nom du service est exactement le nom du coiffeur
  if (serviceLower === coiffeurLower) return true;
  
  // Vérifier si le nom du service est "Service [nom coiffeur]"
  if (serviceLower === `service ${coiffeurLower}`) return true;
  
  // Extraire les mots du nom du coiffeur
  const coiffeurWords = coiffeurLower.split(/\s+/);
  const serviceWords = serviceLower.split(/\s+/);
  
  // Vérifier si au moins 2 mots du nom du coiffeur sont dans le nom du service
  const matchingWords = coiffeurWords.filter(word => 
    serviceWords.some(sw => sw.includes(word) || word.includes(sw))
  );
  
  return matchingWords.length >= 2;
}

// Fonction pour générer un rapport de diagnostic
async function diagnosticComplet() {
  console.log('🔍 DIAGNOSTIC COMPLET DE LA BASE DE DONNÉES\n');
  console.log('='.repeat(80));
  console.log('📊 ANALYSE DES SERVICES');
  console.log('='.repeat(80));
  
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. ANALYSE DES SERVICES
    const services = await Service.find({}).populate('coiffeur', 'name');
    console.log(`📋 Total de services dans la base : ${services.length}\n`);

    const servicesProblemes = [];
    const coiffeursAvecProblemes = new Set();

    for (const service of services) {
      const coiffeurName = service.coiffeur?.name || 'Inconnu';
      const serviceName = service.name;
      
      // Vérifier si le nom du service ressemble à un nom de personne
      if (isLikelyPersonName(serviceName)) {
        // Vérifier si ça correspond au nom du coiffeur
        if (matchesCoiffeurName(serviceName, coiffeurName)) {
          servicesProblemes.push({
            serviceId: service._id,
            serviceName: serviceName,
            coiffeurId: service.coiffeur?._id,
            coiffeurName: coiffeurName,
            category: service.category || 'autre',
            price: service.price,
            duration: service.duration,
            createdAt: service.createdAt
          });
          coiffeursAvecProblemes.add(coiffeurName);
        }
      }
    }

    console.log(`⚠️  Services avec problèmes détectés : ${servicesProblemes.length}\n`);

    if (servicesProblemes.length > 0) {
      // Grouper par coiffeur
      const parCoiffeur = {};
      servicesProblemes.forEach(item => {
        const key = item.coiffeurName;
        if (!parCoiffeur[key]) {
          parCoiffeur[key] = {
            coiffeurName: item.coiffeurName,
            coiffeurId: item.coiffeurId,
            services: []
          };
        }
        parCoiffeur[key].services.push(item);
      });

      console.log('📋 DÉTAIL PAR COIFFEUR :\n');
      Object.values(parCoiffeur).forEach((groupe, index) => {
        console.log(`${index + 1}. COIFFEUR : ${groupe.coiffeurName} (ID: ${groupe.coiffeurId})`);
        console.log(`   Nombre de services problématiques : ${groupe.services.length}\n`);
        
        groupe.services.forEach((service, sIndex) => {
          console.log(`   ${sIndex + 1}. Service ID: ${service.serviceId}`);
          console.log(`      Nom actuel : "${service.serviceName}"`);
          console.log(`      Catégorie : ${service.category}`);
          console.log(`      Prix : ${service.price}€`);
          console.log(`      Durée : ${service.duration}min`);
          console.log(`      Créé le : ${service.createdAt}`);
          console.log('');
        });
      });
    } else {
      console.log('✅ Aucun problème détecté dans les services\n');
    }

    // 2. ANALYSE DES BOOKINGS
    console.log('='.repeat(80));
    console.log('📊 ANALYSE DES RÉSERVATIONS (BOOKINGS)');
    console.log('='.repeat(80));
    
    const bookings = await Booking.find({}).populate('coiffeur', 'name');
    console.log(`📋 Total de réservations dans la base : ${bookings.length}\n`);

    const bookingsProblemes = [];
    const coiffeursAvecBookingsProblemes = new Set();

    // Récupérer tous les noms de coiffeurs pour comparaison
    const tousLesCoiffeurs = await User.find({ role: 'coiffeur' }, 'name');
    const nomsCoiffeurs = tousLesCoiffeurs.map(c => c.name.toLowerCase());

    for (const booking of bookings) {
      const coiffeurName = booking.coiffeur?.name || 'Inconnu';
      const serviceName = booking.service;
      
      // Vérifier si le nom du service ressemble à un nom de personne
      if (isLikelyPersonName(serviceName)) {
        // Vérifier si ça correspond au nom du coiffeur
        if (matchesCoiffeurName(serviceName, coiffeurName)) {
          bookingsProblemes.push({
            bookingId: booking._id,
            serviceName: serviceName,
            coiffeurId: booking.coiffeur?._id,
            coiffeurName: coiffeurName,
            clientId: booking.client,
            date: booking.date,
            price: booking.price,
            duration: booking.duration,
            status: booking.status,
            createdAt: booking.createdAt
          });
          coiffeursAvecBookingsProblemes.add(coiffeurName);
        }
      }
      
      // Vérifier aussi si le nom du service correspond à n'importe quel coiffeur
      const correspondANimporteQuelCoiffeur = nomsCoiffeurs.some(nom => 
        matchesCoiffeurName(serviceName, nom)
      );
      
      if (correspondANimporteQuelCoiffeur && !matchesCoiffeurName(serviceName, coiffeurName)) {
        // Le service correspond à un autre coiffeur
        const autreCoiffeur = tousLesCoiffeurs.find(c => 
          matchesCoiffeurName(serviceName, c.name)
        );
        if (autreCoiffeur) {
          bookingsProblemes.push({
            bookingId: booking._id,
            serviceName: serviceName,
            coiffeurId: booking.coiffeur?._id,
            coiffeurName: coiffeurName,
            autreCoiffeurName: autreCoiffeur.name,
            clientId: booking.client,
            date: booking.date,
            price: booking.price,
            duration: booking.duration,
            status: booking.status,
            createdAt: booking.createdAt,
            probleme: 'Le nom du service correspond à un autre coiffeur'
          });
          coiffeursAvecBookingsProblemes.add(coiffeurName);
        }
      }
    }

    console.log(`⚠️  Réservations avec problèmes détectées : ${bookingsProblemes.length}\n`);

    if (bookingsProblemes.length > 0) {
      // Grouper par coiffeur
      const parCoiffeurBooking = {};
      bookingsProblemes.forEach(item => {
        const key = item.coiffeurName;
        if (!parCoiffeurBooking[key]) {
          parCoiffeurBooking[key] = {
            coiffeurName: item.coiffeurName,
            coiffeurId: item.coiffeurId,
            bookings: []
          };
        }
        parCoiffeurBooking[key].bookings.push(item);
      });

      console.log('📋 DÉTAIL PAR COIFFEUR :\n');
      Object.values(parCoiffeurBooking).forEach((groupe, index) => {
        console.log(`${index + 1}. COIFFEUR : ${groupe.coiffeurName} (ID: ${groupe.coiffeurId})`);
        console.log(`   Nombre de réservations problématiques : ${groupe.bookings.length}\n`);
        
        groupe.bookings.forEach((booking, bIndex) => {
          console.log(`   ${bIndex + 1}. Booking ID: ${booking.bookingId}`);
          console.log(`      Nom du service : "${booking.serviceName}"`);
          if (booking.autreCoiffeurName) {
            console.log(`      ⚠️  PROBLÈME : Le nom correspond à "${booking.autreCoiffeurName}" (autre coiffeur)`);
          }
          if (booking.probleme) {
            console.log(`      ⚠️  PROBLÈME : ${booking.probleme}`);
          }
          console.log(`      Date de réservation : ${booking.date}`);
          console.log(`      Prix : ${booking.price}€`);
          console.log(`      Durée : ${booking.duration}min`);
          console.log(`      Statut : ${booking.status}`);
          console.log(`      Créé le : ${booking.createdAt}`);
          console.log('');
        });
      });
    } else {
      console.log('✅ Aucun problème détecté dans les réservations\n');
    }

    // 3. RÉSUMÉ GLOBAL
    console.log('='.repeat(80));
    console.log('📊 RÉSUMÉ GLOBAL');
    console.log('='.repeat(80));
    
    const tousCoiffeursAvecProblemes = new Set([
      ...coiffeursAvecProblemes,
      ...coiffeursAvecBookingsProblemes
    ]);

    console.log(`\n📈 STATISTIQUES :`);
    console.log(`   - Total de services analysés : ${services.length}`);
    console.log(`   - Services avec problèmes : ${servicesProblemes.length}`);
    console.log(`   - Total de réservations analysées : ${bookings.length}`);
    console.log(`   - Réservations avec problèmes : ${bookingsProblemes.length}`);
    console.log(`   - Coiffeurs concernés : ${tousCoiffeursAvecProblemes.size}`);
    
    if (tousCoiffeursAvecProblemes.size > 0) {
      console.log(`\n👥 COIFFEURS CONCERNÉS :`);
      Array.from(tousCoiffeursAvecProblemes).forEach((nom, index) => {
        const nbServices = servicesProblemes.filter(s => s.coiffeurName === nom).length;
        const nbBookings = bookingsProblemes.filter(b => b.coiffeurName === nom).length;
        console.log(`   ${index + 1}. ${nom} : ${nbServices} service(s) + ${nbBookings} réservation(s)`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DIAGNOSTIC TERMINÉ');
    console.log('='.repeat(80));
    
    // Sauvegarder le rapport dans un fichier
    const rapport = {
      date: new Date().toISOString(),
      statistiques: {
        totalServices: services.length,
        servicesAvecProblemes: servicesProblemes.length,
        totalBookings: bookings.length,
        bookingsAvecProblemes: bookingsProblemes.length,
        coiffeursConcernes: tousCoiffeursAvecProblemes.size
      },
      servicesProblemes: servicesProblemes,
      bookingsProblemes: bookingsProblemes,
      coiffeursConcernes: Array.from(tousCoiffeursAvecProblemes)
    };

    console.log('\n💾 Rapport sauvegardé dans : rapport-diagnostic.json');
    
    await mongoose.disconnect();
    console.log('\n👋 Déconnexion de MongoDB');
    
    return rapport;

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    process.exit(1);
  }
}

// Exécuter le diagnostic
diagnosticComplet()
  .then(rapport => {
    // Optionnel : sauvegarder dans un fichier JSON
    import('fs').then(fs => {
      fs.writeFileSync(
        path.join(__dirname, 'rapport-diagnostic.json'),
        JSON.stringify(rapport, null, 2),
        'utf-8'
      );
    });
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });













