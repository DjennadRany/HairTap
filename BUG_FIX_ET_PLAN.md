# 🐛 BUG FIX & PLAN D'ACTION - ÉTAPE PAR ÉTAPE

---

## 🐛 **BUG IDENTIFIÉ : Réservation à domicile ne se valide plus**

### **Problème :**
- La validation `yup` attend `data.address` dans react-hook-form
- Mais l'adresse est gérée dans `clientAddress` (state local)
- Quand on soumet, `data.address` n'est pas rempli dans le formulaire
- La validation yup échoue car `data.address` est `undefined`

### **Solution :**
- Synchroniser `clientAddress` avec `data.address` via `setValue`
- Mettre à jour `data.address` quand `clientAddress` change
- S'assurer que la validation yup voit les bonnes valeurs

---

## 📋 **PLAN D'ACTION - ÉTAPE PAR ÉTAPE**

### **ÉTAPE 1 : CORRIGER LE BUG DE VALIDATION** ⚠️ **PRIORITÉ HAUTE**

#### **Problème :**
- Réservation à domicile ne se valide plus
- Décalage entre `clientAddress` (state local) et `data.address` (react-hook-form)

#### **Solution :**
- Synchroniser `clientAddress` avec `data.address` via `setValue`
- Mettre à jour `data.address` quand `clientAddress` change
- S'assurer que la validation yup fonctionne

#### **Fichiers à modifier :**
- `front/src/components/BookingForm.tsx`

---

### **ÉTAPE 2 : UNIFIER SalonAddressForm et HorizontalSalonAddress**

#### **État actuel :**
- `SalonAddressForm.tsx` (321 lignes) - **Non utilisé**
- `HorizontalSalonAddress.tsx` (327 lignes) - **Non utilisé**

#### **Action :**
- Créer un composant unifié `SalonAddressForm` avec props :
  - `layout?: 'vertical' | 'horizontal'` (défaut: 'vertical')
  - `showMap?: boolean` (défaut: false)
  - `enableGeocoding?: boolean` (défaut: false)
- Supprimer `HorizontalSalonAddress.tsx`
- **Résultat** : -327 lignes, 1 composant au lieu de 2

#### **Impact :**
- **Aucun** car ils ne sont pas utilisés actuellement

---

### **ÉTAPE 3 : REFACTORISER ClientBookingsPage + AMÉLIORER UX/UI**

#### **URL concernée :**
- **`/client/bookings`** - Page des réservations client

#### **Problèmes actuels :**
- ❌ Affichage en bazar
- ❌ Les RDV les plus récents ne sont pas en premier
- ❌ Difficile de distinguer : en attente, confirmé, annulé
- ❌ UX/UI pas optimale

#### **Améliorations à apporter :**
- ✅ Trier par défaut : **les plus récents en premier** (`createdAt` DESC)
- ✅ Distinguer clairement les statuts :
  - **En attente** : Badge jaune/orange
  - **Confirmé** : Badge vert/bleu
  - **Annulé** : Badge rouge/gris
  - **Terminé** : Badge gris
- ✅ Améliorer l'UX/UI :
  - Cards avec bordures colorées selon le statut
  - Icônes pour chaque statut
  - Espacement et hiérarchie visuelle améliorés
  - Groupement par statut (optionnel)

#### **Action :**
- Refactoriser `ClientBookingsPage` pour utiliser `ClientBookings` comme composant principal
- Ajouter les fonctionnalités manquantes (modals, tri) via props
- **Améliorer l'affichage** : tri par défaut, badges de statut, meilleure UX/UI

#### **Fichiers à modifier :**
- `front/src/pages/ClientBookingsPage.tsx`
- `front/src/components/ClientBookings.tsx`

---

### **ÉTAPE 4 : EXTRAIRE LA LOGIQUE D'ADRESSE DE BookingForm**

#### **URL concernée :**
- **`/booking/:id`** - Page de réservation

#### **Problème :**
- **230 lignes de formulaire d'adresse inline** qui existent déjà dans `AddressForm`
- Code dupliqué
- Difficile à maintenir

#### **Solution :**
- Utiliser le composant `AddressForm` existant au lieu du code inline
- S'assurer que `AddressForm` fonctionne pour la géolocalisation (maps)
- Extraire la logique de disponibilité dans un hook `useBookingAvailability`

#### **Important :**
- ✅ **AddressForm doit fonctionner pour la géolocalisation** (maps pour coiffeurs et clients)
- ✅ **Pas de perte de fonctionnalité**
- ✅ **Tout doit rester fonctionnel**

#### **Fichiers à modifier :**
- `front/src/components/BookingForm.tsx`
- `front/src/components/AddressForm.tsx` (vérifier géolocalisation)

---

### **ÉTAPE 5 : CRÉER DES HOOKS MÉTIER**

#### **Hooks à créer :**
- `hooks/common/useAddress.ts` - Gestion des adresses (CRUD, validation, géolocalisation)
- `hooks/common/useBookings.ts` - Gestion des réservations (fetch, filter, actions)
- `hooks/common/useComments.ts` - Gestion des commentaires (fetch, create, like, reply)
- `hooks/common/useLikes.ts` - Gestion des likes (toggle, fetch user likes)

#### **Avantages :**
- Logique centralisée (1 endroit au lieu de 3-5)
- Réutilisabilité maximale
- Tests plus faciles
- Maintenance simplifiée

---

### **ÉTAPE 6 : OPTIMISER AVEC React.memo, useMemo, useCallback**

#### **Composants à optimiser :**
- `InstagramComments.tsx`
- `BookingForm.tsx`
- `ClientBookings.tsx`
- `CoiffeurBookings.tsx`

#### **Avantages :**
- Performance améliorée (moins de re-renders)
- Expérience utilisateur améliorée (plus fluide)
- Pas de changement de comportement pour l'utilisateur

---

## 📊 **RÉSUMÉ DES QUESTIONS**

### ✅ **Réponses reçues :**

1. **Bug réservation domicile** : ✅ À corriger en priorité
2. **Base de données** : ✅ Pris en compte (addresses.home, addresses.office, salonAddress)
3. **AddressForm** : ✅ Important pour géolocalisation (maps)
4. **ClientBookingsPage** : ✅ Refactoriser + améliorer UX/UI (tri, badges, meilleur affichage)
5. **Hooks métier** : ✅ OK si pas de perte de fonctionnalité
6. **Optimisations React** : ✅ OK

---

## 🎯 **PROCHAINES ÉTAPES**

1. **ÉTAPE 1** : Corriger le bug de validation (PRIORITÉ HAUTE)
2. **ÉTAPE 2** : Unifier SalonAddressForm et HorizontalSalonAddress
3. **ÉTAPE 3** : Refactoriser ClientBookingsPage + améliorer UX/UI
4. **ÉTAPE 4** : Extraire la logique d'adresse de BookingForm
5. **ÉTAPE 5** : Créer les hooks métier
6. **ÉTAPE 6** : Optimiser avec React.memo, useMemo, useCallback

---

**On commence par l'ÉTAPE 1 (corriger le bug) ?** 🚀

