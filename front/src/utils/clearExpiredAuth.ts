// Utilitaire pour nettoyer l'authentification expirée
export const clearExpiredAuth = () => {
  // Nettoyer le localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Nettoyer le sessionStorage si utilisé
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
  // Rediriger vers la page de connexion
  const currentPath = window.location.pathname;
  if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
    window.location.href = '/login';
  }
  
  console.log('Authentification expirée nettoyée');
};

// Vérifier si le token est expiré
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true; // Si on ne peut pas décoder le token, considérer qu'il est expiré
  }
};

// Vérifier et nettoyer automatiquement si nécessaire
export const checkAndClearExpiredAuth = () => {
  const token = localStorage.getItem('token');
  if (token && isTokenExpired(token)) {
    clearExpiredAuth();
    return true;
  }
  return false;
}; 