# 🔍 AUDIT DES DONNÉES ET BUGS - TapHair

## 📊 ÉTAPE 1 : AUDIT DES DONNÉES

### 🔴 BUG CRITIQUE IDENTIFIÉ : Disponibilité toujours "unavailable"

**Problème** : Tous les coiffeurs affichent `availabilityStatus: unavailable` dans les cartes.

**Cause identifiée** :
1. La méthode `getAvailableSlots` dans `WorkingSlot.js` retourne une **query Mongoose** (pas un Promise)
2. L'API backend doit **exécuter** la query avec `.exec()` ou `await`
3. Les coiffeurs n'ont probablement **pas de working slots** dans la base de données

### 📋 Structure des données - Working Slots

**Backend (`back/models/WorkingSlot.js`)** :
- `coiffeurId` : ObjectId (référence User)
- `dayOfWeek` : Number (0-6, Dimanche-Samedi)
- `startTime` : Number (0-23, heure de début)
- `endTime` : Number (0-23, heure de fin)
- `status` : String ('available', 'booked', 'maintenance', 'unavailable')
- `maxBookings` : Number (1-10)
- `currentBookings` : Number (0+)
- `isRecurring` : Boolean
- `exceptions` : Array (dates d'exception)

**Frontend (`front/src/services/api/workingSlots.ts`)** :
- Interface `WorkingSlot` correspond à la structure backend
- `getAvailableSlots(coiffeurId, dayOfWeek?, date?)` retourne `Promise<WorkingSlot[]>`

**API Backend (`back/routes/working-slots.js`)** :
- `GET /api/working-slots/coiffeur/:id/available?dayOfWeek=X&date=YYYY-MM-DD`
- Retourne `{ success: true, data: slots[], count: number }`

### 🔧 CORRECTION NÉCESSAIRE

**Problème 1** : La méthode `getAvailableSlots` dans le modèle ne retourne pas un Promise
```javascript
// ❌ ACTUEL (retourne une query, pas un array)
workingSlotSchema.statics.getAvailableSlots = function(coiffeurId, dayOfWeek = null, date = null) {
  let query = { coiffeurId, status: 'available' };
  // ...
  return this.find(query).sort({ startTime: 1 }); // ❌ Retourne une query
};

// ✅ CORRIGÉ (retourne un Promise<Array>)
workingSlotSchema.statics.getAvailableSlots = async function(coiffeurId, dayOfWeek = null, date = null) {
  let query = { coiffeurId, status: 'available' };
  // ...
  return await this.find(query).sort({ startTime: 1 }).exec(); // ✅ Exécute la query
};
```

**Problème 2** : L'API backend doit exécuter la query
```javascript
// ❌ ACTUEL
const slots = await WorkingSlot.getAvailableSlots(id, dayOfWeek, date);
// Si getAvailableSlots retourne une query, slots est une query, pas un array

// ✅ CORRIGÉ
const slots = await WorkingSlot.getAvailableSlots(id, dayOfWeek, date);
// Si getAvailableSlots retourne un Promise<Array>, slots est un array
```

### 📝 DONNÉES MANQUANTES

**Working Slots** : Les coiffeurs n'ont probablement pas de working slots dans la base de données.

**Solution** : Créer un script pour ajouter des working slots de test pour chaque coiffeur.

## 🎯 PROCHAINES ÉTAPES

1. ✅ Corriger la méthode `getAvailableSlots` pour retourner un Promise<Array>
2. ✅ Vérifier que l'API backend exécute correctement la query
3. ✅ Créer un script pour ajouter des working slots de test
4. ✅ Vérifier que les badges de disponibilité s'affichent correctement
5. ✅ Corriger la régression de la galerie des services

