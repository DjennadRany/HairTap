import geolocationService from './services/geolocationService.js';

async function testGeolocation() {
  try {
    console.log('🧪 Test de géolocalisation...');
    
    // Test avec une adresse simple
    const address = '123 Rue de la Paix, Paris, France';
    console.log('📍 Test avec:', address);
    
    const coordinates = await geolocationService.geocodeAddress(address);
    
    if (coordinates) {
      console.log('✅ Coordonnées trouvées:', coordinates);
    } else {
      console.log('❌ Aucune coordonnée trouvée');
    }
    
    // Test avec des composants d'adresse
    const addressComponents = {
      street: '456 Avenue des Champs',
      streetNumber: '456',
      city: 'Paris',
      postalCode: '75008'
    };
    
    console.log('📍 Test avec composants:', addressComponents);
    
    const coordinatesFromComponents = await geolocationService.geocodeAddressComponents(addressComponents);
    
    if (coordinatesFromComponents) {
      console.log('✅ Coordonnées depuis composants:', coordinatesFromComponents);
    } else {
      console.log('❌ Aucune coordonnée trouvée depuis composants');
    }
    
    console.log('🎉 Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testGeolocation(); 