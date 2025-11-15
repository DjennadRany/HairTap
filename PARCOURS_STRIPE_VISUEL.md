# 🎯 PARCOURS RÉSERVATION AVEC STRIPE - SCHÉMA VISUEL

## 📍 MOMENT PRÉCIS OÙ STRIPE INTERVIENT

```
┌─────────────────────────────────────────────────────────┐
│           PARCOURS ACTUEL (SANS STRIPE) ❌              │
└─────────────────────────────────────────────────────────┘

Client → BookingForm → Création Booking → ✅ Redirection
                     (ligne 282)
                     ❌ PAS DE PAIEMENT !


┌─────────────────────────────────────────────────────────┐
│      PARCOURS ATTENDU (AVEC STRIPE) ✅ À CRÉER          │
└─────────────────────────────────────────────────────────┘

Client → BookingForm → Création Booking → MODAL STRIPE → Paiement → ✅ Redirection
                     (ligne 282)        ⚠️ ICI À AJOUTER
```

## 🔧 POINT D'INTERVENTION STRIPE

### Dans BookingForm.tsx, ligne ~282 :
```typescript
// Actuellement :
const booking = await bookingService.createBooking(bookingData);
// → Réservation créée, mais pas de paiement

// À modifier en :
const booking = await bookingService.createBooking(bookingData);

// ⚠️ AJOUTER ICI :
if (booking.success && booking.data) {
  // Afficher modal paiement Stripe
  setShowPaymentModal(true);
  setCreatedBooking(booking.data);
  // Ne pas rediriger tant que le paiement n'est pas confirmé
}
```

## 💳 MODAL PAIEMENT STRIPE (À CRÉER)

**Fichier à créer :** `front/src/components/modals/StripePaymentModal.tsx`

**Fonctionnalités :**
1. Afficher Stripe Elements (carte bancaire/RIB)
2. Appeler `/api/payments/create-payment-intent` avec `bookingId`
3. Confirmer paiement avec Stripe
4. Appeler `/api/payments/confirm-payment`
5. Fermer modal et rediriger

## 👨‍💼 COTÉ COIFFEUR - CE QUI EST DÉJÀ FAIT

### Backend :
- ✅ Coiffeur peut voir réservations avec `paymentStatus`
- ✅ Coiffeur peut voir `platformFee` et `coiffeurAmount`
- ✅ Remboursement automatique si annulation

### Frontend - À ajouter dans CoiffeurReservationsPage.tsx :
```typescript
// À afficher dans les détails de réservation :
- platformFee: 10€ (commission TapHair)
- coiffeurAmount: 90€ (montant net coiffeur)
- Statut paiement : 'paid' | 'pending' | 'refunded'
```

---

## 📋 CHECKLIST D'INTÉGRATION

### Côté Client :
- [ ] Créer `StripePaymentModal.tsx`
- [ ] Modifier `BookingForm.tsx` ligne ~282
- [ ] Ajouter état pour gérer modal paiement
- [ ] Appeler API création Payment Intent
- [ ] Confirmer paiement Stripe
- [ ] Rediriger seulement après paiement réussi
- [ ] Afficher statut paiement dans `ClientBookingsPage`

### Côté Coiffeur :
- [ ] Afficher `platformFee` dans `CoiffeurReservationsPage`
- [ ] Afficher `coiffeurAmount` dans `CoiffeurReservationsPage`
- [ ] Calculer revenus totaux avec commission
- [ ] Afficher statut paiement

### Configuration :
- [ ] Créer `.env` backend avec `STRIPE_SECRET_KEY`
- [ ] Créer `.env` frontend avec `VITE_STRIPE_PUBLIC_KEY`
- [ ] Configurer webhook dans Stripe Dashboard

---

**Résumé :** Backend complet ✅ | Frontend modal paiement à créer ⏳

