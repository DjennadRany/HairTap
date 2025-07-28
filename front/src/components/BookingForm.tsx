import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Card } from './ui/card';
import { Button } from './ui/Button';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { bookingService } from '../services/api/bookings';
import type { User } from '../types/models';
import { v4 as uuidv4 } from 'uuid';

interface BookingFormProps {
  coiffeur: User;
  selectedService?: {
    _id: string;
    name: string;
    price: number;
    duration: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  coiffeur,
  selectedService,
  onSuccess,
  onCancel
}) => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingMode, setBookingMode] = useState<'salon' | 'domicile'>('salon');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [coiffeurBookings, setCoiffeurBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Générer les disponibilités pour les 7 prochains jours
  const coiffeurAvailability = Array.from({ length: 7 }, (_, i) => ({
    date: format(addDays(new Date(), i), 'yyyy-MM-dd'),
    slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
  }));

  useEffect(() => {
    const fetchCoiffeurBookings = async () => {
      if (!coiffeur._id) {
        console.error('Coiffeur ID is undefined');
        return;
      }
      
      try {
        const bookings = await bookingService.getCoiffeurBookings(coiffeur._id);
        setCoiffeurBookings(bookings);
      } catch (error) {
        console.error('Error fetching coiffeur bookings:', error);
      }
    };

    fetchCoiffeurBookings();
  }, [coiffeur._id]);

  const getAvailableSlots = () => {
    if (!selectedDate) return [];
    const dayAvailability = coiffeurAvailability.find((a: any) => a.date === selectedDate);
    return dayAvailability?.slots || [];
  };

  // Vérifier si le créneau est disponible
  const isSlotAvailable = (date: string, time: string) => {
    const existingBookings = coiffeurBookings.filter(booking => 
      booking.date.startsWith(date) && 
      booking.date.includes(time)
    );
    return existingBookings.length === 0;
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!coiffeur._id) {
      setError('Erreur : ID du coiffeur manquant');
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

    // Vérifier la disponibilité du créneau
    if (!isSlotAvailable(selectedDate, selectedTime)) {
      setError('Ce créneau n\'est plus disponible. Veuillez choisir un autre horaire.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const booking = {
        _id: uuidv4(),
        client: user._id,
        coiffeur: coiffeur._id,
        service: selectedService.name,
        date: `${selectedDate}T${selectedTime}`,
        duration: selectedService.duration,
        price: selectedService.price,
        status: 'pending' as const,
        mode: bookingMode,
        address: bookingMode === 'domicile' ? {
          street: clientAddress,
          city: '',
          postalCode: ''
        } : undefined,
        paymentStatus: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await bookingService.createBooking(booking);
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/client/bookings');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Erreur lors de la création de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const coiffeurModes = coiffeur.workingMode || ['salon'];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Réserver avec {coiffeur.name}</h2>
        {selectedService && (
          <div className="bg-accent/10 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-accent">Service sélectionné</h3>
            <p className="text-gray-700">{selectedService.name} - {selectedService.price}€ ({selectedService.duration} min)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaCalendarAlt />
          Date et heure
        </h3>
        
        {/* Sélection de la date */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Date</label>
          <div className="grid grid-cols-7 gap-2">
            {coiffeurAvailability.slice(0, 7).map((day: any, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedDate(day.date)}
                className={`p-2 text-sm rounded-lg transition-colors ${
                  selectedDate === day.date
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {format(new Date(day.date), 'dd/MM', { locale: fr })}
              </button>
            ))}
          </div>
        </div>

        {/* Sélection de l'heure */}
        {selectedDate && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Heure</label>
            <div className="grid grid-cols-3 gap-2">
              {getAvailableSlots().map((slot: string, index: number) => {
                const isAvailable = isSlotAvailable(selectedDate, slot);
                return (
                  <button
                    key={index}
                    onClick={() => isAvailable && setSelectedTime(slot)}
                    disabled={!isAvailable}
                    className={`p-2 text-sm rounded-lg transition-colors ${
                      selectedTime === slot
                        ? 'bg-accent text-white'
                        : isAvailable
                        ? 'bg-gray-100 hover:bg-gray-200'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {slot}
                    {!isAvailable && <span className="text-xs block">Occupé</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode de réservation */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <FaMapMarkerAlt />
            Mode de réservation
          </label>
          <div className="flex gap-4">
            {coiffeurModes.map((mode: string) => (
              <button
                key={mode}
                onClick={() => setBookingMode(mode as 'salon' | 'domicile')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  bookingMode === mode
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {mode === 'salon' ? 'En salon' : 'À domicile'}
              </button>
            ))}
          </div>
        </div>

        {/* Adresse pour domicile */}
        {bookingMode === 'domicile' && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Adresse</label>
            <input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Votre adresse complète"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
            />
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={!selectedService || !selectedDate || !selectedTime || loading}
            className="flex-1"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Création...
              </div>
            ) : (
              'Confirmer la réservation'
            )}
          </Button>
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
          )}
        </div>
      </Card>

      {/* Informations supplémentaires */}
      <Card className="mt-6 p-6">
        <h3 className="text-lg font-semibold mb-4">Informations importantes</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Politique d'annulation</h4>
            <p className="text-gray-600">Annulation gratuite jusqu'à 24h avant le rendez-vous.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Contact</h4>
            <p className="text-gray-600 flex items-center gap-2">
              <FaClock />
              {coiffeur.phone} • {coiffeur.email}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BookingForm; 