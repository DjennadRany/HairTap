import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser, type User as AuthUser } from '../store/slices/authSlice';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { format, addDays, isBefore, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useClientBookings } from '../hooks/useClientBookings';
import Modal from '../components/ui/Modal';
import { v4 as uuidv4 } from 'uuid';
import { coiffeurService } from '../services/api/coiffeurs';
import { serviceService, Service } from '../services/api/services';
import type { User as CoiffeurUser } from '../types/models';

interface BookingFormData {
  _id: string;
  client: string;
  coiffeur: string;
  service: string;
  date: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  mode: 'salon' | 'domicile';
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
  paymentStatus: 'pending' | 'paid' | 'refunded';
  price: number;
  commission: number;
  createdAt: string;
  updatedAt: string;
}

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const { addBooking, error: bookingError, setError } = useClientBookings();
  const [loading, setLoading] = useState(true);
  const [coiffeur, setCoiffeur] = useState<CoiffeurUser | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [coiffeurBookings, setCoiffeurBookings] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingMode, setBookingMode] = useState<'salon' | 'domicile'>('salon');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const COMMISSION_RATE = 0.07;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      coiffeurService.getCoiffeur(id),
      serviceService.getServicesByCoiffeur(id),
      // bookings du coiffeur pour exclure les créneaux déjà pris
      import('../services/api/bookings').then(m => m.bookingService.getCoiffeurBookings())
    ]).then(([found, servicesList, allBookings]) => {
      setCoiffeur(found || null);
      setServices(servicesList);
      setCoiffeurBookings(allBookings.filter((b: any) => b.coiffeur === id));
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    // Si le coiffeur n'a pas de mode, on force 'salon'
    if (coiffeur && (!Array.isArray(coiffeur.mode) || coiffeur.mode.length === 0)) {
      setBookingMode('salon');
    } else if (coiffeur && Array.isArray(coiffeur.mode) && coiffeur.mode.length === 1) {
      setBookingMode(coiffeur.mode[0]);
    }
  }, [coiffeur]);

  const days = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    return format(date, 'yyyy-MM-dd');
  });

  const getAvailableSlots = () => {
    if (!selectedDate || !coiffeur || !selectedService) return [];
    
    const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const wh = coiffeur.workingHours?.[dayOfWeek];
    if (!wh || !wh.start || !wh.end) return [];

    const slots: string[] = [];
    let [h, m] = wh.start.split(':').map(Number);
    const [endH, endM] = wh.end.split(':').map(Number);
    const now = new Date();

    while (h < endH || (h === endH && m < endM)) {
      const slot = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const slotDateTime = new Date(`${selectedDate}T${slot}`);
      
      // Ne pas proposer les créneaux passés
      if (isBefore(slotDateTime, now)) {
        m += selectedService.duration;
        while (m >= 60) { h++; m -= 60; }
        continue;
      }

      const slotEnd = addMinutes(slotDateTime, selectedService.duration);
      const overlap = coiffeurBookings.some(b => {
        if (b.date.startsWith(selectedDate)) {
          const bookedStart = new Date(b.date);
          const bookedEnd = addMinutes(bookedStart, b.duration || 30);
          return (slotDateTime < bookedEnd && slotEnd > bookedStart);
        }
        return false;
      });

      if (!overlap) slots.push(slot);
      m += selectedService.duration;
      while (m >= 60) { h++; m -= 60; }
    }
    return slots;
  };

  const isValid = selectedService && bookingMode && selectedDate && selectedTime && 
    (bookingMode === 'salon' || (bookingMode === 'domicile' && clientAddress));

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isValid) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!coiffeur) {
      setError('Coiffeur introuvable, impossible de réserver.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const commission = Math.round(selectedService!.price * COMMISSION_RATE * 100) / 100;
      const booking: BookingFormData = {
        _id: uuidv4(),
        client: user.id,
        coiffeur: coiffeur._id,
        service: selectedService!._id,
        date: `${selectedDate}T${selectedTime}`,
        duration: selectedService!.duration,
        status: 'pending',
        mode: bookingMode,
        address: bookingMode === 'domicile' ? {
          street: clientAddress,
          city: '',
          postalCode: ''
        } : undefined,
        paymentStatus: 'pending',
        price: selectedService!.price,
        commission,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Simuler le processus de paiement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await addBooking(booking);
      setShowPaymentSuccess(true);
    } catch (error) {
      setError('Erreur lors de la réservation. Veuillez réessayer.');
    } finally {
      setIsProcessingPayment(false);
    }
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

  // Modes disponibles (toujours au moins 'salon')
  const availableModes = Array.isArray(coiffeur.mode) && coiffeur.mode.length > 0 ? coiffeur.mode : ['salon'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Réserver avec {coiffeur.name}</h1>
      <Card className="p-6 space-y-6">
        {/* Service */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Service</h2>
          <div className="space-y-2">
            {services.map((service) => (
              <div
                key={service._id}
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer ${
                  selectedService?._id === service._id
                    ? 'border-primary bg-primary/10'
                    : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedService(service)}
              >
                <div>
                  <h3 className="font-medium">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.description}</p>
                  <p className="text-xs text-gray-400">Durée : {service.duration} min</p>
                </div>
                <span className="text-lg font-semibold">{service.price}€</span>
              </div>
            ))}
          </div>
        </div>
        {/* Mode de prestation */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Mode de prestation</h2>
          <div className="flex gap-4 mb-2">
            {availableModes.map((mode: string) => (
              <button
                key={mode}
                className={`flex-1 p-4 rounded-lg border transition-colors ${
                  bookingMode === mode
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setBookingMode(mode as 'salon' | 'domicile')}
              >
                {mode === 'salon' ? 'En salon' : 'À domicile'}
              </button>
            ))}
          </div>
          {bookingMode === 'domicile' && (
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Votre adresse</label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Entrez votre adresse complète"
              />
            </div>
          )}
        </div>
        {/* Date */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Date</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {days.map((day) => (
              <button
                key={day}
                className={`px-4 py-2 rounded border ${selectedDate === day ? 'bg-primary text-white' : 'border-gray-200'}`}
                onClick={() => setSelectedDate(day)}
              >
                {format(new Date(day), 'EEEE d MMMM', { locale: fr })}
              </button>
            ))}
          </div>
        </div>
        {/* Créneau */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Créneau horaire</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {getAvailableSlots().map((slot) => (
              <button
                key={slot}
                className={`px-4 py-2 rounded border ${selectedTime === slot ? 'bg-primary text-white' : 'border-gray-200'}`}
                onClick={() => setSelectedTime(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
        {/* Récapitulatif */}
        <div className="bg-gray-50 rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Récapitulatif</h2>
          <div className="space-y-1">
            <p><span className="font-medium">Service :</span> {selectedService?.name} ({selectedService?.duration} min)</p>
            <p><span className="font-medium">Date :</span> {selectedDate && format(new Date(selectedDate), 'EEEE d MMMM', { locale: fr })}</p>
            <p><span className="font-medium">Heure :</span> {selectedTime}</p>
            <p><span className="font-medium">Mode :</span> {bookingMode === 'salon' ? 'En salon' : 'À domicile'}</p>
            {bookingMode === 'domicile' && clientAddress && (
              <p><span className="font-medium">Adresse :</span> {clientAddress}</p>
            )}
            <p className="text-lg font-bold mt-2">Total : {selectedService?.price}€</p>
            <p className="text-xs text-gray-500">Commission TapHair : {selectedService && Math.round(selectedService.price * COMMISSION_RATE * 100) / 100}€ (7%)</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          className="w-full mt-4" 
          disabled={!isValid || isProcessingPayment}
        >
          {isProcessingPayment ? 'Traitement du paiement...' : 'Confirmer et payer'}
        </Button>
      </Card>
      {/* Modale de succès paiement */}
      <Modal
        open={showPaymentSuccess}
        onClose={() => {
          setShowPaymentSuccess(false);
          setTimeout(() => {
            navigate('/client/bookings');
          }, 500);
        }}
        title="Paiement accepté"
        actions={
          <Button 
            onClick={() => {
              setShowPaymentSuccess(false);
              setTimeout(() => {
                navigate('/client/bookings');
              }, 500);
            }} 
            className="bg-primary text-white"
          >
            Voir mes réservations
          </Button>
        }
      >
        <div className="text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <p className="mb-2">Votre paiement a été accepté (simulation).</p>
          <p>Votre réservation est en attente de confirmation par le coiffeur.</p>
        </div>
      </Modal>
      {/* Modale de conflit de créneau */}
      <Modal
        open={showConflictModal}
        onClose={() => { setShowConflictModal(false); setError(''); }}
        title="Créneau déjà réservé"
        actions={
          <Button onClick={() => { setShowConflictModal(false); setError(''); }} className="bg-primary text-white">OK</Button>
        }
      >
        <p>Vous avez déjà une réservation à cette date et heure.</p>
        <p className="mt-2">Veuillez annuler l'autre réservation avant de continuer.</p>
      </Modal>
    </div>
  );
};

export default BookingPage; 