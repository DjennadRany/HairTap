# TapHair Frontend

Application de mise en relation entre clients et coiffeurs.

## Configuration requise

- Node.js >= 18
- npm >= 9

## Installation

1. Cloner le repository
2. Installer les dépendances :
```bash
npm install
```

3. Créer un fichier `.env` à la racine du projet avec les variables suivantes :
```
VITE_GOOGLE_CLIENT_ID="your-google-client-id"
VITE_STRIPE_PUBLIC_KEY="your-stripe-public-key"
VITE_API_URL="http://localhost:3001"
```

## Développement

1. Démarrer le serveur de développement :
```bash
npm run dev
```

2. Démarrer le serveur mock API :
```bash
npm run mock-api
```

## Tests

```bash
npm run test
```

## Structure du projet

```
src/
  ├── components/     # Composants réutilisables
  ├── features/      # Fonctionnalités par domaine
  ├── layouts/       # Layouts de l'application
  ├── pages/         # Pages de l'application
  ├── store/         # Configuration Redux
  ├── hooks/         # Hooks personnalisés
  ├── utils/         # Utilitaires
  ├── mocks/         # Données mock pour le développement
  └── styles/        # Styles globaux
```

## Technologies utilisées

- React (Vite)
- Redux Toolkit
- React Router DOM
- ShadCN UI
- React Hook Form + Yup
- TailwindCSS
- Google Auth
- Stripe Connect
- Framer Motion
- Vitest
- ESLint + Prettier
