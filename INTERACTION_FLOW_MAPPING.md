# 🔄 MAPPING DES INTERACTIONS UTILISATEUR

## 🎯 **ACTIONS UTILISATEUR ET LEURS FLUX**

### **1. LIKE D'UN SERVICE**
**Action:** Utilisateur clique sur "Like" d'un service

#### Flux Complet:
```
Frontend → API → Database → Notification → Dashboard Coiffeur
```

#### Détail du Flux:
1. **Frontend:** `ServiceCard.tsx` → `toggleServiceLike()`
2. **API Call:** `PUT /api/services/:serviceId/like`
3. **Backend:** `routes/services.js` → `photoService.js`
4. **Database:** Update `Service.likes` et `Service.likedBy`
5. **Notification:** Mise à jour dashboard coiffeur
6. **Frontend:** Update UI en temps réel

#### Code Concerné:
- **Frontend:** `front/src/services/api/services.ts`
- **Backend:** `back/routes/services.js`
- **Database:** `back/models/Service.js`

### **2. AJOUT AUX FAVORIS**
**Action:** Utilisateur ajoute un coiffeur à ses favoris

#### Flux Complet:
```
Frontend → API → Database → Notification → Dashboard Coiffeur
```

#### Détail du Flux:
1. **Frontend:** `CoiffeurCard.tsx` → `addToFavorites()`
2. **API Call:** `POST /api/favorites/:coiffeurId`
3. **Backend:** `routes/favorites.js`
4. **Database:** Update `User.favorites` array
5. **Notification:** Mise à jour statistiques coiffeur
6. **Frontend:** Update UI (étoile pleine)

#### Code Concerné:
- **Frontend:** `front/src/services/api/favorites.ts`
- **Backend:** `back/routes/favorites.js`
- **Database:** `back/models/User.js`

### **3. RÉSERVATION D'UN SERVICE**
**Action:** Client réserve un service

#### Flux Complet:
```
Frontend → API → Database → Notification → Dashboard Coiffeur + Client
```

#### Détail du Flux:
1. **Frontend:** `BookingForm.tsx` → `createBooking()`
2. **API Call:** `POST /api/bookings`
3. **Backend:** `routes/bookings.js`
4. **Database:** Create new `Booking` document
5. **Notification:** Email/SMS au coiffeur et client
6. **Frontend:** Confirmation + redirection

#### Code Concerné:
- **Frontend:** `front/src/services/api/bookings.ts`
- **Backend:** `back/routes/bookings.js`
- **Database:** `back/models/Booking.js`

### **4. UPLOAD DE PHOTO**
**Action:** Coiffeur upload une photo de service

#### Flux Complet:
```
Frontend → API → File System → Database → Gallery Update
```

#### Détail du Flux:
1. **Frontend:** `PhotoUpload.tsx` → `uploadServicePhoto()`
2. **API Call:** `POST /api/images/service/:serviceId`
3. **Backend:** `routes/images.js` → `photoService.js`
4. **File System:** Save image to `uploads/services/`
5. **Database:** Update `Service.examplePhotos`
6. **Frontend:** Update gallery display

#### Code Concerné:
- **Frontend:** `front/src/services/api/images.ts`
- **Backend:** `back/routes/images.js` + `photoService.js`
- **File System:** `back/uploads/services/`

### **5. ENVOI DE MESSAGE**
**Action:** Utilisateur envoie un message

#### Flux Complet:
```
Frontend → API → Database → Real-time → Receiver
```

#### Détail du Flux:
1. **Frontend:** `ChatWindow.tsx` → `sendMessage()`
2. **API Call:** `POST /api/chat/messages`
3. **Backend:** `routes/chat.js`
4. **Database:** Create new `Message` document
5. **Real-time:** WebSocket/Socket.io notification
6. **Frontend:** Update chat en temps réel

#### Code Concerné:
- **Frontend:** `front/src/services/api/chat.ts`
- **Backend:** `back/routes/chat.js`
- **Database:** `back/models/Message.js`

