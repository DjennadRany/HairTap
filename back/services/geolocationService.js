class GeolocationService {
  constructor() {
    this.baseUrl = 'https://nominatim.openstreetmap.org';
    this.userAgent = 'TapHair/1.0 (https://taphair.com)';
  }

  /**
   * Géolocaliser une adresse
   * @param {string} address - Adresse complète
   * @returns {Promise<{lat: number, lng: number} | null>}
   */
  async geocodeAddress(address) {
    try {
      console.log('📍 [GeolocationService] Géolocalisation de:', address);
      
      const params = new URLSearchParams({
        q: address,
        format: 'json',
        limit: 1,
        addressdetails: 1
      });
      
      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          'User-Agent': this.userAgent
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const coordinates = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
        
        console.log('✅ [GeolocationService] Coordonnées trouvées:', coordinates);
        return coordinates;
      } else {
        console.log('❌ [GeolocationService] Aucune coordonnée trouvée pour:', address);
        return null;
      }
    } catch (error) {
      console.error('❌ [GeolocationService] Erreur de géolocalisation:', error.message);
      return null;
    }
  }

  /**
   * Construire une adresse complète à partir des composants
   * @param {Object} addressComponents - Composants de l'adresse
   * @returns {string} Adresse complète
   */
  buildFullAddress(addressComponents) {
    const parts = [];
    
    if (addressComponents.streetNumber) parts.push(addressComponents.streetNumber);
    if (addressComponents.street) parts.push(addressComponents.street);
    if (addressComponents.postalCode) parts.push(addressComponents.postalCode);
    if (addressComponents.city) parts.push(addressComponents.city);
    
    return parts.join(' ');
  }

  /**
   * Géolocaliser une adresse à partir de ses composants
   * @param {Object} addressComponents - Composants de l'adresse
   * @returns {Promise<{lat: number, lng: number} | null>}
   */
  async geocodeAddressComponents(addressComponents) {
    const fullAddress = this.buildFullAddress(addressComponents);
    return await this.geocodeAddress(fullAddress);
  }

  /**
   * Géolocaliser automatiquement et mettre à jour les coordonnées
   * @param {Object} addressData - Données d'adresse
   * @returns {Promise<Object>} Adresse avec coordonnées
   */
  async addCoordinatesToAddress(addressData) {
    if (!addressData.street && !addressData.city) {
      console.log('⚠️ [GeolocationService] Adresse incomplète, impossible de géolocaliser');
      return addressData;
    }

    const coordinates = await this.geocodeAddressComponents(addressData);
    
    if (coordinates) {
      return {
        ...addressData,
        coordinates
      };
    }
    
    return addressData;
  }
}

export default new GeolocationService(); 