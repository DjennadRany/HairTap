import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

/**
 * Script d'audit pour analyser pourquoi les services ajoutés par code ne s'affichent pas
 */
const auditServicesCoiffeurs = async () => {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Récupérer Marie Dubois
    const marieDubois = await User.findOne({ email: 'marie.dubois@taphair.com' });
    if (!marieDubois) {
      console.log('❌ Marie Dubois non trouvée');
      process.exit(1);
    }

    console.log('═'.repeat(80));
    console.log('AUDIT DES SERVICES - MARIE DUBOIS');
    console.log('═'.repeat(80));
    console.log(`\n👤 Coiffeur: ${marieDubois.name}`);
    console.log(`📧 Email: ${marieDubois.email}`);
    console.log(`🆔 ID: ${marieDubois._id}\n`);

    // 2. Récupérer TOUS les services de Marie Dubois (sans filtre)
    const allServices = await Service.find({ coiffeur: marieDubois._id });
    console.log(`📊 Total de services dans la base: ${allServices.length}\n`);

    // 3. Analyser chaque service
    console.log('═'.repeat(80));
    console.log('DÉTAIL DES SERVICES');
    console.log('═'.repeat(80));
    
    let activeCount = 0;
    let inactiveCount = 0;
    let withoutIsActive = 0;

    allServices.forEach((service, index) => {
      console.log(`\n${index + 1}. ${service.name}`);
      console.log(`   - ID: ${service._id}`);
      console.log(`   - Description: ${service.description || 'N/A'}`);
      console.log(`   - Prix: ${service.price}€`);
      console.log(`   - Durée: ${service.duration} min`);
      console.log(`   - Catégorie: ${service.category || 'N/A'}`);
      console.log(`   - isActive: ${service.isActive !== undefined ? service.isActive : 'NON DÉFINI'}`);
      console.log(`   - isVerified: ${service.isVerified || false}`);
      console.log(`   - Créé le: ${service.createdAt ? new Date(service.createdAt).toLocaleDateString('fr-FR') : 'N/A'}`);
      console.log(`   - Mis à jour le: ${service.updatedAt ? new Date(service.updatedAt).toLocaleDateString('fr-FR') : 'N/A'}`);
      
      if (service.isActive === true) {
        activeCount++;
      } else if (service.isActive === false) {
        inactiveCount++;
      } else {
        withoutIsActive++;
      }
    });

    // 4. Services qui seront retournés par l'API (avec filtre isActive: true)
    const activeServices = await Service.find({ 
      coiffeur: marieDubois._id, 
      isActive: true 
    });

    console.log('\n═'.repeat(80));
    console.log('RÉSUMÉ');
    console.log('═'.repeat(80));
    console.log(`Total services dans la base: ${allServices.length}`);
    console.log(`Services actifs (isActive: true): ${activeCount}`);
    console.log(`Services inactifs (isActive: false): ${inactiveCount}`);
    console.log(`Services sans isActive défini: ${withoutIsActive}`);
    console.log(`Services retournés par l'API (/coiffeurs/:id/services): ${activeServices.length}`);
    console.log('');

    // 5. Vérifier les services créés par CoiffeurDataFactory
    console.log('═'.repeat(80));
    console.log('VÉRIFICATION DES SERVICES CRÉÉS PAR CODE');
    console.log('═'.repeat(80));
    
    // Chercher les services avec des patterns typiques des scripts
    const scriptCreatedServices = allServices.filter(s => {
      const desc = s.description || '';
      return desc.includes('professionnel') || 
             desc.includes('Service de') ||
             s.popularityScore !== undefined;
    });

    console.log(`Services probablement créés par code: ${scriptCreatedServices.length}`);
    scriptCreatedServices.forEach(s => {
      console.log(`  - ${s.name} (isActive: ${s.isActive})`);
    });

    // 6. Problèmes détectés
    console.log('\n═'.repeat(80));
    console.log('PROBLÈMES DÉTECTÉS');
    console.log('═'.repeat(80));

    const problems = [];

    if (allServices.length > activeServices.length) {
      problems.push(`⚠️ ${allServices.length - activeServices.length} service(s) ne s'affichent pas car isActive !== true`);
    }

    if (withoutIsActive > 0) {
      problems.push(`⚠️ ${withoutIsActive} service(s) n'ont pas le champ isActive défini`);
    }

    if (activeServices.length === 0 && allServices.length > 0) {
      problems.push(`❌ Aucun service actif trouvé alors qu'il y a ${allServices.length} service(s) dans la base`);
    }

    if (problems.length === 0) {
      console.log('✅ Aucun problème détecté');
    } else {
      problems.forEach(p => console.log(p));
    }

    // 7. Recommandations
    console.log('\n═'.repeat(80));
    console.log('RECOMMANDATIONS');
    console.log('═'.repeat(80));

    if (withoutIsActive > 0) {
      console.log('1. Corriger les services sans isActive:');
      console.log('   - Ajouter isActive: true aux services manquants');
    }

    if (inactiveCount > 0) {
      console.log('2. Réactiver les services inactifs si nécessaire:');
      console.log('   - Mettre isActive: true pour les services qui doivent être visibles');
    }

    if (allServices.length === 0) {
      console.log('3. Aucun service trouvé pour ce coiffeur');
      console.log('   - Vérifier que les scripts de création de services ont bien été exécutés');
      console.log('   - Vérifier que CoiffeurDataFactory.createServices() sauvegarde les services');
    }

    // Déconnexion
    await mongoose.disconnect();
    console.log('\n✅ Audit terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

// Exécuter le script
auditServicesCoiffeurs();



