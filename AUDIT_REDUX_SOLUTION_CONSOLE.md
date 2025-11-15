# 🔧 SOLUTION - VIDER LE CACHE REDUX DEPUIS LA CONSOLE

**Problème :** `store is not defined` dans la console du navigateur

---

## ✅ SOLUTION 1 : Via Redux DevTools (Recommandé)

### Étape 1 : Installer Redux DevTools

Si vous n'avez pas l'extension Redux DevTools :
1. Chrome : https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd
2. Firefox : https://addons.mozilla.org/fr/firefox/addon/reduxdevtools/

### Étape 2 : Ouvrir Redux DevTools

1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Redux"
3. Chercher l'action `booking/clearServicesCache`
4. Ou utiliser l'interface pour dispatcher l'action

### Étape 3 : Vider le cache

Dans Redux DevTools :
- Chercher `booking` dans le state
- Trouver `servicesCache`
- Supprimer manuellement l'entrée pour `6839ca0736ec3cfc09c649ec`
- Ou dispatcher l'action `clearServicesCache`

---

## ✅ SOLUTION 2 : Via la Console (Sans Redux DevTools)

### Méthode 1 : Accéder au store via React DevTools

Si vous avez React DevTools installé :

```javascript
// Dans la console du navigateur
const reactFiber = document.querySelector('#root')._reactInternalFiber || 
                   document.querySelector('#root')._reactInternalInstance;

// Naviguer jusqu'au store (peut varier selon la structure)
// Cette méthode peut ne pas fonctionner selon la version de React
```

### Méthode 2 : Exposer le store globalement (Temporaire)

**Modifier temporairement** `front/src/store/index.ts` :

```typescript
// Ajouter à la fin du fichier
if (typeof window !== 'undefined') {
  (window as any).__REDUX_STORE__ = store;
}
```

Puis dans la console :
```javascript
window.__REDUX_STORE__.dispatch({ 
  type: 'booking/clearServicesCache', 
  payload: '6839ca0736ec3cfc09c649ec' 
});
location.reload();
```

### Méthode 3 : Via localStorage (Si utilisé)

```javascript
// Vider le localStorage si le cache y est stocké
localStorage.removeItem('redux-state');
localStorage.removeItem('servicesCache');
location.reload();
```

---

## ✅ SOLUTION 3 : Attendre l'expiration du cache

Le cache expire après **5 minutes**. Si vous attendez 5 minutes, le cache sera automatiquement invalidé et l'API sera appelée.

---

## ✅ SOLUTION 4 : Vider le cache du navigateur

1. **Ctrl + Shift + Delete** (Windows) ou **Cmd + Shift + Delete** (Mac)
2. Sélectionner "Cookies et autres données de sites"
3. Cocher "Données en cache"
4. Cliquer sur "Effacer les données"
5. Recharger la page

---

## ✅ SOLUTION 5 : Mode Navigation Privée

1. Ouvrir une fenêtre de navigation privée
2. Se connecter avec Marie Dubois
3. Aller sur la page Services & Produits
4. Le cache Redux sera vide, donc l'API sera appelée

---

## 🔍 VÉRIFICATION

### Vérifier si le cache existe

**Avec Redux DevTools :**
1. Ouvrir Redux DevTools
2. Chercher `state.booking.servicesCache`
3. Vérifier si `6839ca0736ec3cfc09c649ec` existe

**Sans Redux DevTools :**
- Le cache est en mémoire, donc difficile à vérifier sans outils
- Mais si F5 ne fonctionne pas, c'est probablement le cache

### Vérifier si l'API est appelée

1. Ouvrir l'onglet "Network" des DevTools
2. Filtrer sur `/coiffeurs/6839ca0736ec3cfc09c649ec/services`
3. Recharger la page
4. Si l'API n'est pas appelée → Cache utilisé
5. Si l'API est appelée → Vérifier la réponse

---

## 📝 RECOMMANDATION

**Solution la plus simple :**
1. Attendre 5 minutes (expiration du cache)
2. Ou utiliser une fenêtre de navigation privée
3. Ou vider le cache du navigateur

**Solution la plus fiable :**
- Installer Redux DevTools
- Vider le cache manuellement via l'interface

---

**Document créé le :** 2025-01-09