## 🚨 **PROBLÈMES IDENTIFIÉS DANS LES FLUX**

### **1. Flux de Likes:**
- ❌ **Problème:** Likes non synchronisés entre services
- ❌ **Impact:** Compteurs incorrects
- ✅ **Solution:** Standardiser sur `photoService.js`

### **2. Flux de Favoris:**
- ❌ **Problème:** Pas de notification au coiffeur
- ❌ **Impact:** Coiffeur ne sait pas qu'il est favori
- ✅ **Solution:** Ajouter notification + statistiques

### **3. Flux de Réservations:**
- ❌ **Problème:** Pas de validation de disponibilité
- ❌ **Impact:** Réservations en conflit
- ✅ **Solution:** Ajouter validation temporelle

### **4. Flux de Photos:**
- ❌ **Problème:** Images référencées mais inexistantes
- ❌ **Impact:** Erreurs 404 sur les images
- ✅ **Solution:** Script de nettoyage `fixImageReferences.js`

### **5. Flux de Messages:**
- ❌ **Problème:** Pas de temps réel
- ❌ **Impact:** Messages non instantanés
- ✅ **Solution:** Implémenter WebSocket

## 📊 **SYNCHRONISATION REQUISE**

### **Bidirectionnelle:**
1. **Like Service** ↔ **Dashboard Coiffeur**
2. **Favori Coiffeur** ↔ **Statistiques Coiffeur**
3. **Réservation** ↔ **Calendrier Coiffeur**
4. **Message** ↔ **Chat Real-time**
5. **Photo Upload** ↔ **Galerie Update**

### **Temps Réel:**
1. **Notifications push**
2. **Chat instantané**
3. **Statistiques live**
4. **Statuts de réservation**

## 🔧 **CORRECTIONS NÉCESSAIRES**

### **1. Standardisation des Likes:**
```javascript
// Avant (incohérent)
service.likes = service.likes + 1;

// Après (standardisé)
await photoService.updateServiceLikes(serviceId, userId);
```

### **2. Synchronisation des Favoris:**
```javascript
// Ajouter notification
await notificationService.notifyCoiffeurFavorite(coiffeurId, clientId);
```

### **3. Validation des Réservations:**
```javascript
// Ajouter validation
const isAvailable = await bookingService.checkAvailability(coiffeurId, date, duration);
```

### **4. Nettoyage des Images:**
```javascript
// Script de nettoyage
await imageService.cleanupInvalidReferences();
```

### **5. Temps Réel:**
```javascript
// WebSocket pour chat
socket.emit('newMessage', messageData);
```

## 📋 **CHECKLIST DE VALIDATION DES FLUX**

### **Flux de Likes:**
- [ ] Like ajouté en base
- [ ] Compteur mis à jour
- [ ] Dashboard coiffeur notifié
- [ ] UI mise à jour en temps réel

### **Flux de Favoris:**
- [ ] Favori ajouté en base
- [ ] Statistiques coiffeur mises à jour
- [ ] Notification envoyée au coiffeur
- [ ] UI mise à jour (étoile)

### **Flux de Réservations:**
- [ ] Validation disponibilité
- [ ] Réservation créée en base
- [ ] Notifications envoyées
- [ ] Calendriers mis à jour

### **Flux de Photos:**
- [ ] Image uploadée sur serveur
- [ ] Référence mise à jour en base
- [ ] Galerie mise à jour
- [ ] Erreurs 404 corrigées

### **Flux de Messages:**
- [ ] Message sauvegardé en base
- [ ] Notification temps réel
- [ ] Chat mis à jour instantanément
- [ ] Statut "lu" synchronisé

## 🎯 **OBJECTIFS DE CORRECTION**

1. **Standardiser tous les flux de données**
2. **Implémenter la synchronisation temps réel**
3. **Corriger les références d'images invalides**
4. **Ajouter les validations manquantes**
5. **Optimiser les performances des flux**
6. **Simplifier les logiques complexes** 