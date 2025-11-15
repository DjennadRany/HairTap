# 🎯 PROPOSITIONS FINALES DÉTAILLÉES : Gestion des Incidents

## 📋 **SYSTÈME DE POINTS & BANNISSEMENTS (Point 4)**

### **Échelle de Points pour Incidents**

#### **Types d'Incidents & Points :**

**Légers (1-3 points) :**
- Retard modéré (< 15 min) : **1 point**
- Petite insatisfaction mineure : **2 points**
- Comportement mineur inapproprié : **3 points**
- **Impact :** Avertissement, pas de bannissement

**Moyens (4-6 points) :**
- Retard important (15-30 min) : **4 points**
- Insatisfaction modérée : **5 points**
- Comportement modéré inapproprié : **6 points**
- **Impact :** Alerte, impact note -0.1

**Graves (7-10 points) :**
- **Atteinte à la personne :**
  - Agression verbale : **7 points**
  - Agression physique : **10 points** (bannissement total)
  - Harcèlement : **8 points**
  
- **Atteinte déontologique grave :**
  - Erreur technique grave (trou dans les cheveux, mauvaise coloration) : **7 points**
  - Service non conforme grave : **8 points**
  - Fraude (paiement au black) : **9 points** (bannissement total)
  - Comportement professionnel grave : **9 points** (bannissement total)
  
- **No-show :**
  - Client no-show : **7 points**
  - Coiffeur no-show : **8 points**

**Critiques (9-10 points) :**
- Agression physique : **10 points** → Bannissement total immédiat
- Fraude grave : **9 points** → Bannissement total
- Comportement professionnel grave : **9 points** → Bannissement total
- **Impact :** Bannissement total immédiat

---

### **Système de Bannissements Basé sur les Points**

#### **Accumulation de Points :**

**Période de référence :** 90 jours glissants

**Calcul :**
- Points accumulés sur 90 jours
- Points décroissent après 90 jours (demi-vie)

#### **Échelle de Bannissements :**

**Niveau 0 : OK (1-3 points)**
- **Points :** 1 à 3
- **Action :** Avertissement, pas de bannissement
- **Impact note :** -0.05 par point

**Niveau 1 : Alerte (4-6 points)**
- **Points :** 4 à 6
- **Action :** Alerte dans le dashboard, notification
- **Impact note :** -0.1 par point
- **Impact classification :** Aucun

**Niveau 2 : Grave (7-8 points)**
- **Points :** 7 à 8
- **Action :** Bannissement provisoire (7 jours)
- **Impact note :** -0.5 par point
- **Impact classification :** Déclassement temporaire (30 jours)

**Niveau 3 : Critique (9 points)**
- **Points :** 9
- **Action :** Bannissement temporaire (30 jours)
- **Impact note :** -1.0 point
- **Impact classification :** Exclusion des hub (90 jours)

**Niveau 4 : Bannissement Total (10 points)**
- **Points :** 10
- **Action :** Bannissement total (permanent)
- **Impact note :** -2.0 points
- **Impact classification :** Exclusion définitive

#### **Exemples Concrets :**

**Exemple 1 : Coiffeur avec erreur technique grave**
- Erreur grave (trou dans les cheveux) : **7 points**
- **Action :** Bannissement provisoire 7 jours
- **Impact :** Note -0.5, Déclassement temporaire 30 jours

**Exemple 2 : Coiffeur avec 2 erreurs graves**
- 1ère erreur grave : **7 points**
- 2ème erreur grave : **7 points**
- **Total :** 14 points sur 90 jours
- **Action :** Bannissement temporaire 30 jours (car > 8 points)
- **Impact :** Note -1.0, Exclusion hub 90 jours

**Exemple 3 : Coiffeur avec fraude**
- Fraude (paiement au black) : **9 points**
- **Action :** Bannissement temporaire 30 jours
- **Impact :** Note -1.0, Exclusion hub 90 jours

**Exemple 4 : Coiffeur avec agression physique**
- Agression physique : **10 points**
- **Action :** Bannissement total immédiat (permanent)
- **Impact :** Note -2.0, Exclusion définitive

---

### **Système de Récupération après Bannissement Provisoire**

**Après bannissement provisoire (7 jours) :**
- **Échelle de points :**
  - **0-3 points** : OK, pas de nouveau bannissement
  - **4-6 points** : Alerte, pas de bannissement
  - **7-8 points** : Bannissement temporaire (30 jours)
  - **9 points** : Bannissement temporaire (30 jours)
  - **10 points** : Bannissement total (permanent)

