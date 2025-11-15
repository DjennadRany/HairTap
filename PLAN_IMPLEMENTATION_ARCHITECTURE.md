# 🏗️ PLAN D'IMPLÉMENTATION : Respect de l'Architecture

## 📋 **ARCHITECTURE À RESPECTER**

### **1. Structure des Composants (Frontend)**

**Composants réutilisables :**
- ✅ `ClientBookings.tsx` - Composant unifié pour affichage réservations client
- ✅ `SalonAddressForm.tsx` - Composant unifié pour adresse salon
- ✅ `InstagramComments.tsx` - Composant unifié pour commentaires

**Structure des dossiers :**
```
front/src/
├── components/
│   ├── ui/              # Composants UI de base (Card, Button, Modal, etc.)
│   ├── modals/          # Modals réutilisables
│   ├── booking/         # Composants liés aux réservations
│   └── ...
├── pages/
│   ├── ClientBookingsPage.tsx    # Page qui utilise ClientBookings
│   ├── CoiffeurReservationsPage.tsx
│   └── ...
├── services/
│   └── api/             # Services API
├── domain/              # Logique métier (DDD)
└── utils/               # Utilitaires
```

---

### **2. Architecture DDD (Backend)**

**Structure respectée :**
```
back/
├── models/              # Modèles Mongoose
├── domain/             # Logique métier (DDD)
│   ├── booking/
│   │   ├── BookingService.js
│   │   ├── BookingFactory.js
│   │   └── BookingRepository.js
│   └── incident/       # NOUVEAU
│       ├── IncidentService.js
│       ├── IncidentFactory.js
│       └── IncidentRepository.js
├── routes/              # Routes API
└── services/            # Services externes (Stripe, etc.)
```

---

## 🎯 **PLAN D'IMPLÉMENTATION RESPECTANT L'ARCHITECTURE**

### **Phase 1 : Backend - Modèle & Service (DDD)**

#### **1.1 Créer le Modèle Incident**
```
back/models/Incident.js
```
- ✅ Respecter la structure Mongoose existante
- ✅ Références vers Booking, User
- ✅ Index pour performances

#### **1.2 Créer le Repository (DDD)**
```
back/domain/incident/IncidentRepository.js
```
- ✅ Pattern Repository (comme BookingRepository)
- ✅ Méthodes : findById, findByBooking, save, etc.

#### **1.3 Créer le Factory (DDD)**
```
back/domain/incident/IncidentFactory.js
```
- ✅ Pattern Factory (comme BookingFactory)
- ✅ Méthodes : createFromBooking, createNoShowAlert, etc.

#### **1.4 Créer le Service (DDD)**
```
back/domain/incident/IncidentService.js
```
- ✅ Pattern Service (comme BookingService)
- ✅ Méthodes : reportIncident, mediateIncident, resolveIncident, etc.

#### **1.5 Créer les Routes API**
```
back/routes/incidents.js
```
- ✅ Respecter la structure des routes existantes
- ✅ Validation avec express-validator
- ✅ Gestion d'erreurs cohérente

---

### **Phase 2 : Backend - Services Automatiques**

#### **2.1 Service de Détection Retards**
```
back/domain/incident/RetardDetectionService.js
```
- ✅ Job/Cron pour détecter les retards
- ✅ Calcul des pénalités selon règles
- ✅ Vérification géolocalisation

#### **2.2 Service de Confirmation Prestation**
```
back/domain/incident/ConfirmationService.js
```
- ✅ Job/Cron pour vérifier prestations en cours
- ✅ Alertes automatiques (10 min avant, 5 min après début, fin)
- ✅ Vérification géolocalisation

#### **2.3 Service de Médiation (Rasa)**
```
back/domain/incident/MediationService.js
```
- ✅ Intégration Rasa (architecture préparée)
- ✅ Filtrage des alertes avant chatbot
- ✅ Escalade vers support/admin

---

### **Phase 3 : Frontend - Composants Réutilisables**

#### **3.1 Composant Alertes Post-RDV**
```
front/src/components/booking/PostBookingAlert.tsx
```
- ✅ Composant réutilisable
- ✅ Props pour personnalisation
- ✅ Utilisable dans ClientBookings et CoiffeurReservationsPage

#### **3.2 Composant Confirmation Prestation**
```
front/src/components/booking/ConfirmationModal.tsx
```
- ✅ Modal réutilisable
- ✅ Géolocalisation intégrée
- ✅ Upload photo

