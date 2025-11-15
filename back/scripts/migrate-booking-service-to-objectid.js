/**
 * Script de migration pour convertir les services de String vers ObjectId
 * 
 * Ce script:
 * 1. Parcourt toutes les réservations existantes
 * 2. Pour chaque réservation avec service en String, cherche le service correspondant
 * 3. Met à jour serviceId avec l'ObjectId du service trouvé
 * 4. Garde le champ service (String) pour compatibilité
 * 
 * Usage: node back/scripts/migrate-booking-service-to-objectid.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taphair';

async function migrateBookingServices() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer toutes les réservations sans serviceId
    const bookings = await Booking.find({
      $or: [
        { serviceId: { $exists: false } },
        { serviceId: null }
      ]
    });

    console.log(`📊 ${bookings.length} réservations à migrer`);

    let successCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;

    for (const booking of bookings) {
      try {
        // Si le service est déjà un ObjectId, l'utiliser directement
        if (mongoose.Types.ObjectId.isValid(booking.service)) {
          booking.serviceId = booking.service;
          await booking.save();
          successCount++;
          console.log(`✅ Réservation ${booking._id}: serviceId mis à jour (ObjectId existant)`);
          continue;
        }

        // Si le service est une String, chercher le service correspondant
        if (typeof booking.service === 'string') {
          // Chercher par nom exact
          let service = await Service.findOne({
            name: booking.service,
            coiffeur: booking.coiffeur
          });

          // Si pas trouvé, chercher par nom partiel
          if (!service) {
            service = await Service.findOne({
              name: { $regex: booking.service, $options: 'i' },
              coiffeur: booking.coiffeur
            });
          }

          if (service) {
            booking.serviceId = service._id;
            await booking.save();
            successCount++;
            console.log(`✅ Réservation ${booking._id}: serviceId mis à jour (${service.name})`);
          } else {
            notFoundCount++;
            console.log(`⚠️ Réservation ${booking._id}: Service "${booking.service}" non trouvé pour le coiffeur ${booking.coiffeur}`);
          }
        } else {
          errorCount++;
          console.log(`❌ Réservation ${booking._id}: Format de service inattendu: ${typeof booking.service}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Erreur lors de la migration de la réservation ${booking._id}:`, error.message);
      }
    }

    console.log('\n📊 Résumé de la migration:');
    console.log(`✅ Succès: ${successCount}`);
    console.log(`⚠️ Service non trouvé: ${notFoundCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📝 Total: ${bookings.length}`);

    // Statistiques finales
    const totalBookings = await Booking.countDocuments();
    const bookingsWithServiceId = await Booking.countDocuments({ serviceId: { $exists: true, $ne: null } });
    const bookingsWithoutServiceId = totalBookings - bookingsWithServiceId;

    console.log('\n📈 Statistiques finales:');
    console.log(`📝 Total réservations: ${totalBookings}`);
    console.log(`✅ Avec serviceId: ${bookingsWithServiceId}`);
    console.log(`⚠️ Sans serviceId: ${bookingsWithoutServiceId}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Déconnexion de MongoDB');
    process.exit(0);
  }
}

// Exécuter la migration
migrateBookingServices();