**Après bannissement temporaire (30 jours) :**
- **Échelle de points :**
  - **0-3 points** : OK, pas de nouveau bannissement
  - **4-6 points** : Alerte, pas de bannissement
  - **7-8 points** : Bannissement temporaire (30 jours) - **Répété**
  - **9 points** : Bannissement total (permanent)
  - **10 points** : Bannissement total (permanent)

**Logique :**
- ✅ Après bannissement provisoire → Tolérance réduite
- ✅ Après bannissement temporaire → Tolérance très réduite
- ✅ 2 bannissements temporaires répétés → Bannissement total

---

## 🎯 **PROPOSITIONS PRIORISÉES & DÉTAILLÉES**

### **1. Confirmation Prestation avec Géolocalisation**

#### **Timing des Alertes :**

**A. 10 minutes avant le RDV :**
- **Modal + Push notification** au client : "Vous êtes en route ? Confirmez votre localisation"
- **Modal + Push notification** au coiffeur : "Le client est-il en route ? Vérifiez la localisation"
- **Actions :**
  - "Oui, je suis en route" (avec géolocalisation)
  - "Non, je suis en retard" (avec estimation)
  - **Pénalités :** Si retard > 30 min selon charte → Pénalités pour le client

**B. 5 minutes après le début de la prestation :**
- **Modal + Push notification** au client : "La prestation a-t-elle bien commencé ? Confirmez avec photo + localisation"
- **Modal + Push notification** au coiffeur : "La prestation a-t-elle bien commencé ? Confirmez avec photo + localisation"
- **Actions :**
  - "Oui, en cours" (avec photo + géolocalisation)
  - "Non, problème" (avec description)
- **Vérification :** Géolocalisation doit matcher (client et coiffeur au même endroit)

**C. À la fin de la prestation :**
- **Modal + Push notification** au client : "La prestation est-elle terminée ? Êtes-vous satisfait ?"
- **Modal + Push notification** au coiffeur : "La prestation est-elle terminée ? Marquez comme complétée"
- **Actions :**
  - "Oui, terminée et satisfait" (validation)
  - "Oui, terminée mais problème" (signalement)
  - "Non, problème" (signalement incident)
- **Double validation :** Client ET Coiffeur doivent valider

#### **Système de Géolocalisation :**

**Vérification automatique :**
- ✅ **Distance entre client et coiffeur** < 100m → Match OK
- ✅ **Distance entre client et coiffeur** > 100m → Alerte, pas de match
- ✅ **Si pas de match** → Alerte admin, investigation

**Prérequis :**
- ✅ Autorisation géolocalisation (demandée au début)
- ✅ Vérification à chaque étape (10 min avant, 5 min après début, fin)

---

### **2. Points Factuels & Validation Admin**

#### **Preuves Acceptées :**
- ✅ **Photos** (max 5 par incident, 5MB max)
- ✅ **Messages** (historique du chat)
- ✅ **Géolocalisation** (horodatage + coordonnées)

#### **Processus de Validation :**

**1. Signalement :**
- Client/Coiffeur signale un incident
- Upload photos + messages
- Description détaillée

**2. Alerte Admin :**
- Incident créé dans page admin de contrôle
- Alerte visible pour admin
- Statut : "En attente de validation"

**3. Validation Admin :**
- Admin examine les preuves
- Admin attribue des points selon gravité
- Admin valide ou rejette l'incident

**4. Résolution :**
- Si validé → Points attribués, sanctions appliquées
- Si rejeté → Incident fermé, pas de points

#### **Page Admin de Contrôle :**

**Fonctionnalités :**
- ✅ Liste des incidents en attente
- ✅ Détails de chaque incident (photos, messages, géolocalisation)
- ✅ Attribution de points
- ✅ Validation/Rejet
- ✅ Historique des incidents
- ✅ Statistiques (incidents par type, par coiffeur, etc.)

---

### **3. Chatbot Auto-Incrémenté (Rasa)**

#### **Architecture :**

**Respect de l'architecture DDD :**
- ✅ **Service :** `IncidentMediationService.js` (logique métier)
- ✅ **Factory :** `IncidentMediationFactory.js` (création de médiations)
- ✅ **Repository :** `IncidentRepository.js` (accès données)
- ✅ **Domain Events :** `IncidentMediationEvents.js` (événements)

**Intégration Rasa :**
- ✅ **API Rasa** : Endpoint pour médiation automatique
- ✅ **Base de connaissances** : Règles de médiation
- ✅ **Apprentissage** : Chaque résolution admin enrichit la base

#### **Fonctionnement :**

**1. Médiation Automatique :**
- Incident signalé → Chatbot analyse
- Chatbot propose une résolution selon règles
- Si acceptée par les 2 parties → Résolu automatiquement

