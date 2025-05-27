const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TapHair')
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Schémas
const coiffeurSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: { type: String, default: 'coiffeur' },
  speciality: [String],
  address: {
    street: String,
    city: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  phone: String,
  rating: { type: Number, default: 0 },
  priceRange: { type: String, enum: ['€', '€€', '€€€'] },
  workingHours: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  photos: [String],
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const serviceSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  duration: Number,
  category: { type: String, enum: ['coupe', 'coloration', 'coiffure', 'soin', 'barbe', 'autre'] },
  coiffeur: { type: mongoose.Schema.Types.ObjectId, ref: 'Coiffeur' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Coiffeur = mongoose.model('Coiffeur', coiffeurSchema);
const Service = mongoose.model('Service', serviceSchema);

// Données de test
const coiffeurs = [
  {
    name: "Salon Coiffure Paris",
    email: "contact@saloncoiffureparis.fr",
    speciality: ["coupe", "coloration", "coiffure"],
    address: {
      street: "123 rue de la Paix",
      city: "Paris",
      postalCode: "75001",
      coordinates: {
        lat: 48.8566,
        lng: 2.3522
      }
    },
    phone: "0123456789",
    rating: 4.5,
    priceRange: "€€",
    workingHours: {
      monday: { start: "09:00", end: "19:00" },
      tuesday: { start: "09:00", end: "19:00" },
      wednesday: { start: "09:00", end: "19:00" },
      thursday: { start: "09:00", end: "19:00" },
      friday: { start: "09:00", end: "19:00" },
      saturday: { start: "09:00", end: "17:00" },
      sunday: { start: "10:00", end: "16:00" }
    },
    photos: ["salon1.jpg", "salon2.jpg"],
    description: "Salon de coiffure moderne au cœur de Paris"
  },
  {
    name: "Coiffure Express",
    email: "contact@coiffureexpress.fr",
    speciality: ["coupe", "barbe", "soin"],
    address: {
      street: "45 avenue des Champs-Élysées",
      city: "Paris",
      postalCode: "75008",
      coordinates: {
        lat: 48.8698,
        lng: 2.3079
      }
    },
    phone: "0123456788",
    rating: 4.2,
    priceRange: "€",
    workingHours: {
      monday: { start: "10:00", end: "20:00" },
      tuesday: { start: "10:00", end: "20:00" },
      wednesday: { start: "10:00", end: "20:00" },
      thursday: { start: "10:00", end: "20:00" },
      friday: { start: "10:00", end: "20:00" },
      saturday: { start: "10:00", end: "18:00" },
      sunday: { start: "10:00", end: "16:00" }
    },
    photos: ["express1.jpg", "express2.jpg"],
    description: "Service rapide et efficace pour vos besoins de coiffure"
  }
];

const services = [
  {
    name: "Coupe Homme",
    description: "Coupe de cheveux classique pour homme",
    price: 25,
    duration: 30,
    category: "coupe",
    isActive: true
  },
  {
    name: "Coloration",
    description: "Coloration professionnelle",
    price: 60,
    duration: 120,
    category: "coloration",
    isActive: true
  },
  {
    name: "Coupe Femme",
    description: "Coupe de cheveux pour femme",
    price: 35,
    duration: 45,
    category: "coupe",
    isActive: true
  },
  {
    name: "Taille de Barbe",
    description: "Taille et entretien de la barbe",
    price: 20,
    duration: 30,
    category: "barbe",
    isActive: true
  }
];

// Fonction de seed
async function seed() {
  try {
    // Nettoyer la base de données
    await Coiffeur.deleteMany({});
    await Service.deleteMany({});

    // Insérer les coiffeurs
    const insertedCoiffeurs = await Coiffeur.insertMany(coiffeurs);
    console.log('Coiffeurs insérés avec succès');

    // Insérer les services pour chaque coiffeur
    for (const coiffeur of insertedCoiffeurs) {
      const coiffeurServices = services.map(service => ({
        ...service,
        coiffeur: coiffeur._id
      }));
      await Service.insertMany(coiffeurServices);
    }
    console.log('Services insérés avec succès');

    console.log('Seed terminé avec succès');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du seed:', error);
    process.exit(1);
  }
}

// Exécuter le seed
seed(); 