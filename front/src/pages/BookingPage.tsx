import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadStripe } from '@stripe/stripe-js';
import { getAllCoiffeurs } from '../features/search/domain/mockData';
import { SearchResult } from '../features/search/domain/types';

interface Service {
  name: string;
  price: number;
  duration: string;
}

interface Coiffeur {
  id: string;
  name: string;
  services: Service[];
  mode: ('salon' | 'domicile')[];
  address?: string;
  availability: {
    date: string;
    slots: string[];
  }[];
  cancellationPolicy: string;
}

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<{ name: string; price: number; duration: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingMode, setBookingMode] = useState<'salon' | 'domicile'>('salon');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [coiffeur, setCoiffeur] = useState<SearchResult | null>(null);

  useEffect(() => {
    // Récupérer le coiffeur par id depuis la source de vérité
    const allCoiffeurs = getAllCoiffeurs();
    const found = allCoiffeurs.find((c) => String(c.id) === String(id));
    setCoiffeur(found || null);
    setLoading(false);
  }, [id]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  // Fallbacks pour les propriétés manquantes
  const coiffeurModes = coiffeur ? ((coiffeur as any).mode || (coiffeur.type ? [coiffeur.type] : ['salon'])) : ['salon'];
  const coiffeurServices = coiffeur ? (Array.isArray((coiffeur as any).services) && typeof (coiffeur as any).services[0] === 'object'
    ? (coiffeur as any).services
    : (coiffeur as any).services?.map((s: string) => ({ name: s, price: coiffeur.price || 0, duration: '30 min' })) || []) : [];
  const coiffeurAvailability = coiffeur ? ((coiffeur as any).availability || Array.from({ length: 7 }, (_, i) => ({
    date: format(addDays(new Date(), i), 'yyyy-MM-dd'),
    slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
  }))) : [];
  const coiffeurCancellation = coiffeur ? ((coiffeur as any).cancellationPolicy || "Annulation gratuite jusqu'à 24h avant le rendez-vous.") : "Annulation gratuite jusqu'à 24h avant le rendez-vous.";

  const getAvailableSlots = () => {
    if (!selectedDate) return [];
    const dayAvailability = coiffeurAvailability.find((a: any) => a.date === selectedDate);
    return dayAvailability?.slots || [];
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedService || !selectedDate || !selectedTime) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (bookingMode === 'domicile' && !clientAddress) {
      setError('Veuillez fournir une adresse pour la prestation à domicile');
      return;
    }

    // Simuler une réservation réussie
    navigate('/client/bookings');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-2"></div>
        </div>
      </div>
    );
  }

  if (!coiffeur) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500 font-semibold">Coiffeur introuvable.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Réserver avec {coiffeur.name}
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Mode de prestation */}
          {coiffeurModes.length > 1 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Mode de prestation</h2>
              <div className="flex gap-4">
                {coiffeurModes.map((mode: string) => (
                  <button
                    key={mode}
                    className={`flex-1 p-4 rounded-lg border ${
                      bookingMode === mode
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200'
                    }`}
                    onClick={() => setBookingMode(mode as 'salon' | 'domicile')}
                  >
                    {mode === 'salon' ? 'En salon' : 'À domicile'}
                  </button>
                ))}
              </div>
              {bookingMode === 'domicile' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre adresse
                  </label>
                  <input
                    type="text"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Entrez votre adresse complète"
                  />
                </div>
              )}
            </Card>
          )}

          {/* Services */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Services disponibles</h2>
            <div className="space-y-2">
              {coiffeurServices.map((service: any) => (
                <div
                  key={service.name}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer ${
                    selectedService?.name === service.name
                      ? 'border-primary bg-primary/10'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleServiceSelect(service)}
                >
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-gray-500">{service.duration}</p>
                  </div>
                  <span className="text-lg font-semibold">{service.price}€</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Date et heure */}
          {selectedService && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Date et heure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calendrier */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Sélectionnez une date
                  </h3>
                  <div className="space-y-2">
                    {coiffeurAvailability.map((day: any) => (
                      <button
                        key={day.date}
                        className={`w-full p-2 text-left rounded-lg border ${
                          selectedDate === day.date
                            ? 'border-primary bg-primary/10'
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => handleDateSelect(day.date)}
                      >
                        {format(new Date(day.date), 'EEEE d MMMM', { locale: fr })}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horaires */}
                {selectedDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Sélectionnez un horaire
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {getAvailableSlots().map((time: string) => (
                        <button
                          key={time}
                          className={`p-2 text-center rounded-lg border ${
                            selectedTime === time
                              ? 'border-primary bg-primary/10'
                              : 'hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Politique d'annulation */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">Politique d'annulation</h2>
            <p className="text-gray-600 text-sm">{coiffeurCancellation}</p>
          </Card>

          {/* Récapitulatif et validation */}
          {selectedService && selectedDate && selectedTime && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Récapitulatif</h2>
              <div className="space-y-2 mb-6">
                <p>
                  <span className="font-medium">Service :</span>{' '}
                  {selectedService.name} ({selectedService.duration})
                </p>
                <p>
                  <span className="font-medium">Date :</span>{' '}
                  {format(new Date(selectedDate), 'EEEE d MMMM', { locale: fr })}
                </p>
                <p>
                  <span className="font-medium">Heure :</span> {selectedTime}
                </p>
                <p>
                  <span className="font-medium">Mode :</span>{' '}
                  {bookingMode === 'salon' ? 'En salon' : 'À domicile'}
                </p>
                {bookingMode === 'domicile' && clientAddress && (
                  <p>
                    <span className="font-medium">Adresse :</span> {clientAddress}
                  </p>
                )}
                <p className="text-lg font-bold mt-4">
                  Total : {selectedService.price}€
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
              >
                Confirmer la réservation
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage; 