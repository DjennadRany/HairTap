# ⏰ RÈGLES DE PÉNALITÉS POUR RETARDS CLIENT

## 📋 **SYSTÈME DE PÉNALITÉS DÉTAILLÉ**

### **1. Retard < 10 minutes**

**Règle :**
- ✅ **Pas de pénalité**
- ✅ **Pas de points**
- ✅ **Pas d'alerte**
- ✅ **Tolérance normale**

**Exemple :**
- Client en retard de 5 min + géolocalisation OK (en route) → **Pas de pénalité**

---

### **2. Retard ≥ 10 minutes et < 30 minutes**

**Règle :**
- ✅ **Vérification géolocalisation obligatoire**
- ✅ **Si géolocalisation OK** (personne en route, pas loin) → **Pas de pénalité**
- ✅ **Si géolocalisation suspecte** → **Pénalité 10% du prix**

**Exemple :**
- Client en retard de 15 min + géolocalisation OK (en route) → **Pas de pénalité**
- Client en retard de 15 min + géolocalisation suspecte → **Pénalité 10% du prix**

---

### **3. Retard ≥ 30 minutes et < 45 minutes**

**Règle :**
- ✅ **Pénalité 15% du prix** (selon charte)
- ✅ **OU Modal d'annulation** avec paiement total
- ✅ **Choix du coiffeur** : Accepter le retard (pénalité 15%) OU Annuler (paiement total)

**Exemple :**
- Client en retard de 35 min → **Pénalité 15% du prix** OU **Modal d'annulation avec paiement total**
- Le coiffeur choisit : Accepter (pénalité 15%) OU Annuler (paiement total)

**Modal d'annulation :**
- Message : "Le client est en retard de 35 minutes. Que souhaitez-vous faire ?"
- Options :
  - "Accepter le retard" → Pénalité 15% du prix
  - "Annuler la réservation" → Paiement total (client paye 100%)

---

### **4. Retard ≥ 45 minutes**

**Règle :**
- ✅ **Annulation automatique**
- ✅ **Paiement total** (client paye 100% du prix)
- ✅ **Pas de remboursement**

**Exemple :**
- Client en retard de 45 min → **Annulation automatique + Paiement total**

**Processus automatique :**
1. Détection retard ≥ 45 min
2. Annulation automatique de la réservation
3. Paiement total prélevé (100% du prix)
4. Notification au client : "Votre réservation a été annulée en raison d'un retard de 45 minutes. Le paiement total a été prélevé."
5. Notification au coiffeur : "La réservation a été annulée automatiquement en raison d'un retard de 45 minutes du client."

---

## 🎯 **RÉCAPITULATIF COMPLET**

### **Tableau des Pénalités :**

| Retard | Géolocalisation | Action | Pénalité |
|--------|----------------|--------|----------|
| < 10 min | OK | Pas de pénalité | 0% |
| < 10 min | Suspecte | Pas de pénalité | 0% |
| ≥ 10 min et < 30 min | OK | Pas de pénalité | 0% |
| ≥ 10 min et < 30 min | Suspecte | Pénalité | 10% |
| ≥ 30 min et < 45 min | - | Pénalité OU Annulation | 15% OU 100% |
| ≥ 45 min | - | Annulation automatique | 100% |

---

## 🔄 **PROCESSUS DÉTAILLÉ**

### **1. Retard < 10 minutes**

**Détection :**
- ✅ Heure du RDV passée
- ✅ Client pas encore arrivé
- ✅ Retard < 10 min

**Action :**
- ✅ Pas d'alerte
- ✅ Pas de pénalité
- ✅ Attente normale

---

### **2. Retard ≥ 10 minutes et < 30 minutes**

**Détection :**
- ✅ Heure du RDV passée
- ✅ Client pas encore arrivé
- ✅ Retard ≥ 10 min et < 30 min

**Vérification géolocalisation :**
- ✅ **Si géolocalisation OK** (distance < 100m du salon/coiffeur) → Pas de pénalité
- ✅ **Si géolocalisation suspecte** (distance > 100m OU pas de localisation) → Pénalité 10%

