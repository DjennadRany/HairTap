export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'coiffeur';
  picture: string;
  bio?: string;
  specialties?: string;
  experience?: string;
  diplomas?: string;
  address?: string;
  tarifs?: string;
  gallery?: string[];
  rating?: number;
  reviewsCount?: number;
  services?: Service[];
}

export interface Service {
  name: string;
  priceHT: number;
  duration: string;
  description: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'client@test.com',
    name: 'John Client',
    role: 'client',
    picture: 'https://ui-avatars.com/api/?name=John+Client'
  },
  {
    id: '2',
    email: 'coiffeur@test.com',
    name: 'Marie Coiffeuse',
    role: 'coiffeur',
    picture: 'https://ui-avatars.com/api/?name=Marie+Coiffeuse',
    bio: 'Coiffeuse passionnée, experte en coupes modernes et colorations. À l\'écoute de vos envies pour révéler votre style.',
    specialties: 'Coupe femme, Brushing, Coloration, Balayage',
    experience: '8',
    diplomas: 'CAP Coiffeure, Brevet Professionnel',
    address: '12 rue des Artistes, 75010 Paris',
    tarifs: 'Coupe: 40€, Brushing: 30€, Balayage: 60€',
    gallery: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2'
    ],
    rating: 4.9,
    reviewsCount: 45,
    services: [
      { name: 'Coupe', priceHT: 40, duration: '30 min', description: 'Coupe femme personnalisée, brushing inclus.' },
      { name: 'Brushing', priceHT: 30, duration: '25 min', description: 'Brushing lisse ou wavy.' },
      { name: 'Balayage', priceHT: 60, duration: '1h', description: 'Balayage naturel, effet soleil.' }
    ]
  },
  {
    id: '3',
    email: 'paul@coiffeur.com',
    name: 'Paul Barbier',
    role: 'coiffeur',
    picture: 'https://ui-avatars.com/api/?name=Paul+Barbier',
    bio: 'Barbier et coiffeur homme, spécialiste des dégradés et tailles de barbe.',
    specialties: 'Coupe homme, Taille de barbe, Dégradé américain',
    experience: '5',
    diplomas: 'CAP Coiffure',
    address: '5 avenue de la République, 75011 Paris',
    tarifs: 'Coupe: 30€, Barbe: 20€, Dégradé: 35€',
    gallery: [
      'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
      'https://images.unsplash.com/photo-1464983953574-0892a716854b'
    ],
    rating: 4.7,
    reviewsCount: 28,
    services: [
      { name: 'Coupe homme', priceHT: 30, duration: '25 min', description: 'Coupe moderne, coiffage inclus.' },
      { name: 'Taille de barbe', priceHT: 20, duration: '15 min', description: 'Rasage ou taille de barbe, soin inclus.' },
      { name: 'Dégradé américain', priceHT: 35, duration: '35 min', description: 'Dégradé progressif, finition précise.' }
    ]
  },
  {
    id: '4',
    email: 'sophie@coiffeur.com',
    name: 'Sophie Styliste',
    role: 'coiffeur',
    picture: 'https://ui-avatars.com/api/?name=Sophie+Styliste',
    bio: 'Styliste visagiste, experte en coloration et relooking.',
    specialties: 'Coloration, Relooking, Coupe femme',
    experience: '10',
    diplomas: 'BP Coiffure, Coloriste',
    address: '22 rue de Lyon, 75012 Paris',
    tarifs: 'Coloration: 60€, Coupe: 45€, Relooking: 80€',
    gallery: [
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
    ],
    rating: 4.8,
    reviewsCount: 32,
    services: [
      { name: 'Coloration', priceHT: 60, duration: '1h', description: 'Coloration professionnelle, soin inclus.' },
      { name: 'Coupe femme', priceHT: 45, duration: '35 min', description: 'Coupe, brushing, conseils morpho.' },
      { name: 'Relooking', priceHT: 80, duration: '1h30', description: 'Changement de style complet, conseils personnalisés.' }
    ]
  },
  {
    id: '5',
    email: 'rany@test.com',
    name: 'Rany Client',
    role: 'client',
    picture: 'https://ui-avatars.com/api/?name=Rany+Client'
  },
  {
    id: '6',
    email: 'malik@test.com',
    name: 'Malik Coiffeur',
    role: 'coiffeur',
    picture: 'https://ui-avatars.com/api/?name=Malik+Coiffeur',
    bio: 'Coiffeur polyvalent, expert en coupes modernes et classiques.',
    specialties: 'Coupe homme, Coupe femme, Barbe',
    experience: '7',
    diplomas: 'CAP Coiffure',
    address: '10 rue de la Beauté, 75020 Paris',
    tarifs: 'Coupe homme: 25€, Coupe femme: 35€, Barbe: 15€',
    gallery: [
      'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9'
    ],
    rating: 4.6,
    reviewsCount: 18,
    services: [
      { name: 'Coupe homme', priceHT: 25, duration: '20 min', description: 'Coupe moderne ou classique, coiffage inclus.' },
      { name: 'Coupe femme', priceHT: 35, duration: '30 min', description: 'Coupe personnalisée, brushing inclus.' },
      { name: 'Barbe', priceHT: 15, duration: '15 min', description: 'Taille ou rasage de barbe, soin inclus.' }
    ]
  }
]; 