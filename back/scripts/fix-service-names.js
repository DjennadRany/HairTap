import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Service from '../models/Service.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Fonction pour détecter si un nom de service ressemble à un nom de coiffeur
function isLikelyCoiffeurName(serviceName) {
  // Détecter les patterns comme "Service [Prénom] [Nom]" ou juste un nom de personne
  const patterns = [
    /^Service\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/, // "Service Camille Rousseau"
    /^Service\s+[A-Z][a-z]+$/, // "Service Camille"
    /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // "Camille Rousseau" sans "Service"
  ];
  
  return patterns.some(pattern => pattern.test(serviceName));
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
function generateServiceNameFromCategory(category, coiffeurName) {
  const defaults = defaultServiceNames[category] || defaultServiceNames.autre;
  // Utiliser le premier nom par défaut de la catégorie
  return defaults[0];
}

async function fixServiceNames() {
  try {
    // Connexion à MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les services
    const services = await Service.find({}).populate('coiffeur', 'name');
    console.log(`📊 ${services.length} services trouvés`);

    let fixedCount = 0;
    let skippedCount = 0;
    const servicesToFix = [];

    // Identifier les services à corriger
    for (const service of services) {
      if (isLikelyCoiffeurName(service.name)) {
        servicesToFix.push({
          service,
          oldName: service.name,
          coiffeurName: service.coiffeur?.name || 'Inconnu',
          category: service.category || 'autre'
        });
      }
    }

    console.log(`\n🔍 ${servicesToFix.length} services à corriger détectés :\n`);
    
    // Afficher les services à corriger
    servicesToFix.forEach((item, index) => {
      const suggestedName = generateServiceNameFromCategory(item.category, item.coiffeurName);
      console.log(`${index + 1}. Service ID: ${item.service._id}`);
      console.log(`   Ancien nom: "${item.oldName}"`);
      console.log(`   Coiffeur: ${item.coiffeurName}`);
      console.log(`   Catégorie: ${item.category}`);
      console.log(`   Nom suggéré: "${suggestedName}"`);
      console.log('');
    });

    if (servicesToFix.length === 0) {
      console.log('✅ Aucun service à corriger');
      await mongoose.disconnect();
      return;
    }

    // Correction automatique avec noms suggérés
    console.log('\n🔧 Correction automatique en cours...\n');
    
    for (const item of servicesToFix) {
      const suggestedName = generateServiceNameFromCategory(item.category, item.coiffeurName);
      
      try {
        // Mettre à jour le nom du service
        item.service.name = suggestedName;
        await item.service.save();
        
        console.log(`✅ Service ${item.service._id} : "${item.oldName}" → "${suggestedName}"`);
        fixedCount++;
      } catch (error) {
        console.error(`❌ Erreur lors de la correction du service ${item.service._id}:`, error.message);
      }
    }

    console.log(`\n📊 Résumé :`);
    console.log(`   ✅ Services corrigés : ${fixedCount}`);
    console.log(`   ⏭️  Services ignorés : ${skippedCount}`);
    console.log(`   📝 Total traité : ${servicesToFix.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Déconnexion de MongoDB');
    console.log('\n✨ Migration terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration
fixServiceNames();













