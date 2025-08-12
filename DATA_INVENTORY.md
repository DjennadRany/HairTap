# 📊 INVENTAIRE COMPLET DES DONNÉES TAPHAIR

## 🏗️ **ENTITÉS PRINCIPALES**

### 1. **USER (Utilisateur)**
**Fichier:** `back/models/User.js`
**Collection MongoDB:** `users`

#### Propriétés Principales:
```javascript
{
  _id: ObjectId,                    // ID unique
  name: String,                     // Nom complet
  email: String,                    // Email (unique)
  password: String,                 // Mot de passe hashé
  role: String,                     // 'user', 'coiffeur', 'admin'
  photo: String,                    // URL photo profil
  phone: String,                    // Téléphone
  address: {                        // Adresse complète
    street: String,
    city: String,
    postalCode: String,
    coordinates: { lat: Number, lng: Number }
  }
}
```

#### Propriétés Spécifiques Coiffeur:
```javascript
{
  siren: String,                    // Numéro SIREN
  sirenStatus: String,              // 'pending', 'verified', 'none'
  specialities: [String],           // Spécialités
  rating: Number,                   // Note moyenne
  totalRatings: Number,             // Nombre total d'avis
  workingMode: [String],            // ['salon', 'domicile', 'both']
  travelRadius: Number,             // Rayon de déplacement
  gallery: [{                       // Galerie photos
    url: String,
    description: String,
    isVerified: Boolean
  }]
}
```

#### Propriétés Sociales:
```javascript
{
  likes: Number,                    // Nombre de likes reçus
  favorites: [ObjectId],            // Coiffeurs favoris
  blockedUsers: [ObjectId],         // Utilisateurs bloqués
  stats: {                          // Statistiques
    totalBookings: Number,
    completedBookings: Number,
    cancelledBookings: Number,
    averageRating: Number,
    profileViews: Number
  }
}
```

### 2. **SERVICE (Service)**
**Fichier:** `back/models/Service.js`
**Collection MongoDB:** `services`

