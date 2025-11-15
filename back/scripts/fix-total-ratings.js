import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import Review from '../models/Review.js';

/**
 * Script de correction des totalRatings dans la base de données
 * Synchronise totalRatings avec le nombre réel d'avis pour chaque coiffeur
 */
const fixTotalRatings = async () => {
  try {
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Récupérer tous les coiffeurs
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`📋 ${coiffeurs.length} coiffeurs trouvés\n`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    let errorCount = 0;

    // 2. Corriger chaque coiffeur
    for (const coiffeur of coiffeurs) {
      try {
        // Calculer le nombre réel d'avis
        const realReviewsCount = await Review.countDocuments({ coiffeur: coiffeur._id });
        
        // Calculer la note moyenne réelle
        const stats = await Review.getAverageRating(coiffeur._id);
        const realRating = stats.averageRating;
        const realTotalRatings = stats.totalReviews;
        
        // Vérifier si totalRatings est incorrect
        const currentTotalRatings = coiffeur.totalRatings || 0;
        const currentRating = coiffeur.rating || 0;
        
        if (currentTotalRatings !== realTotalRatings || Math.abs(currentRating - realRating) > 0.1) {
          // Mettre à jour le coiffeur
          coiffeur.rating = realRating;
          coiffeur.totalRatings = realTotalRatings;
          await coiffeur.save();
          
          console.log(`   ✅ Coiffeur "${coiffeur.name}" corrigé:`);
          console.log(`      - totalRatings: ${currentTotalRatings} → ${realTotalRatings}`);
          console.log(`      - rating: ${currentRating.toFixed(1)} → ${realRating.toFixed(1)}`);
          fixedCount++;
        } else {
          alreadyCorrectCount++;
        }
      } catch (error) {
        console.error(`   ❌ Erreur lors de la correction de "${coiffeur.name}":`, error.message);
        errorCount++;
      }
    }

    // 3. Afficher le résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DE LA CORRECTION:');
    console.log('='.repeat(80));
    console.log(`   ✅ Coiffeurs corrigés: ${fixedCount}`);
    console.log(`   ⏭️  Coiffeurs déjà corrects (ignorés): ${alreadyCorrectCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📈 Total: ${coiffeurs.length} coiffeurs traités`);
    console.log('='.repeat(80));
    console.log('\n✅ Correction terminée avec succès !\n');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

fixTotalRatings();

