# 🏗️ ARCHITECTURE & PLAN D'OPTIMISATION - SYSTÈME DE RÉSERVATIONS

**Date:** 1er novembre 2025  
**Objectif:** Créer une architecture parfaite avant de coder, sans doublons ni régressions  
**Priorité:** Système de réservation

---

## 📋 PRINCIPES DE QUALITÉ

### **Caractéristiques de qualité demandées:**
1. ✅ **Pas de doublons** - Code réutilisable et factorisé
2. ✅ **Pas de régressions** - Tests avant chaque modification
3. ✅ **Architecture parfaite** - Design avant implémentation
4. ✅ **Code cohérent** - Patterns uniformes
5. ✅ **Maintenabilité** - Code lisible et documenté

---

## 🔍 AUDIT ARCHITECTURE ACTUELLE

### **1. STRUCTURE DES FICHIERS**

#### **Frontend - Système de réservation**
```
front/src/
├── components/
│   ├── BookingForm.tsx (824 lignes) ⚠️ TROP GROS
│   └── modals/
│       ├── StripePaymentModal.tsx
│       ├── CGVModal.tsx
│       ├── TimeChangeModal.tsx
│       └── CancelBookingModal.tsx
├── pages/
│   ├── ClientBookingsPage.tsx
│   └── CoiffeurReservationsPage.tsx
├── services/api/
│   └── bookings.ts
├── hooks/
│   └── useBookingForm.ts ✅ NOUVEAU
└── utils/
    └── dateUtils.ts ✅ NOUVEAU
```

#### **Backend - Système de réservation**
```
back/
├── routes/
│   └── bookings.js (671 lignes) ⚠️ TROP GROS
├── models/
│   └── Booking.js
├── middleware/
│   └── validate.js
└── utils/
    └── dateUtils.js ✅ NOUVEAU
```

---

### **2. PROBLÈMES IDENTIFIÉS**

#### **Frontend:**
1. ❌ **BookingForm.tsx trop gros** (824 lignes)
   - Beaucoup de logique métier dans le composant
   - Beaucoup de `useState`
   - Validation manuelle
   - Pas de séparation des responsabilités

2. ❌ **Pas d'utilisation de react-hook-form** (déjà installé)
   - Validation manuelle partout
   - Messages d'erreur hardcodés

3. ❌ **Pas d'utilisation de react-query** (non installé)
   - Appels API manuels
   - Pas de cache
   - Pas de retry automatique

4. ❌ **Pas de notifications toast** (non installé)
   - Messages d'erreur avec `setError`
   - Pas de feedback visuel élégant

#### **Backend:**
1. ❌ **bookings.js trop gros** (671 lignes)
   - Beaucoup de logique dans les routes
   - Validation manuelle
   - Pas de services séparés

2. ❌ **Pas d'utilisation de express-validator** (déjà installé)
   - Validation manuelle partout
   - Messages d'erreur non centralisés

3. ❌ **Pas de services séparés**
   - Logique métier dans les routes
   - Code difficile à tester

---

## 🎯 ARCHITECTURE PROPOSÉE

### **FRONTEND - ARCHITECTURE DDD**

```
front/src/
├── domain/
│   └── booking/
│       ├── types.ts (interfaces)
│       ├── validators.ts (schémas yup)
│       └── constants.ts
├── services/
│   └── api/
│       └── bookings.ts (appels API)
├── hooks/
│   ├── useBookingForm.ts ✅ EXISTE
│   ├── useBookingAvailability.ts (nouveau)
│   └── useBookingValidation.ts (nouveau)
├── components/
│   ├── booking/
│   │   ├── BookingForm.tsx (refactorisé)
│   │   ├── BookingDatePicker.tsx (nouveau)
│   │   ├── BookingTimePicker.tsx (nouveau)
│   │   └── BookingAddressForm.tsx (nouveau)
│   └── modals/
│       ├── StripePaymentModal.tsx
│       ├── CGVModal.tsx
│       ├── TimeChangeModal.tsx
│       └── CancelBookingModal.tsx
├── pages/
│   ├── ClientBookingsPage.tsx
│   └── CoiffeurReservationsPage.tsx
└── utils/
    └── dateUtils.ts ✅ EXISTE
```

### **BACKEND - ARCHITECTURE DDD**

```
back/
├── domain/
│   └── booking/
│       ├── Booking.js (modèle)
│       ├── BookingService.js (logique métier)
│       ├── BookingValidator.js (validation)
│       └── BookingRepository.js (accès données)
├── routes/
│   └── bookings.js (routes uniquement)
├── middleware/
│   ├── auth.js
│   └── validate.js
└── utils/
    └── dateUtils.js ✅ EXISTE
```

---

## 📋 PLAN D'OPTIMISATION STRUCTURÉ

### **PHASE 1 : CORRECTIONS & FACTORISATION (URGENT)**

#### **1.1 Corriger l'affichage du nom de la coiffeuse** ✅
**Temps estimé:** 5 min  
**Statut:** ✅ TERMINÉ

**Actions:**
- Ajouter affichage du nom de la coiffeuse dans les cartes de réservation

---

