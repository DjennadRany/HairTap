// Utilitaire pour forcer le mode clair dans le navigateur
export const forceLightMode = () => {
  // Forcer le mode clair via CSS
  const style = document.createElement('style');
  style.textContent = `
    html, body, * {
      color-scheme: light !important;
      background-color: #ffffff !important;
      color: #1a1a1a !important;
    }
    
    /* Override du dark mode de Chrome */
    @media (prefers-color-scheme: dark) {
      html, body, * {
        color-scheme: light !important;
        background-color: #ffffff !important;
        color: #1a1a1a !important;
      }
    }
    
    /* Forcer les couleurs claires sur tous les éléments */
    .force-light-mode {
      color-scheme: light !important;
      background-color: #ffffff !important;
      color: #1a1a1a !important;
    }
    
    .force-light-mode * {
      background-color: inherit !important;
      color: inherit !important;
    }
  `;
  
  document.head.appendChild(style);
  
  // Ajouter une classe au body
  document.body.classList.add('force-light-mode');
  
  // Forcer le mode clair via JavaScript
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery.matches) {
      // Le navigateur est en mode sombre, forcer le mode clair
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.style.backgroundColor = '#ffffff';
      document.documentElement.style.color = '#1a1a1a';
    }
  }
};

// Fonction pour détecter et corriger le dark mode de Chrome
export const detectAndFixDarkMode = () => {
  // Vérifier si Chrome force le dark mode
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (isDarkMode) {
    console.log('Dark mode détecté, application du mode clair...');
    forceLightMode();
  }
  
  // Écouter les changements de préférence
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (e.matches) {
      forceLightMode();
    }
  });
};

// Fonction pour ajouter un bouton de basculement (optionnel)
export const addLightModeToggle = () => {
  const toggle = document.createElement('button');
  toggle.textContent = '🌞 Mode clair';
  toggle.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    padding: 8px 16px;
    background: #1a1a1a;
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 12px;
    font-family: Inter, sans-serif;
  `;
  
  toggle.addEventListener('click', forceLightMode);
  document.body.appendChild(toggle);
};

// Initialisation automatique
if (typeof window !== 'undefined') {
  // Attendre que le DOM soit chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectAndFixDarkMode);
  } else {
    detectAndFixDarkMode();
  }
} 