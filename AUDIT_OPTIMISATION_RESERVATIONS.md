# 🔍 AUDIT D'OPTIMISATION - SYSTÈME DE RÉSERVATIONS TAPHAIR

**Date:** 1er novembre 2025  
**Objectif:** Identifier les optimisations possibles avec des plugins/bibliothèques pour alléger le développement  
**Priorité:** Système de réservation

---

## 📊 ÉTAT ACTUEL DES DÉPENDANCES

### **Frontend (package.json)**
- ✅ `date-fns` (^4.1.0) - Gestion des dates
- ✅ `react-hook-form` (^7.56.4) - Gestion des formulaires
- ✅ `yup` (^1.6.1) - Validation des schémas
- ✅ `axios` (^1.9.0) - Requêtes HTTP
- ✅ `@reduxjs/toolkit` (^2.0.1) - Gestion d'état
- ✅ `react-error-boundary` (^6.0.0) - Gestion des erreurs
- ✅ `framer-motion` (^10.18.0) - Animations

### **Backend (package.json)**
- ✅ `mongoose` (^8.0.3) - ODM MongoDB
- ✅ `express` (^4.18.2) - Framework web
- ✅ `express-validator` (^7.0.1) - Validation
- ✅ `winston` (^3.11.0) - Logging

---

## 🔍 ANALYSE DU CODE ACTUEL - SYSTÈME DE RÉSERVATION

### **1. GESTION DES DATES/HEURES** ⚠️ À OPTIMISER

#### **Problèmes identifiés:**
- ❌ Manipulation manuelle des dates avec `new Date()` partout
- ❌ Parsing manuel des dates (`date.split('-')`, `time.split(':')`)
- ❌ Calculs manuels des durées (`getTime() + duration * 60000`)
- ❌ Comparaisons de dates manuelles et sujettes aux erreurs
- ❌ Pas de gestion des timezones
- ❌ Formatage des dates répétitif

#### **Code actuel (BookingForm.tsx):**
```typescript
// ❌ Parsing manuel
const [year, month, day] = date.split('-');
const [hours, minutes] = time.split(':');
bookingDate = new Date(year, month - 1, day, hours, minutes);

// ❌ Calcul manuel
const endTime = new Date(bookingDate.getTime() + finalDuration * 60000);

// ❌ Comparaison manuelle
if (bookingDate < new Date()) { ... }
```

#### **Code actuel (bookings.js):**
```javascript
// ❌ Parsing manuel
const [year, month, day] = date.split('-');
const [hours, minutes] = time.split(':');
bookingDate = new Date(year, month - 1, day, hours, minutes);

// ❌ Calcul manuel
const endTime = new Date(bookingDate.getTime() + finalDuration * 60000);
const existingEnd = new Date(existingStart.getTime() + existingBooking.duration * 60000);

// ❌ Comparaison manuelle
return (bookingDate < existingEnd) && (endTime > existingStart);
```

#### **✅ Solution recommandée:**
**Utiliser `date-fns` de manière plus intensive** (déjà installé) + **`date-fns-tz`** pour les timezones

**Avantages:**
- ✅ Code plus lisible et maintenable
- ✅ Gestion des timezones
- ✅ Fonctions utilitaires pour les calculs de dates
- ✅ Moins d'erreurs de manipulation

**Exemple d'optimisation:**
```typescript
import { parse, addMinutes, isBefore, isAfter, format } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

// Au lieu de:
const [year, month, day] = date.split('-');
const [hours, minutes] = time.split(':');
bookingDate = new Date(year, month - 1, day, hours, minutes);

// Utiliser:
const bookingDate = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
const endTime = addMinutes(bookingDate, duration);
```

---

### **2. VALIDATION DES FORMULAIRES** ⚠️ À OPTIMISER

#### **Problèmes identifiés:**
- ❌ Validation manuelle dans `handleSubmit`
- ❌ Pas d'utilisation de `react-hook-form` + `yup` (déjà installés mais pas utilisés)
- ❌ Messages d'erreur hardcodés
- ❌ Pas de validation côté client avant soumission

#### **Code actuel (BookingForm.tsx):**
```typescript
// ❌ Validation manuelle
if (!selectedService || !selectedDate || !selectedTime) {
  setError('Veuillez remplir tous les champs obligatoires');
  return;
}
if (bookingMode === 'domicile' && (!clientAddress.street || !clientAddress.city)) {
  setError('Veuillez remplir au minimum la rue, la ville et le code postal');
  return;
}
```

