// back/seed/fixBookings.js
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/taphair'; // adapte si besoin

const bookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.model('Booking', bookingSchema, 'bookings');

async function fixBookings() {
  await mongoose.connect(MONGO_URI);

  const bookings = await Booking.find({});
  for (const booking of bookings) {
    let modified = false;

    // Correction des références
    ['client', 'coiffeur', 'service'].forEach(field => {
      if (booking[field] && typeof booking[field] === 'string' && booking[field].length === 24) {
        booking[field] = new mongoose.Types.ObjectId(booking[field]);
        modified = true;
      }
    });

    // Correction de l'adresse
    if (booking.address && typeof booking.address === 'string') {
      booking.address = {
        street: booking.address,
        city: '',
        postalCode: ''
      };
      modified = true;
    }

    // Correction de la date
    if (booking.date && typeof booking.date === 'string') {
      booking.date = new Date(booking.date);
      modified = true;
    }

    // Correction des champs obligatoires manquants
    if (!booking.createdAt) {
      booking.createdAt = new Date();
      modified = true;
    }
    if (!booking.updatedAt) {
      booking.updatedAt = new Date();
      modified = true;
    }

    // Correction de la durée (par défaut 30 min si manquant)
    if (!booking.duration) {
      booking.duration = 30;
      modified = true;
    }

    // Correction du mode
    if (!booking.mode) {
      booking.mode = 'salon';
      modified = true;
    }

    // Correction du status
    if (!booking.status) {
      booking.status = 'confirmed';
      modified = true;
    }

    // Correction du paymentStatus
    if (!booking.paymentStatus) {
      booking.paymentStatus = 'pending';
      modified = true;
    }

    // Correction du price
    if (!booking.price) {
      booking.price = 0;
      modified = true;
    }

    if (modified) {
      await booking.save();
      console.log(`Booking ${booking._id} corrigé.`);
    }
  }

  await mongoose.disconnect();
  console.log('Correction terminée.');
}

fixBookings().catch(console.error);