# 🔧 AJUSTEMENTS FINAUX : Gestion des Incidents

## 📋 **PRÉCISIONS REÇUES**

### **1. Retards & Géolocalisation**

**Précisions :**
- ✅ **Retards < 10 minutes** : **NON comptabilisés** (tolérance)
- ✅ **Vérification géolocalisation** : Si personne pas loin → Pas d'abus
- ✅ **Pénalité client** : Sur le **paiement de la prestation** (attention aux abus)
- ✅ **Protection contre abus** : Vérification géolocalisation pour éviter les abus

**Ajustements :**

#### **Système de Retards :**

**Retards < 10 minutes :**
- ✅ **Pas de pénalité**
- ✅ **Pas de points**
- ✅ **Pas d'alerte**
- ✅ **Tolérance normale**

**Retards ≥ 10 minutes :**
- ✅ **Vérification géolocalisation** : Si client/coiffeur pas loin → Pas d'abus
- ✅ **Si géolocalisation OK** : Pas de pénalité (personne en route)
- ✅ **Si géolocalisation suspecte** : Alerte, investigation

**Retards ≥ 30 minutes :**
- ✅ **Pénalité client** : Sur le paiement de la prestation
- ✅ **Calcul pénalité** : Selon charte de modification/annulation
- ✅ **Protection abus** : Vérification géolocalisation obligatoire

**Exemple :**
- Client en retard de 5 min → Pas de pénalité
- Client en retard de 15 min + géolocalisation OK (en route) → Pas de pénalité
- Client en retard de 15 min + géolocalisation suspecte → Alerte, investigation
- Client en retard de 45 min → Pénalité sur paiement (selon charte)

---

### **2. Chatbot & Filtrage des Alertes**

**Précisions :**
- ✅ **Filtrage avant chatbot** : Pas toutes les alertes ne montent au chatbot
- ✅ **Page de référencement** : Tous les problèmes référencés en cas de problème
- ✅ **Logique** : Filtrer les alertes pertinentes avant médiation automatique

**Ajustements :**

#### **Système de Filtrage des Alertes :**

**Alertes qui passent au chatbot :**
- ✅ **Incidents moyens/graves** (4-10 points)
- ✅ **Incidents avec preuves** (photos, messages)
- ✅ **Incidents non résolus** après 24h
- ✅ **Incidents avec désaccord** entre client et coiffeur

**Alertes qui NE passent PAS au chatbot :**
- ❌ **Incidents légers** (1-3 points) → Résolution automatique
- ❌ **Incidents sans preuves** → Escalade directe admin
- ❌ **Incidents critiques** (10 points) → Escalade directe admin
- ❌ **Incidents avec accord** → Résolution automatique

**Page de Référencement :**
- ✅ **Tous les incidents** référencés (même ceux qui ne passent pas au chatbot)
- ✅ **Historique complet** des problèmes
- ✅ **Statistiques** et analyses
- ✅ **Recherche** par type, date, coiffeur, client

**Processus :**

1. **Incident signalé** → Créé dans la base
2. **Filtrage automatique** :
   - Si léger (1-3 points) → Résolution automatique
   - Si moyen/grave (4-9 points) → Chatbot
   - Si critique (10 points) → Admin direct
3. **Chatbot médiation** :
   - Si résolu → Fermé
   - Si pas résolu → Support
4. **Support** :
   - Si résolu → Fermé
   - Si pas résolu → Admin
5. **Admin** :
   - Validation finale
   - Attribution points
   - Résolution

---

### **3. Rasa & Clé API**

**Précisions :**
- ✅ **Rasa nécessite une clé API** (ou compte)
- ✅ **On ouvrira le compte** au moment de l'implémentation
- ✅ **On donnera la clé** au moment de cette étape

**Informations Rasa :**

**Option 1 : Rasa Open Source (Self-hosted)**
- ✅ **Gratuit** et open-source
- ✅ **Pas de clé API** nécessaire
- ✅ **Installation locale** ou serveur
- ✅ **Avantage** : Contrôle total, pas de limitations

**Option 2 : Rasa Cloud (SaaS)**
- ✅ **Gratuit** jusqu'à un certain volume
- ✅ **Clé API** nécessaire
- ✅ **Avantage** : Pas d'installation, géré par Rasa

