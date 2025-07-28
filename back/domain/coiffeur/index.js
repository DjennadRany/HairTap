// Domaine Coiffeur : logique métier spécifique aux coiffeurs

// Exemple de service pour récupérer tous les coiffeurs
import User from '../../models/User.js';

export async function getAllCoiffeurs() {
  const coiffeurs = await User.find({ role: 'coiffeur' });
  console.log('getAllCoiffeurs - coiffeurs trouvés:', coiffeurs);
  return coiffeurs;
}

// Tu pourras ajouter ici d'autres fonctions métier (gestion agenda, prestations, etc.) 