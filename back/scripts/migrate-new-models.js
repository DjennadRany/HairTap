import mongoose from 'mongoose';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Specialty from '../models/Specialty.js';
import WorkingSlot from '../models/WorkingSlot.js';
import Pricing from '../models/Pricing.js';

const migrateNewModels = async () => {
  try {
    const mongoURI = 'mongodb://localhost:27017/taphair';
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    console.log('\n🚀 Début de la migration des nouveaux modèles...');
    
    // 1. MIGRATION DES SPÉCIALITÉS
    console.log('\n📋 ÉTAPE 1: Migration des spécialités...');
    await migrateSpecialties();
    
    // 2. MIGRATION DES CRÉNEAUX DE TRAVAIL
    console.log('\n📋 ÉTAPE 2: Migration des créneaux de travail...');
    await migrateWorkingSlots();
    
    // 3. MIGRATION DES PRIX DYNAMIQUES
    console.log('\n📋 ÉTAPE 3: Migration des prix dynamiques...');
    await migratePricing();
    
    // 4. VÉRIFICATION FINALE
    console.log('\n📋 ÉTAPE 4: Vérification finale...');
    await verifyMigration();
    
    console.log('\n🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

// Migration des spécialités
const migrateSpecialties = async () => {
  try {
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`👥 ${coiffeurs.length} coiffeurs trouvés`);
    
    let createdCount = 0;
    
    for (const coiffeur of coiffeurs) {
      // Vérifier si le coiffeur a déjà des spécialités
      const existingSpecialties = await Specialty.find({ coiffeurId: coiffeur._id });
      
      if (existingSpecialties.length === 0) {
        // Créer une spécialité basée sur l'ancien champ 'speciality'
        if (coiffeur.speciality) {
          const specialty = new Specialty({
            coiffeurId: coiffeur._id,
            name: coiffeur.speciality,
            expertiseLevel: calculateExpertiseLevel(coiffeur.yearsExperience || 0),
            yearsExperience: coiffeur.yearsExperience || 0,
            category: determineCategory(coiffeur.speciality),
            description: `Spécialité: ${coiffeur.speciality}`,
            isActive: true
          });
          
          await specialty.save();
          createdCount++;
          console.log(`✅ Spécialité créée pour ${coiffeur.name}: ${coiffeur.speciality}`);
        } else {
          // Créer une spécialité par défaut
          const defaultSpecialty = new Specialty({
            coiffeurId: coiffeur._id,
            name: 'Coiffure générale',
            expertiseLevel: 3,
            yearsExperience: coiffeur.yearsExperience || 0,
            category: 'coupe',
            description: 'Spécialité par défaut',
            isActive: true
          });
          
          await defaultSpecialty.save();
          createdCount++;
          console.log(`✅ Spécialité par défaut créée pour ${coiffeur.name}`);
        }
      } else {
        console.log(`ℹ️ ${coiffeur.name} a déjà ${existingSpecialties.length} spécialités`);
      }
    }
    
    console.log(`📊 ${createdCount} spécialités créées au total`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration des spécialités:', error);
    throw error;
  }
};

// Migration des créneaux de travail
const migrateWorkingSlots = async () => {
  try {
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`👥 ${coiffeurs.length} coiffeurs trouvés`);
    
    let createdCount = 0;
    
    for (const coiffeur of coiffeurs) {
      // Vérifier si le coiffeur a déjà des créneaux
      const existingSlots = await WorkingSlot.find({ coiffeurId: coiffeur._id });
      
      if (existingSlots.length === 0) {
        // Créer des créneaux par défaut basés sur le mode de travail
        const defaultSlots = createDefaultSlots(coiffeur);
        
        for (const slot of defaultSlots) {
          const workingSlot = new WorkingSlot(slot);
          await workingSlot.save();
          createdCount++;
        }
        
        console.log(`✅ ${defaultSlots.length} créneaux créés pour ${coiffeur.name}`);
      } else {
        console.log(`ℹ️ ${coiffeur.name} a déjà ${existingSlots.length} créneaux`);
      }
    }
    
    console.log(`📊 ${createdCount} créneaux créés au total`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration des créneaux:', error);
    throw error;
  }
};

// Migration des prix dynamiques
const migratePricing = async () => {
  try {
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`👥 ${coiffeurs.length} coiffeurs trouvés`);
    
    let createdCount = 0;
    
    for (const coiffeur of coiffeurs) {
      // Récupérer les services du coiffeur
      const services = await Service.find({ coiffeur: coiffeur._id, isActive: true });
      
      for (const service of services) {
        // Vérifier si le prix existe déjà
        const existingPricing = await Pricing.findOne({ 
          coiffeurId: coiffeur._id, 
          serviceId: service._id 
        });
        
        if (!existingPricing) {
          const pricing = new Pricing({
            coiffeurId: coiffeur._id,
            serviceId: service._id,
            basePrice: service.price,
            timeSlotMultiplier: {
              morning: 1.0,
              afternoon: 1.0,
              evening: 1.2,
              weekend: 1.3
            },
            locationMultiplier: {
              salon: 1.0,
              domicile: 1.5
            },
            specialOffers: [],
            isActive: true
          });
          
          await pricing.save();
          createdCount++;
          console.log(`✅ Prix créé pour ${coiffeur.name} - ${service.name}: ${service.price}€`);
        }
      }
    }
    
    console.log(`📊 ${createdCount} prix créés au total`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration des prix:', error);
    throw error;
  }
};

// Vérification finale
const verifyMigration = async () => {
  try {
    console.log('\n🔍 Vérification de la migration...');
    
    // Compter les documents dans chaque collection
    const specialtyCount = await Specialty.countDocuments();
    const workingSlotCount = await WorkingSlot.countDocuments();
    const pricingCount = await Pricing.countDocuments();
    
    console.log(`📊 Résultats de la migration:`);
    console.log(`- Spécialités: ${specialtyCount}`);
    console.log(`- Créneaux: ${workingSlotCount}`);
    console.log(`- Prix: ${pricingCount}`);
    
    // Vérifier que chaque coiffeur a des données
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`\n👥 Vérification par coiffeur:`);
    
    for (const coiffeur of coiffeurs) {
      const specialties = await Specialty.countDocuments({ coiffeurId: coiffeur._id });
      const slots = await WorkingSlot.countDocuments({ coiffeurId: coiffeur._id });
      const pricing = await Pricing.countDocuments({ coiffeurId: coiffeur._id });
      
      console.log(`- ${coiffeur.name}: ${specialties} spécialités, ${slots} créneaux, ${pricing} prix`);
    }
    
    console.log('\n✅ Vérification terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    throw error;
  }
};

// Fonctions utilitaires
const calculateExpertiseLevel = (yearsExperience) => {
  if (yearsExperience >= 10) return 5;
  if (yearsExperience >= 7) return 4;
  if (yearsExperience >= 4) return 3;
  if (yearsExperience >= 2) return 2;
  return 1;
};

const determineCategory = (speciality) => {
  const lowerSpeciality = speciality.toLowerCase();
  
  if (lowerSpeciality.includes('coupe')) return 'coupe';
  if (lowerSpeciality.includes('coloration') || lowerSpeciality.includes('couleur')) return 'coloration';
  if (lowerSpeciality.includes('brushing')) return 'brushing';
  if (lowerSpeciality.includes('lissage')) return 'lissage';
  if (lowerSpeciality.includes('permanente')) return 'permanente';
  if (lowerSpeciality.includes('barbe')) return 'barbe';
  if (lowerSpeciality.includes('soin')) return 'soin';
  if (lowerSpeciality.includes('extension')) return 'extension';
  
  return 'coupe'; // Par défaut
};

const createDefaultSlots = (coiffeur) => {
  const slots = [];
  
  // Créer des créneaux par défaut (Lundi-Vendredi, 9h-18h)
  for (let day = 1; day <= 5; day++) { // Lundi = 1, Vendredi = 5
    slots.push({
      coiffeurId: coiffeur._id,
      dayOfWeek: day,
      startTime: 9,
      endTime: 18,
      serviceTypes: ['coupe', 'coloration', 'brushing', 'lissage', 'permanente', 'barbe', 'soin', 'extension'],
      availableAt: coiffeur.workingMode === 'both' ? 'both' : 
                  coiffeur.workingMode === 'domicile' ? 'domicile' : 'salon',
      status: 'available',
      maxBookings: 1,
      currentBookings: 0,
      isRecurring: true,
      exceptions: []
    });
  }
  
  // Ajouter le samedi si le coiffeur travaille le weekend
  if (coiffeur.workingMode !== 'salon') {
    slots.push({
      coiffeurId: coiffeur._id,
      dayOfWeek: 6, // Samedi
      startTime: 9,
      endTime: 17,
      serviceTypes: ['coupe', 'coloration', 'brushing', 'lissage', 'permanente', 'barbe', 'soin', 'extension'],
      availableAt: coiffeur.workingMode === 'both' ? 'both' : 
                  coiffeur.workingMode === 'domicile' ? 'domicile' : 'salon',
      status: 'available',
      maxBookings: 1,
      currentBookings: 0,
      isRecurring: true,
      exceptions: []
    });
  }
  
  return slots;
};

// Lancer la migration
migrateNewModels();
