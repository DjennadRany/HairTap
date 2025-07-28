import mongoose from 'mongoose';
import User from '../models/User.js';
import mongoURI from '../config/mongoURI.js';

const coiffeurs = [
  {
    name: 'Alice Martin',
    email: 'alice.coiffeur@test.com',
    password: 'Test1234!',
    role: 'coiffeur',
    coiffeurProfile: {
      prestations: [
        { name: 'Coupe femme', price: 30, duration: '45min', description: 'Coupe et brushing' },
        { name: 'Coloration', price: 50, duration: '1h', description: 'Coloration complète' }
      ],
      agenda: [
        { date: '2025-06-01', slots: ['09:00', '10:00', '11:00'] }
      ],
      settings: { acceptsOnlineBooking: true, showProfile: true }
    }
  },
  {
    name: 'Bob Dupont',
    email: 'bob.coiffeur@test.com',
    password: 'Test1234!',
    role: 'coiffeur',
    coiffeurProfile: {
      prestations: [
        { name: 'Barbe', price: 15, duration: '20min', description: 'Taille de barbe' }
      ],
      agenda: [
        { date: '2025-06-01', slots: ['14:00', '15:00'] }
      ],
      settings: { acceptsOnlineBooking: true, showProfile: true }
    }
  }
];

async function seed() {
  await mongoose.connect(mongoURI);
  await User.deleteMany({ role: 'coiffeur' });
  await User.insertMany(coiffeurs);
  console.log('Coiffeurs de test insérés !');
  await mongoose.disconnect();
}

seed(); 