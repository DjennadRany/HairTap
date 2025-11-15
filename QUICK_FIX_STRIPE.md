# ⚡ CORRECTION RAPIDE - ERREUR STRIPE

## ❌ ERREUR ACTUELLE

```
You did not provide an API key
```

**Cause :** Le fichier `.env` dans `back/` n'existe pas ou n'a pas `STRIPE_SECRET_KEY`

---

## ✅ SOLUTION EN 3 ÉTAPES

### Étape 1 : Créer `back/.env`

Créez le fichier `back/.env` avec ce contenu minimum :

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

### Étape 2 : Obtenir votre clé Stripe

1. **Allez sur** : https://dashboard.stripe.com/test/apikeys
2. **Connectez-vous** (ou créez un compte gratuit)
3. **Copiez** la `Secret key` (commence par `sk_test_...`)
4. **Collez-la** dans `back/.env` :

```env
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_ICI
```

### Étape 3 : Créer `front/.env`

Créez le fichier `front/.env` avec :

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

**Obtenir la clé publique :**
- Même page : https://dashboard.stripe.com/test/apikeys
- Copiez la `Publishable key` (commence par `pk_test_...`)
- Collez-la dans `front/.env`

---

## 🔄 REDÉMARRER

Après avoir créé les fichiers `.env` :

1. **Arrêtez** le serveur backend (Ctrl+C)
2. **Redémarrez** :
   ```bash
   cd back
   npm start
   ```
3. **Redémarrez** le frontend si nécessaire

---

## ✅ TEST

Après redémarrage, essayez de créer une réservation :
- Le modal de paiement devrait s'afficher
- Plus d'erreur "API key"

---

**C'est tout !** 🎉

