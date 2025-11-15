# 📋 BILAN : Gestion Automatique des Réservations Passées

## 🎯 Objectifs

1. **Automatiser l'expiration** des réservations passées non confirmées
2. **Gérer les remboursements** automatiques pour les réservations non effectuées
3. **Alerter en temps réel** le coiffeur et le client pour les confirmations
4. **Maintenir la cohérence** des données et des statuts

---

## 🔍 Analyse du Système Actuel

### ✅ Ce qui existe déjà :
- Modèle `Booking` avec statuts : `pending`, `confirmed`, `completed`, `cancelled`
- `paymentStatus` : `pending`, `paid`, `refunded`
- `confirmationDeadline` : Date limite pour confirmation (24h après création)
- `BookingNotificationService` : Système d'alertes basique
- Méthodes de calcul des frais d'annulation

### ❌ Ce qui manque :
- **Statut `expired`** : Pour les réservations passées non confirmées
- **Job/Cron automatique** : Pour vérifier et expirer les réservations
- **Remboursement automatique** : Via Stripe pour les réservations non effectuées
- **Alertes en temps réel** : Pour les confirmations urgentes
- **Gestion des réservations passées** : Automatisation complète

---

## 🏗️ Architecture Proposée

### 1. **Nouveaux Statuts et Transitions**

```
pending → confirmed (par coiffeur)
pending → expired (automatique si date passée + non confirmée)
pending → cancelled (par coiffeur ou client)
confirmed → completed (par coiffeur après service)
confirmed → expired (automatique si date passée + non effectuée)
confirmed → cancelled (par coiffeur ou client)
expired → refunded (automatique si paiement effectué)
```

### 2. **Workflow de Gestion Automatique**

#### **A. Réservation en attente (pending)**
- **Création** : Statut `pending`, `confirmationDeadline` = +24h
- **Avant deadline** :
  - Alerte à 4h avant deadline : "Confirmer rapidement"
  - Alerte à 1h avant deadline : "Dernière chance"
- **Après deadline** :
  - Si date de réservation passée → `expired` + remboursement automatique
  - Si date de réservation future → reste `pending` mais alerte critique

#### **B. Réservation confirmée (confirmed)**
- **Confirmation** : Statut `confirmed`, `confirmedAt` = maintenant
- **Avant la date** :
  - Alerte 24h avant : "Rappel réservation"
  - Alerte 2h avant : "Préparation finale"
- **Pendant la date** :
  - Alerte si service non démarré après l'heure prévue
- **Après la date** :
  - Si service non effectué → `expired` + remboursement automatique
  - Si service effectué → `completed` (manuel par coiffeur)

#### **C. Réservation expirée (expired)**
- **Expiration automatique** :
  - `pending` + date passée + non confirmée → `expired`
  - `confirmed` + date passée + non effectuée → `expired`
- **Remboursement automatique** :
  - Si `paymentStatus === 'paid'` → remboursement Stripe complet
  - Mise à jour `paymentStatus = 'refunded'`
  - Notification client et coiffeur

---

## 🔄 Système de Jobs Automatiques

### **Job 1 : Vérification des Réservations à Expirer**
**Fréquence** : Toutes les heures
**Actions** :
1. Trouver les réservations `pending` avec date passée
2. Trouver les réservations `confirmed` avec date passée + non effectuées
3. Marquer comme `expired`
4. Déclencher le remboursement si nécessaire

### **Job 2 : Gestion des Remises de Remboursement**
**Fréquence** : Toutes les heures
**Actions** :
1. Trouver les réservations `expired` avec `paymentStatus === 'paid'`
2. Effectuer le remboursement Stripe
3. Mettre à jour `paymentStatus = 'refunded'`
4. Envoyer notifications

### **Job 3 : Alertes de Confirmation**
**Fréquence** : Toutes les 15 minutes
**Actions** :
1. Vérifier les réservations `pending` proches du deadline
2. Générer alertes selon le temps restant
3. Envoyer notifications push/email

### **Job 4 : Alertes de Réservation Approchante**
**Fréquence** : Toutes les heures
**Actions** :
1. Vérifier les réservations `confirmed` dans les 24h
2. Générer alertes de rappel
3. Envoyer notifications

---

## 💰 Système de Remboursement

### **Règles de Remboursement**

