import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { coiffeurService } from '../services/api/coiffeurs';
import BookingForm from '../components/BookingForm';
import ServiceCard from '../components/ServiceCard';
import type { User } from '../types/models';
import { useNotification } from '../components/ui/NotificationManager';

interface CoiffeurServiceSummary {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  [key: string]: unknown;
}

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [coiffeur, setCoiffeur] = useState<User | null>(null);
  const [services, setServices] = useState<CoiffeurServiceSummary[]>([]);
  const [selectedService, setSelectedService] = useState<CoiffeurServiceSummary | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer le coiffeur
        const coiffeurData = await coiffeurService.getCoiffeur(id);
        setCoiffeur(coiffeurData);
        
        // Récupérer tous les services du coiffeur
        const coiffeurServices = await coiffeurService.getCoiffeurServices(id);
        setServices(coiffeurServices as CoiffeurServiceSummary[]);
      } catch (error) {
        console.error('Error fetching data:', error);
        showNotification({
          type: 'error',
          title: 'Coiffeur introuvable',
          message: 'Impossible de charger les informations de réservation. Retour à l’accueil.',
        });
        navigate('/');
      } finally {
      setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, showNotification]);

  const handleServiceSelect = (service: CoiffeurServiceSummary) => {
    setSelectedService(service);
  };

  const handleBookingSuccess = () => {
    navigate('/client/bookings');
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8" aria-busy="true" aria-live="polite">
        <div className="space-y-3">
          <div className="h-6 w-2/3 animate-pulse rounded bg-fashion-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-fashion-gray-100" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-lg border border-fashion-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="h-5 w-3/4 animate-pulse rounded bg-fashion-gray-200" />
              <div className="h-3 w-full animate-pulse rounded bg-fashion-gray-100" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-fashion-gray-100" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-fashion-gray-200" />
              <div className="h-10 w-full animate-pulse rounded bg-fashion-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!coiffeur) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600">Coiffeur introuvable</h1>
        <p className="text-sm text-fashion-gray-600">
          Impossible d’accéder à cette page de réservation.
        </p>
        <Button onClick={() => navigate('/')} size="lg">
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-fashion-black">Réserver avec {coiffeur.name}</h1>
        <p className="text-sm text-fashion-gray-600">
          Sélectionnez un service pour accéder aux créneaux disponibles.
        </p>
      </header>

      {!selectedService ? (
        <section className="space-y-4" aria-live="polite">
          <h2 className="text-xl font-semibold text-fashion-black">Services disponibles</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.length === 0 ? (
              <Card className="col-span-full p-6 text-center text-sm text-fashion-gray-600">
                Aucun service disponible pour le moment.
              </Card>
            ) : (
              services.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  showBookButton={true}
                  onBook={() => handleServiceSelect(service)}
                />
              ))
            )}
          </div>
        </section>
      ) : (
        <BookingForm
          coiffeur={coiffeur}
          selectedService={selectedService}
          onSuccess={handleBookingSuccess}
          onCancel={() => setSelectedService(null)}
        />
      )}
    </div>
  );
};

export default BookingPage; 