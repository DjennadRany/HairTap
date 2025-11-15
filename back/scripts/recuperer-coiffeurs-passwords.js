import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';
import User from '../models/User.js';

/**
 * Script pour récupérer tous les identifiants (emails) et mots de passe hashés des coiffeurs
 * Note: Les mots de passe sont hashés avec bcrypt et ne peuvent pas être décryptés
 */
const recupererCoiffeursPasswords = async () => {
  try {
    // Connexion à MongoDB
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer tous les coiffeurs avec leurs emails et mots de passe
    // Note: password a select: false, donc on doit utiliser select('+password') pour l'inclure
    const coiffeurs = await User.find({ role: 'coiffeur' })
      .select('+password')
      .select('name email password createdAt')
      .sort({ email: 1 });

    console.log(`📊 Total de coiffeurs trouvés: ${coiffeurs.length}\n`);
    console.log('═'.repeat(80));
    console.log('LISTE DES COIFFEURS - IDENTIFIANTS ET MOTS DE PASSE');
    console.log('═'.repeat(80));
    console.log('');

    if (coiffeurs.length === 0) {
      console.log('❌ Aucun coiffeur trouvé dans la base de données.');
    } else {
      // Afficher chaque coiffeur
      coiffeurs.forEach((coiffeur, index) => {
        console.log(`${index + 1}. ${coiffeur.name}`);
        console.log(`   📧 Email: ${coiffeur.email}`);
        console.log(`   🔐 Mot de passe (hashé): ${coiffeur.password || '❌ Aucun mot de passe'}`);
        console.log(`   📅 Date de création: ${coiffeur.createdAt ? new Date(coiffeur.createdAt).toLocaleDateString('fr-FR') : 'N/A'}`);
        console.log('');
      });

      // Résumé
      console.log('═'.repeat(80));
      console.log('RÉSUMÉ');
      console.log('═'.repeat(80));
      console.log(`Total coiffeurs: ${coiffeurs.length}`);
      console.log(`Coiffeurs avec mot de passe: ${coiffeurs.filter(c => c.password).length}`);
      console.log(`Coiffeurs sans mot de passe: ${coiffeurs.filter(c => !c.password).length}`);
      console.log('');

      // Liste simple pour copier-coller
      console.log('═'.repeat(80));
      console.log('LISTE SIMPLE (EMAILS)');
      console.log('═'.repeat(80));
      coiffeurs.forEach((coiffeur, index) => {
        console.log(`${index + 1}. ${coiffeur.email}`);
      });
      console.log('');

      // Export CSV format
      console.log('═'.repeat(80));
      console.log('FORMAT CSV');
      console.log('═'.repeat(80));
      console.log('Nom,Email,Mot de passe (hashé),Date de création');
      coiffeurs.forEach((coiffeur) => {
        const name = (coiffeur.name || '').replace(/,/g, ' ');
        const email = coiffeur.email || '';
        const password = (coiffeur.password || 'AUCUN').replace(/,/g, ' ');
        const date = coiffeur.createdAt ? new Date(coiffeur.createdAt).toLocaleDateString('fr-FR') : 'N/A';
        console.log(`${name},${email},${password},${date}`);
      });
    }

    // Déconnexion
    await mongoose.disconnect();
    console.log('\n✅ Script terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

// Exécuter le script
recupererCoiffeursPasswords();





