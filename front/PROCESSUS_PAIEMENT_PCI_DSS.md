# 💳 PROCESSUS DE PAIEMENT STRIPE - CONFORMITÉ PCI-DSS

## 🎯 OBJECTIF : 0 RISQUE FINANCIER ET LÉGAL

### 📋 NORMES RÉGLEMENTAIRES (PCI-DSS)

**PCI-DSS (Payment Card Industry Data Security Standard)** :
- ✅ **Aucune donnée bancaire stockée localement**
- ✅ **Toutes les données sensibles gérées par Stripe**
- ✅ **Seuls des IDs de référence stockés** (stripePaymentIntentId, stripeCustomerId)
- ✅ **Chiffrement TLS obligatoire** (HTTPS)
- ✅ **Validation côté serveur** obligatoire

---

## 🔒 PROCESSUS NORMALISÉ (0 RISQUE)

### **ÉTAPE 1 : Création de la Réservation**
```
Client → BookingForm → Remplit formulaire → Clique "Réserver"
  ↓
✅ Réservation créée avec :
  - status: 'pending'
  - paymentStatus: 'pending'
  - price: 100€
  - stripePaymentIntentId: null (pas encore créé)
  ↓
✅ TOUJOURS ouvrir le modal Stripe (OBLIGATOIRE)
```

**Règle critique :**
- ❌ **JAMAIS** de redirection sans paiement
- ✅ **TOUJOURS** afficher le modal Stripe après création
- ✅ **BLOQUER** la redirection tant que le paiement n'est pas confirmé

---

### **ÉTAPE 2 : Création du Payment Intent (Stripe)**
```
Modal Stripe s'ouvre → Création Payment Intent côté backend
  ↓
✅ Payment Intent créé avec :
  - amount: 100€
  - currency: 'eur'
  - customer: stripeCustomerId (si existe)
  - setup_future_usage: 'off_session' (pour sauvegarder carte)
  - metadata: { bookingId, serviceName }
  ↓
✅ clientSecret retourné au frontend
```

**Sécurité PCI-DSS :**
- ✅ **Aucune donnée bancaire** dans la requête
- ✅ **clientSecret** généré côté serveur uniquement
- ✅ **HTTPS obligatoire** pour toutes les communications

---

### **ÉTAPE 3 : Paiement avec Stripe Elements**
```
Client → Entre carte dans PaymentElement → Clique "Payer"
  ↓
✅ Stripe Elements valide la carte (côté Stripe)
  ↓
✅ stripe.confirmPayment() appelé avec clientSecret
  ↓
✅ Stripe traite le paiement (côté Stripe, pas notre serveur)
  ↓
✅ Webhook payment_intent.succeeded reçu par backend
```

**Sécurité PCI-DSS :**
- ✅ **PaymentElement** gère tout côté Stripe
- ✅ **Aucune donnée bancaire** ne passe par notre serveur
- ✅ **3D Secure** géré automatiquement par Stripe

---

### **ÉTAPE 4 : Confirmation du Paiement**
```
Webhook reçu → Backend met à jour :
  - Booking.paymentStatus: 'paid'
  - Booking.stripePaymentIntentId: 'pi_xxxxx'
  - Payment créé avec :
    - status: 'succeeded'
    - amount: 100€
    - platformFee: 10€ (10%)
    - coiffeurAmount: 90€ (90%)
  ↓
✅ Frontend reçoit confirmation → Ferme modal → Redirige
```

**Règle critique :**
- ✅ **JAMAIS** rediriger avant confirmation du paiement
- ✅ **VÉRIFIER** le statut du Payment Intent avant redirection
- ✅ **GARDER** le modal ouvert en cas d'erreur

---

### **ÉTAPE 5 : Gestion des Erreurs**
```
Si erreur paiement :
  - Modal reste ouvert
  - Message d'erreur affiché
  - Client peut réessayer
  - Réservation reste en 'pending' avec paymentStatus: 'pending'
  ↓
Si paiement réussi :
  - Modal se ferme
  - Redirection vers /client/bookings
  - Réservation visible avec paymentStatus: 'paid'
```

---

## 🚨 RÈGLES CRITIQUES (0 RISQUE)

### **1. TOUJOURS Ouvrir le Modal Stripe**
```typescript
// ❌ MAUVAIS (actuel)
if (booking && booking.success && booking.data) {
  setShowPaymentModal(true);
} else {
  navigate('/client/bookings'); // ❌ Redirection sans paiement
}

// ✅ BON (corrigé)
// TOUJOURS ouvrir le modal après création de réservation
if (booking && booking._id) {
  setCreatedBooking(booking);
  setShowPaymentModal(true); // ✅ TOUJOURS ouvrir
} else {
  // Seulement si erreur de création
  setError('Erreur lors de la création de la réservation');
}
```

### **2. BLOQUER la Redirection Tant que Paiement Non Confirmé**
```typescript
// ❌ MAUVAIS (actuel)
const handlePaymentClose = () => {
  setShowPaymentModal(false);
  navigate('/client/bookings'); // ❌ Redirection sans paiement
};

// ✅ BON (corrigé)
const handlePaymentClose = () => {
  // Vérifier si le paiement a été effectué
  if (createdBooking?.paymentStatus === 'paid') {
    setShowPaymentModal(false);
    navigate('/client/bookings');
  } else {
    // Afficher un avertissement
    if (confirm('Le paiement n\'a pas été effectué. Êtes-vous sûr de vouloir quitter ?')) {
      setShowPaymentModal(false);
      // La réservation reste en 'pending' avec paymentStatus: 'pending'
    }
  }
};
```

