# 💳 CARTES DE TEST STRIPE

## ✅ MODE TEST ACTIVÉ

Les clés Stripe que vous avez configurées sont en mode **test** (`sk_test_...` et `pk_test_...`), donc vous pouvez utiliser les **cartes de test** ci-dessous.

---

## 💳 CARTES DE TEST STRIPE

### ✅ **Paiements qui réussissent**

#### 1. Carte Visa de base (paiement toujours réussi)
```
Numéro : 4242 4242 4242 4242
Date d'expiration : N'importe quelle date future (ex: 12/25)
CVC : N'importe quel 3 chiffres (ex: 123)
Code postal : N'importe quel code postal valide (ex: 75001)
```

#### 2. Carte Visa nécessitant une authentification 3D Secure
```
Numéro : 4000 0027 6000 3184
Date d'expiration : N'importe quelle date future (ex: 12/25)
CVC : N'importe quel 3 chiffres (ex: 123)
Code postal : N'importe quel code postal valide (ex: 75001)
```

#### 3. Carte Mastercard
```
Numéro : 5555 5555 5555 4444
Date d'expiration : N'importe quelle date future (ex: 12/25)
CVC : N'importe quel 3 chiffres (ex: 123)
Code postal : N'importe quel code postal valide (ex: 75001)
```

#### 4. Carte American Express
```
Numéro : 3782 822463 10005
Date d'expiration : N'importe quelle date future (ex: 12/25)
CVC : N'importe quel 4 chiffres (ex: 1234)
Code postal : N'importe quel code postal valide (ex: 75001)
```

---

### ❌ **Paiements qui échouent (pour tester les erreurs)**

#### 5. Carte rejetée (insuffisance de fonds)
```
Numéro : 4000 0000 0000 9995
Date d'expiration : N'importe quelle date future (ex: 12/25)
CVC : N'importe quel 3 chiffres (ex: 123)
Code postal : N'importe quel code postal valide (ex: 75001)
```

#### 6. Carte rejetée (carte refusée)
```
Numéro : 4000 0000 0000 0002
Date d'expiration : N'importe quelle date future (ex: 12/25)
CVC : N'importe quel 3 chiffres (ex: 123)
Code postal : N'importe quel code postal valide (ex: 75001)
```

#### 7. Carte expirée
```
Numéro : 4000 0000 0000 0069
Date d'expiration : Une date passée (ex: 01/20)
CVC : N'importe quel 3 chiffres (ex: 123)
Code postal : N'importe quel code postal valide (ex: 75001)
```

---

## 🇫🇷 CARTES FRANÇAISES DE TEST

### ✅ Cartes françaises qui réussissent

#### 8. Carte Visa française
```
Numéro : 4242 4242 4242 4242
Date d'expiration : 12/25
CVC : 123
Code postal : 75001
```

#### 9. Carte avec authentification 3D Secure
```
Numéro : 4000 0025 0000 3155
Date d'expiration : 12/25
CVC : 123
Code postal : 75001
```

---

## 🏦 VIREMENT SEPA/RIB (FRANCE)

### Pour tester les virements SEPA :

```
IBAN : FR14 2004 1010 0505 0001 3M02 606
BIC : ABNANL2AXXX
Nom du titulaire : N'importe quel nom
```

**Note :** Les virements SEPA prennent 1-2 jours dans Stripe Test Mode.

---

## 🧪 COMMENT TESTER

### Test 1 : Paiement réussi simple
1. Créer une réservation
2. Modal de paiement s'affiche
3. Entrer : `4242 4242 4242 4242`
4. Date : `12/25`
5. CVC : `123`
6. Code postal : `75001`
7. ✅ Paiement devrait réussir

### Test 2 : Authentification 3D Secure
1. Créer une réservation
2. Modal de paiement s'affiche
3. Entrer : `4000 0027 6000 3184`
4. Date : `12/25`
5. CVC : `123`
6. Code postal : `75001`
7. ✅ Une popup 3D Secure s'affichera (cliquez "Complete Authentication")
8. ✅ Paiement devrait réussir après authentification

### Test 3 : Paiement échoué (insuffisance de fonds)
1. Créer une réservation
2. Modal de paiement s'affiche
3. Entrer : `4000 0000 0000 9995`
4. Date : `12/25`
5. CVC : `123`
6. Code postal : `75001`
7. ✅ Paiement devrait échouer avec erreur "insuffisance de fonds"

### Test 4 : Sauvegarder une carte
1. Créer une réservation
2. Modal de paiement s'affiche
3. Entrer : `4242 4242 4242 4242`
4. Date : `12/25`
5. CVC : `123`
6. Code postal : `75001`
7. ✅ Cocher "Sauvegarder cette carte pour plus tard" (si disponible)
8. Payer
9. ✅ Vérifier que la carte apparaît dans Profil → Mes méthodes de paiement

---

## 📋 RÉSUMÉ DES CARTES DE TEST

| Numéro | Type | Résultat | Usage |
|--------|------|----------|-------|
| `4242 4242 4242 4242` | Visa | ✅ Réussi | Test principal |
| `5555 5555 5555 4444` | Mastercard | ✅ Réussi | Test Mastercard |
| `3782 822463 10005` | Amex | ✅ Réussi | Test Amex |
| `4000 0027 6000 3184` | Visa | ✅ Réussi (3DS) | Test 3D Secure |
| `4000 0000 0000 9995` | Visa | ❌ Échoue | Test erreur |
| `4000 0000 0000 0002` | Visa | ❌ Refusé | Test refus |
| `4000 0000 0000 0069` | Visa | ❌ Expiré | Test expiration |

---

## ⚠️ IMPORTANT

1. **Mode Test uniquement** : Ces cartes ne fonctionnent QUE avec les clés de test Stripe (`sk_test_...` et `pk_test_...`)
2. **Aucun vrai paiement** : Aucun argent réel ne sera débité
3. **Production** : En production, vous devrez utiliser de vraies cartes (avec clés `sk_live_...` et `pk_live_...`)

---

## 🔗 DOCUMENTATION STRIPE

Pour plus de cartes de test : https://stripe.com/docs/testing

---

**Date :** 2025-11-01  
**Statut :** ✅ Cartes de test disponibles

