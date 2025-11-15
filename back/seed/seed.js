import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const users = [
  // Clients
  {
    name: 'Alice Martin',
    email: 'alice.martin@test.com',
    password: 'alice123',
    role: 'user',
    phone: '0600000001',
    address: {
      street: '12 rue des Artistes',
      city: 'Paris',
      postalCode: '75010',
      coordinates: { lat: 48.8742, lng: 2.3708 }
    },
    photo: 'default-avatar.png',
    preferences: {
      notifications: { email: true, sms: false },
      language: 'fr',
      theme: 'light'
    }
  },
  {
    name: 'Bob Dupont',
    email: 'bob.dupont@test.com',
    password: 'bob123',
    role: 'user',
    phone: '0600000002',
    address: {
      street: '34 avenue de Lyon',
      city: 'Lyon',
      postalCode: '69000',
      coordinates: { lat: 45.7578, lng: 4.8320 }
    },
    photo: 'default-avatar.png',
    preferences: {
      notifications: { email: true, sms: true },
      language: 'fr',
      theme: 'dark'
    }
  },
  // Coiffeurs
  {
    name: 'Marie Dubois',
    email: 'marie.dubois@taphair.com',
    password: 'marie123',
    role: 'coiffeur',
    phone: '0700000001',
    address: {
      street: '12 rue des Artistes',
      city: 'Paris',
      postalCode: '75010',
      coordinates: { lat: 48.8742, lng: 2.3708 }
    },
    photo: 'default-avatar.png',
    speciality: ['coupe femme', 'coloration'],
    rating: 4.7,
    priceRange: '€€',
    workingHours: {
      monday: { start: '09:00', end: '19:00' },
      tuesday: { start: '09:00', end: '19:00' },
      wednesday: { start: '09:00', end: '19:00' },
      thursday: { start: '09:00', end: '19:00' },
      friday: { start: '09:00', end: '19:00' },
      saturday: { start: '10:00', end: '18:00' },
      sunday: { start: '', end: '' }
    },
    description: 'Spécialiste en coupe et coloration pour femme',
    preferences: {
      notifications: { email: true, sms: true },
      language: 'fr',
      theme: 'light'
    }
  },
  {
    name: 'Pierre Martin',
    email: 'pierre.martin@taphair.com',
    password: 'pierre123',
    role: 'coiffeur',
    phone: '0700000002',
    address: {
      street: '56 avenue de la République',
      city: 'Paris',
      postalCode: '75011',
      coordinates: { lat: 48.8655, lng: 2.3802 }
    },
    photo: 'default-avatar.png',
    speciality: ['barbe', 'coupe homme'],
    rating: 4.9,
    priceRange: '€€€',
    workingHours: {
      monday: { start: '10:00', end: '20:00' },
      tuesday: { start: '10:00', end: '20:00' },
      wednesday: { start: '10:00', end: '20:00' },
      thursday: { start: '10:00', end: '20:00' },
      friday: { start: '10:00', end: '20:00' },
      saturday: { start: '10:00', end: '18:00' },
      sunday: { start: '', end: '' }
    },
    description: 'Expert en coupe homme et barbe',
    preferences: {
      notifications: { email: true, sms: true },
      language: 'fr',
      theme: 'light'
    }
  },
  // Admin
  {
    name: 'Admin System',
    email: 'admin@taphair.com',
    password: 'admin123',
    role: 'admin',
    phone: '0600000000',
    address: {
      street: "1 rue de l'Admin",
      city: 'Paris',
      postalCode: '75001',
      coordinates: { lat: 48.8566, lng: 2.3522 }
    },
    photo: 'default-avatar.png',
    preferences: {
      notifications: { email: true, sms: true },
      language: 'fr',
      theme: 'light'
    }
  }
];

const servicesData = [
  // Pour Marie Dubois
  [
  {
    name: 'Coupe femme',
    description: 'Coupe personnalisée pour femme',
    price: 40,
    duration: 30,
      category: 'coupe',
      isActive: true
  },
  {
    name: 'Coloration',
    description: 'Coloration professionnelle',
    price: 60,
    duration: 60,
      category: 'coloration',
      isActive: true
    }
  ],
  // Pour Pierre Martin
  [
  {
    name: 'Barbe',
    description: 'Taille et soin de la barbe',
    price: 20,
    duration: 20,
      category: 'barbe',
      isActive: true
  },
  {
    name: 'Coupe homme',
    description: 'Coupe personnalisée pour homme',
    price: 25,
    duration: 25,
      category: 'coupe',
      isActive: true
    }
  ]
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taphair');
    await Promise.all([
      User.deleteMany({}),
      Service.deleteMany({}),
      Booking.deleteMany({})
    ]);

    // Créer les utilisateurs
    const createdUsers = await User.create(users);
    const clients = createdUsers.filter(u => u.role === 'user');
    const coiffeurs = createdUsers.filter(u => u.role === 'coiffeur');

    // Créer les services pour chaque coiffeur
    const allServices = [];
    for (let i = 0; i < coiffeurs.length; i++) {
      const coiffeur = coiffeurs[i];
      const coiffeurServices = servicesData[i].map(service => ({ ...service, coiffeur: coiffeur._id }));
      const createdServices = await Service.create(coiffeurServices);
      allServices.push(...createdServices);
    }

    // Créer 1 réservation par client avec un coiffeur
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const coiffeur = coiffeurs[i % coiffeurs.length];
      const service = allServices.find(s => s.coiffeur.toString() === coiffeur._id.toString());
      await Booking.create({
        client: client._id,
        coiffeur: coiffeur._id,
        service: service._id,
        date: new Date(Date.now() + 86400000 * (i + 1)),
        duration: service.duration,
        status: 'confirmed',
        paymentStatus: 'initiated',
        price: service.price,
        mode: 'salon',
        address: client.address,
        notes: 'Réservation de test'
      });
    }

    // Ajouter 1 coiffeur en favori pour chaque client
    for (let i = 0; i < clients.length; i++) {
      const client = await User.findById(clients[i]._id);
      const coiffeur = coiffeurs[i % coiffeurs.length];
      client.favorites = [coiffeur._id];
      await client.save();
    }

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 