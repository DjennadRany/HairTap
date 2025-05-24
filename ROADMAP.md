# 📋 Roadmap & Suivi du projet TapHair

## 🏗️ Architecture & Setup
- [x] Initialiser le projet React (Vite) avec structure feature-based
- [x] Mettre en place TailwindCSS, ESLint, Prettier, ShadCN UI
- [x] Configurer React Router DOM et les layouts (Public, Auth, Dashboard, Error)
- [x] Ajouter le logo et la charte graphique (branding)

## 🔐 Authentification & Routing
- [ ] Intégrer Google Auth (`@react-oauth/google`)
- [ ] Implémenter le flow onboarding (nouvel utilisateur)
- [ ] Redirection selon rôle (client/pro)

## 🧑‍💻 Pages & Parcours Utilisateur
- [x] HomePage
- [x] LoginPage
- [x] OnboardingClientPage
- [x] OnboardingProPage
- [x] ClientDashboardPage
- [x] SearchPage (liste hub + map, filtres, cards coiffeur, navigation)
- [x] CoiffeurProfilePage (mock, navigation OK)
- [ ] BookingPage
- [ ] ClientReservationsPage
- [ ] CoiffeurDashboardPage
- [ ] ProfileEditPage
- [ ] CoiffeurReservationsPage
- [ ] CoiffeurRevenuePage
- [ ] PaymentPage
- [ ] 404Page

## 🧩 Composants & UI
- [x] Cards coiffeur (mock, navigation OK)
- [x] Filtres et moteur de recherche (mock)
- [x] Map (affichage, navigation, à développer pour l'interaction avancée)
- [ ] Skeleton loader, accessibilité, responsive, SEO

## 🗄️ Données & API
- [x] Mock API (mockData, hooks sur la mockup)
- [ ] Préparer l'intégration MongoDB (adapter les hooks, endpoints)
- [ ] Préparer l'intégration Stripe (test mode)

## 🧪 Tests & Qualité
- [ ] Ajouter des tests unitaires (Vitest/Jest)
- [ ] Vérifier la cohérence des parcours utilisateurs (User Stories)
- [ ] Documenter le code et le README

---

## ✅ Ce qui a été effectué
- Parcours utilisateur sur la liste hub (filtres, cards, navigation) **OK**
- Map installée, navigation vers le bon coiffeur **OK** (reste à développer l'interaction avancée)
- Débuggage des hooks pour la future intégration MongoDB **OK**
- Structure du projet, branding, layouts principaux **OK**

## 🚧 Ce qu'il reste à faire
- Développer l'interaction avancée sur la map (sélection, overlay, UX Google Maps)
- Intégrer l'auth Google et le flow onboarding complet
- Développer toutes les pages restantes (réservations, paiement, dashboards…)
- Préparer l'API MongoDB et Stripe
- Ajouter les tests, l'accessibilité, le SEO, la documentation

---

> _Mise à jour automatique à chaque sprint ou merge majeur.  
> Pour chaque tâche, créer une issue dédiée si besoin pour le suivi détaillé._ 