**Action :**
- ✅ **Si OK** : Pas de pénalité, attente
- ✅ **Si suspecte** : Pénalité 10% du prix prélevée automatiquement

**Notification :**
- ✅ Client : "Vous êtes en retard de X minutes. Une pénalité de 10% a été prélevée."
- ✅ Coiffeur : "Le client est en retard de X minutes. Une pénalité de 10% a été prélevée."

---

### **3. Retard ≥ 30 minutes et < 45 minutes**

**Détection :**
- ✅ Heure du RDV passée
- ✅ Client pas encore arrivé
- ✅ Retard ≥ 30 min et < 45 min

**Action :**
- ✅ **Modal au coiffeur** : "Le client est en retard de X minutes. Que souhaitez-vous faire ?"
- ✅ **Options :**
  - "Accepter le retard" → Pénalité 15% du prix
  - "Annuler la réservation" → Paiement total (100%)

**Processus :**
1. Modal affiché au coiffeur
2. Coiffeur choisit : Accepter OU Annuler
3. Si "Accepter" → Pénalité 15% prélevée
4. Si "Annuler" → Paiement total (100%) prélevé, réservation annulée

**Notification :**
- ✅ Client : "Vous êtes en retard de X minutes. Le coiffeur a choisi de [accepter/annuler]. [Pénalité 15% / Paiement total] prélevé."
- ✅ Coiffeur : "Vous avez choisi de [accepter/annuler] la réservation. [Pénalité 15% / Paiement total] prélevé."

---

### **4. Retard ≥ 45 minutes**

**Détection :**
- ✅ Heure du RDV passée
- ✅ Client pas encore arrivé
- ✅ Retard ≥ 45 min

**Action automatique :**
1. ✅ Annulation automatique de la réservation
2. ✅ Paiement total prélevé (100% du prix)
3. ✅ Statut réservation : "cancelled"
4. ✅ Raison : "Retard de 45 minutes"

**Notification :**
- ✅ Client : "Votre réservation a été annulée en raison d'un retard de 45 minutes. Le paiement total (100%) a été prélevé."
- ✅ Coiffeur : "La réservation a été annulée automatiquement en raison d'un retard de 45 minutes du client. Le paiement total (100%) a été prélevé."

---

## 🛡️ **PROTECTION CONTRE ABUS**

### **Vérification Géolocalisation :**

**Critères :**
- ✅ **Distance < 100m** du salon/coiffeur → OK (personne en route)
- ✅ **Distance > 100m** OU pas de localisation → Suspecte

**Protection :**
- ✅ **Historique** : Vérifier si client a déjà eu des retards
- ✅ **Pattern** : Si plusieurs retards → Alerte admin
- ✅ **Vérification manuelle** : Admin peut vérifier les cas suspects

---

## 📊 **IMPACT SUR LES POINTS**

### **Attribution de Points pour Retards :**

**Retard < 10 min :**
- ✅ **0 point** (tolérance)

**Retard ≥ 10 min et < 30 min :**
- ✅ **Si géolocalisation OK** : 0 point
- ✅ **Si géolocalisation suspecte** : 1 point (léger)

**Retard ≥ 30 min et < 45 min :**
- ✅ **Si accepté par coiffeur** : 2 points (léger)
- ✅ **Si annulé par coiffeur** : 4 points (moyen)

**Retard ≥ 45 min :**
- ✅ **Annulation automatique** : 4 points (moyen)

---

## ✅ **VALIDATION FINALE**

**Toutes les règles de pénalités sont définies :**

1. ✅ **Retard < 10 min** : Pas de pénalité
2. ✅ **Retard ≥ 10 min et < 30 min** : Pénalité 10% si géolocalisation suspecte
3. ✅ **Retard ≥ 30 min et < 45 min** : Pénalité 15% OU Annulation (paiement total)
4. ✅ **Retard ≥ 45 min** : Annulation automatique + Paiement total

**On peut commencer l'implémentation !** 🚀









