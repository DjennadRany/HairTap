import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import CoiffeurDataEnrichmentService from '../domain/coiffeur/CoiffeurDataEnrichmentService.js';

/**
 * Script d'enrichissement des données des coiffeurs
 * Enrichit uniquement les coiffeurs qui n'ont pas déjà des données complètes
 */
const enrichCoiffeursData = async () => {
  try {
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    console.log('🚀 Début de l\'enrichissement des données des coiffeurs...\n');

    // Enrichir tous les coiffeurs qui n'ont pas de données complètes
    const results = await CoiffeurDataEnrichmentService.enrichAllCoiffeurs({
      minReviews: 5,
      maxReviews: 100,
      minServices: 3,
      maxServices: 5
    });

    // Afficher le résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DE L\'ENRICHISSEMENT:');
    console.log('='.repeat(80));
    console.log(`   ✅ Coiffeurs enrichis: ${results.enriched}`);
    console.log(`   ⏭️  Coiffeurs déjà complets (ignorés): ${results.skipped}`);
    console.log(`   ❌ Erreurs: ${results.errors}`);
    console.log(`   📈 Total: ${results.total} coiffeurs traités`);
    console.log('='.repeat(80));

    // Afficher les détails
    if (results.details.length > 0) {
      console.log('\n📋 DÉTAILS PAR COIFFEUR:\n');
      results.details.forEach((detail, index) => {
        if (detail.success && !detail.skipped) {
          console.log(`   ${index + 1}. ${detail.coiffeurName}:`);
          console.log(`      - Services créés: ${detail.servicesCreated}`);
          console.log(`      - Avis créés: ${detail.reviewsCreated}`);
          if (detail.errors && detail.errors.length > 0) {
            console.log(`      - Erreurs: ${detail.errors.join(', ')}`);
          }
        } else if (detail.skipped) {
          console.log(`   ${index + 1}. ${detail.coiffeurName}: ⏭️  Déjà complet (ignoré)`);
        } else {
          console.log(`   ${index + 1}. ${detail.coiffeurName}: ❌ ${detail.message || detail.error}`);
        }
      });
    }

    console.log('\n✅ Enrichissement terminé avec succès !\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'enrichissement:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

enrichCoiffeursData();

