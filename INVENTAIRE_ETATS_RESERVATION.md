# 📋 INVENTAIRE COMPLET DES ÉTATS DE RÉSERVATION - TapHair

## 🎯 Objectif
Faire l'inventaire de tous les types d'états dans le parcours client des réservations pour préparer l'intégration avec la caisse (point de vente).

---

## 📊 1. ÉTATS PRINCIPAUX DE RÉSERVATION (status)

### État 1 : `pending` (En attente)
**Définition :** Réservation créée mais pas encore confirmée par le coiffeur

**Caractéristiques :**
- État par défaut lors de la création
- Le client a créé la réservation
- Le coiffeur n'a pas encore validé
- Date de réservation future

**Actions possibles :**
- ✅ **Coiffeur peut :** Confirmer → `confirmed` | Refuser → `cancelled`
- ✅ **Client peut :** Annuler → `cancelled` (avec frais selon délai)

**Dans le parcours client :**
```
1. Client sélectionne service → 2. Client remplit formulaire → 3. Client confirme → 4. Réservation = `pending`
```

**Paiement :** `paymentStatus: 'pending'` (pas encore payé)

---

### État 2 : `confirmed` (Confirmée)
**Définition :** Réservation confirmée par le coiffeur

**Caractéristiques :**
- Le coiffeur a validé la réservation
- Le rendez-vous est accepté
- Date de réservation future
- Prêt pour le service

**Actions possibles :**
- ✅ **Coiffeur peut :** Terminer → `completed` | Annuler → `cancelled`
- ✅ **Client peut :** Annuler → `cancelled` (avec frais selon délai)

**Dans le parcours client :**
```
Réservation `pending` → Coiffeur confirme → Réservation = `confirmed`
```

**Paiement :** Peut être `'pending'`, `'paid'` ou `'refunded'` selon la méthode

---

### État 3 : `completed` (Terminée)
**Définition :** Service effectué et réservation terminée

**Caractéristiques :**
- Le coiffeur a effectué le service
- Date de réservation passée
- Réservation finalisée
- Client peut laisser un avis

**Actions possibles :**
- ✅ **Client peut :** Laisser un avis (après completion)
- ❌ **Aucune modification** possible (réservation historique)

**Dans le parcours client :**
```
Réservation `confirmed` → Coiffeur effectue service → Coiffeur marque comme terminée → Réservation = `completed`
```

**Paiement :** Généralement `'paid'` (sauf exception)

---

### État 4 : `cancelled` (Annulée)
**Définition :** Réservation annulée par le client ou le coiffeur

**Caractéristiques :**
- Réservation annulée
- Peut avoir des frais d'annulation (`cancellationFee`)
- Raison d'annulation stockée (`cancellationReason`)
- Date de réservation peut être passée ou future

**Actions possibles :**
- ❌ **Aucune action** (réservation historique)

**Dans le parcours client :**
```
Réservation `pending`/`confirmed` → Annulation → Réservation = `cancelled`
```

**Paiement :** `'pending'`, `'paid'` ou `'refunded'` selon le moment de l'annulation

---

## 💳 2. ÉTATS DE PAIEMENT (paymentStatus)

### État P1 : `pending` (En attente)
**Définition :** Paiement non effectué

**Caractéristiques :**
- Paiement non reçu
- État par défaut à la création
- Réservation peut être `pending`, `confirmed`, ou `cancelled`

**Moment dans le parcours :**
- Au moment de la création (`pending`)
- Si paiement en retard
- Si réservation annulée avant paiement

---

### État P2 : `paid` (Payé)
**Définition :** Paiement effectué avec succès

**Caractéristiques :**
- Paiement reçu
- Réservation généralement `confirmed` ou `completed`
- Peut être modifié en `refunded` si annulation tardive

**Moment dans le parcours :**
- Après confirmation si paiement anticipé
- Au moment de la prestation si paiement sur place
- Après le service

---

### État P3 : `refunded` (Remboursé)
**Définition :** Paiement remboursé (annulation avec remboursement)

**Caractéristiques :**
- Paiement initialement `paid`
- Remboursement effectué (partiel ou total selon `cancellationFee`)
- Réservation généralement `cancelled`

**Moment dans le parcours :**
```
Réservation `confirmed` (paid) → Annulation avec remboursement → paymentStatus = `refunded`
```

**Calcul du remboursement :**
- **≥ 48h avant :** Remboursement 100% (frais = 0€)
- **24h-48h avant :** Remboursement 75% (frais = 25%)
- **< 24h avant :** Remboursement 25% (frais = 75%)

---

## 🏪 3. MODES DE PRESTATION (mode)

### Mode M1 : `salon` (En salon)
**Définition :** Prestation effectuée au salon du coiffeur

**Caractéristiques :**
- Pas d'adresse client requise
- Adresse = adresse du salon
- Point de paiement généralement au salon

---

### Mode M2 : `domicile` (À domicile)
**Définition :** Prestation effectuée au domicile du client

