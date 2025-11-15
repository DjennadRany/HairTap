# 🧪 PARCOURS DE TEST : Gestion des Incidents

## 📋 **URLS ET PARCOURS**

### **1. Page Client - Réservations**
**URL :** `/client/bookings`

**Parcours :**
1. Se connecter en tant que **client**
2. Aller sur `/client/bookings`
3. Voir les réservations (confirmées, en cours, terminées)

**Fonctionnalités à tester :**
- ✅ Voir les réservations avec statuts
- ✅ **NOUVEAU** : Bouton "Signaler un incident" sur les réservations terminées
- ✅ **NOUVEAU** : Modal de confirmation début/fin de prestation
- ✅ **NOUVEAU** : Modal de vérification géolocalisation (si retard)

---

### **2. Page Coiffeur - Réservations**
**URL :** `/coiffeur/reservations`

**Parcours :**
1. Se connecter en tant que **coiffeur**
2. Aller sur `/coiffeur/reservations`
3. Voir les réservations (en attente, confirmées, en cours, terminées)

**Fonctionnalités à tester :**
- ✅ Voir les réservations avec statuts
- ✅ **NOUVEAU** : Bouton "Signaler un incident" sur les réservations terminées
- ✅ **NOUVEAU** : Modal de confirmation début/fin de prestation
- ✅ **NOUVEAU** : Modal de gestion pénalités retard (si client en retard)

---

### **3. Page Admin - Incidents (À CRÉER)**
**URL :** `/admin/incidents`

**Parcours :**
1. Se connecter en tant que **admin**
2. Aller sur `/admin/incidents`
3. Voir tous les incidents signalés

**Fonctionnalités à tester :**
- ✅ **NOUVEAU** : Liste des incidents en attente
- ✅ **NOUVEAU** : Résoudre/Rejeter un incident
- ✅ **NOUVEAU** : Statistiques des incidents

---

## 🎯 **SCÉNARIOS DE TEST**

### **Scénario 1 : Client signale un incident**
1. Client va sur `/client/bookings`
2. Trouve une réservation **terminée**
3. Clique sur "Signaler un incident"
4. Remplit le formulaire :
   - Type : "Client insatisfait"
   - Description : "Le coiffeur a fait une erreur"
   - Photos (optionnel)
   - Action demandée : "Remboursement partiel"
5. Soumet le formulaire
6. ✅ L'incident est créé et visible par l'admin

---

### **Scénario 2 : Coiffeur signale un incident**
1. Coiffeur va sur `/coiffeur/reservations`
2. Trouve une réservation **terminée**
3. Clique sur "Signaler un incident"
4. Remplit le formulaire :
   - Type : "Client absent"
   - Description : "Le client ne s'est pas présenté"
   - Photos (optionnel)
   - Action demandée : "Paiement total"
5. Soumet le formulaire
6. ✅ L'incident est créé et visible par l'admin

---

### **Scénario 3 : Confirmation début de prestation**
1. Client/Coiffeur a une réservation **confirmée** qui approche
2. 5 minutes après l'heure prévue, une notification apparaît
3. Clique sur "Confirmer le début"
4. Modal s'ouvre :
   - Prendre une photo
   - Confirmer la géolocalisation
5. Soumet la confirmation
6. ✅ La prestation est confirmée comme démarrée

---

### **Scénario 4 : Confirmation fin de prestation**
1. Client/Coiffeur a une prestation **en cours**
2. À la fin de la prestation, une notification apparaît
3. Clique sur "Confirmer la fin"
4. Modal s'ouvre :
   - Êtes-vous satisfait ? (Oui/Non)
   - Si Non : Décrire le problème
5. Soumet la confirmation
6. ✅ La prestation est confirmée comme terminée

---

### **Scénario 5 : Client en retard (10-30 min)**
1. Client a une réservation **confirmée**
2. Client arrive en retard (10-30 min)
3. Une notification apparaît : "Vérification de localisation"
4. Modal s'ouvre :
   - Confirmer la géolocalisation
5. Si géolocalisation suspecte → Pénalité 10%
6. ✅ La pénalité est appliquée

---

### **Scénario 6 : Client en retard (30-45 min)**
1. Client a une réservation **confirmée**
2. Client arrive en retard (30-45 min)
3. Une notification apparaît au **coiffeur** : "Client en retard"
4. Modal s'ouvre au coiffeur :
   - Accepter avec pénalité 15%
   - Annuler la réservation (paiement total)
5. Coiffeur choisit une option
6. ✅ La pénalité ou l'annulation est appliquée

---

### **Scénario 7 : Client en retard (≥ 45 min)**
1. Client a une réservation **confirmée**
2. Client arrive en retard (≥ 45 min)
3. ✅ **Automatique** : Réservation annulée + Paiement total
4. Notification envoyée au client et au coiffeur

---

### **Scénario 8 : Admin résout un incident**
1. Admin va sur `/admin/incidents`
2. Voit les incidents en attente
3. Clique sur un incident
4. Examine les preuves (photos, description)
5. Clique sur "Résoudre" ou "Rejeter"
6. Ajoute des notes admin
7. Soumet
8. ✅ L'incident est résolu/rejeté et les points sont appliqués

---

## 📊 **ÉTAT ACTUEL**

### **✅ Composants créés :**
1. ✅ `incidents.ts` - Service API
2. ✅ `ConfirmationModal.tsx` - Confirmation début/fin
3. ✅ `RetardPenaltyModal.tsx` - Gestion pénalités retard
4. ✅ `GeolocationCheckModal.tsx` - Vérification géolocalisation
5. ✅ `IncidentReportForm.tsx` - Formulaire signalement

### **✅ Intégration :**
1. ✅ **INTÉGRÉ** dans `ClientBookings.tsx` (utilisé par `ClientBookingsPage.tsx`)
   - Bouton "Signaler un incident" sur les réservations terminées
   - Bouton "Confirmer le début" sur les réservations confirmées
   - Modals fonctionnels

### **⏳ À intégrer :**
1. ⏳ Intégrer dans `CoiffeurReservationsPage.tsx`
2. ⏳ Créer `AdminIncidentsPage.tsx`

---

## 🚀 **PROCHAINES ÉTAPES**

1. **Intégrer les composants dans les pages existantes**
2. **Créer la page AdminIncidentsPage**
3. **Tester tous les scénarios**

---

## ⚠️ **NOTE IMPORTANTE**

**Les composants sont créés mais pas encore intégrés dans les pages !**

Pour voir les composants en action, il faut :
1. Intégrer les composants dans `ClientBookingsPage.tsx` et `CoiffeurReservationsPage.tsx`
2. Créer la page `AdminIncidentsPage.tsx`
3. Ajouter les routes dans `routes/index.tsx`

**Souhaitez-vous que je fasse l'intégration maintenant ?** 🚀

