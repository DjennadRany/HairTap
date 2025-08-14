# 🔍 VÉRIFICATION DES PRÉREQUIS TAPHAIR

## 📋 **AVANT DE COMMENCER LE TEST**

### **1. Vérifier MongoDB** ✅
```bash
# Vérifier que MongoDB est démarré
mongod --version

# Vérifier la connexion
cd back
node test-connection.js
```

### **2. Vérifier les dépendances** ✅
```bash
# Backend
cd back
npm install

# Frontend  
cd front
npm install
```

### **3. Vérifier les variables d'environnement** ✅
```bash
# Créer un fichier .env dans le dossier back
MONGO_URI=mongodb://localhost:27017/taphair
JWT_SECRET=votre_secret_jwt_ici
PORT=5000
```

### **4. Vérifier les ports** ✅
- **Backend** : Port 5000 (http://localhost:5000)
- **Frontend** : Port 5173 (http://localhost:5173)
- **MongoDB** : Port 27017

## 🚀 **DÉMARRAGE AUTOMATIQUE**

### **Option 1 : Script automatique**
```bash
# Double-cliquer sur start-servers.bat
# Ou exécuter en ligne de commande
start-servers.bat
```

### **Option 2 : Manuel**
```bash
# Terminal 1 - Backend
cd back
npm start

# Terminal 2 - Frontend  
cd front
npm run dev
```

## 🧪 **TESTS DE VÉRIFICATION**

### **Test 1 : Backend**
```bash
curl http://localhost:5000/api/auth/check-phone?phone=0123456789
# Réponse attendue: {"exists":false,"message":"Téléphone disponible"}
```

### **Test 2 : Frontend**
- Ouvrir http://localhost:5173/signin/client
- Vérifier que la page se charge
- Vérifier que les étapes s'affichent

### **Test 3 : Base de données**
```bash
cd back
node test-connection.js
# Vérifier la connexion MongoDB
```

## 🚨 **ERREURS COURANTES ET SOLUTIONS**

### **Erreur 1 : MongoDB non connecté**
```bash
# Solution : Démarrer MongoDB
mongod
```

### **Erreur 2 : Port déjà utilisé**
```bash
# Solution : Changer le port dans .env
PORT=5001
```

### **Erreur 3 : Module non trouvé**
```bash
# Solution : Réinstaller les dépendances
npm install
```

## ✅ **CHECKLIST FINALE**

- [ ] MongoDB démarré et connecté
- [ ] Dépendances installées (back + front)
- [ ] Variables d'environnement configurées
- [ ] Backend démarré sur port 5000
- [ ] Frontend démarré sur port 5173
- [ ] Test de connexion MongoDB réussi
- [ ] Endpoint `/api/auth/check-phone` accessible

**Une fois cette checklist complétée, vous pouvez tester l'inscription !** 🎯