### **3. VÉRIFIER le Statut du Paiement Avant Redirection**
```typescript
// ✅ BON
const handlePaymentSuccess = async () => {
  // Vérifier que le paiement a bien été confirmé
  const booking = await bookingService.getBooking(createdBooking._id);
  
  if (booking?.paymentStatus === 'paid') {
    setShowPaymentModal(false);
    navigate('/client/bookings');
  } else {
    // Attendre la confirmation du webhook
    // Afficher un message "Paiement en cours de traitement..."
  }
};
```

---

## 📊 FLUX COMPLET (0 RISQUE)

```
┌─────────────────────────────────────────────────────────┐
│ 1. CLIENT REMPLIT BOOKINGFORM                          │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CRÉATION RÉSERVATION (Backend)                       │
│    - status: 'pending'                                  │
│    - paymentStatus: 'pending'                           │
│    - price: 100€                                        │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. ✅ MODAL STRIPE S'OUVRE AUTOMATIQUEMENT (OBLIGATOIRE)│
│    - Création Payment Intent                            │
│    - clientSecret généré                                │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. CLIENT ENTRE CARTE (Stripe Elements)                │
│    - PaymentElement valide côté Stripe                  │
│    - Aucune donnée bancaire sur notre serveur          │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. STRIPE TRAITE LE PAIEMENT                            │
│    - 3D Secure si nécessaire                           │
│    - Webhook payment_intent.succeeded                    │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 6. BACKEND MET À JOUR                                   │
│    - Booking.paymentStatus: 'paid'                      │
│    - Payment créé avec commissions                      │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 7. ✅ CONFIRMATION → MODAL SE FERME → REDIRECTION       │
│    - Redirection vers /client/bookings                  │
│    - Réservation visible avec paymentStatus: 'paid'     │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ PROTECTIONS CONTRE LES RISQUES

### **Risque 1 : Réservation créée sans paiement**
**Protection :**
- ✅ Modal Stripe s'ouvre **TOUJOURS** après création
- ✅ Redirection bloquée tant que paiement non confirmé
- ✅ Réservation reste en 'pending' si paiement échoue

### **Risque 2 : Client ferme le modal sans payer**
**Protection :**
- ✅ Avertissement avant fermeture
- ✅ Réservation reste en 'pending' avec paymentStatus: 'pending'
- ✅ Coiffeur peut voir que le paiement n'a pas été effectué

### **Risque 3 : Erreur de paiement**
**Protection :**
- ✅ Modal reste ouvert
- ✅ Message d'erreur clair
- ✅ Client peut réessayer
- ✅ Réservation reste valide

### **Risque 4 : Données bancaires compromises**
**Protection :**
- ✅ **Aucune donnée bancaire** stockée localement
- ✅ **Tout géré par Stripe** (PCI-DSS Level 1)
- ✅ **HTTPS obligatoire**
- ✅ **Seuls des IDs de référence** stockés

---

## ✅ CHECKLIST DE CONFORMITÉ

- [x] Aucune donnée bancaire stockée localement
- [x] Stripe Elements utilisé pour la saisie
- [x] Payment Intent créé côté serveur
- [x] Webhook configuré pour confirmation
- [x] HTTPS obligatoire
- [x] Validation côté serveur
- [ ] **Modal Stripe s'ouvre TOUJOURS** (À CORRIGER)
- [ ] **Redirection bloquée sans paiement** (À CORRIGER)
- [ ] **Vérification statut avant redirection** (À CORRIGER)

---

## 🎯 CODE À CORRIGER

### **BookingForm.tsx (lignes 522-544)**

**Actuel (❌ RISQUÉ) :**
```typescript
if (booking && booking.success && booking.data) {
  setShowPaymentModal(true);
} else {
  navigate('/client/bookings'); // ❌ Redirection sans paiement
}
```

**Corrigé (✅ SÉCURISÉ) :**
```typescript
// TOUJOURS ouvrir le modal après création de réservation
if (booking && (booking._id || booking.data?._id)) {
  const bookingId = booking._id || booking.data?._id;
  setCreatedBooking({ _id: bookingId, ...booking.data || booking });
  setShowPaymentModal(true); // ✅ TOUJOURS ouvrir
} else {
  // Seulement si erreur de création
  setError('Erreur lors de la création de la réservation');
}
```

---

## 📝 CONCLUSION

**Processus normalisé (0 risque) :**
1. ✅ Création réservation → **TOUJOURS** ouvrir modal Stripe
2. ✅ Modal Stripe → Création Payment Intent
3. ✅ Client paie → Stripe traite (PCI-DSS)
4. ✅ Webhook → Confirmation paiement
5. ✅ **JAMAIS** rediriger sans paiement confirmé

**Conformité PCI-DSS :**
- ✅ Aucune donnée bancaire stockée
- ✅ Tout géré par Stripe
- ✅ HTTPS obligatoire
- ✅ Validation côté serveur