**2. Escalade :**
- Si pas de compromis → Support humain
- Si support échoue → Admin

**3. Auto-Incrémentation :**
- Chaque résolution admin → Ajoutée à la base de connaissances
- Chatbot apprend des nouveaux cas
- Règles mises à jour automatiquement

---

### **4. Système de Points & Bannissements (DÉTAILLÉ)**

#### **Calcul des Points :**

**Formule :**
```
Points totaux = Σ(Points incident × Poids incident × Décroissance temps)

Décroissance temps = 1 - (jours écoulés / 90)
```

**Exemple :**
- Incident 7 points il y a 30 jours
- Décroissance : 1 - (30/90) = 0.67
- Points actuels : 7 × 0.67 = 4.69 points

#### **Impact sur la Note :**

**Formule :**
```
Note finale = Note moyenne × (1 - (Points totaux / 100))

Malus maximum : -2.0 points (si ≥ 10 points)
```

**Exemple :**
- Coiffeur avec note 4.5/5
- 7 points accumulés
- Malus : 7/100 = 0.07
- Note finale : 4.5 × (1 - 0.07) = 4.185/5

#### **Impact sur la Classification :**

**Règles de classification :**
- **Hub Premium :** Note ≥ 4.5, 0-3 points, 0 incidents graves (90 jours)
- **Hub Standard :** Note ≥ 4.0, 4-6 points, ≤ 1 incident grave (90 jours)
- **Hub Basique :** Note ≥ 3.5, 7-8 points, ≤ 2 incidents graves (90 jours)
- **Hub Limité :** Note < 3.5 OU > 8 points OU > 2 incidents graves (90 jours)

**Déclassement automatique :**
- ✅ **7-8 points** → Déclassement temporaire (30 jours)
- ✅ **9 points** → Exclusion hub (90 jours)
- ✅ **10 points** → Exclusion définitive

#### **Impact sur l'Algorithme de Recherche :**

**Score de ranking :**
```
Score = (Note × 0.4) + (Classification × 0.2) + (Distance × 0.1) - (Points × 0.3)

Classification : Premium=1.0, Standard=0.8, Basique=0.6, Limité=0.3
```

**Exemple :**
- Coiffeur A : Note 4.5, Hub Premium, 0 points → Score élevé
- Coiffeur B : Note 4.0, Hub Standard, 5 points → Score moyen
- Coiffeur C : Note 3.5, Hub Limité, 9 points → Score faible

**Résultat :**
- ✅ **Coiffeur avec points** → Moins visible dans les résultats
- ✅ **Coiffeur sans points** → Plus visible, priorité dans les résultats

---

### **5. Paiement Obligatoire avant "Complété"**

#### **Logique Actuelle (à Conforter) :**

**Vérifications automatiques :**
- ✅ **Paiement obligatoire** avant de marquer "complété"
- ✅ **Vérification automatique** : Pas de "complété" sans paiement
- ✅ **Alerte admin** si tentative de "complété" sans paiement

#### **Renforcement :**

**Contrôles supplémentaires :**
- ✅ **Double vérification** : Paiement + Confirmation client
- ✅ **Alerte si pattern suspect** : Plusieurs "complétés" sans paiement
- ✅ **Blocage automatique** : Impossible de marquer "complété" si paiement non effectué

**Détection paiement au black :**
- ✅ **Signaux d'alerte** : Messages suspects, pattern répété
- ✅ **Investigation** : Admin vérifie si paiement au black
- ✅ **Sanction** : Si détecté → 9 points (bannissement temporaire 30 jours)
- ✅ **Signalement fisc** : Si preuve → Signalement au fisc

---

## 📊 **RÉCAPITULATIF COMPLET**

### **Système de Points :**
- **1-3 points** : OK, avertissement
- **4-6 points** : Alerte, impact note
- **7-8 points** : Grave, bannissement provisoire 7 jours
- **9 points** : Critique, bannissement temporaire 30 jours
- **10 points** : Bannissement total permanent

### **Alertes avec Géolocalisation :**
- **10 min avant** : Vérification localisation + retard
- **5 min après début** : Confirmation prestation + géolocalisation
- **À la fin** : Validation double (client + coiffeur)

### **Impact Notes & Classification :**
- **Note :** Malus progressif selon points (max -2.0)
- **Classification :** Déclassement selon points
- **Algorithme :** Moins visible si points élevés

### **Paiement :**
- **Obligatoire** avant "complété"
- **Détection** paiement au black
- **Sanction** : 9 points si détecté

---

## ✅ **VALIDATION FINALE**

**Toutes les propositions sont détaillées et priorisées. On peut commencer l'implémentation !** 🚀









