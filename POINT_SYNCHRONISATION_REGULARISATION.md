# 📋 POINT SUR LA SYNCHRONISATION ET RÉGULARISATION

**Date:** Novembre 2025  
**Statut:** ✅ En cours de correction

---

## 🔍 ÉTAT ACTUEL

### ✅ **Ce qui est fait :**

1. **Modal de régularisation côté coiffeur** ✅
   - Détection automatique des réservations passées
   - Ouverture automatique de la modal
   - Options adaptées selon le mode (salon/domicile)

2. **Modal de régularisation côté client** ✅
   - Détection automatique des réservations passées
   - Ouverture automatique de la modal
   - Options adaptées selon le mode (salon/domicile)

3. **Synchronisation des statuts** ✅
   - Rafraîchissement automatique toutes les 30 secondes côté client
   - Notifications backend pour les changements de statut

4. **Gestion des no-shows** ✅
   - Logique adaptée selon le mode (salon/domicile)
   - Création d'incidents appropriés

---

## ❌ **PROBLÈMES IDENTIFIÉS :**

### 1. **Doublons côté client** ❌
- **Problème :** Deux options identiques "Je ne me suis pas présenté" dans la modal
- **Cause :** Logique de mapping incorrecte entre `no_show_client` et `no_show_coiffeur`
- **Correction :** ✅ Corrigé - Options maintenant distinctes selon le mode

### 2. **Règles de pénalités pour retards** ⚠️
- **Problème :** Les règles de pénalités ne sont pas appliquées lors de la régularisation
- **État :** Les règles existent dans le backend mais ne sont pas déclenchées lors de la régularisation manuelle

### 3. **Incohérences de parcours** ⚠️
- **Problème :** Pas de modal de pénalité pour retards lors de la régularisation
- **État :** Les retards sont détectés automatiquement mais pas lors de la régularisation manuelle

---

## 🔄 **CE QUI SE PASSE QUAND ON CLIQUE :**

### **CÔTÉ COIFFEUR :**

#### 1. **"Prestation effectuée"** ✅
- **Action :** `completeBooking(bookingId)`
- **Résultat :**
  - Statut réservation → `completed`
  - Notification au client
  - Validation de prestation créée
- **Points :** 0 point

#### 2. **"No-show client"** ✅
- **Action :** `reportIncident({ type: 'client_no_show' })`
- **Résultat :**
  - Incident créé : `client_no_show`
  - Points client : 7 points
  - Notification au client
- **Mode Salon :** Client ne s'est pas présenté au salon
- **Mode Domicile :** Coiffeur ne s'est pas présenté (logique inversée)

#### 3. **"No-show coiffeur"** ✅
- **Action :** `reportIncident({ type: 'coiffeur_no_show' })`
- **Résultat :**
  - Incident créé : `coiffeur_no_show`
  - Points coiffeur : 7 points
  - Notification au client
- **Mode Salon :** Client ne s'est pas présenté (logique inversée)
- **Mode Domicile :** Coiffeur ne s'est pas présenté

#### 4. **"Annulée"** ✅
- **Action :** `cancelBooking(bookingId, reason)`
- **Résultat :**
  - Statut réservation → `cancelled`
  - Remboursement selon la charte
  - Notification au client
- **Points :** Selon le motif d'annulation

#### 5. **"Problème"** ⚠️
- **Action :** Aucune action automatique
- **Résultat :** Message d'information seulement
- **Problème :** Devrait ouvrir le formulaire d'incident

---

### **CÔTÉ CLIENT :**

#### 1. **"Prestation effectuée"** ✅
- **Action :** `completeBooking(bookingId)`
- **Résultat :**
  - Statut réservation → `completed`
  - Notification au coiffeur
- **Points :** 0 point

#### 2. **"Je ne me suis pas présenté" (Mode Salon)** ✅
- **Action :** `reportIncident({ type: 'client_no_show' })`
- **Résultat :**
  - Incident créé : `client_no_show`
  - Points client : 7 points
  - Notification au coiffeur

#### 3. **"Le coiffeur ne s'est pas présenté" (Mode Salon)** ✅
- **Action :** `reportIncident({ type: 'coiffeur_no_show' })`
- **Résultat :**
  - Incident créé : `coiffeur_no_show`
  - Points coiffeur : 7 points
  - Notification au coiffeur

#### 4. **"Le coiffeur ne s'est pas présenté" (Mode Domicile)** ✅
- **Action :** `reportIncident({ type: 'coiffeur_no_show' })`
- **Résultat :**
  - Incident créé : `coiffeur_no_show`
  - Points coiffeur : 7 points
  - Remboursement possible

