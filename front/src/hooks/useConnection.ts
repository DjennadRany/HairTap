import { useState, useEffect, useCallback, useRef } from 'react';
import { connectionService } from '../services/api/connections';

export interface ConnectionStatus {
  isOnline: boolean;
  lastSeen: Date;
  status: 'online' | 'busy' | 'offline' | 'away';
  availability: {
    isAvailable: boolean;
    nextAvailable?: Date;
    workingHours: {
      [key: string]: {
        start: string;
        end: string;
        isAvailable: boolean;
      };
    };
  };
}

export const useConnection = (userId: string) => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger le statut initial
  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const connectionStatus = await connectionService.getStatus(userId);
      setStatus(connectionStatus);
      setError(null);
    } catch (err: any) {
      console.error('Error loading connection status:', err);
      setError('Erreur lors du chargement du statut');
      // Statut par défaut si erreur
      setStatus({
        isOnline: false,
        lastSeen: new Date(),
        status: 'offline',
        availability: { 
          isAvailable: false,
          workingHours: {
            monday: { start: '09:00', end: '18:00', isAvailable: false },
            tuesday: { start: '09:00', end: '18:00', isAvailable: false },
            wednesday: { start: '09:00', end: '18:00', isAvailable: false },
            thursday: { start: '09:00', end: '18:00', isAvailable: false },
            friday: { start: '09:00', end: '18:00', isAvailable: false },
            saturday: { start: '09:00', end: '18:00', isAvailable: false },
            sunday: { start: '09:00', end: '18:00', isAvailable: false }
          }
        }
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mettre à jour le statut
  const updateStatus = useCallback(async (newStatus: string, isAvailable?: boolean) => {
    try {
      const updatedStatus = await connectionService.updateStatus(newStatus, isAvailable);
      setStatus({
        isOnline: updatedStatus.isOnline,
        lastSeen: updatedStatus.lastSeen,
        status: updatedStatus.status,
        availability: {
          isAvailable: updatedStatus.availability.isAvailable,
          nextAvailable: updatedStatus.availability.nextAvailable,
          workingHours: status?.availability.workingHours || {}
        }
      });
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  }, [status]);

  // Ping automatique pour maintenir le statut en ligne
  const startPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = setInterval(async () => {
      try {
        await connectionService.ping();
      } catch (err: any) {
        console.error('Error pinging connection:', err);
      }
    }, 30000); // Ping toutes les 30 secondes
  }, []);

  // Arrêter le ping
  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Vérifier le statut périodiquement
  const startStatusCheck = useCallback(() => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
    }

    statusCheckIntervalRef.current = setInterval(() => {
      loadStatus();
    }, 60000); // Vérifier toutes les minutes
  }, [loadStatus]);

  // Arrêter la vérification du statut
  const stopStatusCheck = useCallback(() => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
  }, []);

  // Se connecter
  const connect = useCallback(async () => {
    await updateStatus('online', true);
    startPing();
  }, [updateStatus, startPing]);

  // Se déconnecter
  const disconnect = useCallback(async () => {
    try {
      await connectionService.logout();
      setStatus(prev => prev ? { ...prev, isOnline: false, status: 'offline' } : null);
      stopPing();
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      setError('Erreur lors de la déconnexion');
    }
  }, [stopPing]);

  // Mettre en mode occupé
  const setBusy = useCallback(async () => {
    await updateStatus('busy', false);
  }, [updateStatus]);

  // Mettre en mode disponible
  const setAvailable = useCallback(async () => {
    await updateStatus('online', true);
  }, [updateStatus]);

  // Mettre en mode absent
  const setAway = useCallback(async () => {
    await updateStatus('away', false);
  }, [updateStatus]);

  // Initialisation
  useEffect(() => {
    loadStatus();
    startStatusCheck();

    return () => {
      stopPing();
      stopStatusCheck();
    };
  }, [loadStatus, startStatusCheck, stopPing, stopStatusCheck]);

  // Démarrer le ping automatiquement si l'utilisateur est en ligne
  useEffect(() => {
    if (status?.isOnline) {
      startPing();
    } else {
      stopPing();
    }
  }, [status?.isOnline, startPing, stopPing]);

  // Forcer la mise à jour du statut quand l'userId change
  useEffect(() => {
    if (userId) {
      loadStatus();
    }
  }, [userId, loadStatus]);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, []);

  return {
    status,
    loading,
    error,
    connect,
    disconnect,
    setBusy,
    setAvailable,
    setAway,
    updateStatus,
    loadStatus
  };
}; 