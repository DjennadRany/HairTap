// back/seed/seedBookings.js
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/taphair'; // adapte si besoin

const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false }), 'bookings');
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
const Service = mongoose.model('Service', new mongoose.Schema({}, { strict: false }), 'services');

async function seedBookings() {
  await mongoose.connect(MONGO_URI);

  // Récupère un client, deux coiffeurs et leurs services
  const client = await User.findOne({ role: 'user' });
  const coiffeurs = await User.find({ role: 'coiffeur' }).limit(2);
  const services = await Service.find({ coiffeur: { $in: coiffeurs.map(c => c._id) } });

  if (!client || coiffeurs.length < 2 || services.length < 2) {
    console.error('Pas assez de données pour seed bookings');
    process.exit(1);
  }

  // Exemples de bookings
  const bookings = [
    {
      client: client._id,
      coiffeur: coiffeurs[0]._id,
      service: services[0]._id,
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // dans 3 jours
      duration: services[0].duration || 30,
      status: 'confirmed',
      paymentStatus: 'paid',
      price: services[0].price,
      mode: 'salon',
      address: { street: '12 rue des Artistes', city: 'Paris', postalCode: '75010' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      client: client._id,
      coiffeur: coiffeurs[1]._id,
      service: services[1]._id,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // dans 7 jours
      duration: services[1].duration || 45,
      status: 'pending',
      paymentStatus: 'pending',
      price: services[1].price,
      mode: 'domicile',
      address: { street: '56 avenue de la République', city: 'Paris', postalCode: '75011' },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  await Booking.insertMany(bookings);
  console.log('Bookings de test insérés !');
  await mongoose.disconnect();
}

seedBookings().catch(console.error);