#### **✅ Solution recommandée:**
**Utiliser `react-hook-form` + `yup`** (déjà installés)

**Avantages:**
- ✅ Validation automatique
- ✅ Messages d'erreur centralisés
- ✅ Meilleure UX (validation en temps réel)
- ✅ Moins de code répétitif

**Exemple d'optimisation:**
```typescript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  serviceId: yup.string().required('Service requis'),
  date: yup.string().required('Date requise'),
  time: yup.string().required('Heure requise'),
  mode: yup.string().oneOf(['salon', 'domicile']).required(),
  address: yup.object().when('mode', {
    is: 'domicile',
    then: (schema) => schema.shape({
      street: yup.string().required('Rue requise'),
      city: yup.string().required('Ville requise'),
      postalCode: yup.string().required('Code postal requis')
    })
  })
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: yupResolver(schema)
});
```

---

### **3. GESTION DES CONFLITS DE CRÉNEAUX** ⚠️ À OPTIMISER

#### **Problèmes identifiés:**
- ❌ Logique de détection de conflit manuelle et répétitive
- ❌ Pas de bibliothèque pour gérer les intervalles de temps
- ❌ Code difficile à maintenir et tester

#### **Code actuel (bookings.js):**
```javascript
// ❌ Détection manuelle
const conflictingBookings = activeBookings.filter(existingBooking => {
  const existingStart = new Date(existingBooking.date);
  const existingEnd = new Date(existingStart.getTime() + existingBooking.duration * 60000);
  return (bookingDate < existingEnd) && (endTime > existingStart);
});
```

#### **✅ Solution recommandée:**
**Utiliser `date-fns` avec fonctions utilitaires** ou **`@date-fns/interval`**

**Avantages:**
- ✅ Code plus lisible
- ✅ Moins d'erreurs
- ✅ Facile à tester

**Exemple d'optimisation:**
```typescript
import { areIntervalsOverlapping, Interval } from 'date-fns';

const bookingInterval: Interval = {
  start: bookingDate,
  end: endTime
};

const conflictingBookings = activeBookings.filter(existingBooking => {
  const existingInterval: Interval = {
    start: new Date(existingBooking.date),
    end: addMinutes(new Date(existingBooking.date), existingBooking.duration)
  };
  return areIntervalsOverlapping(bookingInterval, existingInterval);
});
```

---

### **4. SÉLECTEUR DE DATE/HEURE** ⚠️ À OPTIMISER

#### **Problèmes identifiés:**
- ❌ Calendrier custom avec `date-fns` (code répétitif)
- ❌ Pas de composant réutilisable
- ❌ Pas de gestion des disponibilités dynamiques
- ❌ Pas de validation visuelle des créneaux indisponibles

#### **Code actuel (BookingForm.tsx):**
```typescript
// ❌ Génération manuelle des dates
const coiffeurAvailability = Array.from({ length: 7 }, (_, i) => ({
  date: format(addDays(new Date(), i), 'yyyy-MM-dd'),
  slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
}));

// ❌ Vérification manuelle
const isSlotAvailable = (date: string, time: string) => {
  const existingBookings = coiffeurBookings.filter(booking => 
    booking.date.startsWith(date) && booking.date.includes(time)
  );
  return existingBookings.length === 0;
};
```

#### **✅ Solution recommandée:**
**Utiliser `react-datepicker`** ou **`@mui/x-date-pickers`** ou **`react-day-picker`**

**Avantages:**
- ✅ Composant prêt à l'emploi
- ✅ Meilleure UX
- ✅ Accessibilité intégrée
- ✅ Moins de code à maintenir

**Exemple d'optimisation:**
```typescript
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

<DatePicker
  selected={selectedDate}
  onChange={(date) => setSelectedDate(date)}
  minDate={new Date()}
  filterDate={(date) => isDateAvailable(date)}
  dateFormat="dd/MM/yyyy"
  locale="fr"
/>
```

---

### **5. GESTION DES ERREURS** ⚠️ À OPTIMISER

#### **Problèmes identifiés:**
- ❌ Messages d'erreur hardcodés
- ❌ Pas de gestion centralisée des erreurs
- ❌ Pas de notifications toast pour les erreurs

#### **Code actuel:**
```typescript
// ❌ Messages hardcodés
setError('Ce créneau n\'est plus disponible. Veuillez choisir un autre horaire.');
setError('Veuillez remplir tous les champs obligatoires');
```

#### **✅ Solution recommandée:**
**Utiliser `react-toastify`** ou **`sonner`** pour les notifications