#### 5. **"Je ne me suis pas présenté" (Mode Domicile)** ✅
- **Action :** `reportIncident({ type: 'client_no_show' })`
- **Résultat :**
  - Incident créé : `client_no_show`
  - Points client : 7 points
  - Pénalité possible

#### 6. **"Annulée"** ✅
- **Action :** `cancelBooking(bookingId, reason)`
- **Résultat :**
  - Statut réservation → `cancelled`
  - Remboursement selon la charte
  - Notification au coiffeur

#### 7. **"Problème"** ⚠️
- **Action :** Aucune action automatique
- **Résultat :** Message d'information seulement
- **Problème :** Devrait ouvrir le formulaire d'incident

---

## ⚠️ **RÈGLES DE PÉNALITÉS POUR RETARDS - ÉTAT ACTUEL :**

### **Ce qui fonctionne :**
- ✅ Détection automatique des retards (backend)
- ✅ Calcul des pénalités selon les règles
- ✅ Modal de pénalité pour retards ≥ 30 min

### **Ce qui manque :**
- ❌ **Application des pénalités lors de la régularisation manuelle**
- ❌ **Vérification géolocalisation lors de la régularisation**
- ❌ **Modal de pénalité pour retards 10-30 min avec géolocalisation suspecte**

### **Règles définies :**

| Retard | Géolocalisation | Action | Pénalité | Points |
|--------|----------------|--------|----------|--------|
| < 10 min | OK | Pas de pénalité | 0% | 0 |
| ≥ 10 min et < 30 min | OK | Pas de pénalité | 0% | 0 |
| ≥ 10 min et < 30 min | Suspecte | Pénalité | 10% | 1 |
| ≥ 30 min et < 45 min | - | Pénalité OU Annulation | 15% OU 100% | 2 ou 4 |
| ≥ 45 min | - | Annulation automatique | 100% | 4 |

---

## 🔧 **CORRECTIONS À FAIRE :**

### 1. **Corriger les doublons côté client** ✅
- ✅ **FAIT :** Options maintenant distinctes selon le mode

### 2. **Intégrer les règles de pénalités dans la régularisation** ❌
- **À faire :** 
  - Calculer le retard lors de la régularisation
  - Vérifier la géolocalisation si retard ≥ 10 min
  - Appliquer les pénalités selon les règles
  - Ouvrir la modal de pénalité si nécessaire

### 3. **Améliorer l'option "Problème"** ❌
- **À faire :**
  - Ouvrir automatiquement le formulaire d'incident
  - Pré-remplir avec les informations de la réservation

### 4. **Ajouter la vérification géolocalisation** ❌
- **À faire :**
  - Demander la géolocalisation si retard ≥ 10 min
  - Vérifier la distance au salon/domicile
  - Appliquer les pénalités selon le résultat

---

## 📊 **INCOHÉRENCES DE PARCOURS IDENTIFIÉES :**

### 1. **Régularisation manuelle vs Détection automatique**
- **Problème :** Les règles de pénalités ne s'appliquent que lors de la détection automatique
- **Impact :** Un coiffeur peut régulariser manuellement sans pénalité même si le client était en retard

### 2. **Option "Problème" sans action**
- **Problème :** L'option "Problème" ne fait rien
- **Impact :** L'utilisateur doit aller chercher le formulaire d'incident manuellement

### 3. **Pas de vérification géolocalisation lors de la régularisation**
- **Problème :** La géolocalisation n'est pas vérifiée lors de la régularisation manuelle
- **Impact :** Les pénalités peuvent être appliquées incorrectement

### 4. **Pas de modal de pénalité pour retards 10-30 min**
- **Problème :** Pas de modal pour les retards 10-30 min avec géolocalisation suspecte
- **Impact :** Les pénalités ne sont pas appliquées correctement

---

## ✅ **PROCHAINES ÉTAPES :**

1. ✅ Corriger les doublons côté client
2. ❌ Intégrer les règles de pénalités dans la régularisation
3. ❌ Améliorer l'option "Problème"
4. ❌ Ajouter la vérification géolocalisation
5. ❌ Créer la modal de pénalité pour retards 10-30 min

---

## 📝 **NOTES :**

- Les règles de pénalités existent dans le backend mais ne sont pas déclenchées lors de la régularisation manuelle
- La détection automatique des retards fonctionne mais nécessite que le système détecte le retard en temps réel
- La régularisation manuelle est un cas d'usage important qui doit respecter les mêmes règles que la détection automatique

