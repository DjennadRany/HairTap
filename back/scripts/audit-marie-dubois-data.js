import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Review from '../models/Review.js';
import WorkingSlot from '../models/WorkingSlot.js';

/**
 * Script d'audit des données de Marie Dubois
 * Analyse complète de toutes ses données pour les répliquer aux autres coiffeurs
 */
const auditMarieDuboisData = async () => {
  try {
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Récupérer Marie Dubois
    const marieDubois = await User.findOne({ email: 'marie.dubois@taphair.com' });
    if (!marieDubois) {
      console.log('❌ Marie Dubois non trouvée');
      process.exit(1);
    }

    console.log('📋 DONNÉES DE MARIE DUBOIS\n');
    console.log('='.repeat(80));

    // 2. Informations de base
    console.log('\n👤 INFORMATIONS DE BASE:');
    console.log(`   - Nom: ${marieDubois.name}`);
    console.log(`   - Email: ${marieDubois.email}`);
    console.log(`   - Photo: ${marieDubois.photo || 'N/A'}`);
    console.log(`   - Rating: ${marieDubois.rating || 0}`);
    console.log(`   - TotalRatings: ${marieDubois.totalRatings || 0}`);
    console.log(`   - Bio: ${marieDubois.bio || 'N/A'}`);
    console.log(`   - Spécialités: ${marieDubois.specialities?.join(', ') || 'N/A'}`);
    console.log(`   - Mode de travail: ${marieDubois.workingMode?.join(', ') || 'N/A'}`);

    // 3. Adresse et coordonnées
    console.log('\n📍 ADRESSE ET COORDONNÉES:');
    if (marieDubois.salonAddress) {
      console.log(`   - Adresse salon: ${marieDubois.salonAddress.streetNumber || ''} ${marieDubois.salonAddress.street || ''}, ${marieDubois.salonAddress.city || ''} ${marieDubois.salonAddress.postalCode || ''}`);
      if (marieDubois.salonAddress.coordinates) {
        console.log(`   - Coordonnées: lat=${marieDubois.salonAddress.coordinates.lat}, lng=${marieDubois.salonAddress.coordinates.lng}`);
      }
    }
    if (marieDubois.address) {
      console.log(`   - Adresse personnelle: ${marieDubois.address.city || 'N/A'}`);
      if (marieDubois.address.coordinates) {
        console.log(`   - Coordonnées: lat=${marieDubois.address.coordinates.lat}, lng=${marieDubois.address.coordinates.lng}`);
      }
    }

    // 4. Services
    const marieServices = await Service.find({ coiffeur: marieDubois._id });
    console.log(`\n💇 SERVICES (${marieServices.length}):`);
    marieServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name}`);
      console.log(`      - Prix: ${service.price}€`);
      console.log(`      - Durée: ${service.duration}min`);
      console.log(`      - Catégorie: ${service.category || 'N/A'}`);
      console.log(`      - Photos: ${service.gallery?.length || 0} images`);
      if (service.gallery && service.gallery.length > 0) {
        console.log(`      - Première photo: ${service.gallery[0].mediaUrl || 'N/A'}`);
      }
    });

    // 5. Avis
    const marieReviews = await Review.find({ coiffeur: marieDubois._id });
    console.log(`\n⭐ AVIS (${marieReviews.length}):`);
    if (marieReviews.length > 0) {
      marieReviews.forEach((review, index) => {
        console.log(`   ${index + 1}. Note: ${review.rating}/5`);
        console.log(`      - Commentaire: ${review.comment.substring(0, 50)}...`);
        console.log(`      - Date: ${review.createdAt}`);
      });
    } else {
      console.log('   ⚠️  Aucun avis trouvé');
    }

    // 6. Working Slots
    const marieWorkingSlots = await WorkingSlot.find({ coiffeurId: marieDubois._id });
    console.log(`\n📅 WORKING SLOTS (${marieWorkingSlots.length}):`);
    if (marieWorkingSlots.length > 0) {
      marieWorkingSlots.forEach((slot, index) => {
        console.log(`   ${index + 1}. Jour: ${slot.dayOfWeek} (${getDayName(slot.dayOfWeek)})`);
        console.log(`      - Heure: ${slot.startTime}h - ${slot.endTime}h`);
        console.log(`      - Statut: ${slot.status}`);
        console.log(`      - Max bookings: ${slot.maxBookings}`);
        console.log(`      - Current bookings: ${slot.currentBookings}`);
      });
    } else {
      console.log('   ⚠️  Aucun working slot trouvé');
    }

    // 7. Statut de connexion
    console.log('\n🔌 STATUT DE CONNEXION:');
    if (marieDubois.connectionStatus) {
      console.log(`   - En ligne: ${marieDubois.connectionStatus.isOnline ? 'Oui' : 'Non'}`);
      console.log(`   - Dernière connexion: ${marieDubois.connectionStatus.lastSeen || 'N/A'}`);
    } else {
      console.log('   ⚠️  Aucun statut de connexion');
    }

    // 8. Résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ:');
    console.log('='.repeat(80));
    console.log(`   ✅ Services: ${marieServices.length}`);
    console.log(`   ✅ Avis: ${marieReviews.length} (rating: ${marieDubois.rating || 0})`);
    console.log(`   ✅ Working Slots: ${marieWorkingSlots.length}`);
    console.log(`   ✅ Coordonnées: ${marieDubois.salonAddress?.coordinates ? 'Oui' : 'Non'}`);
    console.log(`   ✅ Photo: ${marieDubois.photo ? 'Oui' : 'Non'}`);
    console.log('='.repeat(80));

    // 9. Comparer avec les autres coiffeurs
    const allCoiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`\n📋 COMPARAISON AVEC LES AUTRES COIFFEURS (${allCoiffeurs.length}):`);
    
    const coiffeursWithoutServices = [];
    const coiffeursWithoutReviews = [];
    const coiffeursWithoutWorkingSlots = [];
    const coiffeursWithoutCoordinates = [];
    const coiffeursWithoutPhotos = [];

    for (const coiffeur of allCoiffeurs) {
      if (coiffeur._id.toString() === marieDubois._id.toString()) continue;

      const services = await Service.find({ coiffeur: coiffeur._id });
      const reviews = await Review.find({ coiffeur: coiffeur._id });
      const workingSlots = await WorkingSlot.find({ coiffeurId: coiffeur._id });
      const hasCoordinates = coiffeur.salonAddress?.coordinates || coiffeur.address?.coordinates;
      const hasPhoto = coiffeur.photo && coiffeur.photo !== '/default-avatar.png';

      if (services.length === 0) coiffeursWithoutServices.push(coiffeur.name);
      if (reviews.length === 0) coiffeursWithoutReviews.push(coiffeur.name);
      if (workingSlots.length === 0) coiffeursWithoutWorkingSlots.push(coiffeur.name);
      if (!hasCoordinates) coiffeursWithoutCoordinates.push(coiffeur.name);
      if (!hasPhoto) coiffeursWithoutPhotos.push(coiffeur.name);
    }

    console.log(`\n   ⚠️  Coiffeurs sans services: ${coiffeursWithoutServices.length}`);
    if (coiffeursWithoutServices.length > 0) {
      console.log(`      ${coiffeursWithoutServices.slice(0, 5).join(', ')}${coiffeursWithoutServices.length > 5 ? '...' : ''}`);
    }

    console.log(`\n   ⚠️  Coiffeurs sans avis: ${coiffeursWithoutReviews.length}`);
    if (coiffeursWithoutReviews.length > 0) {
      console.log(`      ${coiffeursWithoutReviews.slice(0, 5).join(', ')}${coiffeursWithoutReviews.length > 5 ? '...' : ''}`);
    }

    console.log(`\n   ⚠️  Coiffeurs sans working slots: ${coiffeursWithoutWorkingSlots.length}`);
    if (coiffeursWithoutWorkingSlots.length > 0) {
      console.log(`      ${coiffeursWithoutWorkingSlots.slice(0, 5).join(', ')}${coiffeursWithoutWorkingSlots.length > 5 ? '...' : ''}`);
    }

    console.log(`\n   ⚠️  Coiffeurs sans coordonnées: ${coiffeursWithoutCoordinates.length}`);
    if (coiffeursWithoutCoordinates.length > 0) {
      console.log(`      ${coiffeursWithoutCoordinates.slice(0, 5).join(', ')}${coiffeursWithoutCoordinates.length > 5 ? '...' : ''}`);
    }

    console.log(`\n   ⚠️  Coiffeurs sans photos: ${coiffeursWithoutPhotos.length}`);
    if (coiffeursWithoutPhotos.length > 0) {
      console.log(`      ${coiffeursWithoutPhotos.slice(0, 5).join(', ')}${coiffeursWithoutPhotos.length > 5 ? '...' : ''}`);
    }

    console.log('\n✅ Audit terminé avec succès !\n');

    return {
      marieDubois,
      marieServices,
      marieReviews,
      marieWorkingSlots,
      coiffeursWithoutServices,
      coiffeursWithoutReviews,
      coiffeursWithoutWorkingSlots,
      coiffeursWithoutCoordinates,
      coiffeursWithoutPhotos
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'audit:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

function getDayName(dayOfWeek) {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayOfWeek] || 'Inconnu';
}

auditMarieDuboisData();