**Avantages:**
- ✅ Notifications toast élégantes
- ✅ Messages centralisés
- ✅ Meilleure UX
- ✅ Moins de code répétitif

**Exemple d'optimisation:**
```typescript
import { toast } from 'react-toastify';

// Au lieu de:
setError('Ce créneau n\'est plus disponible');

// Utiliser:
toast.error('Ce créneau n\'est plus disponible. Veuillez choisir un autre horaire.');
```

---

### **6. GESTION DES ÉTATS** ⚠️ À OPTIMISER

#### **Problèmes identifiés:**
- ❌ Beaucoup de `useState` dans `BookingForm.tsx`
- ❌ Logique métier mélangée avec la logique UI
- ❌ Pas de custom hooks pour la logique de réservation

#### **Code actuel:**
```typescript
// ❌ Beaucoup de useState
const [selectedDate, setSelectedDate] = useState<string>('');
const [selectedTime, setSelectedTime] = useState<string>('');
const [bookingMode, setBookingMode] = useState<'salon' | 'domicile'>('salon');
const [showCGVModal, setShowCGVModal] = useState(false);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [createdBooking, setCreatedBooking] = useState<any>(null);
const [cgvAccepted, setCgvAccepted] = useState(false);
// ... etc
```

#### **✅ Solution recommandée:**
**Créer des custom hooks** pour factoriser la logique

**Avantages:**
- ✅ Code plus réutilisable
- ✅ Séparation des responsabilités
- ✅ Plus facile à tester
- ✅ Moins de code dans le composant

**Exemple d'optimisation:**
```typescript
// hooks/useBookingForm.ts
export const useBookingForm = (coiffeurId: string) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  // ... logique de réservation
  
  return {
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    // ... autres états et fonctions
  };
};
```

---

### **7. REQUÊTES API** ⚠️ À OPTIMISER

#### **Problèmes identifiés:**
- ❌ Appels API manuels avec `axios`
- ❌ Pas de gestion du cache
- ❌ Pas de retry automatique
- ❌ Pas de gestion optimiste des mises à jour

#### **✅ Solution recommandée:**
**Utiliser `@tanstack/react-query`** (anciennement `react-query`)

**Avantages:**
- ✅ Cache automatique
- ✅ Retry automatique
- ✅ Gestion optimiste des mises à jour
- ✅ Synchronisation automatique
- ✅ Moins de code boilerplate

**Exemple d'optimisation:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { data: bookings, isLoading } = useQuery({
  queryKey: ['bookings', coiffeurId],
  queryFn: () => bookingService.getCoiffeurBookings(coiffeurId),
  staleTime: 30000 // Cache 30 secondes
});

const createBooking = useMutation({
  mutationFn: bookingService.createBooking,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    toast.success('Réservation créée avec succès');
  }
});
```

---

### **8. VALIDATION BACKEND** ⚠️ À OPTIMISER

#### **Problèmes identifiés:**
- ❌ Validation manuelle dans les routes
- ❌ `express-validator` installé mais peu utilisé
- ❌ Messages d'erreur non centralisés

#### **Code actuel (bookings.js):**
```javascript
// ❌ Validation manuelle
if (!finalCoiffeurId || (!finalServiceId && !finalServiceName) || !date || !mode) {
  return res.status(400).json({ 
    success: false,
    message: 'Données manquantes...' 
  });
}
```

#### **✅ Solution recommandée:**
**Utiliser `express-validator`** de manière intensive (déjà installé)

**Avantages:**
- ✅ Validation centralisée
- ✅ Messages d'erreur standardisés
- ✅ Moins de code répétitif
- ✅ Meilleure sécurité

**Exemple d'optimisation:**
```javascript
import { body, validationResult } from 'express-validator';

const validateBooking = [
  body('coiffeurId').notEmpty().withMessage('Coiffeur requis'),
  body('serviceId').notEmpty().withMessage('Service requis'),
  body('date').isISO8601().withMessage('Date invalide'),
  body('time').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Heure invalide'),
  body('mode').isIn(['salon', 'domicile']).withMessage('Mode invalide')
];

