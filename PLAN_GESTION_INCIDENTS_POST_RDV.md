# 🚨 PLAN : Gestion des Incidents Post-RDV

## 🎯 **OBJECTIF**

Créer un système de gestion des incidents après un rendez-vous passé pour :
- ✅ Protéger la plateforme TapHair (aspect légal)
- ✅ Respecter la réglementation française
- ✅ Gérer les cas problématiques de manière structurée
- ✅ Fournir un parcours utilisateur clair pour signaler et résoudre les incidents

---

## 📋 **CAS D'USAGE À GÉRER**

### **1. No-Show (Personne n'est venu)**

#### **Scénarios :**
- **Client no-show :** Date passée, statut `confirmed`, mais le client n'est pas venu
- **Coiffeur no-show :** Date passée, statut `confirmed`, mais le coiffeur n'est pas venu

#### **Actions à prévoir :**
- ✅ Alerte automatique 24h après la date du RDV si non complété
- ✅ Parcours pour signaler le no-show (client ou coiffeur)
- ✅ Gestion des remboursements selon la responsabilité
- ✅ Impact sur la réputation (badge, note)

---

### **2. Prestation Mal Passée - Client Mécontent**

#### **Scénarios :**
- **Coupure ratée :** Le client n'est pas satisfait du résultat
- **Trou dans les cheveux :** Problème technique grave
- **Service non conforme :** Service différent de ce qui était prévu
- **Problème de comportement :** Coiffeur mal poli, non professionnel

#### **Actions à prévoir :**
- ✅ Parcours pour signaler l'incident (client)
- ✅ Possibilité de demander un remboursement partiel/total
- ✅ Médiation automatique (plateforme)
- ✅ Escalade vers support si nécessaire
- ✅ Impact sur la réputation du coiffeur

---

### **3. Prestation Mal Passée - Coiffeur Mécontent**

#### **Scénarios :**
- **Client mal comporté :** Client agressif, irrespectueux
- **Client non respectueux :** Client en retard, annulation de dernière minute
- **Problème de paiement :** Client refuse de payer, paiement frauduleux

#### **Actions à prévoir :**
- ✅ Parcours pour signaler l'incident (coiffeur)
- ✅ Possibilité de demander des frais supplémentaires
- ✅ Médiation automatique (plateforme)
- ✅ Escalade vers support si nécessaire
- ✅ Impact sur la réputation du client

---

## 🏗️ **ARCHITECTURE PROPOSÉE (DDD)**

### **1. NOUVEAU MODÈLE : Incident**

```javascript
// back/models/Incident.js
{
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Client ou Coiffeur qui signale
  },
  reportedAgainst: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Client ou Coiffeur contre qui on signale
  },
  type: {
    type: String,
    enum: [
      'client_no_show',
      'coiffeur_no_show',
      'client_dissatisfied',
      'coiffeur_dissatisfied',
      'payment_issue',
      'behavior_issue',
      'service_quality_issue'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['reported', 'under_review', 'mediation', 'resolved', 'escalated', 'dismissed'],
    default: 'reported'
  },
  description: {
    type: String,
    required: true
  },
  evidence: [{
    type: {
      type: String, // 'photo', 'video', 'document', 'message'
      enum: ['photo', 'video', 'document', 'message']
    },
    url: String,
    description: String
  }],
  requestedAction: {
    type: String,
    enum: ['refund_full', 'refund_partial', 'reschedule', 'compensation', 'warning', 'ban'],
    required: true
  },
  resolution: {
    type: {
      type: String,
      enum: ['refund_full', 'refund_partial', 'reschedule', 'compensation', 'warning', 'ban', 'dismissed']
    },
    amount: Number, // Montant remboursé/compensé
    reason: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Admin ou système
    },
    resolvedAt: Date
  },
  mediationHistory: [{
    action: String,
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date,
    message: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

---

### **2. NOUVEAU SERVICE : IncidentService (DDD)**

```javascript
// back/domain/incident/IncidentService.js
class IncidentService {
  /**
   * Signaler un incident
   * @param {Object} incidentData - Données de l'incident
   * @returns {Promise<Object>} Incident créé
   */
  async reportIncident(incidentData) {
    // 1. Valider que le booking existe et est passé
    // 2. Valider que l'utilisateur peut signaler (client ou coiffeur du booking)
    // 3. Créer l'incident
    // 4. Déclencher l'alerte automatique
    // 5. Envoyer notification à l'autre partie
  }

