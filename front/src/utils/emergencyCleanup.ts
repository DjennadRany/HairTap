// Script d'urgence pour nettoyer l'authentification
export const emergencyCleanup = () => {
  console.log('🚨 Nettoyage d\'urgence de l\'authentification...');
  
  // Nettoyer complètement le localStorage
  localStorage.clear();
  
  // Nettoyer le sessionStorage
  sessionStorage.clear();
  
  // Nettoyer les cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  // Rediriger vers la page de connexion
  window.location.href = '/login';
  
  console.log('✅ Nettoyage d\'urgence terminé');
};

// Fonction pour forcer le rechargement de l'application
export const forceReload = () => {
  console.log('🔄 Rechargement forcé de l\'application...');
  window.location.reload();
};

// Fonction pour nettoyer et redémarrer
export const cleanupAndRestart = () => {
  emergencyCleanup();
  setTimeout(() => {
    forceReload();
  }, 1000);
};

// Exposer les fonctions globalement pour utilisation dans la console
if (typeof window !== 'undefined') {
  (window as any).emergencyCleanup = emergencyCleanup;
  (window as any).forceReload = forceReload;
  (window as any).cleanupAndRestart = cleanupAndRestart;
  
  console.log('🔧 Scripts d\'urgence disponibles:');
  console.log('  - emergencyCleanup() : Nettoyer l\'authentification');
  console.log('  - forceReload() : Recharger l\'application');
  console.log('  - cleanupAndRestart() : Nettoyer et redémarrer');
} 