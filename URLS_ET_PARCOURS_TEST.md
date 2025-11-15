# 🧪 URLS ET PARCOURS DE TEST

## 📍 **URLS PRINCIPALES**

### **1. Page Client - Réservations**
**URL :** `http://localhost:5173/client/bookings`

**Parcours :**
1. Se connecter en tant que **client**
2. Aller sur `/client/bookings`
3. Voir les réservations

**✅ Fonctionnalités disponibles :**
- ✅ Voir les réservations avec statuts (En attente, Confirmée, Terminée, Annulée)
- ✅ **NOUVEAU** : Bouton "Signaler un incident" sur les réservations **terminées**
- ✅ **NOUVEAU** : Bouton "Confirmer le début" sur les réservations **confirmées**
- ✅ **NOUVEAU** : Modal de signalement d'incident
- ✅ **NOUVEAU** : Modal de confirmation début/fin de prestation

**Comment tester :**
1. Aller sur `/client/bookings`
2. Trouver une réservation **terminée** → Cliquer sur "Signaler un incident"
3. Trouver une réservation **confirmée** → Cliquer sur "Confirmer le début"

---

### **2. Page Coiffeur - Réservations**
**URL :** `http://localhost:5173/coiffeur/reservations`

**Parcours :**
1. Se connecter en tant que **coiffeur**
2. Aller sur `/coiffeur/reservations`
3. Voir les réservations

**⏳ Fonctionnalités à intégrer :**
- ⏳ Bouton "Signaler un incident" sur les réservations terminées
- ⏳ Bouton "Confirmer le début" sur les réservations confirmées
- ⏳ Modal de gestion pénalités retard (si client en retard)

---

### **3. Page Admin - Incidents (À CRÉER)**
**URL :** `http://localhost:5173/admin/incidents`

**⏳ À créer :**
- ⏳ Liste des incidents en attente
- ⏳ Résoudre/Rejeter un incident
- ⏳ Statistiques des incidents

---

## 🎯 **SCÉNARIOS DE TEST DÉTAILLÉS**

### **Scénario 1 : Client signale un incident**
1. **URL :** `/client/bookings`
2. Trouver une réservation **terminée**
3. Cliquer sur **"Signaler un incident"**
4. Modal s'ouvre :
   - Type : "Client insatisfait"
   - Description : "Le coiffeur a fait une erreur"
   - Photos (optionnel)
   - Action demandée : "Remboursement partiel"
5. Cliquer sur **"Signaler l'incident"**
6. ✅ L'incident est créé et visible par l'admin

**Résultat attendu :**
- ✅ Modal se ferme
- ✅ Message de succès
- ✅ Incident créé dans la base de données

---

### **Scénario 2 : Client confirme le début de prestation**
1. **URL :** `/client/bookings`
2. Trouver une réservation **confirmée**
3. Cliquer sur **"Confirmer le début"**
4. Modal s'ouvre :
   - Prendre une photo
   - Confirmer la géolocalisation
5. Cliquer sur **"Confirmer"**
6. ✅ La prestation est confirmée comme démarrée

**Résultat attendu :**
- ✅ Modal se ferme
- ✅ Message de succès
- ✅ Prestation confirmée dans la base de données

---

### **Scénario 3 : Client confirme la fin de prestation**
1. **URL :** `/client/bookings`
2. Trouver une prestation **en cours**
3. Cliquer sur **"Confirmer la fin"** (à ajouter)
4. Modal s'ouvre :
   - Êtes-vous satisfait ? (Oui/Non)
   - Si Non : Décrire le problème
5. Cliquer sur **"Confirmer"**
6. ✅ La prestation est confirmée comme terminée

**Résultat attendu :**
- ✅ Modal se ferme
- ✅ Message de succès
- ✅ Prestation confirmée dans la base de données

---

## 📝 **NOTES IMPORTANTES**

### **✅ Ce qui est fonctionnel :**
1. ✅ Composants créés et intégrés dans `ClientBookings.tsx`
2. ✅ Boutons visibles sur les réservations
3. ✅ Modals s'ouvrent correctement
4. ✅ Formulaire de signalement fonctionnel

### **⏳ Ce qui reste à faire :**
1. ⏳ Intégrer les composants dans `CoiffeurReservationsPage.tsx`
2. ⏳ Créer la page `AdminIncidentsPage.tsx`
3. ⏳ Connecter les modals aux API backend (TODO dans le code)
4. ⏳ Ajouter les notifications automatiques (10 min avant, 5 min après, etc.)

---

## 🚀 **PROCHAINES ÉTAPES**

1. **Intégrer dans CoiffeurReservationsPage.tsx**
2. **Créer AdminIncidentsPage.tsx**
3. **Connecter les modals aux API backend**
4. **Tester tous les scénarios**

---

## ✅ **VALIDATION**

**Les composants sont maintenant visibles et utilisables sur :**
- ✅ `/client/bookings` - Page client réservations

**Pour tester :**
1. Se connecter en tant que client
2. Aller sur `/client/bookings`
3. Voir les boutons "Signaler un incident" et "Confirmer le début"
4. Cliquer sur les boutons pour voir les modals

**Les modals s'ouvrent mais ne sont pas encore connectés aux API backend (TODO dans le code).**









