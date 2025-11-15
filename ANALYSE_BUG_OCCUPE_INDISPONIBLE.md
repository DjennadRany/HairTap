# 🔍 ANALYSE DU BUG : "Occupé" vs "Indisponible"

## 📋 **PROBLÈME IDENTIFIÉ**

### **Symptôme :**
- **Côté Coiffeur** : Certains créneaux sont marqués "Indisponible" (pas dans les heures de travail)
- **Côté Client** : Ces mêmes créneaux sont marqués "Occupé" (alors qu'ils ne sont pas réservés)

---

## 🔍 **ANALYSE DE LA LOGIQUE ACTUELLE**

### **1. Côté Coiffeur (`IntelligentCalendar.tsx`)**

**Ligne 131 :** Génère TOUS les créneaux de 9h à 19h
```typescript
for (let hour = 9; hour < 19; hour++) {
  // Génère 09:00, 10:00, 11:00, ..., 18:00
}
```

**Ligne 146 :** Détermine si le créneau est disponible
```typescript
const isAvailable = !isPast && !bookingForSlot;
const booked = !!bookingForSlot;
```

**Logique :**
- `booked = true` → Créneau réservé par un client
- `available = true` → Créneau disponible (pas dans le passé ET pas réservé)
- `available = false` → Créneau indisponible (dans le passé OU pas dans les heures de travail)

**Affichage (ligne 380) :**
- Si `booked` → "Réservé" avec prix
- Si `available` → Prix (disponible)
- Sinon → "Indisponible"

**PROBLÈME :** `IntelligentCalendar` génère TOUS les créneaux de 9h à 19h, même ceux qui ne sont pas dans les heures de travail. Ces créneaux sont marqués "Indisponible" car `isAvailable = false` (pas dans le passé mais pas dans les heures de travail).

---

### **2. Côté Client (`BookingForm.tsx`)**

**Ligne 300-319 :** Génère les créneaux selon les heures de travail
```typescript
const generateTimeSlotsForDay = (date: string): string[] => {
  // Priorité 1: Utiliser WorkingSlots si disponibles
  if (workingSlots.length > 0) {
    const slots = generateTimeSlotsFromWorkingSlots(workingSlots, date, 60);
    if (slots.length > 0) return slots;
  }
  
  // Priorité 2: Utiliser openingHours si disponibles
  if (coiffeur.salonAddress?.openingHours) {
    const slots = generateTimeSlotsFromOpeningHours(coiffeur.salonAddress.openingHours, date, 60);
    if (slots.length > 0) return slots;
  }
  
  // Fallback: Créneaux par défaut (9h-19h)
  return generateTimeSlots(9, 19, 60);
};
```

**Ligne 382-386 :** Récupère les créneaux disponibles pour la date sélectionnée
```typescript
const getAvailableSlots = () => {
  if (!selectedDate) return [];
  const dayAvailability = coiffeurAvailability.find((a: any) => a.date === selectedDate);
  return dayAvailability?.slots || [];
};
```

**Ligne 393-432 :** Vérifie si le créneau est disponible
```typescript
const isSlotAvailable = (date: string, time: string) => {
  // 1. Vérifier si dans le passé
  if (bookingDateTime <= now) return false;
  
  // 2. Vérifier si dans les heures de travail
  const availableSlots = getAvailableSlots();
  if (!availableSlots.includes(time)) return false;
  
  // 3. Vérifier si réservé
  const existingBookings = coiffeurBookings.filter(...);
  return existingBookings.length === 0;
};
```

**Affichage (ligne 736-782) :**
- Si `isAvailable` → Créneau disponible (cliquable)
- Si `!isAvailable && isReserved` → "Occupé"
- Si `!isAvailable && !isReserved` → "Indisponible"

**PROBLÈME :** `BookingForm` génère SEULEMENT les créneaux dans les heures de travail. Donc si un créneau n'est pas dans les heures de travail, il n'apparaît même pas dans la liste. Mais si un créneau est dans les heures de travail mais pas réservé, il est disponible.

---

## 🐛 **ROOT CAUSE DU BUG**

### **Le problème :**

1. **Côté Coiffeur** : `IntelligentCalendar` génère TOUS les créneaux de 9h à 19h, même ceux qui ne sont pas dans les heures de travail. Ces créneaux sont marqués "Indisponible" car `isAvailable = false`.

2. **Côté Client** : `BookingForm` génère SEULEMENT les créneaux dans les heures de travail. Donc si un créneau n'est pas dans les heures de travail, il n'apparaît même pas dans la liste.

3. **Incohérence** : Si un créneau n'est pas dans les heures de travail :
   - Côté coiffeur : Il apparaît et est marqué "Indisponible"
   - Côté client : Il n'apparaît même pas (ou apparaît mais est marqué "Occupé" si la logique est incorrecte)

### **Pourquoi "Occupé" au lieu de "Indisponible" ?**

**Hypothèse 1 :** `getAvailableSlots()` retourne des créneaux qui ne sont pas dans les heures de travail (fallback 9h-19h), et ensuite `isSlotAvailable()` les marque comme "Occupé" s'ils ne sont pas réservés.

**Hypothèse 2 :** La logique de `isSlotAvailable()` est incorrecte et marque les créneaux "Indisponible" comme "Occupé".

**Hypothèse 3 :** `coiffeurAvailability` génère des créneaux qui ne sont pas dans les heures de travail (fallback 9h-19h), et ces créneaux sont affichés mais marqués "Occupé" au lieu de "Indisponible".

---

## ✅ **SOLUTION PROPOSÉE**

### **1. Côté Client (`BookingForm.tsx`)**

**Problème :** `getAvailableSlots()` retourne peut-être des créneaux qui ne sont pas dans les heures de travail (fallback 9h-19h).

**Solution :** S'assurer que `getAvailableSlots()` retourne SEULEMENT les créneaux dans les heures de travail. Si un créneau n'est pas dans les heures de travail, il ne doit PAS apparaître dans la liste.

**Correction :**
- Vérifier que `generateTimeSlotsForDay()` génère correctement les créneaux selon les heures de travail
- S'assurer que le fallback (9h-19h) n'est utilisé QUE si aucune heure de travail n'est configurée
- Si un créneau n'est pas dans les heures de travail, il ne doit PAS apparaître dans `getAvailableSlots()`

### **2. Côté Coiffeur (`IntelligentCalendar.tsx`)**

**Problème :** `IntelligentCalendar` génère TOUS les créneaux de 9h à 19h, même ceux qui ne sont pas dans les heures de travail.

**Solution :** `IntelligentCalendar` devrait aussi utiliser les heures de travail pour générer les créneaux, comme `BookingForm`.

**Correction :**
- Récupérer les heures de travail (WorkingSlots ou openingHours)
- Générer les créneaux selon les heures de travail
- Si un créneau n'est pas dans les heures de travail, il ne doit PAS apparaître (ou être marqué "Indisponible" si on veut l'afficher)

---

## 🎯 **CONCLUSION**

**Le bug vient de :**
1. **Incohérence** : Côté coiffeur génère tous les créneaux (9h-19h), côté client génère selon les heures de travail
2. **Logique incorrecte** : Côté client, les créneaux "Indisponible" sont peut-être marqués "Occupé" au lieu de ne pas apparaître

**La solution :**
1. **Synchroniser** : Utiliser la même logique côté client et côté coiffeur
2. **Filtrer** : Ne pas afficher les créneaux qui ne sont pas dans les heures de travail
3. **Distinguer** : "Occupé" = réservé, "Indisponible" = pas dans les heures de travail

---

## 📝 **PROCHAINES ÉTAPES**

1. ✅ Analyser la logique actuelle (FAIT)
2. ⏳ Vérifier pourquoi les créneaux "Indisponible" apparaissent côté client
3. ⏳ Corriger la logique pour ne pas afficher les créneaux hors heures de travail
4. ⏳ Synchroniser côté client et côté coiffeur









