import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import Service from '../models/Service.js';
import User from '../models/User.js';

const verifierServicesExistants = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Vérifier tous les services existants
    console.log('\n🔍 Services existants dans la base...');
    const allServices = await Service.find({}).populate('coiffeur', 'name email');
    
    console.log(`📊 Total services: ${allServices.length}`);
    
    allServices.forEach((service, index) => {
      console.log(`\n--- Service ${index + 1} ---`);
      console.log(`Nom: ${service.name}`);
      console.log(`Prix: ${service.price || 'N/A'}€`);
      console.log(`Catégorie: ${service.category || 'N/A'}`);
      console.log(`Coiffeur: ${service.coiffeur?.name || 'N/A'} (${service.coiffeur?.email || 'N/A'})`);
      
      // Vérifier les photos
      if (service.examplePhotos && service.examplePhotos.length > 0) {
        console.log(`📸 Photos existantes: ${service.examplePhotos.length}`);
        service.examplePhotos.forEach((photo, i) => {
          console.log(`  Photo ${i + 1}: ${photo}`);
        });
      } else {
        console.log(`❌ Aucune photo existante`);
      }
      
      if (service.gallery && service.gallery.length > 0) {
        console.log(`🖼️ Galerie: ${service.gallery.length} photos`);
        service.gallery.forEach((item, i) => {
          console.log(`  Galerie ${i + 1}: ${item.photoUrl}`);
        });
      } else {
        console.log(`❌ Aucune galerie`);
      }
    });

    // 2. Vérifier les coiffeurs existants
    console.log('\n🔍 Coiffeurs existants...');
    const allCoiffeurs = await User.find({ role: 'coiffeur' }).select('name email photo specialities');
    
    console.log(`📊 Total coiffeurs: ${allCoiffeurs.length}`);
    allCoiffeurs.forEach(coiffeur => {
      console.log(`\n👤 ${coiffeur.name} (${coiffeur.email})`);
      console.log(`Photo: ${coiffeur.photo || 'N/A'}`);
      console.log(`Spécialités: ${coiffeur.specialities?.join(', ') || 'Aucune'}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

verifierServicesExistants();
