
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Card } from './ui/card';
import { Button } from './ui/Button';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaEuroSign, FaUser } from 'react-icons/fa';
import { bookingService } from '../services/api/bookings';
import { userService } from '../services/api/users';
import StripePaymentModal from './modals/StripePaymentModal';
import type { User } from '../types/models';

// Type étendu pour les adresses
interface UserWithAddresses extends User {
  addresses?: {
    home?: {
      street: string;
      streetNumber?: string;
      city: string;
      postalCode: string;
      floor?: string;
      apartment?: string;
      buildingCode?: string;
      additionalInfo?: string;
    };
    office?: {
      street: string;
      streetNumber?: string;
      city: string;
      postalCode: string;
      floor?: string;
      apartment?: string;
      buildingCode?: string;
      additionalInfo?: string;
    };
  };
}

interface BookingFormProps {
  coiffeur: User;
  selectedService?: {
    _id: string;
    name: string;
    price: number;
    duration: number;
  };
  onSuccess?: () => void;
  onClose?: () => void;
  onCancel?: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  coiffeur,
  selectedService,
  onSuccess,
  onClose,
  onCancel
}) => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser) as UserWithAddresses;
  
  // Debug: Vérifier les données reçues
  console.log('🔍 [BookingForm] Données reçues:', {
    coiffeur: coiffeur?.name,
    selectedService: selectedService,
    hasSelectedService: !!selectedService
  });
  const [userWithAddresses, setUserWithAddresses] = useState<UserWithAddresses | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingMode, setBookingMode] = useState<'salon' | 'domicile'>('salon');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [addressType, setAddressType] = useState<'home' | 'office' | 'other'>('home');
  const [clientAddress, setClientAddress] = useState<{
    street: string;
    streetNumber: string;
    city: string;
    postalCode: string;
    floor: string;
    apartment: string;
    buildingCode: string;
    additionalInfo: string;
  }>({
    street: '',
    streetNumber: '',
    city: '',
    postalCode: '',
    floor: '',
    apartment: '',
    buildingCode: '',
    additionalInfo: ''
  });

  // Charger les données complètes de l'utilisateur
  useEffect(() => {
    const loadUserData = async () => {
      if (user?._id) {
        try {
          console.log('🔄 [BookingForm] Chargement des données complètes de l\'utilisateur...');
          const userData = await userService.getUser(user._id);
          setUserWithAddresses(userData);
          console.log('✅ [BookingForm] Données utilisateur chargées:', userData);
        } catch (error) {
          console.error('❌ [BookingForm] Erreur lors du chargement des données utilisateur:', error);
          setUserWithAddresses(user);
        }
      }
    };

    loadUserData();
  }, [user?._id]);

  // Charger l'adresse selon le type sélectionné
  useEffect(() => {
    const currentUser = userWithAddresses || user;
    console.log('🔍 [BookingForm] User complet:', currentUser);
    console.log('🏠 [BookingForm] Type d\'adresse sélectionné:', addressType);
    
    if (currentUser?.addresses) {
      console.log('🏠 [BookingForm] Adresses utilisateur disponibles:', currentUser.addresses);
      
      // Charger l'adresse selon le type sélectionné
      let selectedAddress = null;
      if (addressType === 'home' && currentUser.addresses.home) {
        selectedAddress = currentUser.addresses.home;
        console.log('🏠 [BookingForm] Adresse domicile chargée:', selectedAddress);
      } else if (addressType === 'office' && currentUser.addresses.office) {
        selectedAddress = currentUser.addresses.office;
        console.log('🏢 [BookingForm] Adresse bureau chargée:', selectedAddress);
      }
      
      if (selectedAddress) {
        const newAddress = {
          street: selectedAddress.street || '',
          streetNumber: selectedAddress.streetNumber || '',
          city: selectedAddress.city || '',
          postalCode: selectedAddress.postalCode || '',
          floor: selectedAddress.floor || '',
          apartment: selectedAddress.apartment || '',
          buildingCode: selectedAddress.buildingCode || '',
          additionalInfo: selectedAddress.additionalInfo || ''
        };
        setClientAddress(newAddress);
        console.log('✅ [BookingForm] Adresse chargée dans clientAddress:', newAddress);
      } else {
        console.log('❌ [BookingForm] Aucune adresse trouvée pour le type:', addressType);
        // Réinitialiser les champs si pas d'adresse
        setClientAddress({
          street: '',
          streetNumber: '',
          city: '',
          postalCode: '',
          floor: '',
          apartment: '',
          buildingCode: '',
          additionalInfo: ''
        });
      }
    } else if (currentUser?.address && addressType === 'home') {
      // FALLBACK: Utiliser l'ancienne adresse si pas de addresses
      console.log('🏠 [BookingForm] Utilisation de l\'ancienne adresse:', currentUser.address);
      const newAddress = {
        street: currentUser.address.street || '',
        streetNumber: currentUser.address.streetNumber || '',
        city: currentUser.address.city || '',
        postalCode: currentUser.address.postalCode || '',
        floor: currentUser.address.floor || '',
        apartment: currentUser.address.apartment || '',
        buildingCode: currentUser.address.buildingCode || '',
        additionalInfo: currentUser.address.additionalInfo || ''
      };
      setClientAddress(newAddress);
      console.log('✅ [BookingForm] Ancienne adresse chargée dans clientAddress:', newAddress);
    } else {
      console.log('❌ [BookingForm] Pas d\'adresses trouvées dans user:', currentUser);
      console.log('🔍 [BookingForm] Structure user:', JSON.stringify(currentUser, null, 2));
      
      // Réinitialiser les champs si pas d'adresse
      setClientAddress({
        street: '',
        streetNumber: '',
        city: '',
        postalCode: '',
        floor: '',
        apartment: '',
        buildingCode: '',
        additionalInfo: ''
      });
      
      console.log('⚠️ [BookingForm] Champs d\'adresse réinitialisés');
    }
  }, [userWithAddresses, user, addressType]);
  const [coiffeurBookings, setCoiffeurBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modes de travail du coiffeur - CORRIGÉ
  const coiffeurModes = coiffeur.workingMode && coiffeur.workingMode.length > 0 
    ? coiffeur.workingMode 
    : ['salon', 'domicile']; // Valeur par défaut si pas de données

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
    if (bookingMode === 'domicile' && (!clientAddress.street || !clientAddress.city || !clientAddress.postalCode)) {
      setError('Veuillez remplir au minimum la rue, la ville et le code postal pour la prestation à domicile');
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
      const bookingData = {
        coiffeur: coiffeur._id,
        service: selectedService.name,
        date: `${selectedDate}T${selectedTime}`,
        duration: selectedService.duration,
        price: selectedService.price,
        mode: bookingMode,
        address: bookingMode === 'domicile' ? clientAddress : undefined,
        notes: `Réservation pour ${selectedService.name}`
      };

      // Créer la réservation
      const booking = await bookingService.createBooking(bookingData);
      
      // Sauvegarder l'adresse de réservation si c'est un domicile
      if (bookingMode === 'domicile' && user._id) {
        try {
          const addressData = {
            type: addressType === 'home' ? 'domicile' : addressType === 'office' ? 'bureau' : 'autre',
            ...clientAddress
          };
          
          console.log('📍 [BookingForm] Sauvegarde de l\'adresse de réservation:', addressData);
          
          await userService.addBookingAddress(user._id, addressData);
          console.log('✅ [BookingForm] Adresse de réservation sauvegardée');
        } catch (error) {
          console.error('❌ [BookingForm] Erreur lors de la sauvegarde de l\'adresse:', error);
          // Ne pas bloquer la réservation si l'adresse ne peut pas être sauvegardée
        }
      }
      
      // Vérifier si la réservation a été créée avec succès
      if (booking && (booking.success || booking.data || booking._id)) {
        const bookingData = booking.data || booking;
        const bookingId = bookingData._id || booking._id;
        
        console.log('✅ [BookingForm] Réservation créée avec succès:', bookingId);
        
        // Afficher le modal de paiement Stripe
        setCreatedBooking(bookingData);
        setShowPaymentModal(true);
      } else {
        // Si pas de paiement requis ou erreur, rediriger normalement
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/client/bookings');
        }
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      
      if (error.response?.status === 409) {
        setError('Ce créneau n\'est plus disponible. Veuillez choisir un autre horaire.');
      } else {
        setError(error.response?.data?.message || 'Erreur lors de la création de la réservation');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    console.log('✅ [BookingForm] Paiement réussi');
    setShowPaymentModal(false);
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/client/bookings');
    }
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    // Rediriger quand même vers les réservations (l'utilisateur peut payer plus tard)
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/client/bookings');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Modal de paiement Stripe */}
      {showPaymentModal && createdBooking && selectedService && (
        <StripePaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
          bookingId={createdBooking._id || createdBooking.data?._id}
          amount={selectedService.price}
          serviceName={selectedService.name}
        />
      )}
      {/* En-tête avec informations du coiffeur */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-fashion-gray-200 rounded-full flex items-center justify-center">
            <FaUser className="text-2xl text-fashion-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-fashion-black">Réserver avec {coiffeur.name}</h2>
            <p className="text-fashion-gray-600">{coiffeur.email}</p>
          </div>
        </div>
        
        {selectedService && (
          <div className="bg-fashion-gray-50 p-6 rounded-xl border border-fashion-gray-200">
            <h3 className="font-semibold text-fashion-black mb-2 flex items-center gap-2">
              <FaEuroSign className="text-fashion-black" />
              Service sélectionné
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-fashion-gray-600">Service</span>
                <p className="font-medium text-fashion-black">{selectedService.name || 'Non défini'}</p>
              </div>
              <div>
                <span className="text-fashion-gray-600">Prix</span>
                <p className="font-medium text-fashion-black">{selectedService.price || 0}€</p>
              </div>
              <div>
                <span className="text-fashion-gray-600">Durée</span>
                <p className="font-medium text-fashion-black">{selectedService.duration || 0} min</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sélection date et heure */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-fashion-black">
            <FaCalendarAlt className="text-fashion-black" />
            Date et heure
          </h3>
          
          {/* Sélection de la date */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-fashion-gray-700">Date</label>
            <div className="grid grid-cols-7 gap-2">
              {coiffeurAvailability.slice(0, 7).map((day: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day.date)}
                  className={`p-3 text-sm rounded-lg transition-all duration-200 font-medium ${
                    selectedDate === day.date
                      ? 'bg-fashion-black text-white shadow-lg'
                      : 'bg-fashion-gray-100 hover:bg-fashion-gray-200 text-fashion-gray-700'
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
              <label className="block text-sm font-medium mb-3 text-fashion-gray-700">Heure</label>
              <div className="grid grid-cols-3 gap-2">
                {getAvailableSlots().map((slot: string, index: number) => {
                  const isAvailable = isSlotAvailable(selectedDate, slot);
                  return (
                    <button
                      key={index}
                      onClick={() => isAvailable && setSelectedTime(slot)}
                      disabled={!isAvailable}
                      className={`p-3 text-sm rounded-lg transition-all duration-200 font-medium ${
                        selectedTime === slot
                          ? 'bg-fashion-black text-white shadow-lg'
                          : isAvailable
                          ? 'bg-fashion-gray-100 hover:bg-fashion-gray-200 text-fashion-gray-700'
                          : 'bg-fashion-gray-300 text-fashion-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {slot}
                      {!isAvailable && <span className="text-xs block mt-1">Occupé</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Mode de réservation et informations */}
        <div className="space-y-6">
          {/* Mode de réservation */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-fashion-black">
              <FaMapMarkerAlt className="text-fashion-black" />
              Mode de réservation
            </h3>
            <div className="flex gap-4">
              {coiffeurModes.map((mode: string) => (
                <button
                  key={mode}
                  onClick={() => setBookingMode(mode as 'salon' | 'domicile')}
                  className={`flex-1 px-6 py-4 rounded-lg transition-all duration-200 font-medium ${
                    bookingMode === mode
                      ? 'bg-fashion-black text-white shadow-lg'
                      : 'bg-fashion-gray-100 hover:bg-fashion-gray-200 text-fashion-gray-700'
                  }`}
                >
                  {mode === 'salon' ? 'En salon' : 'À domicile'}
                </button>
              ))}
            </div>
          </Card>

          {/* Adresse pour domicile */}
          {bookingMode === 'domicile' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-fashion-black">Adresse de prestation</h3>
              
              {/* Options d'adresse - UX-Pro Simple */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-fashion-gray-700">Type d'adresse</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddressType('home')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      addressType === 'home' 
                        ? 'bg-fashion-black text-white' 
                        : 'bg-fashion-gray-100 text-fashion-gray-700 hover:bg-fashion-gray-200'
                    }`}
                  >
                    🏠 Domicile
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressType('office')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      addressType === 'office' 
                        ? 'bg-fashion-black text-white' 
                        : 'bg-fashion-gray-100 text-fashion-gray-700 hover:bg-fashion-gray-200'
                    }`}
                  >
                    🏢 Bureau
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressType('other')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      addressType === 'other' 
                        ? 'bg-fashion-black text-white' 
                        : 'bg-fashion-gray-100 text-fashion-gray-700 hover:bg-fashion-gray-200'
                    }`}
                  >
                    📍 Autre lieu
                  </button>
                </div>
                
                {/* Géolocalisation pour "Autre lieu" */}
                {addressType === 'other' && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (navigator.geolocation) {
                          try {
                            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                              navigator.geolocation.getCurrentPosition(resolve, reject, {
                                enableHighAccuracy: true,
                                timeout: 10000,
                                maximumAge: 60000
                              });
                            });
                            
                            const { latitude, longitude } = position.coords;
                            const response = await fetch(
                              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`
                            );
                            const data = await response.json();
                            
                            if (data.address) {
                              const address = data.address;
                              setClientAddress({
                                ...clientAddress,
                                streetNumber: address.house_number || '',
                                street: address.road || '',
                                postalCode: address.postcode || '',
                                city: address.city || address.town || address.village || '',
                                additionalInfo: `Géolocalisé: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                              });
                            }
                          } catch (error) {
                            console.error('Erreur géolocalisation:', error);
                            alert('Impossible de récupérer votre position.');
                          }
                        } else {
                          alert('La géolocalisation n\'est pas supportée.');
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      📍 Utiliser ma position actuelle
                    </button>
                  </div>
                )}
              </div>
              {/* Affichage conditionnel selon si l'adresse est sauvegardée */}
              {(user?.addresses && (user.addresses.home || user.addresses.office) || (user?.address && addressType === 'home')) && addressType !== 'other' ? (
                // Affichage en lecture seule pour les adresses sauvegardées
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">
                      Adresse {addressType === 'home' ? 'domicile' : 'bureau'} sauvegardée
                    </h4>
                    <button
                      type="button"
                      onClick={() => setAddressType('other')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Utiliser une autre adresse
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Numéro de rue:</span>
                      <p className="font-medium">{clientAddress.streetNumber || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Rue:</span>
                      <p className="font-medium">{clientAddress.street || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Code postal:</span>
                      <p className="font-medium">{clientAddress.postalCode || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Ville:</span>
                      <p className="font-medium">{clientAddress.city || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Étage:</span>
                      <p className="font-medium">{clientAddress.floor || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Appartement:</span>
                      <p className="font-medium">{clientAddress.apartment || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Code d'entrée:</span>
                      <p className="font-medium">{clientAddress.buildingCode || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Informations complémentaires:</span>
                      <p className="font-medium">{clientAddress.additionalInfo || '-'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Formulaire d'édition pour nouvelle adresse
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-fashion-gray-700">Numéro de rue</label>
                    <input
                      type="text"
                      value={clientAddress.streetNumber}
                      onChange={(e) => setClientAddress({...clientAddress, streetNumber: e.target.value})}
                      placeholder="123"
                      className="w-full p-3 border border-fashion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-fashion-gray-700">Rue</label>
                    <input
                      type="text"
                      value={clientAddress.street}
                      onChange={(e) => setClientAddress({...clientAddress, street: e.target.value})}
                      placeholder="Rue de la Paix"
                      className="w-full p-3 border border-fashion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-fashion-gray-700">Code postal</label>
                    <input
                      type="text"
                      value={clientAddress.postalCode}
                      onChange={(e) => setClientAddress({...clientAddress, postalCode: e.target.value})}
                      placeholder="75001"
                      className="w-full p-3 border border-fashion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-fashion-gray-700">Ville</label>
                    <input
                      type="text"
                      value={clientAddress.city}
                      onChange={(e) => setClientAddress({...clientAddress, city: e.target.value})}
                      placeholder="Paris"
                      className="w-full p-3 border border-fashion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-fashion-gray-700">Étage</label>
                    <input
                      type="text"
                      value={clientAddress.floor}
                      onChange={(e) => setClientAddress({...clientAddress, floor: e.target.value})}
                      placeholder="2ème étage"
                      className="w-full p-3 border border-fashion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-fashion-gray-700">Appartement</label>
                    <input
                      type="text"
                      value={clientAddress.apartment}
                      onChange={(e) => setClientAddress({...clientAddress, apartment: e.target.value})}
                      placeholder="Apt 4B"
                      className="w-full p-3 border border-fashion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-fashion-gray-700">Code d'entrée</label>
              <input
                type="text"
                      value={clientAddress.buildingCode}
                      onChange={(e) => setClientAddress({...clientAddress, buildingCode: e.target.value})}
                      placeholder="1234"
                      className="w-full p-3 border border-fashion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-fashion-gray-700">Informations complémentaires</label>
                    <textarea
                      value={clientAddress.additionalInfo}
                      onChange={(e) => setClientAddress({...clientAddress, additionalInfo: e.target.value})}
                      placeholder="Instructions d'accès, interphone, etc."
                      rows={3}
                      className="w-full p-3 border border-fashion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Informations importantes */}
          <Card className="p-6 bg-fashion-gray-50">
            <h3 className="text-lg font-semibold mb-4 text-fashion-black">Informations importantes</h3>
            <div className="space-y-3 text-sm text-fashion-gray-700">
              <div className="flex items-start gap-2">
                <FaClock className="text-fashion-black mt-0.5" />
                <span>Politique d'annulation : Annulation gratuite jusqu'à 24h avant le rendez-vous.</span>
              </div>
              <div className="flex items-start gap-2">
                <FaUser className="text-fashion-black mt-0.5" />
                <span>Contact : {coiffeur.phone || coiffeur.email}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-4 mt-8">
        <Button
          onClick={handleSubmit}
          disabled={!selectedService || !selectedDate || !selectedTime || loading}
          className="flex-1 bg-fashion-black text-white hover:bg-fashion-gray-800 py-4 text-lg font-medium"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Création en cours...
            </div>
          ) : (
            'Confirmer la réservation'
          )}
        </Button>
        {(onCancel || onClose) && (
          <Button
            onClick={onCancel || onClose}
            variant="outline"
            className="flex-1 py-4 text-lg font-medium"
          >
            Annuler
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookingForm; 