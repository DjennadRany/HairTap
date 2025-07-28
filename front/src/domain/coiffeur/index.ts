// Domaine Coiffeur : logique métier spécifique aux coiffeurs (front)

import axios from 'axios';

export async function fetchCoiffeurs() {
  const response = await axios.get('/api/coiffeurs');
  return response.data;
}

// Tu pourras ajouter ici d'autres fonctions métier (gestion agenda, prestations, etc.) 