import { SearchResult } from './types';
import { format, addDays, subDays } from 'date-fns';

// Coiffeurs en Île-de-France
export const idfCoiffeurs: SearchResult[] = [
  {
    id: 1,
    name: "Studio Jean-Claude",
    type: "salon",
    address: "15 Rue de Rivoli, 75001 Paris",
    rating: 4.8,
    reviews: 156,
    price: 45,
    location: { latitude: 48.856614, longitude: 2.352222 },
    services: ["Coupe", "Coloration", "Brushing"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=1"
  },
  {
    id: 2,
    name: "L'Atelier de Marie",
    type: "salon",
    address: "8 Avenue des Champs-Élysées, 75008 Paris",
    rating: 4.6,
    reviews: 203,
    price: 65,
    location: { latitude: 48.871944, longitude: 2.307222 },
    services: ["Coupe", "Balayage", "Coiffure de mariage"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=2"
  },
  {
    id: 3,
    name: "Coiff'à domicile",
    type: "domicile",
    address: "92100 Boulogne-Billancourt",
    rating: 4.9,
    reviews: 89,
    price: 55,
    location: { latitude: 48.834497, longitude: 2.244997 },
    services: ["Coupe", "Brushing", "Coiffure événementielle"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=3"
  },
  {
    id: 4,
    name: "Le Salon Versaillais",
    type: "salon",
    address: "23 Rue de la Paroisse, 78000 Versailles",
    rating: 4.7,
    reviews: 167,
    price: 50,
    location: { latitude: 48.804722, longitude: 2.120556 },
    services: ["Coupe", "Mèches", "Lissage brésilien"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=4"
  },
  {
    id: 5,
    name: "Style & Co",
    type: "salon",
    address: "45 Avenue du Général Leclerc, 93500 Pantin",
    rating: 4.5,
    reviews: 142,
    price: 40,
    location: { latitude: 48.893889, longitude: 2.412222 },
    services: ["Coupe", "Coloration", "Défrisage"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=5"
  },
  {
    id: 6,
    name: "Hair Beauty",
    type: "salon",
    address: "12 Rue de la République, 94700 Maisons-Alfort",
    rating: 4.4,
    reviews: 98,
    price: 35,
    location: { latitude: 48.803889, longitude: 2.436944 },
    services: ["Coupe", "Brushing", "Permanente"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=6"
  },
  {
    id: 7,
    name: "Coiff'Express",
    type: "domicile",
    address: "95100 Argenteuil",
    rating: 4.6,
    reviews: 76,
    price: 45,
    location: { latitude: 48.947778, longitude: 2.249722 },
    services: ["Coupe", "Coiffure express", "Barbe"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=7"
  },
  {
    id: 8,
    name: "Le Salon Moderne",
    type: "salon",
    address: "34 Avenue Henri Barbusse, 93000 Bobigny",
    rating: 4.3,
    reviews: 112,
    price: 38,
    location: { latitude: 48.904722, longitude: 2.445833 },
    services: ["Coupe", "Coloration", "Tresses"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=8"
  },
  {
    id: 9,
    name: "Élégance Coiffure",
    type: "salon",
    address: "56 Rue du Commerce, 75015 Paris",
    rating: 4.7,
    reviews: 189,
    price: 55,
    location: { latitude: 48.847778, longitude: 2.298889 },
    services: ["Coupe", "Balayage", "Chignon"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=9"
  },
  {
    id: 10,
    name: "Hair at Home",
    type: "domicile",
    address: "77000 Melun",
    rating: 4.8,
    reviews: 67,
    price: 50,
    location: { latitude: 48.542222, longitude: 2.660833 },
    services: ["Coupe", "Coloration", "Coiffure de mariée"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=10"
  }
];

// Coiffeurs à travers la France
export const franceCoiffeurs: SearchResult[] = [
  // Lyon
  {
    id: 11,
    name: "Lyon Hair Studio",
    type: "salon",
    address: "15 Rue de la République, 69001 Lyon",
    rating: 4.7,
    reviews: 178,
    price: 48,
    location: { latitude: 45.767778, longitude: 4.836944 },
    services: ["Coupe", "Coloration", "Brushing"],
    image: "https://example.com/salon11.jpg"
  },
  // Marseille
  {
    id: 12,
    name: "Le Salon Marseillais",
    type: "salon",
    address: "45 Rue Paradis, 13001 Marseille",
    rating: 4.6,
    reviews: 145,
    price: 42,
    location: { latitude: 43.296944, longitude: 5.376667 },
    services: ["Coupe", "Balayage", "Coiffure méditerranéenne"],
    image: "https://example.com/salon12.jpg"
  },
  // Toulouse
  {
    id: 13,
    name: "Coiff'Occitanie",
    type: "salon",
    address: "23 Rue d'Alsace-Lorraine, 31000 Toulouse",
    rating: 4.8,
    reviews: 156,
    price: 45,
    location: { latitude: 43.604722, longitude: 1.444444 },
    services: ["Coupe", "Coloration", "Lissage"],
    image: "https://example.com/salon13.jpg"
  },
  // Nice
  {
    id: 14,
    name: "Riviera Style",
    type: "salon",
    address: "12 Avenue Jean Médecin, 06000 Nice",
    rating: 4.9,
    reviews: 203,
    price: 60,
    location: { latitude: 43.700000, longitude: 7.266667 },
    services: ["Coupe", "Balayage", "Coiffure de plage"],
    image: "https://example.com/salon14.jpg"
  },
  // Nantes
  {
    id: 15,
    name: "L'Atelier Nantais",
    type: "salon",
    address: "34 Rue Crébillon, 44000 Nantes",
    rating: 4.5,
    reviews: 134,
    price: 40,
    location: { latitude: 47.216667, longitude: -1.550000 },
    services: ["Coupe", "Mèches", "Brushing"],
    image: "https://example.com/salon15.jpg"
  },
  // Strasbourg
  {
    id: 16,
    name: "Coiffure Alsacienne",
    type: "salon",
    address: "15 Place Kléber, 67000 Strasbourg",
    rating: 4.7,
    reviews: 167,
    price: 47,
    location: { latitude: 48.583333, longitude: 7.750000 },
    services: ["Coupe", "Coloration", "Coiffure traditionnelle"],
    image: "https://example.com/salon16.jpg"
  },
  // Montpellier
  {
    id: 17,
    name: "Sud Coiffure",
    type: "salon",
    address: "23 Rue de la Loge, 34000 Montpellier",
    rating: 4.6,
    reviews: 145,
    price: 43,
    location: { latitude: 43.610769, longitude: 3.876716 },
    services: ["Coupe", "Balayage", "Coiffure estivale"],
    image: "https://example.com/salon17.jpg"
  },
  // Bordeaux
  {
    id: 18,
    name: "Le Salon Bordelais",
    type: "salon",
    address: "45 Cours de l'Intendance, 33000 Bordeaux",
    rating: 4.8,
    reviews: 189,
    price: 50,
    location: { latitude: 44.837789, longitude: -0.579180 },
    services: ["Coupe", "Coloration", "Coiffure de mariage"],
    image: "https://example.com/salon18.jpg"
  },
  // Lille
  {
    id: 19,
    name: "Ch'ti Hair",
    type: "salon",
    address: "67 Rue de la Grande Chaussée, 59800 Lille",
    rating: 4.4,
    reviews: 123,
    price: 38,
    location: { latitude: 50.637222, longitude: 3.063333 },
    services: ["Coupe", "Brushing", "Coiffure du Nord"],
    image: "https://example.com/salon19.jpg"
  },
  // Rennes
  {
    id: 20,
    name: "Breizh Coiffure",
    type: "salon",
    address: "12 Rue Le Bastard, 35000 Rennes",
    rating: 4.7,
    reviews: 156,
    price: 42,
    location: { latitude: 48.117266, longitude: -1.677793 },
    services: ["Coupe", "Coloration", "Coiffure bretonne"],
    image: "https://example.com/salon20.jpg"
  }
];

// Fonction pour obtenir tous les coiffeurs
export const getAllCoiffeurs = (): SearchResult[] => {
  return [...idfCoiffeurs, ...franceCoiffeurs];
}; 

// Réservations mockées pour le client
export const mockClientBookings = [
  {
    id: "1",
    coiffeurId: 2,
    coiffeurName: "Studio Jean",
    service: "Coupe Homme",
    date: format(addDays(new Date(), 2), 'yyyy-MM-dd\'T\'HH:mm'),
    price: 25,
    status: 'confirmed' as const,
    mode: 'salon' as const,
    paymentStatus: 'paid' as const,
    cancellationDeadline: format(addDays(new Date(), 1), 'yyyy-MM-dd\'T\'HH:mm')
  },
  {
    id: "2",
    coiffeurId: 3,
    coiffeurName: "Sarah Coiffure",
    service: "Coloration",
    date: format(addDays(new Date(), 5), 'yyyy-MM-dd\'T\'HH:mm'),
    price: 65,
    status: 'pending' as const,
    mode: 'domicile' as const,
    address: "12 rue Victor Hugo, Lyon",
    paymentStatus: 'pending' as const,
    cancellationDeadline: format(addDays(new Date(), 4), 'yyyy-MM-dd\'T\'HH:mm')
  },
  {
    id: "3",
    coiffeurId: 2,
    coiffeurName: "Studio Jean",
    service: "Coupe + Barbe",
    date: format(subDays(new Date(), 3), 'yyyy-MM-dd\'T\'HH:mm'),
    price: 35,
    status: 'completed' as const,
    mode: 'salon' as const,
    paymentStatus: 'paid' as const,
    cancellationDeadline: format(subDays(new Date(), 4), 'yyyy-MM-dd\'T\'HH:mm')
  },
  {
    id: "4",
    coiffeurId: 4,
    coiffeurName: "Marie Style",
    service: "Coupe Femme",
    date: format(subDays(new Date(), 10), 'yyyy-MM-dd\'T\'HH:mm'),
    price: 45,
    status: 'cancelled' as const,
    mode: 'salon' as const,
    paymentStatus: 'refunded' as const,
    cancellationDeadline: format(subDays(new Date(), 11), 'yyyy-MM-dd\'T\'HH:mm')
  }
]; 