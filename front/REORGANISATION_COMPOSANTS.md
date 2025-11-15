# 📋 Inventaire et Plan de Réorganisation des Composants

## 🎯 Objectif
Réorganiser les composants selon les parcours utilisateur pour améliorer la maintenabilité et la compréhension du code.

## 📊 Inventaire des Composants

### 🔄 Composants Partagés (utilisés dans 2+ pages)
Ces composants doivent rester dans `components/shared/` ou `components/ui/`

#### UI Components (déjà bien organisés)
- `ui/Button.tsx` - Utilisé dans 10+ pages
- `ui/card.tsx` - Utilisé dans 8+ pages
- `ui/Modal.tsx` - Utilisé dans 5+ pages
- `ui/Input.tsx` - Utilisé dans 2+ pages
- `ui/NotificationManager.tsx` - Utilisé dans 3+ pages

#### Layout Components
- `Header.tsx` - Utilisé dans PublicLayout, ClientLayout, CoiffeurLayout
- `Footer.tsx` - Utilisé dans PublicLayout
- `BottomNavigation.tsx` - Utilisé dans tous les layouts

#### Chat Components (partagés entre Client et Coiffeur)
- `ChatWindow.tsx` - ClientChatPage, CoiffeurChatPage
- `ChatSuggestions.tsx` - ClientChatPage
- `ChatWelcome.tsx` - ClientChatPage
- `ChatStatusNotification.tsx` - Potentiellement partagé

#### Booking Components (partagés)
- `BookingForm.tsx` - BookingPage, CoiffeurProfilePage
- `ServiceCard.tsx` - BookingPage, ServicesSection
- `ServicesSection.tsx` - CoiffeurProfilePage, ClientServicesPage

#### Profile Components (partagés)
- `SimplePhotoUpload.tsx` - ClientProfilePage, CoiffeurProfileEditPage
- `AddressDisplay.tsx` - ClientProfilePage
- `AddressForm.tsx` - ClientProfilePage, SignInClientPage, SignInCoiffeurPage
- `AddressAutocomplete.tsx` - SignInClientPage, SignInCoiffeurPage
- `ProfileInfoDisplay.tsx` - ClientProfilePage
- `PreferencesDisplay.tsx` - ClientProfilePage

#### Auth Components (partagés)
- `StepIndicator.tsx` - SignInClientPage, SignInCoiffeurPage
- `StepNavigation.tsx` - SignInClientPage, SignInCoiffeurPage
- `ProtectedRoute.tsx` - Routes globales

#### Modals (partagés)
- `modals/` - Tous les modals sont partagés entre plusieurs pages

### 📄 Composants Spécifiques à une Page
Ces composants doivent être déplacés dans `components/pages/[PageName]/`

#### Client Pages
- `ClientBookings.tsx` → `pages/ClientBookings/ClientBookings.tsx` (utilisé uniquement dans ClientBookingsPage)
- `ClientFavoritesPage` - Pas de composant dédié, logique dans la page

#### Coiffeur Pages
- `CoiffeurBookings.tsx` → `pages/CoiffeurDashboard/CoiffeurBookings.tsx` (utilisé uniquement dans CoiffeurDashboardPage)
- `CoiffeurInfoDisplay.tsx` → `pages/CoiffeurProfileEdit/CoiffeurInfoDisplay.tsx` (utilisé uniquement dans CoiffeurProfileEditPage)

#### Public Pages
- `BackgroundVideo.tsx` → `pages/Home/BackgroundVideo.tsx` (utilisé uniquement dans HomePage)
- `MainHub.tsx` → `pages/Hub/MainHub.tsx` (utilisé uniquement dans HubPage)

#### Admin Pages
- `AdminDebug.tsx` → `pages/AdminDashboard/AdminDebug.tsx` (utilisé uniquement dans AdminDashboardPage)
- `AdminNavigation.tsx` → `layouts/AdminLayout/AdminNavigation.tsx` (utilisé uniquement dans AdminLayout)

### 🎨 Composants par Domaine (déjà bien organisés)
Ces composants restent dans leurs dossiers actuels car ils sont liés à un domaine métier :

- `booking/` - Composants liés aux réservations
- `calendar/` - Composants liés au calendrier
- `modals/` - Tous les modals
- `admin/` - Composants admin
- `coiffeur/` - Composants spécifiques coiffeur
- `pricing/` - Composants de tarification

## 🏗️ Nouvelle Structure Proposée

