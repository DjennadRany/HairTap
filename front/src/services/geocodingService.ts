interface Coordinates {
  lat: number;
  lng: number;
}

interface GeocodingResult {
  coordinates: Coordinates;
  formattedAddress: string;
}

class GeocodingService {
  private apiKey: string;

  constructor() {
    // Utiliser l'API de géocodage gratuite de Nominatim (OpenStreetMap)
    this.apiKey = '';
  }

  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    try {
      const query = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return {
          coordinates: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
          },
          formattedAddress: result.display_name
        };
      }

      return null;
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      
      const response = await fetch(url);
      const data = await response.json();

      return data.display_name || null;
    } catch (error) {
      console.error('Erreur de géocodage inverse:', error);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService(); 