#### **Réservation `pending` expirée** :
- ✅ **Remboursement complet** (100%)
- Raison : Coiffeur n'a pas confirmé à temps

#### **Réservation `confirmed` expirée** :
- ✅ **Remboursement complet** (100%)
- Raison : Service non effectué (coiffeur absent ou problème)

#### **Réservation `cancelled`** :
- Selon les frais d'annulation existants :
  - ≥48h avant : 100% remboursé
  - 24-48h avant : 75% remboursé
  - <24h avant : 25% remboursé

### **Processus de Remboursement Stripe**

1. **Vérifier le paiement** :
   - `stripePaymentIntentId` existe
   - `paymentStatus === 'paid'`

2. **Créer le remboursement** :
   ```javascript
   const refund = await stripe.refunds.create({
     payment_intent: booking.stripePaymentIntentId,
     amount: booking.price * 100, // En centimes
     reason: 'requested_by_customer'
   });
   ```

3. **Mettre à jour la réservation** :
   - `paymentStatus = 'refunded'`
   - `refundedAt = new Date()`
   - `refundId = refund.id`

4. **Notifications** :
   - Email au client : "Remboursement effectué"
   - Notification au coiffeur : "Réservation expirée - Remboursement effectué"

---

## 🔔 Système d'Alertes Amélioré

### **Types d'Alertes**

#### **1. Alertes de Confirmation (Coiffeur)**
- **4h avant deadline** : "Confirmer rapidement" (high)
- **1h avant deadline** : "Dernière chance" (critical)
- **Deadline dépassée** : "Réservation expirée" (critical)

#### **2. Alertes de Réservation Approchante**
- **24h avant** : "Rappel réservation" (medium)
- **2h avant** : "Préparation finale" (high)
- **Heure passée** : "Service non démarré" (critical)

#### **3. Alertes de Remboursement**
- **Client** : "Remboursement effectué" (info)
- **Coiffeur** : "Réservation expirée - Remboursement effectué" (warning)

### **Canaux de Notification**
- ✅ **Push notifications** (via service existant)
- ✅ **Notifications in-app** (via `Notification` model)
- ✅ **Email** (optionnel, pour alertes critiques)

---

## 📊 Modifications du Modèle Booking

### **Nouveaux Champs**

```javascript
{
  // Statuts existants + nouveau
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'expired'], // ✅ NOUVEAU: 'expired'
    default: 'pending'
  },
  
  // Nouveaux champs pour expiration
  expiredAt: {
    type: Date // Date d'expiration automatique
  },
  expirationReason: {
    type: String,
    enum: ['not_confirmed', 'not_performed', 'auto_expired']
  },
  
  // Nouveaux champs pour remboursement
  refundedAt: {
    type: Date
  },
  refundId: {
    type: String // ID du remboursement Stripe
  },
  refundAmount: {
    type: Number // Montant remboursé
  }
}
```

---

## 🛠️ Services à Créer/Modifier

### **1. BookingExpirationService.js** (NOUVEAU)
```javascript
class BookingExpirationService {
  // Expirer les réservations passées
  async expirePastBookings()
  
  // Vérifier et expirer une réservation spécifique
  async checkAndExpireBooking(bookingId)
  
  // Récupérer les réservations à expirer
  async getBookingsToExpire()
}
```

### **2. BookingRefundService.js** (NOUVEAU)
```javascript
class BookingRefundService {
  // Rembourser une réservation expirée
  async refundExpiredBooking(bookingId)
  
  // Rembourser toutes les réservations expirées en attente
  async refundAllExpiredBookings()
  
  // Vérifier le statut d'un remboursement Stripe
  async checkRefundStatus(refundId)
}
```

### **3. BookingNotificationService.js** (MODIFIER)
- Ajouter alertes d'expiration
- Ajouter alertes de remboursement
- Améliorer les alertes de confirmation

### **4. BookingService.js** (MODIFIER)
- Ajouter méthode `expireBooking()`
- Modifier `getCoiffeurBookings()` pour exclure les `expired` par défaut
- Modifier `getClientBookings()` pour exclure les `expired` par défaut

---

## ⏰ Jobs/Cron à Implémenter

### **Utiliser `node-cron` ou `agenda`**

