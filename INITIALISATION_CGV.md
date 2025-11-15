# 🚀 INITIALISATION DES CGV

**Problème:** L'erreur 404 indique que les CGV n'existent pas encore dans la base de données.

---

## ✅ CORRECTION APPLIQUÉE

La route `/api/cgv/active` retourne maintenant un **200** avec `success: false` au lieu d'un **404** si les CGV n'existent pas. Cela permet au frontend de gérer l'absence de CGV sans erreur.

---

## 📋 INITIALISATION DES CGV

### **Option 1 : Via le script d'initialisation (Recommandé)**

```bash
cd back
node scripts/init-cgv.js
```

Ce script va :
1. Se connecter à MongoDB
2. Vérifier si des CGV existent déjà
3. Créer des CGV par défaut si elles n'existent pas

### **Option 2 : Via l'API (Admin uniquement)**

```bash
POST http://localhost:5000/api/cgv
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "version": "v1.0-2025-11-01",
  "content": "<h1>Conditions Générales de Vente - TapHair</h1>...",
  "isActive": true
}
```

---

## 🔄 REDÉMARRAGE DU SERVEUR

**Important:** Après avoir ajouté les routes CGV, vous devez redémarrer le serveur backend pour que les nouvelles routes soient prises en compte.

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer
cd back
npm start
```

---

## ✅ VÉRIFICATION

Une fois les CGV initialisées, vous pouvez vérifier qu'elles existent :

```bash
GET http://localhost:5000/api/cgv/active
```

Vous devriez recevoir :
```json
{
  "success": true,
  "data": {
    "version": "v1.0-2025-11-01",
    "content": "...",
    "effectiveDate": "2025-11-01T00:00:00.000Z"
  }
}
```

---

## 🐛 DÉPANNAGE

### **Erreur 404 persistante**

1. Vérifier que le serveur backend est bien redémarré
2. Vérifier que les routes CGV sont bien montées dans `back/server.js` (ligne 134)
3. Vérifier que le fichier `back/routes/cgv.js` existe
4. Vérifier que le modèle `back/models/CGV.js` existe

### **Erreur de connexion MongoDB**

1. Vérifier que MongoDB est bien démarré
2. Vérifier que la variable d'environnement `MONGO_URI` est correcte dans `.env`

---

**Prochaine étape:** Initialiser les CGV avec le script `init-cgv.js` puis redémarrer le serveur backend.

