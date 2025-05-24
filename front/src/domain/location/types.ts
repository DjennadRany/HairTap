export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SearchRadius {
  value: number;
  unit: 'km' | 'mi';
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  coordinates: Coordinates;
}

export interface ServiceArea {
  center: Coordinates;
  radius: SearchRadius;
  restrictions?: {
    minPrice?: number;
    maxDistance?: SearchRadius;
    excludedZones?: Coordinates[][];
  };
}

export interface TravelTime {
  duration: number;
  distance: number;
  mode: 'driving' | 'walking' | 'transit';
  trafficLevel: 'low' | 'medium' | 'high';
}

export interface Location {
  coordinates: Coordinates;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface SearchArea {
  center: Location;
  radius: SearchRadius;
}

export interface LocationSearch {
  area: SearchArea;
  timestamp: number;
} 