// Script pour nettoyer l'authentification expirée
// À exécuter dans la console du navigateur

console.log('Nettoyage de l\'authentification expirée...');

// Nettoyer le localStorage
localStorage.removeItem('token');
localStorage.removeItem('user');

// Nettoyer le sessionStorage
sessionStorage.removeItem('token');
sessionStorage.removeItem('user');

// Rediriger vers la page de connexion
window.location.href = '/login';

console.log('Authentification nettoyée, redirection vers /login'); 