# 🔍 AUDIT COMPLET - BUGS D'INITIALISATION ET PROBLÈMES VITE/IMPORTS

## 📋 Résumé
Audit effectué pour identifier et corriger les erreurs "Cannot access before initialization" et autres problèmes liés à l'ordre d'initialisation, Vite, et les imports.

## ✅ CORRECTIONS APPLIQUÉES

### 1. BookingForm.tsx - CORRIGÉ ✅
**Problème** : `ReferenceError: Cannot access 'canUseSlot' before initialization` à la ligne 291
**Cause** : `getSlotValidation` utilisait `canUseSlot` dans son callback et ses dépendances AVANT que `canUseSlot` ne soit défini par `useBookingValidation`

**Solution** : Réorganisation de l'ordre d'initialisation :
```typescript
// ❌ AVANT (ligne 284-297)
const getSlotValidation = useCallback(
  (slot: CoiffeurSlotDTO) => {
    return canUseSlot(slot, bookingMode, selectedService.duration || 0);
  },
  [bookingMode, canUseSlot, selectedService]
);
const { validateBooking, canUseSlot } = useBookingValidation({...});

// ✅ APRÈS (ligne 284-298)
const { validateBooking, canUseSlot } = useBookingValidation({...});
const getSlotValidation = useCallback(
  (slot: CoiffeurSlotDTO) => {
    return canUseSlot(slot, bookingMode, selectedService.duration || 0);
  },
  [bookingMode, canUseSlot, selectedService]
);
```

## 🔍 PROBLÈMES IDENTIFIÉS ET À VÉRIFIER

### 1. Ordre d'initialisation des hooks React
**Règle** : Les hooks doivent être déclarés dans l'ordre où ils sont utilisés. Si un hook A utilise une variable du hook B, B doit être déclaré avant A.

**Fichiers à vérifier** :
- ✅ `front/src/components/BookingForm.tsx` - CORRIGÉ
- ⚠️ `front/src/components/shared/booking/BookingForm.tsx` - À vérifier (version alternative)
- ⚠️ `front/src/components/modals/RegularizationModal.tsx` - À vérifier
- ⚠️ `front/src/components/modals/StripePaymentModal.tsx` - À vérifier
- ⚠️ `front/src/components/DragDropImageUpload.tsx` - À vérifier

### 2. Imports circulaires potentiels
**Fichiers avec imports relatifs complexes** :
- `front/src/components/modals/RetardPenaltyModal.tsx` : `../../utils/dateUtils`
- `front/src/components/modals/RegularizationModal.tsx` : `../../utils/dateUtils`
- `front/src/components/modals/IncidentReportForm.tsx` : `../../services/api/incidents`, `../../utils/dateUtils`
- `front/src/components/modals/ConfirmationModal.tsx` : `../../utils/dateUtils`
- `front/src/components/modals/GeolocationCheckModal.tsx` : `../../utils/dateUtils`

**Recommandation** : Utiliser l'alias `@/` au lieu de `../../` pour éviter les problèmes :
```typescript
// ❌ AVANT
import { formatDate } from '../../utils/dateUtils';

// ✅ APRÈS
import { formatDate } from '@/utils/dateUtils';
```

### 3. Configuration Vite
**Configuration actuelle** (`vite.config.ts`) :
- ✅ Alias `@` configuré correctement
- ✅ Proxy API configuré
- ⚠️ Pas de configuration pour les imports circulaires

**Recommandations** :
1. Vérifier que tous les imports utilisent l'alias `@/` au lieu de `../`
2. Ajouter une configuration pour détecter les imports circulaires :
```typescript
build: {
  rollupOptions: {
    onwarn(warning, warn) {
      // Ignorer les warnings d'imports circulaires si nécessaire
      if (warning.code === 'CIRCULAR_DEPENDENCY') {
        return;
      }
      warn(warning);
    }
  }
}
```

### 4. TypeScript Configuration
**Fichiers de configuration** :
- `tsconfig.json` - À vérifier
- `tsconfig.app.json` - À vérifier
- `tsconfig.node.json` - À vérifier

**Points à vérifier** :
- ✅ Paths mapping pour l'alias `@`
- ✅ Strict mode activé
- ✅ Résolution des modules

## 🎯 PLAN D'ACTION

### Priorité 1 - CRITIQUE (Corrigé)
- [x] BookingForm.tsx - Ordre d'initialisation `canUseSlot`

### Priorité 2 - IMPORTANT
- [ ] Vérifier tous les fichiers avec `useCallback`/`useMemo` pour l'ordre d'initialisation
- [ ] Remplacer les imports relatifs `../../` par l'alias `@/` dans les modals
- [ ] Vérifier les imports circulaires

### Priorité 3 - AMÉLIORATION
- [ ] Ajouter la détection des imports circulaires dans Vite
- [ ] Standardiser tous les imports pour utiliser `@/`
- [ ] Ajouter des règles ESLint pour prévenir ces problèmes

## 🔧 COMMANDES UTILES

### Vérifier les imports circulaires
```bash
npx madge --circular --extensions ts,tsx front/src
```

### Vérifier les imports non utilisés
```bash
npx ts-prune front/src
```

### Linter pour détecter les problèmes
```bash
npm run lint
```

## 📝 NOTES TECHNIQUES

### Pourquoi ces erreurs se produisent ?
1. **Temporal Dead Zone (TDZ)** : En JavaScript/TypeScript, les variables déclarées avec `const`/`let` ne peuvent pas être utilisées avant leur déclaration
2. **Ordre d'exécution** : React exécute les hooks dans l'ordre où ils sont déclarés
3. **Hoisting** : Les fonctions sont "hoisted" mais pas les variables `const`/`let`

### Bonnes pratiques
1. **Déclarer les hooks dans l'ordre d'utilisation**
2. **Utiliser des alias d'imports** (`@/`) au lieu de chemins relatifs
3. **Éviter les imports circulaires**
4. **Utiliser TypeScript strict mode**

## 🐛 BUGS SIMILAIRES À SURVEILLER

Si vous voyez des erreurs comme :
- `Cannot access 'X' before initialization`
- `ReferenceError: X is not defined`
- `Cannot read property 'X' of undefined` (dans certains cas)

Vérifiez :
1. L'ordre des déclarations de hooks
2. Les dépendances dans `useCallback`/`useMemo`
3. Les imports circulaires
4. L'ordre des `useState`/`useEffect`/`useMemo`/`useCallback`

