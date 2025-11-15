# 🔍 AUDIT COMPLET - REDUX ET COMPOSANTS SERVICES

**Date :** 2025-01-09  
**Problème :** Les services ajoutés par code ne s'affichent pas même après F5 et redémarrage  
**Focus :** Audit Redux et comparaison des 2 composants "Services & Produits"

---

## 📋 RÉSUMÉ EXÉCUTIF

**Découverte importante :**
- ✅ Il y a **2 composants différents** pour afficher les services
- ✅ Les deux utilisent le **même hook** `useCoiffeurServices`
- ✅ Le hook utilise un **cache Redux** avec durée de 5 minutes
- ❌ **Problème identifié :** Le cache Redux retourne les données sans vérifier si elles sont à jour

---

## 🔍 ANALYSE DES COMPOSANTS

### 1. **ServicesSection** (Page Profil)

**Fichier :** `front/src/components/shared/booking/ServicesSection.tsx`  
**Utilisé dans :** `CoiffeurProfilePage.tsx` (ligne 581)

**Code :**
```typescript
const { services: cachedServices, loading, fetchServices: fetchCoiffeurServices } = useCoiffeurServices(coiffeurId);

const fetchServices = async () => {
  const servicesData = await fetchCoiffeurServices(false); // ⚠️ Utilise le cache
  if (servicesData) {
    const enrichedServices = servicesData.map(service => ({
      ...service,
      keywords: service.keywords || [],
      examplePhotos: service.examplePhotos || [],
      likes: service.likes || 0,
      isLiked: service.isLiked || false
    }));
    setServices(enrichedServices);
  }
};
```

**Caractéristiques :**
- ✅ Utilise `useCoiffeurServices` hook
- ⚠️ Appelle `fetchCoiffeurServices(false)` - utilise le cache
- ⚠️ Pas de rechargement forcé après modification
- ⚠️ Pas d'invalidation du cache

### 2. **ServiceManager** (Tableau de Bord)

**Fichier :** `front/src/components/shared/services/ServiceManager.tsx`  
**Utilisé dans :** `CoiffeurDashboardPage.tsx` (ligne 106)

**Code :**
```typescript
const { services: cachedServices, loading, fetchServices: fetchCoiffeurServices } = useCoiffeurServices(coiffeurId);

const fetchServices = async () => {
  const servicesData = await fetchCoiffeurServices(false); // ⚠️ Utilise le cache
  if (servicesData) {
    const enrichedServices = servicesData.map(service => ({
      ...service,
      keywords: service.keywords || [],
      examplePhotos: service.examplePhotos || [],
      likes: service.likes || 0,
      isLiked: service.isLiked || false
    }));
    setServices(enrichedServices);
  }
};
```

**Caractéristiques :**
- ✅ Utilise `useCoiffeurServices` hook (MÊME HOOK)
- ⚠️ Appelle `fetchCoiffeurServices(false)` - utilise le cache
- ⚠️ Pas de rechargement forcé après modification
- ⚠️ Pas d'invalidation du cache

**Conclusion :** Les deux composants ont **exactement le même comportement** et utilisent le **même hook**.

---

## 🔍 AUDIT REDUX

### 1. **Structure du Store Redux**

**Fichier :** `front/src/store/index.ts`

```typescript
const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,  // ✅ Contient le cache des services
    profile: profileReducer,
  },
});
```

**État Redux :**
- ✅ Store configuré correctement
- ✅ `bookingReducer` contient le cache des services

### 2. **Slice Booking (Cache des Services)**

**Fichier :** `front/src/store/slices/bookingSlice.ts`

**Structure du cache :**
```typescript
interface BookingState {
  servicesCache: Record<string, {
    services: Service[];
    timestamp: number;  // ⚠️ Timestamp de mise en cache
  }>;
}

const CACHE_DURATION = 5 * 60 * 1000; // ⚠️ 5 minutes
```

**Actions Redux :**
1. `setCoiffeurServices` - Met en cache les services
2. `clearServicesCache` - Vide le cache (mais jamais appelé)

**Sélecteur :**
```typescript
export const selectCoiffeurServices = (coiffeurId: string) => (state: RootState) => {
  const cached = state.booking.servicesCache[coiffeurId];
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.services; // ⚠️ Retourne le cache si < 5 minutes
  }
  return null;
};
```

**Problème identifié :**
- ⚠️ Le cache dure **5 minutes**
- ⚠️ Si le cache existe et est < 5 minutes, retourne le cache **sans appeler l'API**
- ⚠️ Les services ajoutés par code ne sont pas dans le cache
- ⚠️ Le cache n'est jamais invalidé manuellement

### 3. **Hook useCoiffeurServices**

**Fichier :** `front/src/hooks/useCoiffeurServices.ts`

**Code critique :**
```typescript
const fetchServices = async (forceRefresh = false) => {
  if (!coiffeurId) {
    setError('ID du coiffeur manquant');
    return;
  }

  // ⚠️ PROBLÈME : Retourne le cache sans appeler l'API
  if (!forceRefresh && cachedServices) {
    return cachedServices; // ❌ Retourne le cache même s'il est obsolète
  }

  try {
    setLoading(true);
    const services = await coiffeurService.getCoiffeurServices(coiffeurId);
    dispatch(setCoiffeurServices({ coiffeurId, services }));
    return services;
  } catch (err: any) {
    console.error('Erreur lors de la récupération des services:', err);
    return null;
  } finally {
    setLoading(false);
  }
};
```

**Problèmes identifiés :**

1. **Cache non vérifié :**
   - `cachedServices` vient du sélecteur Redux qui vérifie la durée
   - Mais si le cache existe (même vide), il est retourné
   - Pas de vérification si le cache est vide ou obsolète

2. **Force refresh non utilisé :**
   - Les composants appellent toujours `fetchCoiffeurServices(false)`
   - Le paramètre `forceRefresh` existe mais n'est jamais utilisé

3. **Cache jamais invalidé :**
   - La fonction `clearCache()` existe mais n'est jamais appelée
   - Le cache persiste même après ajout de services par code

---

## 🔍 ANALYSE DU FLUX COMPLET

### Scénario 1 : Services ajoutés par code

1. ✅ Script backend crée un service et le sauvegarde en base
2. ✅ Service présent en base avec `isActive: true`
3. ❌ Utilisateur ouvre la page (CoiffeurProfilePage ou CoiffeurDashboardPage)
4. ❌ `ServicesSection` ou `ServiceManager` appelle `fetchServices()`
5. ❌ `fetchServices()` appelle `fetchCoiffeurServices(false)`
6. ❌ `useCoiffeurServices` vérifie le cache Redux
7. ❌ Si le cache existe (même vide ou obsolète), retourne le cache
8. ❌ L'API n'est **jamais appelée**
9. ❌ Les nouveaux services ne s'affichent pas

### Scénario 2 : Cache expiré (> 5 minutes)

1. ✅ Cache Redux existe mais > 5 minutes
2. ✅ `selectCoiffeurServices` retourne `null`
3. ✅ `fetchCoiffeurServices(false)` appelle l'API
4. ✅ Les services sont récupérés et mis en cache
5. ✅ Les services s'affichent

**Conclusion :** Les services ne s'affichent que si le cache est expiré (> 5 minutes) ou s'il n'existe pas.

---

## 🎯 PROBLÈMES IDENTIFIÉS

### Problème Principal

**Cache Redux trop agressif :**
- Le cache retourne les données même si elles sont vides ou obsolètes
- Pas de vérification si le cache contient des données valides
- Le cache n'est jamais invalidé après ajout de services par code

### Problèmes Secondaires

1. **Force refresh jamais utilisé :**
   - Les composants appellent toujours `fetchCoiffeurServices(false)`
   - Le paramètre `forceRefresh` existe mais n'est jamais utilisé

2. **Cache jamais invalidé :**
   - La fonction `clearCache()` existe mais n'est jamais appelée
   - Le cache persiste même après modification

3. **Deux composants identiques :**
   - `ServicesSection` et `ServiceManager` ont le même comportement
   - Tous les deux ont le même problème de cache

4. **Pas de synchronisation :**
   - Aucun mécanisme pour détecter les changements en base
   - Le frontend ne sait pas quand recharger

---

## 📊 COMPARAISON DES COMPOSANTS

| Caractéristique | ServicesSection | ServiceManager |
|----------------|-----------------|----------------|
| **Fichier** | `ServicesSection.tsx` | `ServiceManager.tsx` |
| **Page** | CoiffeurProfilePage | CoiffeurDashboardPage |
| **Hook utilisé** | `useCoiffeurServices` | `useCoiffeurServices` |
| **Appel API** | `fetchCoiffeurServices(false)` | `fetchCoiffeurServices(false)` |
| **Cache utilisé** | ✅ Oui | ✅ Oui |
| **Force refresh** | ❌ Non | ❌ Non |
| **Invalidation cache** | ❌ Non | ❌ Non |
| **Problème identique** | ✅ Oui | ✅ Oui |

**Conclusion :** Les deux composants ont **exactement le même problème**.

---

## 🔍 VÉRIFICATIONS À FAIRE

### 1. **Vérifier le cache Redux dans le navigateur**

**Étapes :**
1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Redux" (extension Redux DevTools)
3. Chercher `booking.servicesCache`
4. Vérifier si le cache existe pour `coiffeurId` de Marie Dubois
5. Vérifier le `timestamp` du cache

**Si le cache existe :**
- Le cache peut contenir des données obsolètes ou vides
- Le cache peut être < 5 minutes, donc retourné sans appeler l'API

### 2. **Vérifier les appels API**

**Étapes :**
1. Ouvrir l'onglet "Network" des DevTools
2. Filtrer sur `/coiffeurs/:id/services`
3. Recharger la page
4. Vérifier si l'API est appelée

**Si l'API n'est pas appelée :**
- Le cache Redux existe et est retourné
- Les nouveaux services ne sont pas récupérés

### 3. **Vérifier les logs console**

**Étapes :**
1. Ouvrir la console du navigateur
2. Chercher les logs de `fetchServices` ou `useCoiffeurServices`
3. Vérifier si le cache est utilisé ou si l'API est appelée

---

## 🔧 DIAGNOSTIC DU PROBLÈME

### Test 1 : Vérifier si le cache existe

**Dans la console du navigateur :**
```javascript
// Ouvrir Redux DevTools et vérifier
state.booking.servicesCache['6839ca0736ec3cfc09c649ec']
```

**Résultat attendu :**
- Si le cache existe : `{ services: [...], timestamp: ... }`
- Si le cache n'existe pas : `undefined`

### Test 2 : Vérifier la durée du cache

**Dans la console du navigateur :**
```javascript
const cache = state.booking.servicesCache['6839ca0736ec3cfc09c649ec'];
if (cache) {
  const age = Date.now() - cache.timestamp;
  console.log('Cache age:', age, 'ms');
  console.log('Cache expired:', age > 300000); // 5 minutes
}
```

### Test 3 : Forcer le rechargement

**Dans la console du navigateur :**
```javascript
// Vider le cache Redux manuellement
store.dispatch(clearServicesCache('6839ca0736ec3cfc09c649ec'));
// Recharger la page
location.reload();
```

---

## 📝 RECOMMANDATIONS (SANS MODIFIER LE CODE)

### Solution Immédiate (Manuelle)

1. **Vider le cache Redux :**
   - Ouvrir Redux DevTools
   - Dispatch l'action `clearServicesCache` avec l'ID de Marie Dubois
   - Recharger la page

2. **Attendre 5 minutes :**
   - Le cache expire après 5 minutes
   - Après expiration, l'API sera appelée
   - Les nouveaux services s'afficheront

3. **Vider le cache du navigateur :**
   - Ctrl+Shift+Delete
   - Vider le cache et les cookies
   - Recharger la page

### Vérifications à Faire

1. **Vérifier le cache Redux :**
   - Si le cache existe et est < 5 minutes → Problème confirmé
   - Si le cache n'existe pas → Problème ailleurs

2. **Vérifier les appels API :**
   - Si l'API n'est pas appelée → Cache utilisé
   - Si l'API est appelée → Vérifier la réponse

3. **Vérifier la réponse API :**
   - Si l'API retourne les 3 services → Problème frontend
   - Si l'API ne retourne pas les services → Problème backend

---

## 🎯 CONCLUSION DE L'AUDIT

### Problème Identifié

**Cache Redux trop agressif :**
- Le hook `useCoiffeurServices` retourne le cache si il existe (même vide)
- Les composants appellent toujours `fetchCoiffeurServices(false)`
- Le cache n'est jamais invalidé après ajout de services par code
- Les deux composants (`ServicesSection` et `ServiceManager`) ont le même problème

### Cause Racine

Le cache Redux a une durée de 5 minutes. Si le cache existe (même vide ou obsolète), il est retourné sans appeler l'API. Les services ajoutés par code ne sont pas dans le cache, donc ne s'affichent pas.

### Impact

- ❌ Services ajoutés par code ne s'affichent pas immédiatement
- ❌ Services ajoutés via UI peuvent ne pas s'afficher si le cache est obsolète
- ❌ Les deux composants (Profil et Dashboard) ont le même problème
- ❌ F5 ne fonctionne pas car le cache Redux persiste

### Solutions Possibles (À Implémenter)

1. **Invalider le cache après modification**
2. **Ajouter un paramètre `forceRefresh` dans les composants**
3. **Réduire la durée du cache (5 minutes → 1 minute)**
4. **Vérifier si le cache est vide avant de le retourner**
5. **Ajouter un mécanisme de synchronisation**

---

**Document créé le :** 2025-01-09  
**Type :** Audit uniquement (pas de modification de code)



