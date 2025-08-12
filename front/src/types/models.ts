export interface User {
  _id: string; // Ajouté pour le front (toujours utilisé dans le code)
  name: string;
  email: string;
  role: 'user' | 'admin' | 'coiffeur';
  photo: string;
  bio?: string;
  phone?: string;
  address?: {
    street: string;
    streetNumber?: string;
    city: string;
    postalCode: string;
    floor?: string;
    apartment?: string;
    buildingCode?: string;
    additionalInfo?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  addresses?: {
    home?: {
      street: string;
      streetNumber?: string;
      city: string;
      postalCode: string;
      floor?: string;
      apartment?: string;
      buildingCode?: string;
      additionalInfo?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    office?: {
      street: string;
      streetNumber?: string;
      city: string;
      postalCode: string;
      floor?: string;
      apartment?: string;
      buildingCode?: string;
      additionalInfo?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
  siren?: string;
  sirenStatus?: 'pending' | 'verified' | 'none';
  sirenVerificationDate?: Date;
  experience?: number;
  formation?: string;
  specialities?: string[];
  salonAddress?: {
    street?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    floor?: string;
    apartment?: string;
    buildingCode?: string;
    additionalInfo?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    phone?: string;
    openingHours?: {
      monday: { open: string; close: string; closed: boolean };
      tuesday: { open: string; close: string; closed: boolean };
      wednesday: { open: string; close: string; closed: boolean };
      thursday: { open: string; close: string; closed: boolean };
      friday: { open: string; close: string; closed: boolean };
      saturday: { open: string; close: string; closed: boolean };
      sunday: { open: string; close: string; closed: boolean };
    };
  };
  rating: number;
  totalRatings: number;
  workingMode?: ('salon' | 'domicile' | 'both')[];
  workingHours?: {
    [key: string]: {
      start: string;
      end: string;
      isAvailable: boolean;
    };
  };
  travelRadius?: number;
  services?: Service[];
  gallery?: GalleryImage[];
  likes?: number;
  socialPosts?: SocialPost[];
  connectionStatus?: {
    isOnline: boolean;
    lastSeen: Date;
    status: 'online' | 'busy' | 'offline' | 'away';
    availability: {
      isAvailable: boolean;
      nextAvailable?: Date;
      workingHours: {
        [key: string]: {
          start: string;
          end: string;
          isAvailable: boolean;
        };
      };
    };
  };
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: 'fr' | 'en';
    theme: 'light' | 'dark';
    privacy: {
      showPhone: boolean;
      showAddress: boolean;
    };
  };
  stats?: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    averageRating: number;
    profileViews: number;
  };
  lastLogin?: Date;
  loginHistory?: Array<{
    date: Date;
    ip: string;
    device: string;
  }>;
  isBlocked?: boolean;
  blockedUsers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  name: string;
  description: string;
  duration: number;
  priceHT: number;
  image?: string;
  tags: string[];
  isTemporary?: boolean;
  startDate?: Date;
  endDate?: Date;
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
    streetNumber?: string;
    city: string;
    postalCode: string;
    floor?: string;
    apartment?: string;
    buildingCode?: string;
    additionalInfo?: string;
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

export interface GalleryImage {
  url: string;
  description: string;
  isVerified: boolean;
}

export interface SocialPost {
  content: string;
  images: string[];
  hashtags: string[];
  createdAt: Date;
  likes: number;
  comments: Array<{
    userId: string;
    content: string;
    createdAt: Date;
  }>;
} 