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
  ];
  
  return patterns.some(pattern => pattern.test(name.trim()));
}

// Fonction pour extraire le nom de service depuis les notes
function extractServiceNameFromNotes(notes) {
  if (!notes || typeof notes !== 'string') return null;
  
  // Pattern: "Réservation pour Service [Nom]" ou "Réservation pour [Nom]"
  const match = notes.match(/Réservation pour\s+(.+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return null;
}

// Fonction pour corriger les notes
function correctNotes(notes, serviceName) {
  if (!notes || typeof notes !== 'string') return notes;
  
  // Si les notes contiennent "Réservation pour Service [Nom]", remplacer par le nom du service
  if (notes.includes('Réservation pour')) {
    return `Réservation pour ${serviceName}`;
  }
  
  return notes;
}

async function correctionNotesBookings() {
  console.log('🔧 CORRECTION DES NOTES DES RÉSERVATIONS\n');
  console.log('='.repeat(80));
  
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer tous les bookings avec leurs services
    const bookings = await Booking.find({}).populate('coiffeur', 'name');
    console.log(`📋 Total de réservations : ${bookings.length}\n`);

    let notesCorrigees = 0;
    const bookingsAvecProblemes = [];

    // Identifier les bookings avec des notes problématiques
    for (const booking of bookings) {
      const notes = booking.notes;
      const serviceName = booking.service;
      
      if (notes && typeof notes === 'string' && notes.includes('Réservation pour')) {
        const serviceNameFromNotes = extractServiceNameFromNotes(notes);
        
        // Vérifier si le nom extrait ressemble à un nom de coiffeur
        if (serviceNameFromNotes && isLikelyPersonName(serviceNameFromNotes)) {
          bookingsAvecProblemes.push({
            booking,
            anciennesNotes: notes,
            serviceNameFromNotes: serviceNameFromNotes,
            serviceNameActuel: serviceName
          });
        }
      }
    }

    console.log(`📋 Réservations avec notes problématiques : ${bookingsAvecProblemes.length}\n`);

    if (bookingsAvecProblemes.length === 0) {
      console.log('✅ Aucune note problématique détectée\n');
      await mongoose.disconnect();
      return;
    }

    // Corriger les notes
    console.log('🔧 Correction des notes en cours...\n');
    
    for (const item of bookingsAvecProblemes) {
      const { booking, anciennesNotes, serviceNameActuel } = item;
      
      // Utiliser le nom du service actuel (qui a déjà été corrigé)
      const nouvellesNotes = correctNotes(anciennesNotes, serviceNameActuel);
      
      try {
        booking.notes = nouvellesNotes;
        await booking.save();
        
        console.log(`✅ Booking ${booking._id} :`);
        console.log(`   Anciennes notes: "${anciennesNotes}"`);
        console.log(`   Nouvelles notes: "${nouvellesNotes}"`);
        console.log('');
        
        notesCorrigees++;
      } catch (error) {
        console.error(`❌ Erreur lors de la correction du booking ${booking._id}:`, error.message);
      }
    }

    console.log(`\n📊 Résumé :`);
    console.log(`   ✅ Notes corrigées : ${notesCorrigees}/${bookingsAvecProblemes.length}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Déconnexion de MongoDB');
    console.log('\n✨ Correction terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

// Exécuter la correction
correctionNotesBookings()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });













