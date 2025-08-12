# 🗺️ REFERENCE DES DONNÉES TAPHAIR - ÉTAT ACTUEL

## 📊 ÉTAT DES SERVICES PHOTO (DUPLICATS IDENTIFIÉS)

### 1. **photoService.js** (PRINCIPAL - SIMPLIFIÉ)
- **Fichier:** `back/services/photoService.js`
- **Fonctionnalités:** Upload profil, upload service, suppression, validation
- **Méthodes principales:**
  - `uploadProfilePhoto(file, userId)`
  - `uploadServicePhoto(file, serviceId)`
  - `deletePhoto(photoUrl)`
  - `validateImageUrl(url)`
- **Utilisé par:** users.js, services.js, coiffeurs.js, scripts

### 2. **servicePhotoService.js** (DUPLICAT - SPÉCIALISÉ SERVICES)
- **Fichier:** `back/services/servicePhotoService.js`
- **Fonctionnalités:** Upload service uniquement, plus complexe
- **Méthodes principales:**
  - `uploadServicePhoto(file, serviceId)`
  - `deleteServicePhoto(imageUrl)`
  - `validateServiceImageUrl(url)`
  - `cleanupOrphanedServicePhotos()`
- **Utilisé par:** scripts/migrateData.js uniquement

### 3. **imageUploadService.js** (DUPLICAT - GÉNÉRIQUE)
- **Fichier:** `back/services/imageUploadService.js`
- **Fonctionnalités:** Upload générique, plus complexe
- **Méthodes principales:**
  - `uploadImage(file, type)`
  - `deleteImage(filename, type)`
  - `validateImageUrl(url)`
  - `cleanupOrphanedImages()`
- **Utilisé par:** routes/images.js uniquement

## 🔄 ROUTES ACTIVES

### Routes Principales (server.js)
- `/api/users` → userRoutes
- `/api/coiffeurs` → coiffeurRoutes  
- `/api/auth` → authRoutes
- `/api/bookings` → bookingRoutes
- `/api/services` → serviceRoutes
- `/api/chat` → chatRoutes
- `/api/favorites` → favoriteRoutes
- `/api/reviews` → reviewRoutes
- `/api/images` → imageRoutes

### Routes Frontend (App.tsx)
- **Publiques:** `/`, `/login`, `/search`, `/coiffeur/:id`, `/coiffeur/:coiffeurId/services`
- **Client:** `/client/dashboard`, `/client/favorites`, `/client/profile`, `/client/bookings`, `/booking/:id`, `/client/chat`
- **Coiffeur:** `/coiffeur/dashboard`, `/coiffeur/profile`, `/coiffeur/reservations`, `/coiffeur/revenue`, `/coiffeur/chat`

## 🚨 PROBLÈMES IDENTIFIÉS

### 1. **DUPLICATS DE SERVICES PHOTO**
- **Problème:** 3 services photo avec fonctionnalités similaires
- **Impact:** Confusion, maintenance difficile, incohérences
- **Solution:** Garder photoService.js, supprimer les autres

### 2. **ROUTES DUPLIQUÉES**
- **Problème:** Routes coiffeur dans users.js ET coiffeurs.js
- **Impact:** Conflits, logique dispersée
- **Solution:** Séparer clairement les responsabilités

### 3. **IMPORTS INCOHÉRENTS**
- **Problème:** Différents services photo utilisés selon les routes
- **Impact:** Comportements différents selon l'endpoint
- **Solution:** Standardiser sur photoService.js

## 📋 PLAN DE CORRECTION SYSTÉMATIQUE

### Phase 1: Nettoyage des Services Photo
1. ✅ Analyser les 3 services photo
2. ✅ Supprimer servicePhotoService.js et imageUploadService.js
3. ✅ Mettre à jour les imports dans les routes
4. ✅ Tester la fonctionnalité photo

### Phase 2: Correction des Routes
1. ✅ Analyser les routes users.js et coiffeurs.js
2. ✅ Vérifier qu'il n'y a pas de doublons
3. ✅ Standardiser les imports (photoService.js)
4. ✅ Vérifier les endpoints

### Phase 3: Synchronisation Frontend-Backend
1. ✅ Vérifier les appels API frontend
2. ✅ Corriger les chemins d'import
3. 🔄 Tester les user journeys
4. 🔄 Valider la cohérence

### Phase 4: Tests et Validation
1. 🔄 Tester chaque user journey
2. 🔄 Vérifier les uploads photos
3. 🔄 Valider les CRUD operations
4. 🔄 Confirmer la stabilité

## 🎯 OBJECTIF FINAL
- **1 service photo unifié** (photoService.js)
- **Routes claires et non-dupliquées**
- **Imports cohérents**
- **Application fonctionnelle avec UX-Pro** 