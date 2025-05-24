import { Coordinates } from '../types';

export class GeolocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeolocationError';
  }
}

export class GeolocationService {
  private static instance: GeolocationService;

  private constructor() {}

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  public isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  public async getCurrentPosition(): Promise<Coordinates> {
    if (!this.isSupported()) {
      throw new GeolocationError('La géolocalisation n\'est pas supportée par votre navigateur');
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            throw new GeolocationError('L\'accès à votre position a été refusé');
          case error.POSITION_UNAVAILABLE:
            throw new GeolocationError('Votre position est actuellement indisponible');
          case error.TIMEOUT:
            throw new GeolocationError('La demande de géolocalisation a expiré');
          default:
            throw new GeolocationError('Une erreur est survenue lors de la géolocalisation');
        }
      }
      throw new GeolocationError('Une erreur inattendue est survenue');
    }
  }
} 