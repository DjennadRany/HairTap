# 💳 INTÉGRATION STRIPE POUR LES RÉSERVATIONS - TapHair

## ✅ STATUT D'INSTALLATION

- ✅ Stripe installé dans le backend (`stripe@^14.21.0`)
- ✅ Stripe Elements installé dans le frontend (`@stripe/react-stripe-js@^2.4.0`, `@stripe/stripe-js@^2.4.0`)
- ✅ Modèle Payment créé avec calcul automatique 10% commission
- ✅ Modèle Booking mis à jour avec infos Stripe
- ✅ Service Stripe créé (`stripeService.js`)
- ✅ Routes API paiements créées (`/api/payments`)
- ✅ Service frontend créé (`stripeBooking.ts`)

---

## 🔑 VARIABLES D'ENVIRONNEMENT REQUISES

### Backend (.env)
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Frontend (.env)
```env
# Stripe Public Key
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

**⚠️ IMPORTANT :** 
- En développement, utilisez les clés de test : `sk_test_...` et `pk_test_...`
- En production, utilisez les clés live : `sk_live_...` et `pk_live_...`
- Le webhook secret est disponible dans le dashboard Stripe → Webhooks

---

## 💰 COMMISSION TAPHAIR : 10%

### Calcul automatique :
- **Montant total** : `amount` (ex: 100€)
- **Commission TapHair (10%)** : `platformFee = amount * 0.10` (ex: 10€)
- **Montant net coiffeur (90%)** : `coiffeurAmount = amount * 0.90` (ex: 90€)

Ces montants sont calculés automatiquement dans :
- `Payment.calculateAmounts()`
- `stripeService.createPaymentIntent()`

---

## 📊 STRUCTURE DES DONNÉES

### Modèle Payment
```javascript
{
  booking: ObjectId,              // Référence Booking
  client: ObjectId,               // Référence User (client)
  coiffeur: ObjectId,             // Référence User (coiffeur)
  amount: Number,                 // Montant total (€)
  platformFee: Number,            // Commission TapHair 10% (€)
  coiffeurAmount: Number,         // Montant net coiffeur 90% (€)
  stripePaymentIntentId: String,  // ID Stripe Payment Intent
  stripeCustomerId: String,       // ID Stripe Customer
  stripeChargeId: String,        // ID Stripe Charge
  paymentMethod: String,          // 'card' | 'sepa_debit' | 'bancontact' | 'ideal'
  status: String,                 // 'pending' | 'succeeded' | 'failed' | 'refunded'
  refundAmount: Number,           // Montant remboursé (€)
  refundReason: String,           // Raison du remboursement
  stripeRefundId: String,          // ID Stripe Refund
  metadata: Map,                  // Métadonnées additionnelles
  createdAt: Date,
  updatedAt: Date
}
```

### Modèle Booking (mis à jour)
```javascript
{
  // ... champs existants ...
  stripePaymentIntentId: String,  // ID Stripe Payment Intent
  stripeCustomerId: String,       // ID Stripe Customer
  platformFee: Number,           // Commission TapHair 10% (€)
  coiffeurAmount: Number,         // Montant net coiffeur 90% (€)
  // ... autres champs ...
}
```

---

## 🔌 ROUTES API DISPONIBLES

### 1. Créer un Payment Intent
**POST** `/api/payments/create-payment-intent`
```json
{
  "bookingId": "string",
  "amount": number
}
```

**Réponse :**
```json
{
  "success": true,
  "clientSecret": "pi_xxxxx_secret_xxxxx",
  "paymentIntentId": "pi_xxxxx",
  "amount": 100,
  "platformFee": 10,
  "coiffeurAmount": 90
}
```

---

### 2. Confirmer un paiement
**POST** `/api/payments/confirm-payment`
```json
{
  "paymentIntentId": "pi_xxxxx"
}
```

**Réponse :**
```json
{
  "success": true,
  "paymentIntent": { ... },
  "amount": 100,
  "platformFee": 10,
  "coiffeurAmount": 90
}
```

---

### 3. Créer un Setup Intent (sauvegarder méthode paiement)
**POST** `/api/payments/create-setup-intent`

**Réponse :**
```json
{
  "success": true,
  "clientSecret": "seti_xxxxx_secret_xxxxx",
  "setupIntentId": "seti_xxxxx"
}
```

---

### 4. Rembourser un paiement
**POST** `/api/payments/refund`
```json
{
  "bookingId": "string",
  "amount": number,  // Optionnel, null = remboursement total
  "reason": "string"  // Optionnel
}
```

**Réponse :**
```json
{
  "success": true,
  "refundId": "re_xxxxx",
  "amount": 75,
  "message": "Remboursement de 75€ effectué avec succès"
}
```

---

### 5. Récupérer un Payment Intent
**GET** `/api/payments/payment-intent/:paymentIntentId`

---

### 6. Webhook Stripe
**POST** `/api/payments/webhook`

**Événements gérés :**
- `payment_intent.succeeded` → Met à jour `paymentStatus: 'paid'`
- `payment_intent.payment_failed` → Met à jour `status: 'failed'`
- `payment_intent.refunded` → Met à jour `paymentStatus: 'refunded'`

**⚠️ Configuration webhook dans Stripe Dashboard :**
- URL : `https://votre-domaine.com/api/payments/webhook`
- Événements à écouter :
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.refunded`

---

## 🔄 PARCOURS COMPLET AVEC STRIPE

### Étape 1 : Création de la réservation
```
Client → Sélection service → Formulaire → Création Booking
Booking créé avec :
- status: 'pending'
- paymentStatus: 'pending'
- price: 100€
```

### Étape 2 : Création du Payment Intent
```
Client → Clique "Payer" → API /create-payment-intent
Booking mis à jour avec :
- stripePaymentIntentId: 'pi_xxxxx'
- stripeCustomerId: 'cus_xxxxx'
- platformFee: 10€
- coiffeurAmount: 90€