  /**
   * Médiation automatique
   * @param {string} incidentId - ID de l'incident
   * @returns {Promise<Object>} Résultat de la médiation
   */
  async mediateIncident(incidentId) {
    // 1. Analyser l'incident
    // 2. Proposer une résolution automatique
    // 3. Si acceptée, résoudre
    // 4. Si refusée, escalader vers support
  }

  /**
   * Résoudre un incident
   * @param {string} incidentId - ID de l'incident
   * @param {Object} resolution - Résolution proposée
   * @returns {Promise<Object>} Incident résolu
   */
  async resolveIncident(incidentId, resolution) {
    // 1. Valider la résolution
    // 2. Appliquer la résolution (remboursement, etc.)
    // 3. Mettre à jour les réputations
    // 4. Notifier les parties
  }

  /**
   * Vérifier les RDV passés non complétés
   * @returns {Promise<Array>} Liste des bookings à vérifier
   */
  async checkPastBookings() {
    // 1. Trouver les bookings passés avec statut 'confirmed'
    // 2. Vérifier si complétés
    // 3. Créer des alertes automatiques
  }
}
```

---

### **3. NOUVEAU FACTORY : IncidentFactory**

```javascript
// back/domain/incident/IncidentFactory.js
class IncidentFactory {
  /**
   * Créer un incident depuis un booking
   * @param {Object} booking - Booking concerné
   * @param {string} type - Type d'incident
   * @param {Object} data - Données supplémentaires
   * @returns {Object} Incident créé
   */
  static createFromBooking(booking, type, data) {
    // Logique de création selon le type
  }

