import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { userService } from '../services/api/users';
import { bookingService } from '../services/api/bookings';
import BookingForm from '../components/BookingForm';
import ServiceCard from '../components/ServiceCard';
import type { User } from '../types/models';

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [coiffeur, setCoiffeur] = useState<User | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer le coiffeur
        const coiffeurData = await userService.getUser(id);
        setCoiffeur(coiffeurData);
        
        // Récupérer tous les services du coiffeur
        const coiffeurServices = await userService.getCoiffeurServices(id);
        setServices(coiffeurServices);
      } catch (error) {
        console.error('Error fetching data:', error);
        navigate('/');
      } finally {
      setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
  };

  const handleBookingSuccess = () => {
    navigate('/client/bookings');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!coiffeur) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-600">Coiffeur introuvable.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Réserver avec {coiffeur.name}</h1>
        <p className="text-gray-600">Sélectionnez un service pour continuer</p>
          </div>

      {!selectedService ? (
        // Affichage de la sélection de service
                  <div>
          <h2 className="text-xl font-semibold mb-4">Services disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.length === 0 ? (
              <p className="text-gray-600 col-span-full text-center">Aucun service disponible pour le moment.</p>
            ) : (
              services.map((service: any) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  showBookButton={true}
                  onBook={() => handleServiceSelect(service)}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        // Formulaire de réservation
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