Payment créé avec :
- status: 'pending'
- amount: 100€
- platformFee: 10€
- coiffeurAmount: 90€
```

### Étape 3 : Paiement avec Stripe Elements
```
Client → Entre carte bancaire/RIB → Stripe Elements
Stripe → Traite le paiement → Webhook payment_intent.succeeded
Booking mis à jour :
- paymentStatus: 'paid'

Payment mis à jour :
- status: 'succeeded'
- stripeChargeId: 'ch_xxxxx'
```

### Étape 4 : Confirmation réservation
```
Coiffeur → Confirme la réservation
Booking mis à jour :
- status: 'confirmed'
- paymentStatus: 'paid'
```

### Étape 5 : Service terminé
```
Coiffeur → Marque comme terminé
Booking mis à jour :
- status: 'completed'
- paymentStatus: 'paid'

Coiffeur reçoit : 90€ (90% du montant)
TapHair reçoit : 10€ (10% commission)
```

### Étape 6 : Annulation avec remboursement (si nécessaire)
```
Client/Coiffeur → Annule → Calcul frais annulation
Si remboursement :
- API /refund → Créer remboursement Stripe
- Booking mis à jour : paymentStatus: 'refunded'
- Payment mis à jour : status: 'refunded'
```

---

## 💳 MÉTHODES DE PAIEMENT SUPPORTÉES

### Carte bancaire
- Visa, Mastercard, American Express
- Carte débit/crédit

### Virement bancaire (SEPA)
- Prélèvement automatique SEPA
- IBAN requis

### Autres méthodes (selon pays)
- Bancontact (Belgique)
- iDEAL (Pays-Bas)
- Et autres selon configuration Stripe

---

## 🛠️ IMPLÉMENTATION FRONTEND (À FAIRE)

### 1. Installer les dépendances (déjà fait ✅)
```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
```

### 2. Créer un composant PaymentForm
```tsx
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { stripeBookingService } from '../services/api/stripeBooking';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function PaymentForm({ bookingId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      // Créer le Payment Intent
      const { clientSecret, paymentIntentId } = await stripeBookingService.createPaymentIntent(bookingId, amount);

      // Confirmer le paiement
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.origin + '/booking-success',
        },
      });

      if (error) {
        console.error('Erreur paiement:', error);
      } else {
        // Paiement réussi
        await stripeBookingService.confirmPayment(paymentIntentId);
        onSuccess();
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={!stripe || isProcessing}>
        {isProcessing ? 'Traitement...' : `Payer ${amount}€`}
      </button>
    </form>
  );
}

export function StripePaymentWrapper({ bookingId, amount, onSuccess }) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Créer le Payment Intent au chargement
    stripeBookingService.createPaymentIntent(bookingId, amount)
      .then(data => setClientSecret(data.clientSecret));
  }, [bookingId, amount]);

  if (!clientSecret) return <div>Chargement...</div>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm bookingId={bookingId} amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}
```

### 3. Intégrer dans BookingForm
```tsx
import { StripePaymentWrapper } from './StripePaymentWrapper';

// Dans BookingForm, après création de la réservation :
{bookingCreated && (
  <StripePaymentWrapper
    bookingId={booking._id}
    amount={booking.price}
    onSuccess={() => {
      // Rediriger vers page de confirmation
      navigate('/client/bookings');
    }}
  />
)}
```

---

## 📋 CHECKLIST D'IMPLÉMENTATION

### Backend ✅
- [x] Stripe installé
- [x] Modèle Payment créé
- [x] Modèle Booking mis à jour
- [x] Service Stripe créé
- [x] Routes API créées
- [x] Webhook handler créé
- [ ] Variables d'environnement configurées
- [ ] Tests effectués

### Frontend ⏳
- [x] Stripe Elements installé
- [x] Service API créé
- [ ] Composant PaymentForm créé
- [ ] Intégration dans BookingForm
- [ ] Gestion erreurs paiement
- [ ] Page confirmation paiement
- [ ] Tests effectués

### Configuration ⏳
- [ ] Clés Stripe configurées (test)
- [ ] Clés Stripe configurées (production)
- [ ] Webhook configuré dans Stripe Dashboard
- [ ] Domaines autorisés dans Stripe

---

## 🧪 TESTS

### Test 1 : Création Payment Intent
```bash
curl -X POST http://localhost:5000/api/payments/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bookingId": "booking_id",
    "amount": 100
  }'
```

### Test 2 : Webhook (via Stripe CLI)
```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

---

## 📝 NOTES IMPORTANTES

1. **Commission 10%** : Calculée automatiquement, toujours vérifiée
2. **Montants en centimes** : Stripe utilise les centimes, conversion automatique
3. **Webhooks** : Essentiels pour la synchronisation, toujours configurer
4. **Sécurité** : Ne jamais exposer `STRIPE_SECRET_KEY` côté frontend
5. **Test vs Live** : Utiliser les clés de test en développement

---

**Document créé le :** 2025-01-XX  
**Version :** 1.0  
**Statut :** Backend complet ✅ | Frontend en cours ⏳

