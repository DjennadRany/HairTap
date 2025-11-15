/**
 * Schéma de validation pour le formulaire de réservation
 * Utilise yup (déjà installé) pour la validation
 */

import * as yup from 'yup';

// Schéma de validation pour l'adresse
export const addressSchema = yup.object({
  street: yup.string().required('La rue est requise'),
  streetNumber: yup.string(),
  city: yup.string().required('La ville est requise'),
  postalCode: yup.string()
    .required('Le code postal est requis')
    .matches(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres'),
  floor: yup.string(),
  apartment: yup.string(),
  buildingCode: yup.string(),
  additionalInfo: yup.string(),
  country: yup.string().default('France')
});

// Schéma de validation principal pour la réservation
export const bookingSchema = yup.object({
  serviceId: yup.string().required('Le service est requis'),
  coiffeurId: yup.string().required('Le coiffeur est requis'),
  date: yup.string()
    .required('La date est requise')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  time: yup.string()
    .required('L\'heure est requise')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
  mode: yup.string()
    .oneOf(['salon', 'domicile'], 'Le mode doit être "salon" ou "domicile"')
    .required('Le mode est requis'),
  price: yup.number()
    .positive('Le prix doit être positif')
    .required('Le prix est requis'),
  duration: yup.number()
    .positive('La durée doit être positive')
    .required('La durée est requise'),
  notes: yup.string(),
  address: yup.object().when('mode', {
    is: 'domicile',
    then: (schema) => addressSchema.required('L\'adresse est requise pour une prestation à domicile'),
    otherwise: (schema) => schema.notRequired()
  }).nullable()
});

// Type TypeScript dérivé du schéma
export type BookingFormData = yup.InferType<typeof bookingSchema>;