#### Propriétés:
```javascript
{
  _id: ObjectId,                    // ID unique
  name: String,                     // Nom du service
  description: String,              // Description
  price: Number,                    // Prix
  duration: Number,                 // Durée (minutes)
  category: String,                 // 'coupe', 'coloration', etc.
  keywords: [String],               // Mots-clés
  examplePhotos: [String],          // URLs photos
  likes: Number,                    // Nombre de likes
  likedBy: [ObjectId],             // Utilisateurs qui ont liké
  coiffeur: ObjectId,              // Référence User (coiffeur)
  isActive: Boolean,                // Service actif/inactif
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **BOOKING (Réservation)**
**Fichier:** `back/models/Booking.js`
**Collection MongoDB:** `bookings`

#### Propriétés:
```javascript
{
  _id: ObjectId,                    // ID unique
  client: ObjectId,                 // Référence User (client)
  coiffeur: ObjectId,               // Référence User (coiffeur)
  service: ObjectId,                // Référence Service
  date: Date,                       // Date et heure
  duration: Number,                 // Durée (minutes)
  status: String,                   // 'pending', 'confirmed', 'completed', 'cancelled'
  price: Number,                    // Prix final
  notes: String,                    // Notes client
  location: {                       // Lieu
    type: String,                   // 'salon', 'domicile'
    address: String,
    coordinates: { lat: Number, lng: Number }
  },
  payment: {                        // Informations paiement
    method: String,
    status: String,
    transactionId: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **REVIEW (Avis)**
**Fichier:** `back/models/Review.js`
**Collection MongoDB:** `reviews`

#### Propriétés:
```javascript
{
  _id: ObjectId,                    // ID unique
  client: ObjectId,                 // Référence User (client)
  coiffeur: ObjectId,               // Référence User (coiffeur)
  booking: ObjectId,                // Référence Booking
  rating: Number,                   // Note (1-5)
  comment: String,                  // Commentaire
  isVerified: Boolean,              // Avis vérifié
  createdAt: Date
}
```

### 5. **MESSAGE (Message)**
**Fichier:** `back/models/Message.js`
**Collection MongoDB:** `messages`

#### Propriétés:
```javascript
{
  _id: ObjectId,                    // ID unique
  sender: ObjectId,                 // Référence User (expéditeur)
  receiver: ObjectId,               // Référence User (destinataire)
  content: String,                  // Contenu du message
  isRead: Boolean,                  // Lu/non lu
  createdAt: Date
}
```

## 🔄 **RELATIONS ENTRE ENTITÉS**

### **Relations Principales:**
1. **User ↔ Service:** Un coiffeur peut avoir plusieurs services
2. **User ↔ Booking:** Un client peut avoir plusieurs réservations
3. **User ↔ Review:** Un client peut laisser plusieurs avis
4. **User ↔ Message:** Un utilisateur peut envoyer/recevoir plusieurs messages
5. **Service ↔ Booking:** Un service peut être réservé plusieurs fois
6. **Booking ↔ Review:** Une réservation peut avoir un avis

### **Relations Sociales:**
1. **User ↔ User (Favorites):** Un client peut avoir plusieurs coiffeurs favoris
2. **User ↔ User (Blocked):** Un utilisateur peut bloquer plusieurs utilisateurs
3. **Service ↔ User (Likes):** Un service peut être liké par plusieurs utilisateurs

## 📍 **PRÉSENCE DANS L'APPLICATION**

### **Frontend (React/TypeScript):**
- ✅ Types définis dans `front/src/types/models.ts`
- ✅ API services dans `front/src/services/api/`
- ✅ Composants utilisant ces données

### **Backend (Node.js/Express):**
- ✅ Modèles Mongoose dans `back/models/`
- ✅ Routes API dans `back/routes/`
- ✅ Services dans `back/services/`

### **Base de Données (MongoDB):**
- ✅ Collections MongoDB correspondantes
- ✅ Index pour les performances
- ✅ Relations via ObjectId

## 🚨 **PROBLÈMES IDENTIFIÉS**

### **1. Incohérences de Données:**
- ❌ Images référencées mais inexistantes
- ❌ Likes non synchronisés entre services
- ❌ Statistiques non mises à jour en temps réel

### **2. Doublons de Code:**
- ❌ Services photo dupliqués (corrigé)
- ❌ Logiques de validation répétées
- ❌ Gestion d'erreurs non standardisée

### **3. Interactions Manquantes:**
- ❌ Notifications en temps réel
- ❌ Synchronisation des favoris
- ❌ Mise à jour automatique des statistiques

## 📋 **CHECKLIST DE VALIDATION**

### **Données Utilisateur:**
- [ ] Profil complet (nom, email, photo, adresse)
- [ ] Rôle et permissions
- [ ] Spécialités (coiffeur)
- [ ] Galerie photos (coiffeur)
- [ ] Statistiques et métriques

### **Données Service:**
- [ ] Informations de base (nom, description, prix)
- [ ] Photos d'exemple
- [ ] Système de likes
- [ ] Catégorisation
- [ ] Statut actif/inactif

### **Données Réservation:**
- [ ] Client et coiffeur
- [ ] Service réservé
- [ ] Date et heure
- [ ] Statut de la réservation
- [ ] Informations de paiement

### **Données Sociales:**
- [ ] Système de favoris
- [ ] Système de likes
- [ ] Système d'avis
- [ ] Messagerie
- [ ] Blocage d'utilisateurs

## 🎯 **OBJECTIFS DE CORRECTION**

1. **Nettoyer les références d'images invalides**
2. **Synchroniser les likes entre services**
3. **Mettre à jour les statistiques automatiquement**
4. **Standardiser la gestion d'erreurs**
5. **Simplifier les logiques complexes**
6. **Optimiser les performances** 