#### **3.3 Composant Signalement Incident**
```
front/src/components/booking/IncidentReportForm.tsx
```
- ✅ Formulaire multi-étapes (wizard)
- ✅ Upload photos
- ✅ Validation côté client

#### **3.4 Composant Pénalité Retard**
```
front/src/components/booking/RetardPenaltyModal.tsx
```
- ✅ Modal pour coiffeur (choix accepter/annuler)
- ✅ Calcul pénalité automatique
- ✅ Affichage selon règles

---

### **Phase 4 : Frontend - Pages**

#### **4.1 Page Admin - Contrôle Incidents**
```
front/src/pages/AdminIncidentsPage.tsx
```
- ✅ Page admin pour gérer les incidents
- ✅ Liste des incidents en attente
- ✅ Validation/Rejet avec attribution points
- ✅ Historique et statistiques

#### **4.2 Intégration dans Pages Existantes**

**ClientBookingsPage.tsx :**
- ✅ Utiliser `PostBookingAlert` (composant réutilisable)
- ✅ Utiliser `ConfirmationModal` (composant réutilisable)
- ✅ Utiliser `IncidentReportForm` (composant réutilisable)
- ✅ **Ne pas dupliquer** le code existant

**CoiffeurReservationsPage.tsx :**
- ✅ Utiliser `PostBookingAlert` (composant réutilisable)
- ✅ Utiliser `ConfirmationModal` (composant réutilisable)
- ✅ Utiliser `RetardPenaltyModal` (composant réutilisable)
- ✅ **Ne pas dupliquer** le code existant

---

### **Phase 5 : Services API Frontend**

#### **5.1 Service API Incidents**
```
front/src/services/api/incidents.ts
```
- ✅ Respecter la structure des services existants
- ✅ Types TypeScript cohérents
- ✅ Gestion d'erreurs

#### **5.2 Service API Confirmation**
```
front/src/services/api/confirmations.ts
```
- ✅ API pour confirmations prestation
- ✅ Géolocalisation intégrée

#### **5.3 Service API Pénalités**
```
front/src/services/api/penalties.ts
```
- ✅ API pour pénalités retards
- ✅ Calcul automatique

---

## 🎯 **PRINCIPES À RESPECTER**

### **1. Réutilisabilité**
- ✅ **Composants réutilisables** : Pas de duplication
- ✅ **Props pour personnalisation** : Comme ClientBookings
- ✅ **Composants unifiés** : Comme SalonAddressForm

### **2. Architecture DDD**
- ✅ **Repository Pattern** : Accès données
- ✅ **Factory Pattern** : Création objets
- ✅ **Service Pattern** : Logique métier
- ✅ **Domain Events** : Événements métier

### **3. Structure des Fichiers**
- ✅ **Composants** : `front/src/components/`
- ✅ **Pages** : `front/src/pages/`
- ✅ **Services** : `front/src/services/api/`
- ✅ **Domain** : `back/domain/`

### **4. Cohérence avec l'Existant**
- ✅ **Même structure** que BookingService
- ✅ **Même patterns** que ClientBookings
- ✅ **Même conventions** de nommage

---

## 📋 **CHECKLIST D'IMPLÉMENTATION**

### **Backend :**
- [ ] Modèle Incident (respecter structure Mongoose)
- [ ] IncidentRepository (pattern Repository)
- [ ] IncidentFactory (pattern Factory)
- [ ] IncidentService (pattern Service)
- [ ] Routes API (respecter structure existante)
- [ ] RetardDetectionService (job/cron)
- [ ] ConfirmationService (job/cron)
- [ ] MediationService (Rasa - architecture préparée)

### **Frontend :**
- [ ] PostBookingAlert (composant réutilisable)
- [ ] ConfirmationModal (composant réutilisable)
- [ ] IncidentReportForm (composant réutilisable)
- [ ] RetardPenaltyModal (composant réutilisable)
- [ ] AdminIncidentsPage (page admin)
- [ ] Intégration ClientBookingsPage (utiliser composants)
- [ ] Intégration CoiffeurReservationsPage (utiliser composants)
- [ ] Service API incidents.ts
- [ ] Service API confirmations.ts
- [ ] Service API penalties.ts

---

## ✅ **VALIDATION**

**Toutes les règles d'architecture sont définies :**

1. ✅ **Composants réutilisables** (pas de duplication)
2. ✅ **Architecture DDD** (Repository, Factory, Service)
3. ✅ **Structure cohérente** avec l'existant
4. ✅ **Intégration** dans pages existantes (utiliser composants)

**On commence l'implémentation en respectant cette architecture !** 🚀









