/**
 * Hook personnalisé pour gérer le cache des services d'un coiffeur
 * Utilise Redux pour le cache (déjà installé)
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { coiffeurService } from '../services/api/coiffeurs';
import { setCoiffeurServices, selectCoiffeurServices, clearServicesCache } from '../store/slices/bookingSlice';
import type { Service } from '../store/slices/bookingSlice';

export const useCoiffeurServices = (coiffeurId: string | undefined) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Récupérer les services depuis le cache Redux
  const cachedServices = useSelector(selectCoiffeurServices(coiffeurId || ''));

  const fetchServices = async (forceRefresh = false) => {
    if (!coiffeurId) {
      setError('ID du coiffeur manquant');
      return;
    }

    // ✅ Utiliser le cache si disponible et pas de force refresh
    if (!forceRefresh && cachedServices) {
      return cachedServices;
    }

    try {
      setLoading(true);
      setError(null);
      
      const services = await coiffeurService.getCoiffeurServices(coiffeurId);
      
      // ✅ Mettre en cache dans Redux
      dispatch(setCoiffeurServices({ coiffeurId, services }));
      
      return services;
    } catch (err: any) {
      console.error('Erreur lors de la récupération des services:', err);
      setError(err.message || 'Erreur lors de la récupération des services');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    if (coiffeurId) {
      dispatch(clearServicesCache(coiffeurId));
    }
  };

  return {
    services: cachedServices || null,
    loading,
    error,
    fetchServices,
    clearCache
  };
};