**Caractéristiques :**
- Adresse complète client requise
- Peut inclure : rue, numéro, ville, code postal, étage, appartement, code bâtiment, infos complémentaires
- Point de paiement généralement à domicile

---

## 🔄 4. PARCOURS CLIENT COMPLET - DIAGRAMME D'ÉTATS

```
┌─────────────────────────────────────────────────────────────┐
│                   CRÉATION DE RÉSERVATION                    │
│                                                              │
│  Client → Sélection service → Formulaire → Confirmation     │
│                                                              │
│  Réservation créée avec :                                    │
│  - status: 'pending'                                        │
│  - paymentStatus: 'pending'                                 │
│  - date: [date choisie]                                     │
│  - mode: 'salon' | 'domicile'                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   pending (En attente) │
        │   payment: pending     │
        └───────────┬────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐      ┌─────────────────┐
│ Coiffeur    │      │ Client Annule   │
│ Confirme    │      │ (avec frais)    │
└──────┬───────┘      └────────┬────────┘
       │                       │
       ▼                       ▼
┌──────────────┐      ┌─────────────────┐
│ confirmed    │      │ cancelled       │
│ payment:     │      │ payment:        │
│ pending/paid │      │ pending/refunded│
└──────┬───────┘      └─────────────────┘
       │
       │
       ▼
┌─────────────────────────┐
│ Coiffeur Effectue       │
│ Service                 │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Coiffeur Marque Terminé │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ completed               │
│ payment: paid           │
│                         │
│ Client peut laisser avis│
└─────────────────────────┘
```

---

## 💰 5. INTÉGRATION CAISSE - POINTS D'INTERVENTION

### Point Caisse 1 : À la création (pending)
**Moment :** Client crée la réservation

**Action caisse :**
- ✅ Vérifier solvabilité
- ✅ Autoriser la création même si non payé
- ⚠️ Option : Prépaiement (paiement anticipé) → `paymentStatus: 'paid'`

**États après action :**
- Si prépayé : `status: 'pending'`, `paymentStatus: 'paid'`
- Si non payé : `status: 'pending'`, `paymentStatus: 'pending'`

---

### Point Caisse 2 : À la confirmation (confirmed)
**Moment :** Coiffeur confirme la réservation

**Action caisse :**
- ✅ Enregistrer le paiement si pas encore fait
- ✅ Générer ticket/facture si paiement anticipé
- ✅ Marquer `paymentStatus: 'paid'` si paiement reçu

**États après action :**
- `status: 'confirmed'`, `paymentStatus: 'paid'`

---

### Point Caisse 3 : Avant la prestation (confirmed)
**Moment :** Juste avant ou au moment de la prestation

**Action caisse :**
- ✅ Vérifier si déjà payé
- ✅ Enregistrer paiement si pas encore fait
- ✅ Générer ticket/facture
- ✅ Marquer `paymentStatus: 'paid'`

**États après action :**
- `status: 'confirmed'`, `paymentStatus: 'paid'`

---

### Point Caisse 4 : Après la prestation (completed)
**Moment :** Coiffeur marque comme terminée

**Action caisse :**
- ✅ Finaliser la transaction
- ✅ Générer facture finale
- ✅ Enregistrer revenus

**États après action :**
- `status: 'completed'`, `paymentStatus: 'paid'`

---

### Point Caisse 5 : À l'annulation (cancelled)
**Moment :** Annulation de réservation

**Action caisse :**
- ✅ Calculer frais d'annulation (`cancellationFee`)
- ✅ Si déjà payé : Calculer remboursement
- ✅ Si remboursement : `paymentStatus: 'refunded'`
- ✅ Enregistrer remboursement dans caisse

**Calcul automatique des frais :**
- **≥ 48h avant :** `cancellationFee: 0` → Remboursement 100%
- **24h-48h avant :** `cancellationFee: price * 0.25` → Remboursement 75%
- **< 24h avant :** `cancellationFee: price * 0.75` → Remboursement 25%

**États après action :**
- `status: 'cancelled'`
- Si payé : `paymentStatus: 'refunded'`
- Si non payé : `paymentStatus: 'pending'`

---

## 📈 6. TABLEAU RÉCAPITULATIF DES ÉTATS

| État Réservation | État Paiement | Mode | Description | Action Caisse Possible |
|------------------|----------------|------|-------------|------------------------|
| `pending` | `pending` | salon/domicile | Réservation en attente de confirmation | Vérifier solvabilité, option prépaiement |
| `pending` | `paid` | salon/domicile | Réservation en attente mais prépayée | Facture prépaiement générée |
| `confirmed` | `pending` | salon/domicile | Réservation confirmée, pas encore payée | Enregistrer paiement, générer facture |
| `confirmed` | `paid` | salon/domicile | Réservation confirmée et payée | Transaction complète |
| `completed` | `paid` | salon/domicile | Service terminé et payé | Finaliser, enregistrer revenus |
| `cancelled` | `pending` | salon/domicile | Annulée avant paiement | Pas d'action financière |
| `cancelled` | `paid` | salon/domicile | Annulée mais était payée | Calculer remboursement |
| `cancelled` | `refunded` | salon/domicile | Annulée et remboursée | Enregistrer remboursement |

