# 🚀 Roadmap Signup, Auth & Profils TapHair (Front)

## 1. Authentification & Inscription

### Pages à créer ou refondre
- `/signup` : Page de **choix du rôle** (client ou coiffeur, UI claire et accessible)
- `/signup/client` : **Formulaire d’inscription client** (nom, email, mot de passe, téléphone, ville, Google Auth)
- `/signup/coiffeur` : **Formulaire d’inscription coiffeur** (nom activité, email, mot de passe, téléphone, adresse, ville, spécialités, description, photo, Google Auth)
- `/login` : **Connexion** (email/password + Google Auth, feedback clair)
- `/reset-password` : **Réinitialisation du mot de passe** (Firebase)
- `/verify-email` : **Vérification email** (Firebase, message d’attente/confirmation)
- `/logout` : **Déconnexion** (bouton ou composant, feedback)

### Fonctionnalités à prévoir
- Authentification email/password (Firebase Auth)
- Authentification Google (Firebase Auth)
- Gestion des erreurs d’auth (email déjà utilisé, mauvais mot de passe, compte inexistant, etc.)
- Feedback visuel (chargement, succès, erreurs, notifications)
- Redirection après login/signup selon le rôle (dashboard ou onboarding)
- Sécurité des routes (ProtectedRoute selon le rôle)
- Accessibilité (labels, focus, navigation clavier)

---

## 2. Profils & Données Utilisateur

### Pages à créer ou refondre
- `/client/profile` : **Profil client** (édition, upload avatar, UI responsive)
- `/coiffeur/profile/edit` : **Profil coiffeur** (édition complète, upload photo, spécialités, services, galerie, UI moderne)
- `/coiffeur/:id` : **Profil public coiffeur** (affichage dynamique, données à jour, bouton réservation, avis, galerie)
- `/client/dashboard` : **Dashboard client** (récap, favoris, réservations)
- `/coiffeur/dashboard` : **Dashboard coiffeur** (récap, réservations, revenus, gestion profil)

### Fonctionnalités à prévoir
- Stockage des infos utilisateur (Firebase Firestore, fallback localStorage en dev)
- Synchronisation des données après édition (profil, services, galerie)
- Affichage dynamique des infos (profil, recherche, réservation, dashboard)
- Upload photo/avatar (Firebase Storage ou local temporaire)
- Gestion des rôles (client/coiffeur) dans l’UI, navigation et accès
- Gestion des favoris (clients)
- Gestion des avis (clients sur coiffeurs)
- Sécurité et confidentialité des données

---

## 3. Recherche & Réservations

### Pages à créer ou refondre
- `/search` : **Recherche de coiffeurs** (affiche les vrais profils, filtres dynamiques, UI moderne)
- `/booking/:id` : **Réservation avec un coiffeur** (utilise les vraies infos, choix du service, date, mode salon/domicile)
- `/client/bookings` : **Mes réservations client** (historique, statut, annulation)
- `/coiffeur/reservations` : **Mes réservations coiffeur** (planning, statut, actions)

### Fonctionnalités à prévoir
- Utilisation de la même source de données pour les coiffeurs (Firestore, pas de mock en prod)
- Mise à jour en temps réel après modification d’un profil ou d’une réservation
- Affichage des infos client/coiffeur dans les réservations (nom, photo, service, statut)
- Gestion des statuts de réservation (confirmé, en attente, annulé, terminé)
- Notifications (email, in-app, à prévoir avec Firebase Cloud Messaging)

---

## 4. UI/UX & Composants

### Composants à prévoir ou améliorer
- `Input`, `PasswordInput`, `Button`, `FormError`, `Loader`, `Notification`
- `RoleSelector` (choix client/coiffeur, UI accessible)
- `GoogleAuthButton` (connexion/inscription Google, branding officiel)
- `AvatarUploader` (upload photo, drag & drop, preview)
- `ProtectedRoute` (sécurisation des routes selon le rôle)
- `Stepper` (pour onboarding multi-étapes si besoin)
- `Modal`, `Dialog` (confirmation, feedback)
- `Card`, `List`, `Badge`, `Tabs` (UI moderne et réutilisable)

### UI/UX
- Responsive design (mobile first, desktop friendly)
- Feedback utilisateur clair (états de chargement, erreurs, succès, notifications)
- Navigation fluide et accessible (liens, boutons, retour, focus)
- Séparation visuelle claire des rôles et des parcours
- Thème cohérent, branding, couleurs accessibles
- Expérience utilisateur testée (user flows, edge cases)

---

## 5. Nettoyage, Cohérence & Documentation

- Supprimer ou isoler les données mockées (`mockUsers`, mockData)
- S'assurer que toutes les pages utilisent la source unique de vérité (Firestore ou localStorage en dev)
- Nettoyer les routes/pages obsolètes ou redondantes
- Documenter le flow dans le README et ce fichier roadmap
- Ajouter des commentaires clairs dans le code pour chaque étape clé
- Préparer l'intégration back-end (API REST ou Firebase Functions)
- Prévoir des hooks custom pour l'auth, le profil, la recherche, les réservations
- Mettre en place des tests unitaires et d'intégration (Vitest, Testing Library)
- Prévoir l'internationalisation (i18n) si besoin

---

# ✅ Suivi & Checklist
- [ ] Création des pages d'inscription et de choix du rôle
- [ ] Intégration de Firebase Auth (email/password + Google)
- [ ] Refactor des profils pour affichage dynamique
- [ ] Nettoyage des données mockées
- [ ] Cohérence des données dans la recherche et les réservations
- [ ] Amélioration continue de l'UI/UX
- [ ] Documentation et commentaires
- [ ] Préparation de l'intégration back-end
- [ ] Mise en place des tests
- [ ] Accessibilité et responsive design

---

**Ce document est la feuille de route centrale pour garantir un développement rapide, cohérent et scalable du parcours d'inscription, d'authentification et de gestion des profils sur TapHair.** 