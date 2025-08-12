// Script pour forcer une nouvelle authentification
export const forceReauth = () => {
  // Nettoyer complètement l'authentification
  localStorage.clear();
  sessionStorage.clear();
  
  // Rediriger vers la page de connexion
  window.location.href = '/login';
  
  console.log('Authentification forcée - redirection vers login');
};

// Exécuter immédiatement si appelé directement
if (typeof window !== 'undefined') {
  // Vérifier si on est sur une page qui nécessite une authentification
  const currentPath = window.location.pathname;
  const protectedRoutes = ['/client/', '/coiffeur/', '/dashboard'];
  
  const isOnProtectedRoute = protectedRoutes.some(route => 
    currentPath.includes(route)
  );
  
  if (isOnProtectedRoute) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Aucun token trouvé, redirection vers login');
      forceReauth();
    }
  }
} 