**Recommandation :**
- 📍 **Rasa Open Source** (self-hosted) pour commencer
- 📍 **Pas de clé API** nécessaire
- 📍 **Installation sur serveur** ou Docker
- 📍 **Si besoin de Rasa Cloud** → On ouvrira le compte au moment de l'implémentation

**Pour l'instant :**
- ✅ **On prépare l'architecture** pour intégrer Rasa
- ✅ **On définit les endpoints** et la structure
- ✅ **Au moment de l'implémentation** → On décidera Rasa Open Source ou Cloud

---

### **4. Pénalité Client sur Paiement**

**Précisions :**
- ✅ **Pénalité client** : Sur le **paiement de la prestation**
- ✅ **Attention aux abus** : Vérification géolocalisation obligatoire
- ✅ **Selon charte** : Modification/annulation

**Ajustements :**

#### **Système de Pénalité Client :**

**Retards ≥ 30 minutes :**
- ✅ **Vérification géolocalisation** : Obligatoire avant pénalité
- ✅ **Si géolocalisation OK** : Pas de pénalité (personne en route)
- ✅ **Si géolocalisation suspecte** : Pénalité selon charte

**Calcul pénalité :**
- ✅ **Selon charte** de modification/annulation
- ✅ **Exemple** : 10% du prix si retard 30-60 min, 25% si > 60 min
- ✅ **Protection abus** : Vérification géolocalisation + historique

**Protection contre abus :**
- ✅ **Vérification géolocalisation** : Si client pas loin → Pas d'abus
- ✅ **Historique** : Vérifier si client a déjà eu des retards
- ✅ **Pattern** : Si plusieurs retards → Alerte admin

**Exemple :**
- Client en retard de 45 min + géolocalisation OK (en route) → Pas de pénalité
- Client en retard de 45 min + géolocalisation suspecte → Pénalité 10% du prix
- Client en retard de 2h → Pénalité 25% du prix (selon charte)

---

## 🎯 **PROPOSITIONS AJUSTÉES**

### **1. Retards & Géolocalisation**

**Système :**
- ✅ **Retards < 10 min** : Pas de pénalité, pas de points
- ✅ **Retards ≥ 10 min** : Vérification géolocalisation
- ✅ **Retards ≥ 30 min** : Pénalité sur paiement (si géolocalisation suspecte)

**Protection abus :**
- ✅ **Vérification géolocalisation** : Si personne pas loin → Pas d'abus
- ✅ **Historique** : Vérifier si client a déjà eu des retards
- ✅ **Pattern** : Si plusieurs retards → Alerte admin

---

### **2. Chatbot & Filtrage**

**Système :**
- ✅ **Filtrage automatique** : Pas toutes les alertes passent au chatbot
- ✅ **Chatbot** : Seulement incidents moyens/graves avec preuves
- ✅ **Page référencement** : Tous les incidents référencés

**Processus :**
1. Incident signalé → Filtrage
2. Si léger → Résolution auto
3. Si moyen/grave → Chatbot
4. Si critique → Admin direct
5. Tous référencés dans page admin

---

### **3. Rasa**

**Recommandation :**
- ✅ **Rasa Open Source** (self-hosted) pour commencer
- ✅ **Pas de clé API** nécessaire
- ✅ **Architecture préparée** pour intégration
- ✅ **Au moment de l'implémentation** → On décidera Open Source ou Cloud

---

### **4. Pénalité Client**

**Système :**
- ✅ **Pénalité sur paiement** : Selon charte
- ✅ **Vérification géolocalisation** : Obligatoire avant pénalité
- ✅ **Protection abus** : Historique + pattern

---

## ✅ **VALIDATION DES AJUSTEMENTS**

**Tous les ajustements sont pris en compte :**

1. ✅ **Retards < 10 min** : Pas comptabilisés
2. ✅ **Géolocalisation** : Vérification pour éviter abus
3. ✅ **Pénalité client** : Sur paiement, avec protection abus
4. ✅ **Filtrage alertes** : Avant chatbot
5. ✅ **Page référencement** : Tous les incidents
6. ✅ **Rasa** : Architecture préparée, décision au moment de l'implémentation

**On continue à discuter pour affiner encore ?** 💬









