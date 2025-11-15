import mongoose from 'mongoose';
import User from '../models/User.js';
import WorkingSlot from '../models/WorkingSlot.js';

/**
 * Script pour créer des working slots de test pour tous les coiffeurs
 * Crée des créneaux pour chaque jour de la semaine (Lundi-Vendredi: 9h-18h, Samedi: 9h-17h)
 */
const createWorkingSlotsTest = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    console.log('\n🚀 Début de la création des working slots de test...');
    
    // Récupérer tous les coiffeurs
    const coiffeurs = await User.find({ role: 'coiffeur' });
    console.log(`👥 ${coiffeurs.length} coiffeurs trouvés`);
    
    if (coiffeurs.length === 0) {
      console.log('⚠️ Aucun coiffeur trouvé. Créez d\'abord des coiffeurs.');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    let totalSlotsCreated = 0;
    let totalSlotsSkipped = 0;
    
    // Pour chaque coiffeur, créer des working slots
    for (const coiffeur of coiffeurs) {
      console.log(`\n📅 Création des working slots pour ${coiffeur.name} (${coiffeur._id})...`);
      
      // Vérifier si le coiffeur a déjà des working slots
      const existingSlots = await WorkingSlot.find({ coiffeurId: coiffeur._id });
      if (existingSlots.length > 0) {
        console.log(`  ⏭️  ${coiffeur.name} a déjà ${existingSlots.length} working slots. Passage au suivant...`);
        totalSlotsSkipped += existingSlots.length;
        continue;
      }
      
      // Créer des working slots pour chaque jour de la semaine
      const slotsToCreate = [];
      
      // Lundi-Vendredi (1-5): 9h-18h
      for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
        slotsToCreate.push({
          coiffeurId: coiffeur._id,
          dayOfWeek,
          startTime: 9,
          endTime: 18,
          serviceTypes: ['coupe', 'coloration', 'brushing', 'lissage'],
          availableAt: coiffeur.workingMode?.includes('domicile') ? 'both' : 'salon',
          status: 'available',
          maxBookings: 3,
          currentBookings: 0,
          isRecurring: true,
          exceptions: []
        });
      }
      
      // Samedi (6): 9h-17h
      slotsToCreate.push({
        coiffeurId: coiffeur._id,
        dayOfWeek: 6,
        startTime: 9,
        endTime: 17,
        serviceTypes: ['coupe', 'coloration', 'brushing', 'lissage'],
        availableAt: coiffeur.workingMode?.includes('domicile') ? 'both' : 'salon',
        status: 'available',
        maxBookings: 3,
        currentBookings: 0,
        isRecurring: true,
        exceptions: []
      });
      
      // Créer les working slots
      const createdSlots = await WorkingSlot.insertMany(slotsToCreate);
      console.log(`  ✅ ${createdSlots.length} working slots créés pour ${coiffeur.name}`);
      totalSlotsCreated += createdSlots.length;
    }
    
    console.log('\n📊 RÉSUMÉ:');
    console.log(`  ✅ ${totalSlotsCreated} working slots créés`);
    console.log(`  ⏭️  ${totalSlotsSkipped} working slots déjà existants (ignorés)`);
    console.log(`  📈 Total: ${totalSlotsCreated + totalSlotsSkipped} working slots dans la base`);
    
    console.log('\n🎉 Création des working slots terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des working slots:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

// Exécuter le script
createWorkingSlotsTest();

