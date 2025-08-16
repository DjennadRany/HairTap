import mongoose from 'mongoose';
import { mongoURI } from '../config/mongoURI.js';
import GlobalSpecialty from '../models/GlobalSpecialty.js';
import Service from '../models/Service.js';
import User from '../models/User.js';

const migrateGlobalSpecialties = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // 1. Créer les spécialités de base pour la coiffure
    const baseSpecialties = [
      // Coupes
      { name: 'Coupe homme', category: 'coupe', aliases: ['coupe masculine', 'coiffure homme'], description: 'Coupe de cheveux pour hommes' },
      { name: 'Coupe femme', category: 'coupe', aliases: ['coupe féminine', 'coiffure femme'], description: 'Coupe de cheveux pour femmes' },
      { name: 'Coupe enfant', category: 'coupe', aliases: ['coupe junior', 'coiffure enfant'], description: 'Coupe de cheveux pour enfants' },
      { name: 'Coupe moderne', category: 'coupe', aliases: ['coupe tendance', 'style contemporain'], description: 'Coupe de cheveux moderne et tendance' },
      { name: 'Coupe classique', category: 'coupe', aliases: ['coupe traditionnelle', 'style classique'], description: 'Coupe de cheveux classique et intemporelle' },
      
      // Colorations
      { name: 'Coloration complète', category: 'coloration', aliases: ['teinture complète', 'coloration totale'], description: 'Coloration complète des cheveux' },
      { name: 'Mèches', category: 'coloration', aliases: ['highlights', 'balayage'], description: 'Technique de coloration par mèches' },
      { name: 'Ombré', category: 'coloration', aliases: ['dégradé', 'transition'], description: 'Technique de dégradé de couleur' },
      { name: 'Balayage', category: 'coloration', aliases: ['highlights naturels', 'effet soleil'], description: 'Technique de coloration naturelle' },
      
      // Soins
      { name: 'Soin capillaire', category: 'soin', aliases: ['masque cheveux', 'traitement'], description: 'Soin et traitement des cheveux' },
      { name: 'Lissage brésilien', category: 'lissage', aliases: ['lissage permanent', 'lissage brésilien'], description: 'Technique de lissage permanent' },
      { name: 'Lissage japonais', category: 'lissage', aliases: ['lissage asiatique', 'lissage thermique'], description: 'Technique de lissage japonais' },
      
      // Extensions
      { name: 'Extensions cheveux', category: 'extension', aliases: ['postiches', 'rajouts'], description: 'Pose d\'extensions capillaires' },
      { name: 'Perruques', category: 'extension', aliases: ['postiche complète', 'cheveux artificiels'], description: 'Pose et entretien de perruques' },
      
      // Barbe
      { name: 'Taille de barbe', category: 'barbe', aliases: ['coupe barbe', 'entretien barbe'], description: 'Taille et entretien de la barbe' },
      { name: 'Rasage traditionnel', category: 'barbe', aliases: ['rasage au coupe-choux', 'rasage classique'], description: 'Rasage traditionnel au coupe-choux' },
      
      // Brushing
      { name: 'Brushing', category: 'brushing', aliases: ['coiffage', 'mise en forme'], description: 'Technique de coiffage et mise en forme' },
      { name: 'Lissage temporaire', category: 'brushing', aliases: ['lissage au fer', 'lissage temporaire'], description: 'Lissage temporaire au fer' },
      
      // Permanentes
      { name: 'Permanente', category: 'permanente', aliases: ['frisure permanente', 'boucles permanentes'], description: 'Technique de frisure permanente' },
      { name: 'Défrisage', category: 'permanente', aliases: ['lissage permanent', 'défrisage'], description: 'Technique de lissage permanent' }
    ];

    console.log(`📝 Création de ${baseSpecialties.length} spécialités de base...`);

    for (const specialtyData of baseSpecialties) {
      try {
        // Vérifier si la spécialité existe déjà
        const existing = await GlobalSpecialty.findOne({ 
          name: { $regex: `^${specialtyData.name}$`, $i: true } 
        });

        if (!existing) {
          const specialty = new GlobalSpecialty({
            ...specialtyData,
            isVerified: true, // Les spécialités de base sont vérifiées
            usageCount: Math.floor(Math.random() * 50) + 10 // Usage aléatoire pour la démo
          });
          
          await specialty.save();
          console.log(`✅ Créée: ${specialty.name}`);
        } else {
          console.log(`ℹ️ Existe déjà: ${existing.name}`);
        }
      } catch (error) {
        console.error(`❌ Erreur création ${specialtyData.name}:`, error.message);
      }
    }

    // 2. Migrer les spécialités existantes des utilisateurs
    console.log('\n🔄 Migration des spécialités existantes...');
    
    const usersWithSpecialties = await User.find({
      $or: [
        { specialities: { $exists: true, $ne: [] } },
        { 'specialties.specialtyId': { $exists: true, $ne: [] } }
      ]
    });

    console.log(`📊 ${usersWithSpecialties.length} utilisateurs avec spécialités trouvés`);

    for (const user of usersWithSpecialties) {
      try {
        let userSpecialties = [];
        
        // Récupérer les anciennes spécialités (champ specialities)
        if (user.specialities && user.specialities.length > 0) {
          for (const specName of user.specialities) {
            if (specName && specName.trim()) {
              // Chercher ou créer la spécialité globale
              let globalSpecialty = await GlobalSpecialty.findOne({
                name: { $regex: `^${specName.trim()}$`, $i: true }
              });

              if (!globalSpecialty) {
                // Créer une nouvelle spécialité globale
                globalSpecialty = new GlobalSpecialty({
                  name: specName.trim(),
                  category: 'autre', // Catégorie par défaut
                  aliases: [specName.trim().toLowerCase()],
                  description: `Spécialité: ${specName.trim()}`,
                  createdBy: user._id
                });
                await globalSpecialty.save();
                console.log(`🆕 Nouvelle spécialité créée: ${globalSpecialty.name}`);
              }

              // Incrémenter l'usage
              await globalSpecialty.incrementUsage();
              
              userSpecialties.push({
                specialtyId: globalSpecialty._id,
                expertiseLevel: 3, // Niveau par défaut
                yearsExperience: user.experience || 0
              });
            }
          }
        }

        // Mettre à jour l'utilisateur
        if (userSpecialties.length > 0) {
          user.specialties = userSpecialties;
          user.specialities = undefined; // Supprimer l'ancien champ
          await user.save();
          console.log(`✅ Utilisateur ${user.name} mis à jour avec ${userSpecialties.length} spécialités`);
        }
      } catch (error) {
        console.error(`❌ Erreur migration utilisateur ${user.name}:`, error.message);
      }
    }

    // 3. Migrer les services existants
    console.log('\n🔄 Migration des services existants...');
    
    const services = await Service.find({});
    console.log(`📊 ${services.length} services trouvés`);

    for (const service of services) {
      try {
        if (service.keywords && service.keywords.length > 0) {
          const serviceSpecialties = [];
          
          for (const keyword of service.keywords) {
            if (keyword && keyword.trim()) {
              // Chercher la spécialité correspondante
              let globalSpecialty = await GlobalSpecialty.findOne({
                $or: [
                  { name: { $regex: `^${keyword.trim()}$`, $i: true } },
                  { aliases: { $regex: `^${keyword.trim()}$`, $i: true } }
                ]
              });

              if (globalSpecialty) {
                serviceSpecialties.push({
                  specialtyId: globalSpecialty._id,
                  expertiseLevel: 3
                });
                
                // Incrémenter l'usage
                await globalSpecialty.incrementUsage();
              }
            }
          }

          if (serviceSpecialties.length > 0) {
            service.specialities = serviceSpecialties;
            await service.save();
            console.log(`✅ Service ${service.name} mis à jour avec ${serviceSpecialties.length} spécialités`);
          }
        }
      } catch (error) {
        console.error(`❌ Erreur migration service ${service.name}:`, error.message);
      }
    }

    // 4. Statistiques finales
    console.log('\n📊 STATISTIQUES FINALES');
    
    const totalSpecialties = await GlobalSpecialty.countDocuments();
    const verifiedSpecialties = await GlobalSpecialty.countDocuments({ isVerified: true });
    const totalUsage = await GlobalSpecialty.aggregate([
      { $group: { _id: null, total: { $sum: '$usageCount' } } }
    ]);

    console.log(`🎯 Total spécialités: ${totalSpecialties}`);
    console.log(`✅ Spécialités vérifiées: ${verifiedSpecialties}`);
    console.log(`📈 Total usage: ${totalUsage[0]?.total || 0}`);

    console.log('\n🎉 Migration terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

// Exécuter la migration
migrateGlobalSpecialties();
