import { Location } from '@/domain/location/types';
import {
  SearchFilters,
  SearchResult,
  SearchState,
  SortOption,
  ViewMode
} from './types';

export class SearchAggregate {
  private state: SearchState;

  constructor() {
    this.state = {
      filters: {
        mode: 'both',
        priceRange: [0, 200],
        minRating: 0,
        services: []
      },
      results: [],
      isLoading: false,
      error: null,
      selectedResult: null,
      viewMode: 'list',
      sortBy: 'distance'
    };
  }

  // Getters
  public getState(): SearchState {
    return { ...this.state };
  }

  public getResults(): SearchResult[] {
    return [...this.state.results];
  }

  public getFilters(): SearchFilters {
    return { ...this.state.filters };
  }

  public getSelectedResult(): SearchResult | null {
    return this.state.selectedResult;
  }

  // Setters
  public setLocation(location: Location): void {
    this.state.filters = {
      ...this.state.filters,
      location: `${location.coordinates.latitude},${location.coordinates.longitude}`
    };
  }

  public setFilters(filters: Partial<SearchFilters>): void {
    this.state.filters = {
      ...this.state.filters,
      ...filters
    };
    this.sortResults();
  }

  public setSortOption(option: SortOption): void {
    this.state.sortBy = option;
    this.sortResults();
  }

  public setViewMode(mode: ViewMode): void {
    this.state.viewMode = mode;
  }

  public setResults(results: SearchResult[]): void {
    this.state.results = results;
    this.sortResults();
  }

  public selectResult(result: SearchResult | null): void {
    this.state.selectedResult = result;
  }

  public setLoading(isLoading: boolean): void {
    this.state.isLoading = isLoading;
  }

  public setError(error: string | null): void {
    this.state.error = error;
  }

  // Méthodes privées
  private sortResults(): void {
    const { results, sortBy } = this.state;
    
    switch (sortBy) {
      case 'distance':
        results.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
        break;
      case 'rating':
        results.sort((a: any, b: any) => b.rating - a.rating);
        break;
      case 'price':
        results.sort((a: any, b: any) => a.minPrice - b.minPrice);
        break;
    }
  }

  // Méthodes de filtrage
  private applyFilters(): SearchResult[] {
    const { filters, results } = this.state;

    return results.filter((result: any) => {
      // Filtre par mode
      if (filters.mode !== 'both' && !result.mode.includes(filters.mode)) {
        return false;
      }

      // Filtre par prix
      if (filters.maxPrice && result.minPrice > filters.maxPrice) {
        return false;
      }

      // Filtre par note
      if (filters.minRating && result.rating < filters.minRating) {
        return false;
      }

      // Filtre par services
      if (filters.services?.length && 
          !filters.services.every((service: any) => result.services.includes(service))) {
        return false;
      }

      return true;
    });
  }

  // Méthodes publiques de requête
  public getFilteredAndSortedResults(): SearchResult[] {
    const filteredResults = this.applyFilters();
    return [...filteredResults];
  }
} 