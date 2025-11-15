/**
 * Validators pour les réservations
 * Utilise express-validator pour une validation centralisée
 */

import { body, param, validationResult } from 'express-validator';

/**
 * Middleware pour gérer les erreurs de validation
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validators pour la création d'une réservation
 */
export const validateCreateBooking = [
  body('coiffeurId')
    .notEmpty()
    .withMessage('Coiffeur requis')
    .isMongoId()
    .withMessage('ID coiffeur invalide'),
  
  body('serviceId')
    .optional()
    .isMongoId()
    .withMessage('ID service invalide'),
  
  body('date')
    .notEmpty()
    .withMessage('Date requise')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Format de date invalide (YYYY-MM-DD)'),
  
  body('time')
    .notEmpty()
    .withMessage('Heure requise')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Format d\'heure invalide (HH:MM)'),
  
  body('mode')
    .notEmpty()
    .withMessage('Mode requis')
    .isIn(['salon', 'domicile'])
    .withMessage('Mode invalide (salon ou domicile)'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Prix invalide'),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Durée invalide (15-480 minutes)'),
  
  body('address')
    .optional()
    .custom((value, { req }) => {
      if (req.body.mode === 'domicile') {
        if (!value || !value.street || !value.city || !value.postalCode) {
          throw new Error('Adresse complète requise pour prestation à domicile');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validators pour la mise à jour d'une réservation
 */
export const validateUpdateBooking = [
  param('id')
    .isMongoId()
    .withMessage('ID réservation invalide'),
  
  body('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Format de date invalide (YYYY-MM-DD)'),
  
  body('time')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Format d\'heure invalide (HH:MM)'),
  
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes trop longues (max 500 caractères)'),
  
  handleValidationErrors
];

/**
 * Validators pour l'annulation d'une réservation
 */
export const validateCancelBooking = [
  param('id')
    .isMongoId()
    .withMessage('ID réservation invalide'),
  
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Raison trop longue (max 200 caractères)'),
  
  handleValidationErrors
];

/**
 * Validators pour la confirmation d'une réservation
 */
export const validateConfirmBooking = [
  param('id')
    .isMongoId()
    .withMessage('ID réservation invalide'),
  
  handleValidationErrors
];

/**
 * Validators pour récupérer une réservation
 */
export const validateGetBooking = [
  param('id')
    .isMongoId()
    .withMessage('ID réservation invalide'),
  
  handleValidationErrors
];

