# ✅ BONNES PRATIQUES POUR LES VIDÉOS

## 🚨 PROBLÈME IDENTIFIÉ

Les vidéos se chargeaient **TOUTES en même temps** avec `autoPlay` et `src` directement, même si elles n'étaient pas visibles. Cela peut faire planter l'application.

## ✅ CORRECTIONS APPLIQUÉES

### 1. **Composant LazyVideo avec IntersectionObserver**
- ✅ Ne charge la vidéo **QUE si elle est visible** dans le viewport
- ✅ Utilise `preload="none"` pour éviter le chargement automatique
- ✅ Pause automatiquement les vidéos non visibles
- ✅ Pause si la page devient cachée (visibilitychange)

### 2. **Chargement conditionnel**
- ✅ Vidéos chargées seulement si visibles (au moins 10% dans le viewport)
- ✅ Auto-play seulement si visible (au moins 30% dans le viewport) ET autoplay activé
- ✅ Poster image affichée avant le chargement de la vidéo

### 3. **Optimisations**
- ✅ `preload="none"` : Ne pas précharger les vidéos
- ✅ `rootMargin: '50px'` : Commencer à charger 50px avant d'être visible
- ✅ Pause automatique si la page devient cachée
- ✅ Gestion des erreurs de play (bloqué par le navigateur)

## 📋 FICHIERS MODIFIÉS

1. **`front/src/components/shared/gallery/LazyVideo.tsx`** (NOUVEAU)
   - Composant vidéo avec lazy loading optimisé
   - Utilise IntersectionObserver
   - Gère le play/pause selon la visibilité

2. **`front/src/components/shared/gallery/GalleryHub.tsx`**
   - Remplace `<video>` par `<LazyVideo>`
   - `autoplay={false}` par défaut (économise la bande passante)

3. **`front/src/components/shared/gallery/InstagramGallery.tsx`**
   - Remplace `<video>` par `<LazyVideo>`
   - `autoplay={true}` sur mobile (Instagram-like)

## 🎯 RÉSULTAT ATTENDU

- ✅ Les vidéos ne se chargent QUE si elles sont visibles
- ✅ Pas de chargement inutile si on est sur d'autres pages
- ✅ Meilleures performances (pas de plantage)
- ✅ Économie de bande passante

