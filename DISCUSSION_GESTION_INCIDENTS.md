# 💬 DISCUSSION : Gestion des Incidents Post-RDV

## 📋 **TES RÉPONSES AUX 5 QUESTIONS**

### **1. Délai de signalement & Confirmation prestation en cours**

**Ta réponse :**
- ✅ Après le temps de prestation annoncé et validé
- ✅ Si prestation en cours → Message au client pour confirmer qu'elle est en cours
- ✅ Le client doit confirmer que la prestation est bien en cours

**Questions de clarification :**
- 📍 **Quand exactement** envoie-t-on le message ? (Dès que la durée de prestation est écoulée ? 15 min après ? 30 min après ?)
- 📍 **Combien de temps** le client a-t-il pour confirmer ? (1h ? 24h ?)
- 📍 **Que se passe-t-il** si le client ne répond pas ? (Alerte automatique ? Signalement possible ?)

---

### **2. Remboursement automatique**

**Ta réponse :**
- ❌ **PAS automatique**
- ✅ Il faut trouver un **point factuel** pour réaliser les remboursements
- ✅ On va développer l'idée ensemble

**Questions de clarification :**
- 📍 **Qu'est-ce qu'un "point factuel"** pour toi ? (Photo ? Message ? Preuve concrète ?)
- 📍 **Qui décide** du remboursement ? (Système automatique avec preuves ? Support ? Admin ?)
- 📍 **Quels types de preuves** sont acceptés comme "factuels" ? (Photos ? Messages ? Horodatage ?)

---

### **3. Médiation & Chatbot auto-incrémenté**

**Ta réponse :**
- ✅ **Système auto** si pas de compromis entre les 2 parties
- ✅ **Support** si pas de résultat dans le système automatique
- ✅ **Système automatique du support** qui s'incrémente avec les nouvelles alertes et nouveaux cas
- ✅ **Admin** pour les cas complexes
- ✅ **Chatbot** qui s'incrémente seul avec les nouvelles solutions des nouveaux cas
- ✅ Utiliser **plugin gratuit sans pub**

**Questions de clarification :**
- 📍 **Quel plugin chatbot** tu veux utiliser ? (Tu as une préférence ?)
- 📍 **Comment le chatbot s'incrémente** ? (Apprentissage automatique ? Base de connaissances ? Règles ?)
- 📍 **Quand escalade-t-on** vers le support ? (Après combien de tentatives ? Après combien de temps ?)
- 📍 **Quand escalade-t-on** vers l'admin ? (Cas graves uniquement ? Après échec du support ?)

---

### **4. Politique à la Uber & Bannissements**

**Ta réponse :**
- ✅ **Politique à la Uber** : incidents dévalorisent les notes
- ✅ **Bannissements** : au bout de 3 bannissements temporaires ou permanents selon le type d'incident
- ✅ Les incidents peuvent générer des bannissements

**Questions de clarification :**
- 📍 **Quels types d'incidents** = bannissement temporaire ? (No-show ? Comportement ?)
- 📍 **Quels types d'incidents** = bannissement permanent ? (Graves ? Répétés ?)
- 📍 **Combien d'incidents** avant le premier bannissement ? (1 ? 2 ? 3 ?)
- 📍 **Combien de temps** dure un bannissement temporaire ? (7 jours ? 30 jours ?)
- 📍 **Comment les notes sont dévalorisées** ? (Malus ? Réduction ? Impact direct ?)

---

### **5. Preuves acceptées**

**Ta réponse :**
- ✅ **Photos** pour le moment
- ✅ **Messages** pour le moment

**Questions de clarification :**
- 📍 **Vidéos** acceptées aussi ? (Ou seulement photos ?)
- 📍 **Documents** acceptés ? (Factures ? Reçus ?)
- 📍 **Limite de taille** pour les photos ? (Combien de MB ?)
- 📍 **Combien de photos** maximum par incident ? (1 ? 5 ? 10 ?)

---

### **6. Logique Uber & Paiement au black**

**Ta réponse :**
- ✅ **Si client a raison** → Remboursement total
- ✅ **Si client a tort** → Trouver un modèle de sanction
- ✅ **Les caisses passent par nous** → On gère les paiements
- ✅ **Solution pour éviter le paiement au black** : Le coiffeur ne doit pas pouvoir se faire payer au black en plus ou à la place de l'application