---

## 🎯 7. RECOMMANDATIONS POUR L'INTÉGRATION CAISSE

### Actions à implémenter :

1. **Hook de création de réservation**
   - Vérifier si prépaiement requis
   - Enregistrer transaction si payé

2. **Hook de confirmation**
   - Vérifier paiement si pas encore fait
   - Générer facture/ticket

3. **Hook de completion**
   - Finaliser transaction
   - Générer facture finale
   - Enregistrer dans caisse/journal

4. **Hook d'annulation**
   - Calculer frais automatiquement
   - Si remboursement : créer transaction remboursement
   - Enregistrer dans caisse

5. **Fonction de calcul automatique des frais**
   - Déjà implémentée dans `Booking.js` : `getCancellationFee()`
   - Utiliser pour calculer remboursement

6. **Synchronisation caisse ↔ Réservations**
   - Toutes les transactions doivent être traçables
   - Chaque changement de `paymentStatus` doit créer une entrée caisse
   - Journaliser toutes les opérations

---

## 📝 8. DONNÉES STOCKÉES PAR RÉSERVATION

### Informations principales :
```javascript
{
  _id: ObjectId,
  client: ObjectId (référence User),
  coiffeur: ObjectId (référence User),
  service: String,
  date: Date,
  duration: Number (minutes),
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  paymentStatus: 'pending' | 'paid' | 'refunded',
  price: Number,
  mode: 'salon' | 'domicile',
  address: { ... }, // Si mode = 'domicile'
  notes: String,
  cancellationReason: String, // Si cancelled
  cancellationFee: Number, // Si cancelled
  createdAt: Date,
  updatedAt: Date
}
```

---

## ✅ 9. VALIDATIONS IMPORTANTES

### Validations métier :
- ✅ Réservation ne peut passer de `completed` à autre état
- ✅ Réservation `cancelled` ne peut être modifiée
- ✅ `cancellationFee` ne peut être > `price`
- ✅ Paiement doit être cohérent avec le statut
- ✅ Date de réservation doit être future pour `pending`/`confirmed`

### Validations techniques :
- ✅ `status` doit être dans enum : `['pending', 'confirmed', 'completed', 'cancelled']`
- ✅ `paymentStatus` doit être dans enum : `['pending', 'paid', 'refunded']`
- ✅ `mode` doit être dans enum : `['salon', 'domicile']`

---

## 🔗 10. ROUTES API DISPONIBLES

### Routes principales :
- `POST /api/bookings` - Créer réservation
- `GET /api/bookings/client` - Réservations du client
- `GET /api/bookings/coiffeur` - Réservations du coiffeur
- `GET /api/bookings/:id` - Détails réservation
- `PATCH /api/bookings/:id/status` - Modifier statut
- `POST /api/bookings/:id/cancel` - Annuler (avec calcul frais)
- `POST /api/bookings/:id/confirm` - Confirmer
- `POST /api/bookings/:id/complete` - Terminer
- `PATCH /api/bookings/:id/payment` - Modifier statut paiement

---

## 📊 11. STATISTIQUES DISPONIBLES

### Métriques calculées :
- Total réservations
- En attente (`pending`)
- Confirmées (`confirmed`)
- Terminées (`completed`)
- Annulées (`cancelled`)
- Revenus (somme des `confirmed` + `completed` avec `paid`)

---

**Document créé le :** 2025-01-XX  
**Version :** 1.0  
**Objectif :** Inventaire pour intégration caisse/point de vente

---

## 🔗 12. INTÉGRATION STRIPE (AJOUTÉ)

### Statut : ✅ Backend complet | ⏳ Frontend en cours

### Commission TapHair : **10% par transaction**

Voir le document complet : `INTEGRATION_STRIPE_RESERVATIONS.md`

### Points d'intégration Stripe ajoutés :
- ✅ Création Payment Intent avec calcul automatique 10% commission
- ✅ Confirmation paiement via Stripe Elements
- ✅ Webhooks pour synchronisation automatique
- ✅ Remboursements avec calcul automatique des frais
- ✅ Support carte bancaire et virement SEPA (RIB)

### Nouveaux états avec Stripe :
- `pending` + `paymentStatus: 'pending'` + `stripePaymentIntentId: null`
- `pending` + `paymentStatus: 'pending'` + `stripePaymentIntentId: 'pi_xxxxx'`
- `confirmed` + `paymentStatus: 'paid'` + `stripePaymentIntentId: 'pi_xxxxx'`
- `completed` + `paymentStatus: 'paid'` + `platformFee: 10€`, `coiffeurAmount: 90€`
- `cancelled` + `paymentStatus: 'refunded'` + `stripeRefundId: 're_xxxxx'`