  /**
   * Créer une alerte automatique pour no-show
   * @param {Object} booking - Booking concerné
   * @returns {Object} Alerte créée
   */
  static createNoShowAlert(booking) {
    // Créer une alerte automatique 24h après la date
  }
}
```

---

## 🔄 **PARCOURS UTILISATEUR**

### **1. Alerte Automatique (24h après RDV)**

#### **Scénario :** RDV passé, statut `confirmed`, non complété

**Actions :**
1. ✅ Système détecte automatiquement (job/cron)
2. ✅ Alerte envoyée au client ET au coiffeur
3. ✅ Message : "Votre rendez-vous du [date] n'a pas été marqué comme complété. Avez-vous rencontré un problème ?"
4. ✅ Boutons d'action :
   - "Tout s'est bien passé" → Marquer comme complété
   - "Signaler un problème" → Ouvrir le parcours de signalement

---

### **2. Parcours de Signalement (Client)**

#### **Étape 1 : Type d'incident**
- [ ] Le coiffeur n'est pas venu (no-show)
- [ ] Le service n'était pas conforme
- [ ] Problème de qualité (coupure ratée, etc.)
- [ ] Problème de comportement
- [ ] Autre

#### **Étape 2 : Description**
- Champ texte libre pour décrire le problème
- Upload de photos/vidéos (preuve)

#### **Étape 3 : Action demandée**
- [ ] Remboursement total
- [ ] Remboursement partiel (X%)
- [ ] Nouveau rendez-vous gratuit
- [ ] Compensation
- [ ] Juste signaler (pas d'action)

#### **Étape 4 : Confirmation**
- Récapitulatif
- Avertissement légal
- Confirmation

---

### **3. Parcours de Signalement (Coiffeur)**

#### **Étape 1 : Type d'incident**
- [ ] Le client n'est pas venu (no-show)
- [ ] Le client a mal comporté
- [ ] Problème de paiement
- [ ] Autre

#### **Étape 2 : Description**
- Champ texte libre pour décrire le problème
- Upload de photos/vidéos (preuve)

#### **Étape 3 : Action demandée**
- [ ] Frais de no-show
- [ ] Compensation
- [ ] Avertissement au client
- [ ] Juste signaler (pas d'action)

#### **Étape 4 : Confirmation**
- Récapitulatif
- Avertissement légal
- Confirmation

---

### **4. Médiation Automatique**

#### **Scénario :** Incident signalé

**Actions :**
1. ✅ Notification envoyée à l'autre partie
2. ✅ Possibilité de répondre/contester
3. ✅ Médiation automatique (si règles claires)
4. ✅ Escalade vers support si nécessaire

---

## ⚖️ **ASPECTS LÉGAUX & RÉGLEMENTATION**

### **1. Protection de la Plateforme**

#### **CGV à inclure :**
- ✅ Clause de non-responsabilité pour les incidents entre utilisateurs
- ✅ Processus de médiation clair
- ✅ Politique de remboursement
- ✅ Politique de réputation

#### **Conformité RGPD :**
- ✅ Consentement pour le traitement des données d'incident
- ✅ Droit à l'oubli
- ✅ Traçabilité des actions

---

### **2. Règles de Médiation**

#### **Remboursement automatique :**
- ✅ No-show client → Remboursement total (si paiement effectué)
- ✅ No-show coiffeur → Remboursement total + compensation client
- ✅ Service non conforme → Remboursement partiel/total selon gravité

#### **Escalade vers support :**
- ✅ Si les deux parties ne sont pas d'accord
- ✅ Si l'incident est grave (critical)
- ✅ Si demande de ban/permanent action

---

## 🎨 **INTERFACE UTILISATEUR**

### **1. Alerte Post-RDV (24h après)**

**Composant :** `PostBookingAlert.tsx`

**Affichage :**
- Badge d'alerte sur la page des réservations
- Modal avec message et actions
- Notification push/email

---

### **2. Formulaire de Signalement**

**Composant :** `IncidentReportForm.tsx`

**Fonctionnalités :**
- Étapes multiples (wizard)
- Upload de preuves
- Validation côté client et serveur
- Avertissement légal

---

### **3. Page de Médiation**

**Composant :** `IncidentMediationPage.tsx`

**Fonctionnalités :**
- Affichage de l'incident
- Historique des échanges
- Actions possibles (accepter, contester, répondre)
- Statut de la médiation

---

## 📊 **IMPACT SUR LA RÉPUTATION**

### **1. Système de Badges**

#### **Client :**
- ✅ "Client fiable" (pas de no-show)
- ⚠️ "Client à surveiller" (plusieurs incidents)
- ❌ "Client problématique" (incidents graves)

#### **Coiffeur :**
- ✅ "Coiffeur professionnel" (pas d'incidents)
- ⚠️ "Coiffeur à surveiller" (plusieurs incidents)
- ❌ "Coiffeur problématique" (incidents graves)

---

### **2. Impact sur les Notes**

- ✅ Incidents résolus positivement → Pas d'impact
- ⚠️ Incidents non résolus → Impact négatif
- ❌ Incidents graves → Impact négatif important

---

## 🚀 **PLAN D'IMPLÉMENTATION**

### **Phase 1 : Modèle & Service (Backend)**
1. ✅ Créer le modèle `Incident`
2. ✅ Créer le service `IncidentService`
3. ✅ Créer le factory `IncidentFactory`
4. ✅ Créer les routes API

### **Phase 2 : Détection Automatique**
1. ✅ Créer le job/cron pour détecter les RDV passés
2. ✅ Créer les alertes automatiques
3. ✅ Créer les notifications

### **Phase 3 : Interface Utilisateur (Frontend)**
1. ✅ Créer le composant `PostBookingAlert`
2. ✅ Créer le formulaire `IncidentReportForm`
3. ✅ Créer la page `IncidentMediationPage`
4. ✅ Intégrer dans les pages existantes

### **Phase 4 : Médiation & Résolution**
1. ✅ Implémenter la médiation automatique
2. ✅ Créer l'interface admin pour gérer les incidents
3. ✅ Implémenter l'impact sur la réputation

---

## ❓ **QUESTIONS À DÉFINIR ENSEMBLE**

1. **Délai de signalement :** Combien de temps après le RDV peut-on signaler un incident ? (7 jours ? 30 jours ?)

2. **Remboursement automatique :** Dans quels cas le remboursement est-il automatique ? (no-show client ? no-show coiffeur ?)

3. **Médiation :** Qui gère la médiation ? (Système automatique ? Support ? Admin ?)

4. **Ban/Permanent action :** À partir de combien d'incidents un utilisateur est-il banni ? (3 incidents ? 5 incidents ?)

5. **Preuves :** Quels types de preuves sont acceptés ? (Photos ? Vidéos ? Messages ?)

6. **Compensation :** Comment calculer la compensation ? (Pourcentage du prix ? Montant fixe ?)

---

## ⏸️ **EN ATTENTE DE TES RETOURS**

**Peux-tu me dire :**
1. ✅ Quels cas sont prioritaires pour toi ?
2. ✅ Quelles règles de médiation tu veux ?
3. ✅ Comment tu veux gérer les remboursements ?
4. ✅ Quels délais tu veux pour le signalement ?
5. ✅ Comment tu veux gérer l'impact sur la réputation ?

**Une fois défini, on implémente !** 🚀









