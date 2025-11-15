# 🔍 ANALYSE PARCOURS RÉSERVATION AVEC STRIPE

## ❌ PROBLÈME IDENTIFIÉ

**Stripe est installé mais PAS ENCORE INTÉGRÉ dans le parcours de réservation !**

---

## 📍 PARCOURS ACTUEL (SANS STRIPE)

### Côté Client :
```
1. Client sélectionne service
   ↓
2. Client remplit BookingForm (date, heure, mode, adresse)
   ↓
3. Client clique "Réserver"
   ↓
4. Booking créé avec :
   - status: 'pending'
   - paymentStatus: 'pending'
   - price: 100€
   ↓
5. ✅ Réservation créée → Redirection vers /client/bookings
   ❌ MAIS AUCUN PAIEMENT STRIPE DÉCLENCHÉ !
```

### Côté Coiffeur :
```
1. Coiffeur voit réservation dans CoiffeurReservationsPage
   ↓
2. Réservation avec status 'pending'
   ↓
3. Coiffeur peut :
   - ✅ Confirmer → status: 'confirmed'
   - ✅ Refuser → status: 'cancelled'
   ↓
4. Si confirmée :
   - Coiffeur peut marquer comme terminée → status: 'completed'
   ❌ MAIS AUCUNE VÉRIFICATION PAIEMENT !
   ❌ AUCUNE COMMISSION CALCULÉE !
```

---

## ✅ PARCOURS ATTENDU AVEC STRIPE (À IMPLÉMENTER)

### Côté Client :
```
1. Client sélectionne service
   ↓
2. Client remplit BookingForm (date, heure, mode, adresse)
   ↓
3. Client clique "Réserver"
   ↓
4. Booking créé avec :
   - status: 'pending'
   - paymentStatus: 'pending'
   - price: 100€
   ↓
5. ⚠️ MODAL PAIEMENT STRIPE S'AFFICHE
   - Client entre carte bancaire/RIB
   - Stripe Elements affiché
   ↓
6. Client paie avec Stripe
   ↓
7. Payment Intent créé avec :
   - amount: 100€
   - platformFee: 10€ (10%)
   - coiffeurAmount: 90€ (90%)
   ↓
8. Booking mis à jour :
   - stripePaymentIntentId: 'pi_xxxxx'
   - stripeCustomerId: 'cus_xxxxx'
   - platformFee: 10€
   - coiffeurAmount: 90€
   - paymentStatus: 'paid'
   ↓
9. ✅ Réservation créée ET payée → Redirection vers /client/bookings
```

### Côté Coiffeur :
```
1. Coiffeur voit réservation dans CoiffeurReservationsPage
   ↓
2. Réservation avec :
   - status: 'pending' ou 'confirmed'
   - paymentStatus: 'paid'
   - platformFee: 10€
   - coiffeurAmount: 90€
   ↓
3. Coiffeur peut :
   - ✅ Confirmer → status: 'confirmed'
   - ✅ Refuser → status: 'cancelled' (remboursement automatique)
   ↓
4. Si confirmée :
   - Coiffeur peut marquer comme terminée → status: 'completed'
   - Coiffeur reçoit 90€ (affiché dans revenus)
   - TapHair garde 10€ (commission)
```

---

## 🔧 CE QUI MANQUE ACTUELLEMENT

### ❌ Frontend - Client :
1. **Modal paiement Stripe après création réservation**
   - À créer : `StripePaymentModal.tsx`
   - À intégrer dans : `BookingForm.tsx` après ligne 282 (après `bookingService.createBooking()`)

2. **Affichage statut paiement dans ClientBookingsPage**
   - Afficher si réservation est payée ou non
   - Bouton "Payer" si pas encore payé

### ❌ Frontend - Coiffeur :
1. **Affichage commission dans CoiffeurReservationsPage**
   - Afficher `platformFee` et `coiffeurAmount`
   - Afficher revenus totaux avec commission déduite

2. **Gestion remboursements**
   - Bouton remboursement si annulation
   - Calcul automatique frais d'annulation

---

## 🔑 CLÉS STRIPE - ÉTAT ACTUEL

### ✅ Déjà référencées dans le code :
- `front/src/env.d.ts` → `VITE_STRIPE_PUBLIC_KEY`
- `front/README.md` → Mention de `VITE_STRIPE_PUBLIC_KEY`

### ❌ Pas encore configurées :
- Pas de fichier `.env` dans `back/` avec `STRIPE_SECRET_KEY`
- Pas de fichier `.env` dans `front/` avec `VITE_STRIPE_PUBLIC_KEY`
- Pas de `STRIPE_WEBHOOK_SECRET` configuré

### 📝 À configurer :
```env
# back/.env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# front/.env
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

---

## 🚨 DOUBLONS VÉRIFIÉS

### ✅ Pas de doublons dans le code :
- `stripe` installé 1 fois dans `back/package.json` ✅
- `@stripe/react-stripe-js` et `@stripe/stripe-js` installés 1 fois dans `front/package.json` ✅
- Modèle `Payment.js` créé 1 fois ✅
- Service `stripeService.js` créé 1 fois ✅
- Routes `payments.js` créées 1 fois ✅
- Service frontend `stripeBooking.ts` créé 1 fois ✅

### ⚠️ Mention Stripe dans Order.js :
- `Order.js` mentionne `stripe` dans `paymentMethod` enum
- **MAIS** c'est pour les **produits** (Order), pas les **réservations** (Booking)
- Pas de doublon, c'est normal

---

## 📊 RÉSUMÉ : CE QUI EST FAIT VS À FAIRE

### ✅ Backend - COMPLET :
- [x] Stripe installé
- [x] Modèle Payment créé
- [x] Modèle Booking mis à jour
- [x] Service Stripe créé
- [x] Routes API créées
- [x] Calcul 10% commission automatique
- [x] Webhook handler créé

### ⏳ Frontend - EN COURS :
- [x] Stripe Elements installé
- [x] Service API créé (`stripeBooking.ts`)
- [ ] **Modal paiement à créer** (`StripePaymentModal.tsx`)
- [ ] **Intégration dans BookingForm**
- [ ] **Affichage paiement dans ClientBookingsPage**
- [ ] **Affichage commission dans CoiffeurReservationsPage**

### ⏳ Configuration - À FAIRE :
- [ ] Clés Stripe à configurer dans `.env`
- [ ] Webhook Stripe à configurer dans dashboard

---

## 🎯 PROCHAINES ÉTAPES PRIORITAIRES

### 1. **Créer le modal paiement Stripe** (CÔTÉ CLIENT)
   - Fichier : `front/src/components/modals/StripePaymentModal.tsx`
   - Intégrer Stripe Elements
   - Appeler `/api/payments/create-payment-intent`
   - Confirmer paiement

### 2. **Intégrer dans BookingForm** (CÔTÉ CLIENT)
   - Après création réservation (ligne 282)
   - Afficher modal paiement
   - Attendre confirmation paiement
   - Rediriger seulement après paiement réussi

### 3. **Affichage commission côté coiffeur**
   - Afficher `platformFee` et `coiffeurAmount` dans `CoiffeurReservationsPage`
   - Calculer revenus totaux avec commission

### 4. **Configurer les clés Stripe**
   - Créer `.env` backend avec clés Stripe
   - Créer `.env` frontend avec clé publique
   - Configurer webhook dans Stripe Dashboard

---

**Document créé le :** 2025-01-XX  
**Version :** 1.0  
**Statut :** Backend prêt ✅ | Frontend à compléter ⏳

