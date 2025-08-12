# 🟢 SYSTÈME DE CONNEXION TAPHAIR - GUIDE COMPLET

## 🎯 **Vue d'ensemble**

Le système de connexion TapHair permet aux coiffeurs de gérer leur statut de disponibilité en temps réel et aux clients de voir quels coiffeurs sont en ligne et disponibles.

## 🏗️ **Architecture Technique**

### **Backend (Node.js + MongoDB)**
- **Modèle Connection** : `back/models/Connection.js`
- **Routes API** : `back/routes/connections.js`
- **Intégration serveur** : `back/server.js`

### **Frontend (React + TypeScript)**
- **Composant indicateur** : `front/src/components/ConnectionIndicator.tsx`
- **Gestionnaire de statut** : `front/src/components/ConnectionStatusManager.tsx`
- **Hook de connexion** : `front/src/hooks/useConnection.ts`
- **Service API** : `front/src/services/api/connections.ts`
- **Notifications push** : `front/src/components/PushNotification.tsx`

## 🔧 **Installation et Configuration**

### **1. Backend**
```bash
# Les nouvelles routes sont automatiquement ajoutées au serveur
# Vérifiez que le fichier back/server.js contient :
app.use('/api/connections', connectionRoutes);
```

### **2. Frontend**
```bash
# Les composants sont prêts à l'emploi
# Aucune installation supplémentaire requise
```

## 📱 **Fonctionnalités**

### **A. Indicateurs de Statut Visuels**
- **🟢 Vert** : En ligne et disponible
- **🟡 Jaune** : En ligne mais occupé
- **🟠 Orange** : Absent
- **🔴 Rouge** : Hors ligne
- **⚪ Transparent** : Statut inconnu

### **B. Gestion du Statut (Coiffeurs)**
- **Menu déroulant** dans le header
- **Changement de statut** en temps réel
- **Ping automatique** toutes les 30 secondes
- **Vérification périodique** toutes les minutes

### **C. Affichage du Statut (Clients)**
- **Cartes de recherche** : Indicateur en haut à droite
- **Page de profil** : Statut détaillé avec label
- **Liste des conversations** : Statut en temps réel

### **D. Notifications Push**
- **Messages non lus** : Notifications automatiques
- **Permission navigateur** : Gestion automatique
- **Fallback** : Notifications internes si push refusé

## 🎨 **Utilisation des Composants**

### **1. ConnectionIndicator**
```tsx
import { ConnectionIndicator } from './components/ConnectionIndicator';

// Utilisation simple
<ConnectionIndicator status={user.connectionStatus} />

// Avec label et taille personnalisée
<ConnectionIndicator 
  status={user.connectionStatus} 
  size="lg" 
  showLabel={true} 
/>
```

### **2. ConnectionStatusManager**
```tsx
import { ConnectionStatusManager } from './components/ConnectionStatusManager';

// Ajout dans le header (automatique pour les coiffeurs)
<ConnectionStatusManager />
```

### **3. Hook useConnection**
```tsx
import { useConnection } from './hooks/useConnection';

const { 
  status, 
  connect, 
  disconnect, 
  setBusy, 
  setAvailable 
} = useConnection(userId);
```

## 🔄 **Flux de Données**

### **1. Mise à Jour du Statut**
```
Frontend → API → MongoDB → Notification temps réel
```

### **2. Ping de Connexion**
```
Client → Ping toutes les 30s → Serveur → Mise à jour lastSeen
```

### **3. Vérification Périodique**
```
Client → Vérification toutes les 60s → Serveur → Synchronisation
```

## 📊 **Structure de la Base de Données**

### **Collection Connection**
```javascript
{
  userId: ObjectId,           // Référence User
  isOnline: Boolean,          // Statut de connexion
  lastSeen: Date,             // Dernière activité
  status: String,             // 'online' | 'busy' | 'offline' | 'away'
  availability: {
    isAvailable: Boolean,      // Disponibilité immédiate
    nextAvailable: Date,       // Prochaine disponibilité
    workingHours: Object       // Horaires de travail
  },
  chatSettings: {
    autoReply: Boolean,        // Réponse automatique
    awayMessage: String,       // Message d'absence
    notificationPreferences: Object
  }
}
```

## 🚀 **API Endpoints**

### **POST /api/connections/status**
Mettre à jour le statut de connexion
```json
{
  "status": "online",
  "isAvailable": true
}
```

### **GET /api/connections/status/:userId**
Récupérer le statut d'un utilisateur

### **GET /api/connections/online**
Liste des utilisateurs en ligne

### **POST /api/connections/ping**
Ping de connexion (maintenance du statut)

### **POST /api/connections/logout**
Se déconnecter

### **PUT /api/connections/chat-settings**
Mettre à jour les paramètres de chat

## 🎯 **Cas d'Usage**

### **1. Coiffeur se connecte**
- Statut passe à "En ligne et disponible"
- Indicateur vert sur toutes les cartes
- Ping automatique activé

### **2. Coiffeur devient occupé**
- Statut passe à "En ligne mais occupé"
- Indicateur jaune affiché
- Disponibilité mise à jour

### **3. Client cherche un coiffeur**
- Filtrage par statut de connexion
- Tri par disponibilité
- Indicateurs visuels immédiats

### **4. Nouveau message reçu**
- Notification push automatique
- Badge de messages non lus
- Mise à jour en temps réel

## 🔧 **Personnalisation**

### **Couleurs des Indicateurs**
```tsx
// Dans ConnectionIndicator.tsx
const getStatusColor = () => {
  switch (status.status) {
    case 'online': return 'bg-green-500';
    case 'busy': return 'bg-yellow-500';
    case 'away': return 'bg-orange-500';
    case 'offline': return 'bg-red-500';
    default: return 'bg-transparent border-2 border-gray-300';
  }
};
```

### **Intervalles de Ping**
```tsx
// Dans useConnection.ts
pingIntervalRef.current = setInterval(async () => {
  await connectionService.ping();
}, 30000); // 30 secondes
```

## 🐛 **Dépannage**

### **Problème : Statut ne se met pas à jour**
- Vérifiez la connexion MongoDB
- Contrôlez les logs du serveur
- Vérifiez les permissions utilisateur

### **Problème : Notifications push ne fonctionnent pas**
- Vérifiez les permissions du navigateur
- Contrôlez la console pour les erreurs
- Testez avec le bouton de test

### **Problème : Indicateurs ne s'affichent pas**
- Vérifiez que `connectionStatus` est défini dans User
- Contrôlez les props passées au composant
- Vérifiez la console pour les erreurs TypeScript

## 🚀 **Prochaines Étapes**

### **1. WebSocket en Temps Réel**
- Implémentation Socket.io
- Mises à jour instantanées
- Notifications push avancées

### **2. Géolocalisation**
- Statut basé sur la localisation
- Disponibilité par zone
- Filtrage géographique

### **3. Intégration Chat Avancée**
- Indicateur de frappe
- Statut de lecture
- Historique des connexions

## 📝 **Notes de Développement**

- Le système est conçu pour être **scalable** et **performant**
- Les **index MongoDB** sont optimisés pour les requêtes fréquentes
- Le **fallback** assure la compatibilité avec tous les navigateurs
- L'**architecture modulaire** permet des extensions faciles

---

**Développé avec ❤️ pour TapHair**  
*Version 1.0 - Système de Connexion Intelligent* 