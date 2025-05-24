import { Location, Coordinates } from '@/domain/location/types';

export class LocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocationError';
  }
}

export class LocationService {
  private static instance: LocationService;
  private geocoder: google.maps.Geocoder;

  private constructor() {
    this.geocoder = new google.maps.Geocoder();
  }

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  public async getCurrentPosition(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new LocationError('La géolocalisation n\'est pas supportée par votre navigateur.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coordinates: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          try {
            const address = await this.reverseGeocode(coordinates);
            resolve({
              coordinates,
              ...address
            });
          } catch (error) {
            resolve({ coordinates }); // Retourner au moins les coordonnées si l'adresse échoue
          }
        },
        (error: GeolocationPositionError) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new LocationError('L\'accès à la géolocalisation a été refusé.'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new LocationError('La position n\'est pas disponible.'));
              break;
            case error.TIMEOUT:
              reject(new LocationError('La demande de géolocalisation a expiré.'));
              break;
            default:
              reject(new LocationError('Une erreur inconnue est survenue.'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  }

  public async geocode(address: string): Promise<Location> {
    return new Promise((resolve, reject) => {
      this.geocoder.geocode(
        { address },
        (
          results: google.maps.GeocoderResult[] | null,
          status: google.maps.GeocoderStatus
        ) => {
          if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
            const result = results[0];
            const location: Location = {
              coordinates: {
                latitude: result.geometry.location.lat(),
                longitude: result.geometry.location.lng()
              },
              address: result.formatted_address,
              city: this.extractAddressComponent(result, 'locality'),
              postalCode: this.extractAddressComponent(result, 'postal_code'),
              country: this.extractAddressComponent(result, 'country')
            };
            resolve(location);
          } else {
            reject(new LocationError('Adresse non trouvée'));
          }
        }
      );
    });
  }

  public async reverseGeocode(coordinates: Coordinates): Promise<Omit<Location, 'coordinates'>> {
    return new Promise((resolve, reject) => {
      const latLng = { lat: coordinates.latitude, lng: coordinates.longitude };
      
      this.geocoder.geocode(
        { location: latLng },
        (
          results: google.maps.GeocoderResult[] | null,
          status: google.maps.GeocoderStatus
        ) => {
          if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
            const result = results[0];
            resolve({
              address: result.formatted_address,
              city: this.extractAddressComponent(result, 'locality'),
              postalCode: this.extractAddressComponent(result, 'postal_code'),
              country: this.extractAddressComponent(result, 'country')
            });
          } else {
            reject(new LocationError('Impossible de trouver l\'adresse pour ces coordonnées'));
          }
        }
      );
    });
  }

  private extractAddressComponent(
    result: google.maps.GeocoderResult,
    type: string,
    shortName: boolean = false
  ): string {
    const component = result.address_components.find(
      (component: google.maps.GeocoderAddressComponent) => component.types.includes(type)
    );
    return component ? (shortName ? component.short_name : component.long_name) : '';
  }
} 