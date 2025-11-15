import React, { useEffect, useState } from 'react';
import { useNotification } from '../../ui/NotificationManager';
import { FaBell, FaBellSlash, FaCog } from 'react-icons/fa';

interface PushNotificationProps {
  onMessageReceived?: (message: any) => void;
}

export const PushNotification: React.FC<PushNotificationProps> = ({ onMessageReceived }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    // Vérifier si les notifications sont supportées
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        showNotification({
          type: 'success',
          title: 'Notifications activées',
          message: 'Vous recevrez maintenant des notifications pour les nouveaux messages'
        });
      } else {
        showNotification({
          type: 'warning',
          title: 'Notifications refusées',
          message: 'Vous ne recevrez pas de notifications pour les nouveaux messages'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'activer les notifications'
      });
    }
  };

  const showPushNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && isSupported) {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        });

        // Gérer le clic sur la notification
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Fermer automatiquement après 5 secondes
        setTimeout(() => {
          notification.close();
        }, 5000);

        return notification;
      } catch (error) {
        console.error('Error showing push notification:', error);
        // Fallback vers la notification interne
        showNotification({
          type: 'info',
          title,
          message: options?.body || ''
        });
      }
    }
  };

  const testNotification = () => {
    showPushNotification('Test de notification', {
      body: 'Ceci est un test de notification push',
      tag: 'test'
    });
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Bouton de permission */}
      {permission === 'default' && (
        <button
          onClick={requestPermission}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          title="Activer les notifications"
        >
          <FaBell />
          <span className="text-sm">Activer les notifications</span>
        </button>
      )}

      {/* Statut des notifications */}
      {permission === 'granted' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
          <FaBell />
          <span className="text-sm">Notifications activées</span>
        </div>
      )}

      {permission === 'denied' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg">
          <FaBellSlash />
          <span className="text-sm">Notifications désactivées</span>
        </div>
      )}

      {/* Bouton de test */}
      {permission === 'granted' && (
        <button
          onClick={testNotification}
          className="flex items-center gap-2 px-2 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          title="Tester les notifications"
        >
          <FaCog />
        </button>
      )}
    </div>
  );
};

// Hook pour utiliser les notifications push
export const usePushNotification = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && 'Notification' in window) {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => {
          notification.close();
        }, 5000);

        return notification;
      } catch (error) {
        console.error('Error showing push notification:', error);
      }
    }
  };

  return { showNotification, permission };
}; 