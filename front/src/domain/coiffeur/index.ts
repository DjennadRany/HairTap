// Domaine Coiffeur : logique métier spécifique aux coiffeurs (front)

import httpClient from '../../api/httpClient';

export async function fetchCoiffeurs() {
  const response = await httpClient.get('/coiffeurs');
  return response.data;
}

// Tu pourras ajouter ici d'autres fonctions métier (gestion agenda, prestations, etc.) 