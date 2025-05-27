import { useEffect, useState } from 'react';
import { coiffeurService } from '@/services/api/coiffeurs';
import { serviceService } from '@/services/api/services';
import { User, Service } from '@/types/models';

interface UseCoiffeursWithServicesResult {
  coiffeurs: (User & { services: Service[] })[];
  loading: boolean;
  error: string | null;
}

export function useCoiffeursWithServices(): UseCoiffeursWithServicesResult {
  const [coiffeurs, setCoiffeurs] = useState<(User & { services: Service[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [coiffeursList, servicesList] = await Promise.all([
          coiffeurService.getCoiffeurs(),
          serviceService.getServices(),
        ]);
        const coiffeursWithServices = coiffeursList.map(coiffeur => ({
          ...coiffeur,
          services: servicesList.filter(s => s.coiffeur === coiffeur._id),
        }));
        setCoiffeurs(coiffeursWithServices);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des coiffeurs/services');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { coiffeurs, loading, error };
} 