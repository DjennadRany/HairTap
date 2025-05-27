export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'coiffeur';
  photo: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  speciality?: string[];
  rating?: number;
  priceRange?: '€' | '€€' | '€€€';
  workingHours?: {
    [key: string]: {
      start: string;
      end: string;
    };
  };
  description?: string;
  photos?: string[];
  mode?: ('salon' | 'domicile')[];
  availability?: { date: string; slots: string[] }[];
  cancellationPolicy?: string;
  bio?: string;
  experience?: string;
  diplomas?: string;
  tarifs?: string;
  favorites?: string[];
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
    };
    language: 'fr' | 'en';
    theme: 'light' | 'dark';
  };
  services?: Service[];
  gallery?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: 'coupe' | 'coloration' | 'coiffure' | 'soin' | 'barbe' | 'autre';
  coiffeur: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  client: string;
  coiffeur: string;
  service: string;
  date: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  price: number;
  mode: 'salon' | 'domicile';
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  user: string;
  coiffeur: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
} 