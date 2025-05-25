import { SearchResult } from './types';
import { format, addDays, subDays } from 'date-fns';
import { mockUsers } from '../../../mocks/users';

// Coiffeurs en Île-de-France
export const idfCoiffeurs: SearchResult[] = mockUsers
  .filter(u => u.role === 'coiffeur')
  .map((u, idx) => ({
    id: Number(u.id) || idx + 1,
    name: u.name,
    type: 'salon',
    mode: ['salon', 'domicile'],
    address: u.address || '',
    rating: u.rating || 0,
    reviews: u.reviewsCount || 0,
    price: u.services?.[0]?.priceHT || 40,
    minPrice: u.services?.[0]?.priceHT || 40,
    location: getLocationFromAddress(u.address, idx),
    services: u.services?.map(s => s.name) || [],
    image: u.picture
  }));

function getLocationFromAddress(_: string | undefined, idx: number) {
  // Pour la démo, coordonnées fixes par coiffeur, à améliorer si besoin
  const coords = [
    { latitude: 48.8762, longitude: 2.3585 }, // Marie
    { latitude: 48.8655, longitude: 2.3802 }, // Paul
    { latitude: 48.8462, longitude: 2.3739 }, // Sophie
  ];
  return coords[idx] || { latitude: 48.85 + idx * 0.01, longitude: 2.35 + idx * 0.01 };
}

// On vide franceCoiffeurs pour ne garder que les comptes test
export const franceCoiffeurs: SearchResult[] = [];

// Fonction pour obtenir tous les coiffeurs
export const getAllCoiffeurs = (): SearchResult[] => {
  return [...idfCoiffeurs, ...franceCoiffeurs];
}; 

// Réservations mockées pour le client
export const mockClientBookings = [
  {
    id: "1",
    clientId: "1",
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
    clientId: "1",
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
    clientId: "1",
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
    clientId: "1",
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