```javascript
// Toutes les heures : Expirer les réservations passées
cron.schedule('0 * * * *', async () => {
  await bookingExpirationService.expirePastBookings();
});

// Toutes les heures : Rembourser les réservations expirées
cron.schedule('0 * * * *', async () => {
  await bookingRefundService.refundAllExpiredBookings();
});

// Toutes les 15 minutes : Alertes de confirmation
cron.schedule('*/15 * * * *', async () => {
  await bookingNotificationService.checkConfirmationAlerts();
});

// Toutes les heures : Alertes de réservation approchante
cron.schedule('0 * * * *', async () => {
  await bookingNotificationService.checkApproachingBookings();
});
```

---

## 🎨 Modifications Frontend

### **1. CoiffeurReservationsPage.tsx**
- **Filtre "Expirées"** : Afficher les réservations expirées
- **Badge "Expirée"** : Style rouge pour les réservations expirées
- **Statistiques** : Ajouter compteur "Expirées"
- **Actions** : Désactiver les actions sur les réservations expirées

### **2. ClientBookingsPage.tsx**
- **Section "Remboursements"** : Afficher les réservations remboursées
- **Badge "Remboursé"** : Style vert pour les remboursements
- **Notifications** : Afficher les alertes de remboursement

### **3. BookingAlert.tsx**
- **Nouveaux types d'alertes** :
  - `expired_booking` : "Réservation expirée"
  - `refund_processed` : "Remboursement effectué"
  - `confirmation_urgent` : "Confirmer rapidement"

---

## 📈 Métriques et Reporting

### **Nouveaux KPIs**
- Taux d'expiration des réservations
- Temps moyen de confirmation
- Taux de remboursement
- Réservations non effectuées

### **Tableau de bord Coiffeur**
- Graphique des réservations expirées
- Alertes en temps réel
- Historique des remboursements

---

## 🔒 Sécurité et Validation

### **Règles de Validation**
- ✅ Ne pas permettre de modifier une réservation `expired`
- ✅ Ne pas permettre de confirmer une réservation `expired`
- ✅ Vérifier que le remboursement Stripe a réussi avant de mettre à jour le statut
- ✅ Logger tous les remboursements pour audit

### **Gestion d'Erreurs**
- Si remboursement Stripe échoue → alerte admin
- Si expiration échoue → retry avec backoff
- Si notification échoue → log mais continuer le processus

---

## 🚀 Plan d'Implémentation

### **Phase 1 : Fondations** (Priorité Haute)
1. ✅ Ajouter statut `expired` au modèle `Booking`
2. ✅ Créer `BookingExpirationService`
3. ✅ Créer `BookingRefundService`
4. ✅ Modifier `BookingService` pour gérer l'expiration

### **Phase 2 : Automatisation** (Priorité Haute)
1. ✅ Implémenter les jobs/cron
2. ✅ Tester l'expiration automatique
3. ✅ Tester les remboursements automatiques

### **Phase 3 : Alertes** (Priorité Moyenne)
1. ✅ Améliorer `BookingNotificationService`
2. ✅ Ajouter alertes d'expiration
3. ✅ Ajouter alertes de remboursement

### **Phase 4 : Frontend** (Priorité Moyenne)
1. ✅ Modifier les pages de réservations
2. ✅ Ajouter filtres et badges
3. ✅ Afficher les notifications

### **Phase 5 : Tests et Optimisation** (Priorité Basse)
1. ✅ Tests unitaires
2. ✅ Tests d'intégration
3. ✅ Optimisation des performances

---

## ✅ Avantages de cette Architecture

1. **Automatisation complète** : Plus besoin d'intervention manuelle
2. **Cohérence des données** : Les réservations passées sont toujours à jour
3. **Expérience utilisateur** : Remboursements automatiques, alertes claires
4. **Sécurité financière** : Gestion stricte des remboursements
5. **Scalabilité** : Jobs efficaces, pas de surcharge serveur
6. **Traçabilité** : Tous les événements sont loggés

---

## 🎯 Résultat Final Attendu

- ✅ **Réservations passées non confirmées** → Automatiquement expirées
- ✅ **Réservations passées non effectuées** → Automatiquement expirées + remboursées
- ✅ **Alertes en temps réel** → Coiffeur et client informés
- ✅ **Remboursements automatiques** → Via Stripe, sans intervention
- ✅ **Interface claire** → Filtres, badges, statistiques

---

**Date de création** : 2025-01-XX
**Version** : 1.0
**Statut** : 📋 Prêt pour développement