router.post('/', auth, validateBooking, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... reste du code
});
```

---

## 🎯 PLAN D'OPTIMISATION PRIORITAIRE

### **PHASE 1 : FACTORISATION RÉSERVATION (URGENT)**

#### **1.1 Créer des utilitaires pour les dates** 🔴 URGENT
**Temps estimé:** 2h

**Actions:**
1. Créer `front/src/utils/dateUtils.ts` avec fonctions utilitaires
2. Utiliser `date-fns` de manière intensive
3. Remplacer toutes les manipulations manuelles de dates

**Fichiers à créer:**
- `front/src/utils/dateUtils.ts`
- `back/utils/dateUtils.js`

---

#### **1.2 Créer des custom hooks pour la réservation** 🔴 URGENT
**Temps estimé:** 4h

**Actions:**
1. Créer `useBookingForm` hook
2. Créer `useBookingAvailability` hook
3. Créer `useBookingValidation` hook
4. Factoriser la logique de réservation

**Fichiers à créer:**
- `front/src/hooks/useBookingForm.ts`
- `front/src/hooks/useBookingAvailability.ts`
- `front/src/hooks/useBookingValidation.ts`

---

#### **1.3 Utiliser react-hook-form + yup** 🔴 URGENT
**Temps estimé:** 4h

**Actions:**
1. Refactoriser `BookingForm.tsx` pour utiliser `react-hook-form`
2. Créer schéma de validation avec `yup`
3. Ajouter validation en temps réel

**Fichiers à modifier:**
- `front/src/components/BookingForm.tsx`

---

#### **1.4 Utiliser express-validator** 🔴 URGENT
**Temps estimé:** 3h

**Actions:**
1. Créer middlewares de validation avec `express-validator`
2. Remplacer toutes les validations manuelles
3. Centraliser les messages d'erreur

**Fichiers à modifier:**
- `back/routes/bookings.js`
- `back/middleware/validate.js` (créer si n'existe pas)

---

### **PHASE 2 : AMÉLIORATION UX (IMPORTANT)**

#### **2.1 Ajouter react-toastify** 🟡 IMPORTANT
**Temps estimé:** 2h

**Actions:**
1. Installer `react-toastify`
2. Remplacer tous les `setError` par des toasts
3. Configurer les notifications

**Fichiers à modifier:**
- `front/src/components/BookingForm.tsx`
- `front/src/pages/ClientBookingsPage.tsx`

---

#### **2.2 Améliorer le sélecteur de date** 🟡 IMPORTANT
**Temps estimé:** 4h

**Actions:**
1. Installer `react-datepicker` ou `react-day-picker`
2. Remplacer le calendrier custom
3. Ajouter gestion des disponibilités dynamiques

**Fichiers à modifier:**
- `front/src/components/BookingForm.tsx`

---

#### **2.3 Utiliser @tanstack/react-query** 🟡 IMPORTANT
**Temps estimé:** 6h

**Actions:**
1. Installer `@tanstack/react-query`
2. Refactoriser tous les appels API
3. Ajouter cache et retry automatique

**Fichiers à modifier:**
- `front/src/services/api/bookings.ts`
- `front/src/components/BookingForm.tsx`
- `front/src/pages/ClientBookingsPage.tsx`

---

## 📦 NOUVELLES DÉPENDANCES À AJOUTER

### **Frontend**
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "date-fns-tz": "^2.0.0",
    "react-datepicker": "^4.25.0",
    "react-toastify": "^9.1.3"
  },
  "devDependencies": {
    "@types/react-datepicker": "^4.19.4"
  }
}
```

### **Backend**
```json
{
  "dependencies": {
    "date-fns": "^4.1.0"
  }
}
```

---

## 📊 GAINS ATTENDUS

### **Réduction du code:**
- **BookingForm.tsx** : ~30% de code en moins
- **bookings.js** : ~25% de code en moins
- **Meilleure maintenabilité** : Code plus lisible et testable

### **Amélioration de la qualité:**
- ✅ Moins d'erreurs de manipulation de dates
- ✅ Validation automatique
- ✅ Meilleure gestion des erreurs
- ✅ Meilleure UX

### **Performance:**
- ✅ Cache automatique avec react-query
- ✅ Moins de requêtes inutiles
- ✅ Meilleure réactivité

---

## ✅ CHECKLIST D'OPTIMISATION

### **Phase 1 : Factorisation (URGENT)**
- [ ] Créer utilitaires dates (frontend + backend)
- [ ] Créer custom hooks pour réservation
- [ ] Utiliser react-hook-form + yup
- [ ] Utiliser express-validator

### **Phase 2 : Amélioration UX (IMPORTANT)**
- [ ] Ajouter react-toastify
- [ ] Améliorer sélecteur de date
- [ ] Utiliser @tanstack/react-query

---

**Prochaine étape:** Commencer la Phase 1 avec la création des utilitaires dates.

