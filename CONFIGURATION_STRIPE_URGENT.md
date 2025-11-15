# 🚨 CONFIGURATION STRIPE URGENTE

## ❌ ERREUR ACTUELLE

```
StripeAuthenticationError: You did not provide an API key
```

**Cause :** La clé API Stripe n'est pas configurée dans le fichier `.env` du backend.

---

## ✅ SOLUTION IMMÉDIATE

### 1. Créer le fichier `.env` dans `back/`

**Fichier à créer :** `back/.env`

**Contenu minimum :**
```env
# MongoDB (si pas déjà configuré)
MONGO_URI=mongodb://localhost:27017/taphair

# JWT Secret (si pas déjà configuré)
JWT_SECRET=votre_secret_jwt_ici

# Port (si pas déjà configuré)
PORT=5000

# ⚠️ STRIPE - OBLIGATOIRE POUR LE PAIEMENT
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 2. Obtenir vos clés Stripe

1. **Allez sur** : https://dashboard.stripe.com/test/apikeys
2. **Connectez-vous** à votre compte Stripe (ou créez un compte gratuit)
3. **Copiez la clé secrète** : `sk_test_...`
4. **Collez-la dans** `back/.env` :
   ```env
   STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_ICI
   ```

### 3. Obtenir le webhook secret (optionnel pour le moment)

1. **Allez sur** : https://dashboard.stripe.com/test/webhooks
2. **Créez un webhook** avec l'URL : `http://localhost:5000/api/payments/webhook`
3. **Copiez le webhook secret** : `whsec_...`
4. **Collez-le dans** `back/.env` :
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_ICI
   ```

### 4. Créer le fichier `.env` dans `front/`

**Fichier à créer :** `front/.env`

**Contenu :**
```env
# API URL (si pas déjà configuré)
VITE_API_URL=http://localhost:5000

# ⚠️ STRIPE PUBLIC KEY - OBLIGATOIRE POUR LE PAIEMENT
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

**Obtenir la clé publique :**
- Sur https://dashboard.stripe.com/test/apikeys
- Copiez la clé publique : `pk_test_...`
- Collez-la dans `front/.env`

---

## 🔄 REDÉMARRER LES SERVEURS

Après avoir configuré les fichiers `.env` :

1. **Arrêter** les serveurs (Ctrl+C)
2. **Redémarrer le backend** :
   ```bash
   cd back
   npm start
   ```
3. **Redémarrer le frontend** :
   ```bash
   cd front
   npm run dev
   ```

---

## ✅ VÉRIFICATION

### Backend
```bash
cd back
node -e "require('dotenv').config(); console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Configuré' : '❌ Manquant')"
```

### Frontend
Vérifiez que `VITE_STRIPE_PUBLIC_KEY` est accessible dans la console du navigateur.

---

## 🧪 TEST AVEC CLÉS DE TEST

### Clés Stripe Test (pour développement)

Si vous n'avez pas encore de compte Stripe, utilisez ces clés de test temporaires :

**⚠️ ATTENTION :** Ces clés ne fonctionneront pas en production, mais permettent de tester l'intégration.

**Backend (.env) :**
```env
STRIPE_SECRET_KEY=sk_test_51Q...  # Remplacez par votre vraie clé
```

**Frontend (.env) :**
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_51Q...  # Remplacez par votre vraie clé
```

---

## 🎯 RÉSUMÉ

**Problème :** `STRIPE_SECRET_KEY` n'est pas configurée  
**Solution :** Créer `back/.env` avec `STRIPE_SECRET_KEY=sk_test_...`  
**Action :** Redémarrer le serveur backend après configuration

---

**Date :** 2025-11-01  
**Urgence :** 🔴 CRITIQUE - L'application ne peut pas fonctionner sans cette configuration

