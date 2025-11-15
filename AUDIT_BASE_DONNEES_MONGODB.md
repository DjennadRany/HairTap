# 🔍 AUDIT COMPLET - BASE DE DONNÉES MONGODB TAPHAIR

**Date :** 2025-01-09  
**Problème signalé :** Impossible de se connecter avec `marie.dubois@taphair.com` / `marie123`  
**Statut :** 🔴 CRITIQUE - Base de données incohérente

---

## 📋 RÉSUMÉ EXÉCUTIF

La base de données MongoDB présente des **incohérences critiques** dans le stockage des mots de passe :
- Certains mots de passe sont **hashés** avec bcrypt (format `$2a$12$...`)
- D'autres sont stockés **en clair** (ex: `MdpSimple1` pour Marie Dubois)
- Le système de login utilise `bcrypt.compare()` qui **ne fonctionne qu'avec des hash**

**Résultat :** Les utilisateurs avec des mots de passe en clair ne peuvent plus se connecter.

---

## 🔴 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. **ROUTES D'AUTHENTIFICATION DÉFAILLANTES**

#### A. Route `/change-password` (back/routes/auth.js:321-348)
```javascript
// ❌ PROBLÈME : Comparaison en clair et sauvegarde en clair
if (currentPassword !== user.password) {  // Ligne 335
  return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
}
user.password = newPassword;  // Ligne 340 - Stockage en clair !
await user.save();
```

**Impact :** 
- Si l'utilisateur a un mot de passe hashé, la comparaison échoue
- Si l'utilisateur a un mot de passe en clair, il est sauvegardé en clair
- Le middleware `pre('save')` devrait hasher, mais si le mot de passe est déjà modifié, il peut y avoir des conflits

#### B. Route `/reset-password` (back/routes/auth.js:351-369)
```javascript
// ❌ PROBLÈME : Stockage en clair
const tempPassword = Math.random().toString(36).slice(-8);
user.password = tempPassword; // Stockage en clair pour les tests - Ligne 366
await user.save();
```

**Impact :** Les mots de passe temporaires sont stockés en clair.

#### C. Route `/google` (back/routes/auth.js:224-291)
```javascript
// ❌ PROBLÈME : Stockage en clair
const tempPassword = Math.random().toString(36).slice(-8);
user = new User({
  name,
  email,
  password: tempPassword, // Stockage en clair pour les tests - Ligne 247
  ...
});
```

**Impact :** Les utilisateurs créés via Google ont des mots de passe en clair.

---

### 2. **SCRIPTS DE TEST DANGEREUX**

#### A. `back/seed/resetUserPassword.js`
```javascript
// ❌ PROBLÈME : Stockage en clair
user.password = NEW_PASSWORD; // Stockage en clair pour les tests - Ligne 15
await user.save();
```

**Impact :** Ce script peut corrompre des comptes existants en remplaçant un hash par un mot de passe en clair.

---

### 3. **MIDDLEWARE DE HASHAGE INCOMPLET**

#### A. Middleware `pre('save')` (back/models/User.js:260-264)
```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

**Problème :** 
- Le middleware ne vérifie **pas** si le mot de passe est déjà un hash
- Si un script assigne directement `user.password = "MdpSimple1"` et sauvegarde, le middleware va hasher "MdpSimple1" → devient un hash
- Mais si le mot de passe est déjà un hash et qu'on le modifie, il sera re-hashé (double hashage)

**Scénario problématique :**
1. Mot de passe original : `"marie123"` (en clair dans seed.js)
2. Sauvegarde → hashé en `$2a$12$...`
3. Script modifie le compte → assigne `user.password = "MdpSimple1"` (en clair)
4. Sauvegarde → hashé en `$2a$12$...` (nouveau hash)
5. **Mais** si un script utilise `updateOne()` ou `findOneAndUpdate()` sans passer par le middleware, le mot de passe peut rester en clair

---

### 4. **MÉTHODE DE COMPARAISON INCOMPATIBLE**

#### A. Méthode `comparePassword` (back/models/User.js:273-275)
```javascript
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

**Problème :** 
- `bcrypt.compare()` **ne fonctionne qu'avec des hash bcrypt valides**
- Si `this.password` est en clair (ex: `"MdpSimple1"`), `bcrypt.compare()` va échouer
- Erreur silencieuse : la comparaison retourne `false` même si le mot de passe est correct