**Questions de clarification :**
- 📍 **Comment déterminer** si le client a raison ou tort ? (Système automatique ? Support ? Admin ?)
- 📍 **Quelles sanctions** pour le client si il a tort ? (Avertissement ? Bannissement ? Frais ?)
- 📍 **Comment détecter** le paiement au black ? (Signaux ? Alertes ? Vérifications ?)
- 📍 **Quelles sanctions** pour le coiffeur qui fait du black ? (Avertissement ? Bannissement ? Frais ?)
- 📍 **Comment s'assurer** que le paiement passe bien par l'app ? (Vérification ? Contrôle ?)

---

### **7. Impact sur la classification & Notes des coiffeurs**

**Ta réponse :**
- ✅ **Toutes ces notations et parcours** vont jouer sur la classification du coiffeur dans les hub
- ✅ **Impact sur leur note**
- ✅ **Importance de cette étape** → Tu comprends l'importance

**Questions de clarification :**
- 📍 **Comment les incidents impactent** la note du coiffeur ? (Malus direct ? Réduction ? Impact progressif ?)
- 📍 **Comment les incidents impactent** la classification dans les hub ? (Déclassement ? Exclusion ? Impact progressif ?)
- 📍 **Quels incidents** ont le plus d'impact ? (No-show ? Qualité ? Comportement ?)
- 📍 **Comment récupérer** sa note/classification après un incident ? (Temps ? Actions ? Amélioration ?)

---

## 🎯 **POINTS À DÉVELOPPER ENSEMBLE**

### **1. Système de confirmation prestation en cours**

**Idée :**
- ✅ Après la durée de prestation annoncée
- ✅ Message au client : "Votre prestation est-elle en cours ?"
- ✅ Le client confirme ou signale un problème

**À définir :**
- 📍 Timing exact du message
- 📍 Délai de réponse
- 📍 Actions si pas de réponse

---

### **2. Points factuels pour remboursement**

**Idée :**
- ✅ Pas de remboursement automatique
- ✅ Il faut des preuves factuelles
- ✅ Système de validation des preuves

**À définir :**
- 📍 Qu'est-ce qu'un point factuel ?
- 📍 Qui valide les preuves ?
- 📍 Processus de validation

---

### **3. Chatbot auto-incrémenté**

**Idée :**
- ✅ Chatbot qui apprend des nouveaux cas
- ✅ Base de connaissances qui s'enrichit
- ✅ Escalade vers support puis admin

**À définir :**
- 📍 Quel plugin utiliser ?
- 📍 Comment il apprend ?
- 📍 Quand escalader ?

---

### **4. Politique Uber & Bannissements**

**Idée :**
- ✅ Incidents dévalorisent les notes
- ✅ Bannissements progressifs (3 strikes)
- ✅ Temporaire ou permanent selon gravité

**À définir :**
- 📍 Types d'incidents = bannissement
- 📍 Durée des bannissements
- 📍 Impact sur les notes

---

### **5. Détection paiement au black**

**Idée :**
- ✅ Éviter que le coiffeur se fasse payer au black
- ✅ Contrôles et alertes
- ✅ Sanctions si détecté

**À définir :**
- 📍 Comment détecter ?
- 📍 Quelles sanctions ?
- 📍 Comment prévenir ?

---

### **6. Impact sur classification & Notes**

**Idée :**
- ✅ Incidents impactent la note
- ✅ Incidents impactent la classification dans les hub
- ✅ Système de récupération

**À définir :**
- 📍 Calcul de l'impact
- 📍 Récupération possible
- 📍 Transparence pour le coiffeur

---

## ❓ **QUESTIONS POUR TOI**

1. **Timing confirmation prestation :** Quand exactement envoie-t-on le message ? (Dès que la durée est écoulée ? 15 min après ?)

2. **Point factuel :** Qu'est-ce qu'un point factuel pour toi ? (Photo ? Message ? Preuve concrète ?)

3. **Chatbot :** Tu as une préférence pour le plugin ? (Ou on cherche ensemble ?)

4. **Bannissements :** Quels types d'incidents = bannissement temporaire ? Permanent ?

5. **Paiement au black :** Comment détecter ? Quelles sanctions ?

6. **Impact notes :** Comment calculer l'impact sur la note ? (Malus ? Réduction ?)

---

## ⏸️ **ON CONTINUE À DISCUTER**

**Pas de développement pour l'instant, juste discussion pour affiner le système !** 💬









