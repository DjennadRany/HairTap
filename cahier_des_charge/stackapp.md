1. Objectif de l'application

Permettre la mise en relation entre coiffeurs et clients via une interface simple, responsive, et professionnelle. Les coiffeurs peuvent proposer des services en salon ou à domicile. Les clients peuvent réserver une prestation avec le professionnel de leur choix.

2. Stack technique V1 (Front uniquement)

Framework principal : React (avec Vite ou Create React App)

Gestion d'état : Redux Toolkit ou Zustand

Routing : React Router DOM

UI Kit : ShadCN UI ou Material UI (privilégier un design moderne et accessible)

Auth : Google Auth avec Firebase Auth ou OAuth2 (via @react-oauth/google)

Formulaires : React Hook Form + Yup (validation)

Style : TailwindCSS ou CSS Modules (selon préférence de Cursor)

Paiement : Stripe (probablement ce que tu voulais dire par "Splint")

Animation : Framer Motion (pour transitions d'écran et UX fluide)

3. Bonnes pratiques et standards

Respect des standards W3C (accessibilité, sémantique HTML)

SEO de base (balises méta, titre, descriptions)

Code composanté, réutilisable et testé (Tests unitaires avec Vitest ou Jest)

Architecture scalable (type Atomic Design ou Feature-based Folder Structure)

Responsive (mobile first design)

Linter/Formatter : ESLint + Prettier (configuré dans le projet)

5. Pages de la V1 à développer

Page d'accueil (accroche, CTA pour inscription client ou coiffeur)

Page de login/inscription (Google Auth)

Dashboard client (recherche, réservations, profil)

Dashboard coiffeur (gestion de profil, agenda, réservations)

Fiche détaillée d'un coiffeur

Page de réservation (choix date/heure/service)

Page de paiement (intégration Stripe)

Page "Mes réservations"

6. Directives clés pour Cursor (dév. front)

Modulariser les composants (Header, Footer, CardCoiffeur, etc.)

Intégrer les formulaires avec React Hook Form et validation via Yup

Utiliser une architecture "feature-based" (ex : /features/auth, /features/user, /features/booking)

Intégration des routes avec layout conditionnel selon le rôle (client/coiffeur)

Ajouter des "skeleton loaders" pour les appels à venir (simuler loading API)

Respecter scrupuleusement le responsive (mobile d'abord)

Avoir un fichier .env pour les clés Stripe et Google Auth (mocké pour le moment)

7. Livrables attendus pour la V1

Code source propre, testé, commenté, sur GitHub

Application front 100% fonctionnelle (mock API ou JSON static)

Maquettes intégrées fidèlement (si Figma ou autre)

Documentation README claire pour installation et déploiement