```
front/src/components/
├── shared/                    # Composants partagés entre plusieurs pages
│   ├── ui/                   # Composants UI de base (Button, Card, Modal, etc.)
│   ├── layout/               # Header, Footer, BottomNavigation
│   ├── chat/                 # ChatWindow, ChatSuggestions, ChatWelcome
│   ├── booking/              # BookingForm, ServiceCard, ServicesSection
│   ├── profile/              # SimplePhotoUpload, AddressDisplay, AddressForm, etc.
│   ├── auth/                 # StepIndicator, StepNavigation, ProtectedRoute
│   └── modals/               # Tous les modals partagés
│
├── pages/                    # Composants spécifiques à une page
│   ├── Home/
│   │   └── BackgroundVideo.tsx
│   ├── Hub/
│   │   └── MainHub.tsx
│   ├── ClientBookings/
│   │   └── ClientBookings.tsx
│   ├── ClientProfile/
│   │   └── (composants spécifiques si nécessaire)
│   ├── CoiffeurDashboard/
│   │   └── CoiffeurBookings.tsx
│   ├── CoiffeurProfileEdit/
│   │   └── CoiffeurInfoDisplay.tsx
│   └── AdminDashboard/
│       └── AdminDebug.tsx
│
├── features/                 # Composants par domaine métier (déjà existant)
│   ├── booking/              # booking/, calendar/
│   ├── admin/               # admin/
│   ├── coiffeur/              # coiffeur/
│   └── pricing/              # pricing/
│
└── domain/                   # Composants liés à un domaine métier spécifique
    ├── gallery/              # Gallery, GalleryHub, InstagramGallery
    ├── products/             # ProductCard, ProductGallery, ProductsSection
    ├── services/             # ServiceManager, ServiceModal
    └── reviews/              # ReviewForm
```

## 📝 Plan d'Action

### Phase 1 : Créer la nouvelle structure
1. Créer les dossiers `components/shared/` avec sous-dossiers
2. Créer les dossiers `components/pages/` avec sous-dossiers

### Phase 2 : Déplacer les composants partagés
1. Déplacer les composants UI vers `shared/ui/`
2. Déplacer les composants layout vers `shared/layout/`
3. Déplacer les composants chat vers `shared/chat/`
4. Déplacer les composants booking vers `shared/booking/`
5. Déplacer les composants profile vers `shared/profile/`
6. Déplacer les composants auth vers `shared/auth/`

### Phase 3 : Déplacer les composants spécifiques
1. Déplacer `BackgroundVideo.tsx` vers `pages/Home/`
2. Déplacer `MainHub.tsx` vers `pages/Hub/`
3. Déplacer `ClientBookings.tsx` vers `pages/ClientBookings/`
4. Déplacer `CoiffeurBookings.tsx` vers `pages/CoiffeurDashboard/`
5. Déplacer `CoiffeurInfoDisplay.tsx` vers `pages/CoiffeurProfileEdit/`
6. Déplacer `AdminDebug.tsx` vers `pages/AdminDashboard/`

### Phase 4 : Mettre à jour les imports
1. Mettre à jour tous les imports dans les pages
2. Mettre à jour tous les imports dans les layouts
3. Mettre à jour tous les imports dans les composants

### Phase 5 : Nettoyer
1. Supprimer les anciens fichiers
2. Vérifier que tout fonctionne
3. Mettre à jour la documentation

## 🔍 Détail des Imports à Mettre à Jour

### Pages à mettre à jour :
- `HomePage.tsx` : `BackgroundVideo` → `../components/pages/Home/BackgroundVideo`
- `HubPage.tsx` : `MainHub` → `../components/pages/Hub/MainHub`
- `ClientBookingsPage.tsx` : `ClientBookings` → `../components/pages/ClientBookings/ClientBookings`
- `CoiffeurDashboardPage.tsx` : `CoiffeurBookings` → `../components/pages/CoiffeurDashboard/CoiffeurBookings`
- `CoiffeurProfileEditPage.tsx` : `CoiffeurInfoDisplay` → `../components/pages/CoiffeurProfileEdit/CoiffeurInfoDisplay`
- `AdminDashboardPage.tsx` : `AdminDebug` → `../components/pages/AdminDashboard/AdminDebug`

### Layouts à mettre à jour :
- `PublicLayout.tsx` : `Header`, `Footer`, `BottomNavigation` → `../components/shared/layout/`
- `ClientDashboardLayout.tsx` : `Header`, `BottomNavigation` → `../components/shared/layout/`
- `CoiffeurDashboardLayout.tsx` : `Header`, `BottomNavigation` → `../components/shared/layout/`
- `AdminLayout.tsx` : `AdminNavigation` → `../layouts/AdminLayout/AdminNavigation`

### Composants à mettre à jour :
- Tous les composants qui importent des composants partagés

## ✅ Avantages de cette Organisation

1. **Clarté** : On sait immédiatement où trouver un composant
2. **Maintenabilité** : Les composants sont groupés par usage
3. **Réutilisabilité** : Les composants partagés sont facilement identifiables
4. **Parcours utilisateur** : Les composants spécifiques suivent les parcours utilisateur
5. **Scalabilité** : Facile d'ajouter de nouveaux composants

