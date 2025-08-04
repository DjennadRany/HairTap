// Script pour tester les images par défaut
export const testDefaultImages = async () => {
  console.log('🖼️ Test des images par défaut...');
  
  const testUrls = [
    'http://localhost:5000/default-avatar.png',
    'http://localhost:5000/default-service-image.png'
  ];
  
  testUrls.forEach((url, index) => {
    console.log(`📸 Test image par défaut ${index + 1}:`, url);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log(`✅ Image par défaut ${index + 1} chargée avec succès`);
    };
    
    img.onerror = () => {
      console.log(`❌ Erreur de chargement image par défaut ${index + 1}`);
    };
    
    img.src = url;
  });
  
  // Test des URLs relatives
  const relativeUrls = [
    '/default-avatar.png',
    '/default-service-image.png'
  ];
  
  relativeUrls.forEach((url, index) => {
    console.log(`📸 Test URL relative ${index + 1}:`, url);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log(`✅ URL relative ${index + 1} chargée avec succès`);
    };
    
    img.onerror = () => {
      console.log(`❌ Erreur de chargement URL relative ${index + 1}`);
    };
    
    img.src = `http://localhost:5000${url}`;
  });
  
  console.log('✅ Test des images par défaut terminé');
};

// Exécuter automatiquement en mode développement
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  setTimeout(testDefaultImages, 5000);
} 