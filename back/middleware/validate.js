import { 
  validateEmail, 
  validateName, 
  validatePhone, 
  validateAddress,
  validateUserRole,
  validatePassword,
  validatePrice,
  validateDuration,
  validateDescription,
  validateServiceMode,
  validateBookingStatus,
  validatePaymentStatus
} from '../utils/validators.js';
import { body, validationResult } from 'express-validator';

// Middleware de validation pour les utilisateurs
const validateUser = (req, res, next) => {
  const { name, email, phone, address, role } = req.body;
  const errors = [];

  if (name && !validateName(name)) {
    errors.push('Nom invalide');
  }

  if (email && !validateEmail(email)) {
    errors.push('Email invalide');
  }

  if (phone && !validatePhone(phone)) {
    errors.push('Numéro de téléphone invalide');
  }

  if (address && !validateAddress(address)) {
    errors.push('Adresse invalide');
  }

  if (role && !validateUserRole(role)) {
    errors.push('Rôle invalide');
  }

  if (errors.length > 0) {
    console.log('Erreur de validation utilisateur:', errors, req.body);
    return res.status(400).json({ message: 'Données invalides', errors });
  }

  next();
};

// Middleware de validation pour les coiffeurs
const validateCoiffeur = (req, res, next) => {
  const { name, email, phone, address, services, mode } = req.body;
  const errors = [];

  if (name && !validateName(name)) {
    errors.push('Nom invalide');
  }

  if (email && !validateEmail(email)) {
    errors.push('Email invalide');
  }

  if (phone && !validatePhone(phone)) {
    errors.push('Numéro de téléphone invalide');
  }

  if (address && !validateAddress(address)) {
    errors.push('Adresse invalide');
  }

  if (mode && !validateServiceMode(mode)) {
    errors.push('Mode de service invalide');
  }

  if (services && Array.isArray(services)) {
    services.forEach((service, index) => {
      if (!validateName(service.name)) {
        errors.push(`Nom de service invalide à l'index ${index}`);
      }
      if (!validatePrice(service.price)) {
        errors.push(`Prix invalide pour le service à l'index ${index}`);
      }
      if (!validateDuration(service.duration)) {
        errors.push(`Durée invalide pour le service à l'index ${index}`);
      }
      if (!validateDescription(service.description)) {
        errors.push(`Description invalide pour le service à l'index ${index}`);
      }
    });
  }

  if (errors.length > 0) {
    console.log('Erreur de validation coiffeur:', errors, req.body);
    return res.status(400).json({ message: 'Données invalides', errors });
  }

  next();
};

// Middleware de validation pour les réservations
const validateBooking = (req, res, next) => {
  const { date, status, paymentStatus } = req.body;
  const errors = [];

  if (date && !validateDate(date)) {
    errors.push('Date invalide');
  }

  if (status && !validateBookingStatus(status)) {
    errors.push('Statut de réservation invalide');
  }

  if (paymentStatus && !validatePaymentStatus(paymentStatus)) {
    errors.push('Statut de paiement invalide');
  }

  if (errors.length > 0) {
    console.log('Erreur de validation réservation:', errors, req.body);
    return res.status(400).json({ message: 'Données invalides', errors });
  }

  next();
};

// Middleware de validation pour l'authentification
const validateAuth = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  body('role')
    .optional()
    .isIn(['user', 'coiffeur', 'admin'])
    .withMessage('Rôle invalide'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Middleware de validation pour les fichiers
const validateFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier fourni' });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ message: 'Type de fichier non autorisé' });
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    return res.status(400).json({ message: 'Fichier trop volumineux (max 5MB)' });
  }

  next();
}; 

export { 
  validateUser, 
  validateCoiffeur, 
  validateBooking, 
  validateAuth, 
  validateFile 
}; 