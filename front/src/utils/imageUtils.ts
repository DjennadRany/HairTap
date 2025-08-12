// Utilitaires pour la gestion des images

export const DEFAULT_COIFFEUR_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iI0QxRDVEMyIvPgo8cGF0aCBkPSJNNDAgMTQwQzQwIDEyMCA2MCAxMDAgMTAwIDEwMEMxNDAgMTAwIDE2MCAxMjAgMTYwIDE0MFYxNjBINDBWMTQwWiIgZmlsbD0iI0QxRDVEMyIvPgo8dGV4dCB4PSIxMDAiIHk9IjE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk0QTNBRiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj5Db2lmZmV1cjwvdGV4dD4KPC9zdmc+';
export const DEFAULT_SERVICE_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iI0QxRDVEMyIvPgo8cGF0aCBkPSJNNDAgMTQwQzQwIDEyMCA2MCAxMDAgMTAwIDEwMEMxNDAgMTAwIDE2MCAxMjAgMTYwIDE0MFYxNjBINDBWMTQwWiIgZmlsbD0iI0QxRDVEMyIvPgo8dGV4dCB4PSIxMDAiIHk9IjE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk0QTNBRiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj5TZXJ2aWNlPC90ZXh0Pgo8L3N2Zz4=';
export const DEFAULT_USER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iI0QxRDVEMyIvPgo8cGF0aCBkPSJNNDAgMTQwQzQwIDEyMCA2MCAxMDAgMTAwIDEwMEMxNDAgMTAwIDE2MCAxMjAgMTYwIDE0MFYxNjBINDBWMTQwWiIgZmlsbD0iI0QxRDVEMyIvPgo8dGV4dCB4PSIxMDAiIHk9IjE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk0QTNBRiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj5Vc2VyPC90ZXh0Pgo8L3N2Zz4=';
export const DEFAULT_PRODUCT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iI0QxRDVEMyIvPgo8cGF0aCBkPSJNNDAgMTQwQzQwIDEyMCA2MCAxMDAgMTAwIDEwMEMxNDAgMTAwIDE2MCAxMjAgMTYwIDE0MFYxNjBINDBWMTQwWiIgZmlsbD0iI0QxRDVEMyIvPgo8dGV4dCB4PSIxMDAiIHk9IjE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk0QTNBRiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj5Qcm9kdWl0PC90ZXh0Pgo8L3N2Zz4=';

export const getDefaultImage = (type: 'coiffeur' | 'service' | 'user' = 'user') => {
  switch (type) {
    case 'coiffeur':
      return DEFAULT_COIFFEUR_IMAGE;
    case 'service':
      return DEFAULT_SERVICE_IMAGE;
    case 'user':
    default:
      return DEFAULT_USER_IMAGE;
  }
};

// Utilitaire pour gérer les URLs d'images
export const getImageUrl = (imageUrl: string | null | undefined, defaultUrl?: string): string => {
  const defaultAvatar = defaultUrl || DEFAULT_USER_IMAGE;
  if (!imageUrl || imageUrl === defaultAvatar) return defaultAvatar;
  
  // Si c'est une image SVG (data:image/), la retourner directement
  if (imageUrl.startsWith('data:image/')) {
    return imageUrl;
  }
  
  // Si c'est une URL externe (http/https), la retourner directement
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Si c'est une URL relative qui commence par /uploads/, la rendre absolue
  if (imageUrl.startsWith('/uploads/')) {
    return `http://localhost:5000${imageUrl}`;
  }
  
  // Si c'est une URL relative qui commence par /, la rendre absolue
  if (imageUrl.startsWith('/')) {
    return `http://localhost:5000${imageUrl}`;
  }
  
  // Si c'est un nom de fichier simple (comme pexels-pixabay-247322.jpg)
  // On suppose qu'il est dans le dossier uploads/services/
  if (imageUrl.includes('.jpg') || imageUrl.includes('.png') || imageUrl.includes('.jpeg') || imageUrl.includes('.webp') || imageUrl.includes('.svg')) {
    return `http://localhost:5000/uploads/services/${imageUrl}`;
  }
  
  return defaultAvatar;
};

// Fonction pour gérer les erreurs d'images
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackUrl?: string) => {
  const target = e.target as HTMLImageElement;
  const fallback = fallbackUrl || DEFAULT_USER_IMAGE;
  
  // Éviter les boucles infinies
  if (target.src !== fallback) {
    console.log(`❌ Erreur de chargement image: ${target.src}`);
    target.src = fallback;
  }
};

// Fonction pour vérifier si une image existe
export const checkImageExists = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

// Fonction pour précharger une image
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Vérifier si c'est une URL valide ou une image par défaut
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('blob:')) return true;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isBlobUrl = (url: string): boolean => {
  return url.startsWith('blob:');
};

export const getImageWithFallback = (url: string | null | undefined, fallbackType: 'coiffeur' | 'service' | 'user' = 'user'): string => {
  if (!url) {
    return getDefaultImage(fallbackType);
  }
  
  // Si c'est une URL blob, on la garde et on laisse le navigateur gérer
  if (isBlobUrl(url)) {
    return url;
  }
  
  // Si c'est une image par défaut, on la garde
  if (url.startsWith('data:image/')) {
    return url;
  }
  
  // Si c'est une URL HTTP/HTTPS valide, on la garde
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Si c'est une URL relative, on la convertit en absolue
  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }
  
  // Sinon, on utilise l'image par défaut
  return getDefaultImage(fallbackType);
};

// Fonction pour nettoyer les URLs d'images
export const cleanImageUrl = (url: string): string => {
  if (!url) return getDefaultImage('service');
  
  // Supprimer les espaces et caractères invalides
  const cleaned = url.trim();
  
  // Si c'est une URL blob, on la garde
  if (isBlobUrl(cleaned)) {
    return cleaned;
  }
  
  // Si c'est une image par défaut, on la garde
  if (cleaned.startsWith('data:image/')) {
    return cleaned;
  }
  
  // Si c'est une URL valide, on la garde
  if (isValidImageUrl(cleaned)) {
    return cleaned;
  }
  
  // Sinon, on utilise l'image par défaut
  return getDefaultImage('service');
};

// Fonction pour convertir une image blob en base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Fonction pour créer une URL blob à partir d'une chaîne base64
export const base64ToBlobUrl = (base64: string): string => {
  try {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Erreur lors de la conversion base64 vers blob:', error);
    return getDefaultImage('service');
  }
};

// Fonction pour valider et corriger une URL d'image
export const validateAndFixImageUrl = (url: string): string => {
  if (!url) return getDefaultImage('service');
  
  // Si c'est déjà une image par défaut, on la garde
  if (url.startsWith('data:image/')) return url;
  
  // Si c'est une URL blob valide, on la garde
  if (isBlobUrl(url) && url.length > 10) return url;
  
  // Si c'est une URL HTTP/HTTPS valide, on la garde
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // Si c'est une URL relative, on la convertit en absolue
  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }
  
  // Sinon, on utilise l'image par défaut
  return getDefaultImage('service');
}; 