# ⚡ SETUP STRIPE EN 2 MINUTES

## 🚨 ERREUR ACTUELLE

```
You did not provide an API key
```

## ✅ SOLUTION RAPIDE

### Étape 1 : Créer `back/.env`

Créez le fichier `back/.env` avec ce contenu :

```env
# Stripe (OBLIGATOIRE)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# MongoDB (si pas déjà configuré)
MONGO_URI=mongodb://localhost:27017/taphair

# JWT (si pas déjà configuré)
JWT_SECRET=votre_secret_jwt_ici

# Port (si pas déjà configuré)
PORT=5000
```

### Étape 2 : Obtenir la clé Stripe

**Option A : Vous avez déjà un compte Stripe**
1. Allez sur : https://dashboard.stripe.com/test/apikeys
2. Copiez `Secret key` (commence par `sk_test_...`)
3. Collez dans `back/.env`

**Option B : Créer un compte Stripe (gratuit)**
1. Allez sur : https://stripe.com
2. Créez un compte gratuit
3. Allez sur : https://dashboard.stripe.com/test/apikeys
4. Copiez `Secret key` (commence par `sk_test_...`)
5. Collez dans `back/.env`

### Étape 3 : Créer `front/.env`

Créez le fichier `front/.env` avec ce contenu :

```env
# Stripe Public Key (OBLIGATOIRE)
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx

# API URL (si pas déjà configuré)
VITE_API_URL=http://localhost:5000
```

**Obtenir la clé publique :**
- Sur https://dashboard.stripe.com/test/apikeys
- Copiez `Publishable key` (commence par `pk_test_...`)
- Collez dans `front/.env`

### Étape 4 : Redémarrer les serveurs

**Terminal 1 - Backend :**
```bash
cd back
# Arrêtez le serveur (Ctrl+C si en cours)
npm start
```

**Terminal 2 - Frontend :**
```bash
cd front
# Arrêtez le serveur (Ctrl+C si en cours)
npm run dev
```

## ✅ TEST RAPIDE

Après redémarrage, essayez de créer une réservation :
1. Créez une réservation
2. Le modal de paiement devrait s'afficher
3. Entrez une carte de test : `4242 4242 4242 4242`

## 🎯 RÉSUMÉ

1. ✅ Créer `back/.env` avec `STRIPE_SECRET_KEY=sk_test_...`
2. ✅ Créer `front/.env` avec `VITE_STRIPE_PUBLIC_KEY=pk_test_...`
3. ✅ Redémarrer les serveurs
4. ✅ Tester !

**C'est tout !** 🎉

