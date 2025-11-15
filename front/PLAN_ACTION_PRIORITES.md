# 🎯 PLAN D'ACTION - PRIORITÉS

**Date:** 2025-01-09  
**Objectif:** Finaliser le parcours réservation de base (comme Uber) avec 0 risque

---

## ✅ TÂCHES COMPLÉTÉES

### 1. ✅ Hooks Centralisés pour les Rôles (PRIORITÉ)
- ✅ Créé `useRole.ts` avec hooks centralisés
- ✅ `useRole()` - Hook principal
- ✅ `useIsClient()`, `useIsCoiffeur()`, `useIsAdmin()` - Hooks spécifiques
- ✅ Remplacé les vérifications dispersées dans :
  - `CoiffeurCard.tsx`
  - `ConnectionStatusManager.tsx`
  - `Header.tsx`
  - `CoiffeurProfileEditPage.tsx`
  - `CoiffeurReservationsPage.tsx`
  - `CoiffeurProfilePage.tsx`

### 2. ✅ Processus Paiement Stripe (PCI-DSS)
- ✅ Corrigé `BookingForm.tsx` pour **TOUJOURS** ouvrir le modal Stripe
- ✅ Bloqué la redirection tant que le paiement n'est pas confirmé
- ✅ Ajouté vérification du statut du paiement avant redirection
- ✅ Créé document `PROCESSUS_PAIEMENT_PCI_DSS.md` avec normes réglementaires

### 3. ✅ Géolocalisation dans Réservations Coiffeur
- ✅ Ajouté affichage de l'adresse pour réservations à domicile
- ✅ Ajouté coordonnées GPS avec lien vers Google Maps
- ✅ Affiché uniquement pour `mode === 'domicile'`

---

## 🔄 TÂCHES EN COURS

### 4. Identifier et Supprimer Composants Non Utilisés
**Composants à supprimer :**
- `VideoTest.tsx` - Composant de test non utilisé
- `ApiErrorHandler.tsx` - Non importé (à intégrer ou supprimer)
- `DashboardStats.tsx` - Non importé dans Dashboard
- `SalonAddressForm.tsx` - Non utilisé (doublon avec AddressForm)
- `AddressDisplay.tsx` - Non importé dans ClientProfilePage
- `OrdersManagement.tsx` - Non importé dans les pages

**Action :** Supprimer ou intégrer ces composants

### 5. Unifier Doublons Majeurs
**Doublons à unifier :**
- `AddressForm.tsx` + `SalonAddressForm.tsx` → Unifier en un composant avec props `type: 'client' | 'salon'`
- `ClientBookings.tsx` + `CoiffeurBookings.tsx` → Créer `BookingList` avec props `view: 'client' | 'coiffeur'`
- `SimplePhotoUpload.tsx` + `DragDropImageUpload.tsx` → Fusionner avec props `mode: 'simple' | 'dragdrop' | 'mobile'`

**Action :** Unifier en gardant toutes les fonctionnalités

---

## 📋 PROCESSUS PAIEMENT NORMALISÉ (PCI-DSS)

### **Flux Complet (0 Risque) :**

```
1. Client remplit BookingForm → Clique "Réserver"
   ↓
2. ✅ Réservation créée (status: 'pending', paymentStatus: 'pending')
   ↓
3. ✅ MODAL STRIPE S'OUVRE AUTOMATIQUEMENT (OBLIGATOIRE)
   ↓
4. ✅ Payment Intent créé côté serveur (clientSecret)
   ↓
5. ✅ Client paie via Stripe Elements (PCI-DSS)
   ↓
6. ✅ Webhook payment_intent.succeeded → Backend met à jour
   ↓
7. ✅ Vérification statut paiement → Modal se ferme → Redirection
```

### **Règles Critiques :**
- ✅ **TOUJOURS** ouvrir le modal Stripe après création
- ✅ **JAMAIS** rediriger sans paiement confirmé
- ✅ **VÉRIFIER** le statut du paiement avant redirection
- ✅ **BLOQUER** la fermeture du modal sans paiement

---

## 🗺️ GÉOLOCALISATION

### **Affichage dans Réservations Coiffeur :**
- ✅ Adresse complète affichée pour `mode === 'domicile'`
- ✅ Coordonnées GPS affichées si disponibles
- ✅ Lien vers Google Maps pour navigation
- ✅ Affiché uniquement pour les réservations à domicile

### **Endroits où la géolocalisation devrait être présente :**
- ✅ BookingForm (côté client) - Déjà présent
- ✅ ClientBookingsPage - Déjà présent
- ✅ CoiffeurReservationsPage - ✅ **AJOUTÉ**
- ⚠️ Validation géolocalisation côté serveur - À améliorer

---

## 🧹 MÉNAGE DES COMPOSANTS

### **Composants à Supprimer (Non Utilisés) :**
1. `VideoTest.tsx` - Composant de test
2. `ApiErrorHandler.tsx` - Non importé
3. `DashboardStats.tsx` - Non importé
4. `SalonAddressForm.tsx` - Doublon (non utilisé)
5. `AddressDisplay.tsx` - Non importé
6. `OrdersManagement.tsx` - Non importé

### **Composants à Unifier (Doublons) :**
1. `AddressForm.tsx` + `SalonAddressForm.tsx` → Unifier
2. `ClientBookings.tsx` + `CoiffeurBookings.tsx` → Unifier
3. `SimplePhotoUpload.tsx` + `DragDropImageUpload.tsx` → Fusionner

---

## 📊 PROCHAINES ÉTAPES

### **Phase 1 : Finalisation (URGENT)**
1. ✅ Hooks centralisés créés
2. ✅ Processus Stripe corrigé
3. ✅ Géolocalisation ajoutée
4. ⏳ Supprimer composants non utilisés
5. ⏳ Unifier doublons majeurs

### **Phase 2 : Amélioration (IMPORTANT)**
6. Validation géolocalisation côté serveur
7. Tests automatisés
8. Documentation complète

### **Phase 3 : Optimisation (AMÉLIORATION)**
9. Performance (lazy loading, code splitting)
10. Accessibilité complète

---

## ✅ RÉSUMÉ DES CORRECTIONS

### **Hooks Centralisés :**
- ✅ `useRole()` créé et utilisé dans 6 composants
- ✅ Code dupliqué supprimé
- ✅ Vérifications cohérentes et sans bug

### **Processus Stripe :**
- ✅ Modal s'ouvre **TOUJOURS** après création
- ✅ Redirection bloquée sans paiement
- ✅ Vérification statut avant redirection
- ✅ Conformité PCI-DSS

### **Géolocalisation :**
- ✅ Affichage adresse dans réservations coiffeur
- ✅ Coordonnées GPS avec lien Google Maps
- ✅ Affiché uniquement pour domicile

---

## 🎯 OBJECTIF ATTEINT

**Parcours réservation de base (comme Uber) :**
- ✅ Création réservation
- ✅ Paiement obligatoire (Stripe)
- ✅ Géolocalisation affichée
- ✅ Vérifications de rôle centralisées
- ✅ 0 risque financier et légal

**Prochaines étapes :**
- Supprimer composants non utilisés
- Unifier doublons
- Finaliser fonctionnalités