#### **1.2 Créer services backend (BookingService)** 🔴 URGENT
**Temps estimé:** 4h

**Actions:**
1. Créer `back/domain/booking/BookingService.js`
2. Extraire toute la logique métier de `bookings.js`
3. Créer méthodes :
   - `createBooking()`
   - `updateBooking()`
   - `cancelBooking()`
   - `checkAvailability()`
   - `validateBooking()`

**Fichiers à créer:**
- `back/domain/booking/BookingService.js`

**Fichiers à modifier:**
- `back/routes/bookings.js` (routes uniquement)

**Gains:**
- ✅ Séparation des responsabilités
- ✅ Code testable
- ✅ Réutilisable

---

#### **1.3 Créer validators avec express-validator** 🔴 URGENT
**Temps estimé:** 3h

**Actions:**
1. Créer `back/domain/booking/BookingValidator.js`
2. Créer middlewares de validation avec `express-validator`
3. Remplacer toutes les validations manuelles

**Fichiers à créer:**
- `back/domain/booking/BookingValidator.js`

**Fichiers à modifier:**
- `back/routes/bookings.js`
- `back/middleware/validate.js`

**Gains:**
- ✅ Validation centralisée
- ✅ Messages d'erreur standardisés
- ✅ ~25% de code en moins

---

#### **1.4 Refactoriser BookingForm avec react-hook-form + yup** 🔴 URGENT
**Temps estimé:** 6h

**Actions:**
1. Créer schéma de validation avec `yup`
2. Refactoriser `BookingForm.tsx` pour utiliser `react-hook-form`
3. Utiliser le hook `useBookingForm` créé
4. Ajouter validation en temps réel

**Fichiers à créer:**
- `front/src/domain/booking/validators.ts` (schémas yup)

**Fichiers à modifier:**
- `front/src/components/BookingForm.tsx`

**Gains:**
- ✅ ~40% de code en moins
- ✅ Validation automatique
- ✅ Meilleure UX

---

### **PHASE 2 : AMÉLIORATION UX (IMPORTANT)**

#### **2.1 Installer et utiliser react-toastify** 🟡 IMPORTANT
**Temps estimé:** 2h

**Actions:**
1. Installer `react-toastify`
2. Configurer le provider
3. Remplacer tous les `setError` par des toasts

**Fichiers à modifier:**
- `front/src/components/BookingForm.tsx`
- `front/src/pages/ClientBookingsPage.tsx`
- `front/src/components/modals/TimeChangeModal.tsx`

---

#### **2.2 Installer et utiliser @tanstack/react-query** 🟡 IMPORTANT
**Temps estimé:** 6h

**Actions:**
1. Installer `@tanstack/react-query`
2. Configurer le provider
3. Refactoriser tous les appels API
4. Ajouter cache et retry automatique

**Fichiers à modifier:**
- `front/src/services/api/bookings.ts`
- `front/src/components/BookingForm.tsx`
- `front/src/pages/ClientBookingsPage.tsx`

---

#### **2.3 Améliorer le sélecteur de date** 🟡 IMPORTANT
**Temps estimé:** 4h

**Actions:**
1. Installer `react-datepicker`
2. Créer composant `BookingDatePicker.tsx`
3. Remplacer le calendrier custom

**Fichiers à créer:**
- `front/src/components/booking/BookingDatePicker.tsx`

**Fichiers à modifier:**
- `front/src/components/BookingForm.tsx`

---

## 🚀 IMPLÉMENTATION SÉQUENTIELLE

### **ÉTAPE 1 : Services Backend (Sans régression)**

1. Créer `BookingService.js` avec toutes les méthodes
2. Tester chaque méthode individuellement
3. Refactoriser `bookings.js` route par route
4. Tester après chaque modification

### **ÉTAPE 2 : Validators Backend (Sans régression)**

1. Créer `BookingValidator.js` avec tous les validators
2. Tester chaque validator
3. Remplacer validation manuelle route par route
4. Tester après chaque modification

### **ÉTAPE 3 : Refactorisation Frontend (Sans régression)**

1. Créer schémas de validation avec `yup`
2. Refactoriser `BookingForm.tsx` étape par étape
3. Tester après chaque modification
4. Utiliser `useBookingForm` hook

---

## 📦 DÉPENDANCES À AJOUTER

### **Frontend**
```bash
npm install @tanstack/react-query react-toastify date-fns-tz react-datepicker @types/react-datepicker
```

### **Backend**
```bash
# date-fns déjà installé
```

---

## ✅ CHECKLIST DE QUALITÉ

### **Avant chaque modification:**
- [ ] Comprendre l'architecture actuelle
- [ ] Planifier les changements
- [ ] Créer les fichiers/services nécessaires
- [ ] Tester après chaque modification
- [ ] Vérifier qu'il n'y a pas de régression

### **Après chaque modification:**
- [ ] Vérifier que tout fonctionne
- [ ] Vérifier qu'il n'y a pas de doublons
- [ ] Vérifier que le code est cohérent
- [ ] Documenter les changements

---

**Prochaine étape:** Créer les services backend pour factoriser la logique métier.

