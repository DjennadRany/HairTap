// Validation d'email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validation de mot de passe
export const validatePassword = (password) => {
  // Au moins 8 caractères, une majuscule, une minuscule et un chiffre
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return re.test(password);
};

// Validation de numéro de téléphone
export const validatePhone = (phone) => {
  const re = /^(\+33|0)[1-9](\d{2}){4}$/;
  return re.test(phone);
};

// Validation de date
export const validateDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d) && d > new Date();
};

// Validation de prix
export const validatePrice = (price) => {
  return typeof price === 'number' && price >= 0;
};

// Validation d'adresse
export const validateAddress = (address) => {
  return typeof address === 'string' && address.length >= 5;
};

// Validation de nom
export const validateName = (name) => {
  return typeof name === 'string' && name.length >= 2;
};

// Validation de description
export const validateDescription = (description) => {
  return typeof description === 'string' && description.length >= 10;
};

// Validation de note
export const validateRating = (rating) => {
  return typeof rating === 'number' && rating >= 0 && rating <= 5;
};

// Validation de durée (en minutes)
export const validateDuration = (duration) => {
  return typeof duration === 'number' && duration > 0 && duration <= 480;
};

// Validation de statut de réservation
export const validateBookingStatus = (status) => {
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  return validStatuses.includes(status);
};

// Validation de statut de paiement
export const validatePaymentStatus = (status) => {
  const validStatuses = ['pending', 'paid', 'refunded'];
  return validStatuses.includes(status);
};

// Validation de mode de prestation
export const validateServiceMode = (mode) => {
  const validModes = ['salon', 'domicile'];
  return validModes.includes(mode);
};

// Validation de rôle utilisateur
export const validateUserRole = (role) => {
  const validRoles = ['client', 'coiffeur', 'admin'];
  return validRoles.includes(role);
}; 