**Exemple :**
```javascript
// Si password en DB = "MdpSimple1" (en clair)
bcrypt.compare("marie123", "MdpSimple1")  // → false (erreur silencieuse)
bcrypt.compare("MdpSimple1", "MdpSimple1") // → false (car "MdpSimple1" n'est pas un hash)
```

---

## 🔍 ANALYSE DU CAS MARIE DUBOIS

### État actuel dans la base de données :
- **Email :** `marie.dubois@taphair.com`
- **Mot de passe stocké :** `MdpSimple1` (en clair, selon le script de récupération)
- **Mot de passe attendu :** `marie123` (selon seed.js)

### Scénario probable :

1. **Création initiale** (seed.js:55)
   - Mot de passe : `"marie123"` (en clair)
   - Sauvegarde → hashé automatiquement par middleware

2. **Modification ultérieure** (par un script ou une route)
   - Un script a probablement modifié le compte
   - Le mot de passe a été changé en `"MdpSimple1"` (en clair)
   - **Deux possibilités :**
     - **A)** Sauvegarde via `save()` → hashé en `$2a$12$...` (mais on voit "MdpSimple1" en DB ?)
     - **B)** Modification directe via `updateOne()` ou `findOneAndUpdate()` → contourne le middleware → reste en clair

3. **Tentative de connexion**
   - Login avec `"marie123"`
   - `bcrypt.compare("marie123", "MdpSimple1")` → **false** (car "MdpSimple1" n'est pas un hash valide)
   - Connexion échoue

### Scripts suspects ayant pu modifier Marie Dubois :

1. `back/scripts/copier-structure-complete.js` - Utilise Marie Dubois comme modèle
2. `back/scripts/completer-comptes-coiffeurs.js` - Récupère Marie Dubois
3. `back/scripts/audit-marie-dubois-data.js` - Analyse les données de Marie Dubois
4. `back/scripts/create-paris-coiffeurs.js` - Utilise Marie Dubois comme référence
5. `back/scripts/corriger-comptes-existants.js` - Modifie les comptes existants

**Aucun de ces scripts ne devrait modifier le mot de passe de Marie Dubois**, mais ils peuvent avoir déclenché une sauvegarde qui a causé un problème.

---

## 📊 ÉTAT DE LA BASE DE DONNÉES

### Résultats du script de récupération :
- **17 coiffeurs** au total
- **16 coiffeurs** avec mots de passe hashés (format `$2a$12$...`)
- **1 coiffeur** (Marie Dubois) avec mot de passe en clair : `MdpSimple1`

### Incohérences détectées :

| Email | Mot de passe stocké | Format | Problème |
|-------|---------------------|--------|----------|
| marie.dubois@taphair.com | `MdpSimple1` | En clair | ❌ Ne peut pas se connecter |
| Tous les autres | `$2a$12$...` | Hash bcrypt | ✅ OK |

---

## 🛠️ PROBLÈMES STRUCTURELS

### 1. **Pas de validation du format de mot de passe**
- Aucune vérification que le mot de passe stocké est un hash valide
- Aucune détection des mots de passe en clair

### 2. **Méthodes de sauvegarde incohérentes**
- Certains scripts utilisent `user.save()` (passe par middleware)
- D'autres utilisent `User.updateOne()` (contourne middleware)
- D'autres utilisent `User.findOneAndUpdate()` (contourne middleware)

### 3. **Pas de migration des mots de passe**
- Aucun script pour convertir les mots de passe en clair en hash
- Aucun script pour vérifier l'intégrité des mots de passe

### 4. **Commentaires "pour les tests"**
- Plusieurs routes et scripts stockent en clair "pour les tests"
- Ces commentaires indiquent une intention temporaire, mais le code est en production

---

## 🎯 RECOMMANDATIONS CRITIQUES

### 1. **CORRECTION IMMÉDIATE - Route de login**

Modifier `back/routes/auth.js` pour gérer les deux cas :

```javascript
// Dans la route /login
const user = await User.findOne({ email }).select('+password');
if (!user) {
  return res.status(400).json({ message: 'Utilisateur inexistant.' });
}

// Détecter si le mot de passe est un hash ou en clair
const isHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$');

let isMatch = false;
if (isHash) {
  // Mot de passe hashé : utiliser bcrypt.compare
  isMatch = await user.comparePassword(password);
} else {
  // Mot de passe en clair : comparaison directe (TEMPORAIRE)
  isMatch = (password === user.password);
  
  // ⚠️ IMPORTANT : Re-hasher immédiatement après vérification
  if (isMatch) {
    user.password = password; // Le middleware va hasher
    await user.save();
  }
}

if (!isMatch) {
  return res.status(400).json({ message: 'Mot de passe incorrect.' });
}
```

### 2. **CORRECTION DES ROUTES D'AUTHENTIFICATION**

#### A. Route `/change-password`
```javascript
// Utiliser comparePassword au lieu de comparaison directe
const isMatch = await user.comparePassword(currentPassword);
if (!isMatch) {
  return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
}
// Le nouveau mot de passe sera hashé automatiquement par le middleware
user.password = newPassword;
await user.save();
```

#### B. Route `/reset-password`
```javascript
// Hasher le mot de passe temporaire AVANT sauvegarde
const tempPassword = Math.random().toString(36).slice(-8);
user.password = tempPassword; // Le middleware va hasher
await user.save();
```

#### C. Route `/google`
```javascript
// Hasher le mot de passe temporaire AVANT sauvegarde
const tempPassword = Math.random().toString(36).slice(-8);
user = new User({
  name,
  email,
  password: tempPassword, // Le middleware va hasher
  ...
});
```

### 3. **SCRIPT DE MIGRATION URGENT**

Créer un script pour :
1. Détecter tous les mots de passe en clair
2. Les hasher avec bcrypt
3. Les sauvegarder

### 4. **AMÉLIORATION DU MIDDLEWARE**

Ajouter une vérification pour éviter le double hashage :

```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Vérifier si c'est déjà un hash bcrypt
  const isAlreadyHashed = /^\$2[ayb]\$\d{2}\$/.test(this.password);
  
  if (isAlreadyHashed) {
    console.warn('⚠️ Tentative de sauvegarder un hash comme mot de passe');
    return next(); // Ne pas re-hasher
  }
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

### 5. **VALIDATION AVANT SAUVEGARDE**

Ajouter une méthode de validation :

```javascript
userSchema.methods.validatePassword = function() {
  const isHash = /^\$2[ayb]\$\d{2}\$/.test(this.password);
  if (!isHash && this.password.length < 8) {
    throw new Error('Mot de passe invalide : doit être hashé ou faire au moins 8 caractères');
  }
};
```

---

## 📝 PLAN D'ACTION PRIORITAIRE

### 🔴 URGENT (À faire immédiatement)

1. **Corriger la route `/login`** pour gérer les mots de passe en clair
2. **Créer un script de migration** pour hasher tous les mots de passe en clair
3. **Corriger les routes `/change-password` et `/reset-password`**

### 🟡 IMPORTANT (Cette semaine)

4. **Améliorer le middleware** pour éviter le double hashage
5. **Ajouter des validations** avant sauvegarde
6. **Auditer tous les scripts** qui modifient des utilisateurs

### 🟢 RECOMMANDÉ (Ce mois)

7. **Créer des tests unitaires** pour les routes d'authentification
8. **Documenter les bonnes pratiques** de modification des utilisateurs
9. **Mettre en place un système de logs** pour tracer les modifications de mots de passe

---

## 🔒 SÉCURITÉ

### Risques identifiés :

1. **Mots de passe en clair** → Accessibles en cas de fuite de base de données
2. **Routes non sécurisées** → Permettent de contourner le hashage
3. **Pas de validation** → Permet d'insérer des données invalides
4. **Scripts de test en production** → Peuvent corrompre les données

### Mesures de sécurité recommandées :

1. **Chiffrer la base de données** au repos
2. **Limiter l'accès** aux scripts de modification
3. **Auditer régulièrement** les mots de passe en clair
4. **Implémenter un système de rotation** des mots de passe
5. **Ajouter des logs** pour toutes les modifications de mots de passe

---

## 📊 MÉTRIQUES À SURVEILLER

1. **Nombre de mots de passe en clair** dans la base
2. **Taux d'échec de connexion** par utilisateur
3. **Nombre de modifications de mots de passe** par jour
4. **Temps de réponse** des routes d'authentification

---

## ✅ CONCLUSION

La base de données MongoDB présente des **incohérences critiques** dans le stockage des mots de passe. Le problème principal est que :

1. **Certains mots de passe sont en clair** (ex: Marie Dubois)
2. **Le système de login ne peut pas les vérifier** (utilise bcrypt.compare qui nécessite un hash)
3. **Plusieurs routes contournent le hashage** et stockent en clair

**Action immédiate requise :** Corriger la route de login pour gérer les deux cas et créer un script de migration pour hasher tous les mots de passe en clair.

---

**Document créé le :** 2025-01-09  
**Dernière mise à jour :** 2025-01-09



