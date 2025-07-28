import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const coiffeurs = [
  {
    name: 'Sophie Martin',
    email: 'sophie.martin@example.com',
    password: 'Password123!',
    role: 'coiffeur',
    photo: 'sophie-martin.jpg',
    bio: 'Spécialiste des coupes modernes et des colorations tendance. Plus de 10 ans d\'expérience.',
    phone: '0612345678',
    address: {
      street: '15 rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      coordinates: {
        lat: 48.8566,
        lng: 2.3522
      }
    },
    siren: '123456789',
    sirenStatus: 'verified',
    sirenVerificationDate: new Date('2024-01-01'),
    specialities: ['Coupe moderne', 'Coloration', 'Mèches'],
    rating: 4.8,
    totalRatings: 45,
    workingMode: ['salon', 'domicile'],
    workingHours: {
      monday: { start: '09:00', end: '19:00', isAvailable: true },
      tuesday: { start: '09:00', end: '19:00', isAvailable: true },
      wednesday: { start: '09:00', end: '19:00', isAvailable: true },
      thursday: { start: '09:00', end: '19:00', isAvailable: true },
      friday: { start: '09:00', end: '19:00', isAvailable: true },
      saturday: { start: '10:00', end: '17:00', isAvailable: true },
      sunday: { start: '10:00', end: '17:00', isAvailable: false }
    },
    travelRadius: 15,
    services: [
      {
        name: 'Coupe femme',
        description: 'Coupe moderne adaptée à votre visage',
        duration: 60,
        priceHT: 45,
        tags: ['coupe', 'femme']
      },
      {
        name: 'Coloration complète',
        description: 'Coloration professionnelle avec produits de qualité',
        duration: 120,
        priceHT: 85,
        tags: ['coloration', 'couleur']
      }
    ],
    gallery: [
      {
        url: 'gallery1.jpg',
        description: 'Coupe moderne',
        isVerified: true
      },
      {
        url: 'gallery2.jpg',
        description: 'Coloration tendance',
        isVerified: true
      }
    ],
    likes: 128,
    socialPosts: [
      {
        content: 'Nouvelle collection de coupes d\'été !',
        images: ['summer1.jpg', 'summer2.jpg'],
        hashtags: ['summer', 'haircut', 'trend'],
        likes: 45,
        comments: []
      }
    ],
    preferences: {
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      language: 'fr',
      theme: 'light',
      privacy: {
        showPhone: false,
        showAddress: true
      }
    },
    stats: {
      totalBookings: 156,
      completedBookings: 150,
      cancelledBookings: 6,
      averageRating: 4.8,
      profileViews: 1250
    }
  },
  {
    name: 'Thomas Dubois',
    email: 'thomas.dubois@example.com',
    password: 'Password123!',
    role: 'coiffeur',
    photo: 'thomas-dubois.jpg',
    bio: 'Expert en coupes homme et barbe. Style classique et moderne.',
    phone: '0623456789',
    address: {
      street: '8 avenue des Champs-Élysées',
      city: 'Paris',
      postalCode: '75008',
      coordinates: {
        lat: 48.8698,
        lng: 2.3079
      }
    },
    siren: '987654321',
    sirenStatus: 'verified',
    sirenVerificationDate: new Date('2024-01-15'),
    specialities: ['Coupe homme', 'Barbe', 'Rasage'],
    rating: 4.9,
    totalRatings: 78,
    workingMode: ['salon'],
    workingHours: {
      monday: { start: '10:00', end: '20:00', isAvailable: true },
      tuesday: { start: '10:00', end: '20:00', isAvailable: true },
      wednesday: { start: '10:00', end: '20:00', isAvailable: true },
      thursday: { start: '10:00', end: '20:00', isAvailable: true },
      friday: { start: '10:00', end: '20:00', isAvailable: true },
      saturday: { start: '10:00', end: '18:00', isAvailable: true },
      sunday: { start: '10:00', end: '18:00', isAvailable: false }
    },
    travelRadius: 0,
    services: [
      {
        name: 'Coupe homme',
        description: 'Coupe classique ou moderne',
        duration: 30,
        priceHT: 35,
        tags: ['coupe', 'homme']
      },
      {
        name: 'Taille de barbe',
        description: 'Taille et entretien de la barbe',
        duration: 45,
        priceHT: 25,
        tags: ['barbe', 'entretien']
      }
    ],
    gallery: [
      {
        url: 'gallery3.jpg',
        description: 'Coupe homme moderne',
        isVerified: true
      },
      {
        url: 'gallery4.jpg',
        description: 'Taille de barbe',
        isVerified: true
      }
    ],
    likes: 215,
    socialPosts: [
      {
        content: 'Nouvelle technique de taille de barbe !',
        images: ['beard1.jpg'],
        hashtags: ['beard', 'grooming', 'style'],
        likes: 89,
        comments: []
      }
    ],
    preferences: {
      notifications: {
        email: true,
        sms: true,
        push: true
      },
      language: 'fr',
      theme: 'dark',
      privacy: {
        showPhone: true,
        showAddress: true
      }
    },
    stats: {
      totalBookings: 245,
      completedBookings: 240,
      cancelledBookings: 5,
      averageRating: 4.9,
      profileViews: 1890
    }
  }
];

const seedCoiffeurs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Supprimer les coiffeurs existants
    await User.deleteMany({ role: 'coiffeur' });
    console.log('Deleted existing coiffeurs');

    // Insérer les nouveaux coiffeurs
    const createdCoiffeurs = await User.insertMany(coiffeurs);
    console.log('Created new coiffeurs:', createdCoiffeurs.length);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding coiffeurs:', error);
    process.exit(1);
  }
};

seedCoiffeurs(); 