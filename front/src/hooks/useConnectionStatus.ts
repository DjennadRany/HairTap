import { useState, useEffect, useCallback } from 'react';
import { connectionService, ConnectionStatus } from '../services/api/connection';

export const useConnectionStatus = (userId: string | null) => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer le statut
  const fetchStatus = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userStatus = await connectionService.getUserStatus(userId);
      setStatus(userStatus);
    } catch (err) {
      console.error('Erreur lors de la récupération du statut:', err);
      setError('Impossible de récupérer le statut');
      
      // Essayer d'utiliser le cache en cas d'erreur
      const cachedStatus = connectionService.getCachedStatus(userId);
      if (cachedStatus) {
        setStatus(cachedStatus);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fonction pour mettre à jour le statut (pour les coiffeurs)
  const updateStatus = useCallback(async (newStatus: string, isAvailable?: boolean) => {
    if (!userId) return;
    
    try {
      const updatedStatus = await connectionService.updateMyStatus(newStatus, isAvailable);
      setStatus(updatedStatus);
      return updatedStatus;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      throw err;
    }
  }, [userId]);

  // Récupération initiale
  useEffect(() => {
    if (userId) {
      fetchStatus();
    }
  }, [userId, fetchStatus]);

  // Synchronisation automatique toutes les 30 secondes
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      fetchStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId, fetchStatus]);

  // Fonctions utilitaires pour les coiffeurs
  const setAvailable = useCallback(() => updateStatus('online', true), [updateStatus]);
  const setBusy = useCallback(() => updateStatus('online', false), [updateStatus]);
  const setAway = useCallback(() => updateStatus('away'), [updateStatus]);
  const setOffline = useCallback(() => updateStatus('offline'), [updateStatus]);

  // Fonction pour forcer la mise à jour
  const refreshStatus = useCallback(() => {
    if (userId) {
      connectionService.clearCache(userId);
      fetchStatus();
    }
  }, [userId, fetchStatus]);

  return {
    status,
    loading,
    error,
    fetchStatus,
    updateStatus,
    setAvailable,
    setBusy,
    setAway,
    setOffline,
    refreshStatus
  };
};
