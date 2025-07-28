/**
 * Valide un numéro SIREN selon l'algorithme de Luhn
 * @param {string} siren - Le numéro SIREN à valider
 * @returns {boolean} - True si le SIREN est valide, false sinon
 */
export const validateSiren = async (siren) => {
  // Vérifier que le SIREN est une chaîne de 9 chiffres
  if (!/^\d{9}$/.test(siren)) {
    return false;
  }

  // Algorithme de Luhn
  let sum = 0;
  for (let i = 0; i < siren.length; i++) {
    let digit = parseInt(siren[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  return sum % 10 === 0;
}; 