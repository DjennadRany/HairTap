// Types de base
export interface Location {
  latitude: number;
  longitude: number;
}

export type SearchMode = 'salon' | 'domicile' | 'both';
export type ViewMode = 'list' | 'map' | 'split';
export type SortOption = 'distance' | 'rating' | 'price';

// Interfaces principales
export interface SearchResult {
  id: number;
  name: string;
  type: SearchMode;
  address: string;
  rating: number;
  reviews: number;
  price: number;
  location: Location;
  services: string[];
  image: string;
}

export interface SearchFilters {
  type?: SearchMode;
  maxPrice?: number;
  minRating?: number;
  services?: string[];
}

// Props des composants
export interface MapViewProps {
  center: Location;
  markers: SearchResult[];
  onMarkerClick?: (id: number) => void;
  showRoute?: boolean;
  origin?: Location;
  destination?: Location;
  className?: string;
}

export interface SearchBarProps {
  onSearch: (address: string) => void;
  placeholder?: string;
}

export interface FilterPanelProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export interface ResultListProps {
  results: SearchResult[];
  onResultClick: (id: number) => void;
  isLoading?: boolean;
  viewMode: ViewMode;
}

// Events
export interface SearchEvents {
  onSearch: (location: string) => void;
  onFilterChange: (filters: SearchFilters) => void;
  onSortChange: (option: SortOption) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onResultSelect: (result: SearchResult) => void;
} 