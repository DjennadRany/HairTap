/**
 * Custom hook pour gérer le formulaire de réservation
 * Factorise la logique de réservation pour alléger BookingForm.tsx
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { bookingService } from '../services/api/bookings';
import { userService } from '../services/api/users';
import { 
  parseBookingDateTime, 
  isSlotAvailable,
  generateNext7Days,
  generateTimeSlots,
  isValidDate,
  isFutureDate
} from '../utils/dateUtils';
import type { User } from '../types/models';

interface BookingFormData {
  serviceId: string;
  coiffeurId: string;
  date: string;
  time: string;
  mode: 'salon' | 'domicile';
  price: number;
  duration: number;
  notes?: string;
  address?: {
    street: string;
    streetNumber?: string;
    city: string;
    postalCode: string;
    country?: string;
  };
}

interface UseBookingFormOptions {
  coiffeur: User;
  selectedService?: {
    _id: string;
    name: string;
    price: number;
    duration: number;
  };
  onSuccess?: () => void;
  onClose?: () => void;
}

export const useBookingForm = (options: UseBookingFormOptions) => {
  const { coiffeur, selectedService, onSuccess, onClose } = options;
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  
  // États du formulaire
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingMode, setBookingMode] = useState<'salon' | 'domicile'>('salon');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États des modals
  const [showCGVModal, setShowCGVModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [cgvAccepted, setCgvAccepted] = useState(false);
  
  // États de l'adresse
  const [addressType, setAddressType] = useState<'home' | 'office' | 'other'>('home');
  const [clientAddress, setClientAddress] = useState({
    street: '',
    streetNumber: '',
    city: '',
    postalCode: '',
    floor: '',
    apartment: '',
    buildingCode: '',
    additionalInfo: ''
  });
  
  // États des réservations existantes
  const [coiffeurBookings, setCoiffeurBookings] = useState<any[]>([]);
  
  // Générer les disponibilités pour les 7 prochains jours
  const coiffeurAvailability = generateNext7Days().map(date => ({
    date,
    slots: generateTimeSlots(9, 17, 60) // 9h-17h, créneaux de 60 min
  }));
  
  // Modes de travail du coiffeur
  const coiffeurModes = coiffeur.workingMode && coiffeur.workingMode.length > 0 
    ? coiffeur.workingMode 
    : ['salon', 'domicile'];
  
  // Récupérer les créneaux disponibles pour une date
  const getAvailableSlots = useCallback(() => {
    if (!selectedDate) return [];
    const dayAvailability = coiffeurAvailability.find(a => a.date === selectedDate);
    return dayAvailability?.slots || [];
  }, [selectedDate, coiffeurAvailability]);
  
  // Vérifier si un créneau est disponible
  const isSlotAvailableForDate = useCallback((date: string, time: string): boolean => {
    if (!selectedService) return false;
    
    return isSlotAvailable(
      date,
      time,
      selectedService.duration,
      coiffeurBookings
    );
  }, [selectedService, coiffeurBookings]);
  
  // Valider le formulaire
  const validateForm = useCallback((): string | null => {
    if (!user) {
      return 'Vous devez être connecté pour réserver';
    }
    
    if (!coiffeur._id) {
      return 'Erreur : ID du coiffeur manquant';
    }
    
    if (!selectedService || !selectedDate || !selectedTime) {
      return 'Veuillez remplir tous les champs obligatoires';
    }
    
    // Valider la date
    try {
      const bookingDate = parseBookingDateTime(selectedDate, selectedTime);
      if (!isValidDate(bookingDate)) {
        return 'Date invalide';
      }
      if (!isFutureDate(bookingDate)) {
        return 'La date de réservation doit être dans le futur';
      }
    } catch (error: any) {
      return error.message || 'Erreur lors de la validation de la date';
    }
    
    // Valider l'adresse si mode domicile
    if (bookingMode === 'domicile') {
      if (!clientAddress.street || !clientAddress.city || !clientAddress.postalCode) {
        return 'Veuillez remplir au minimum la rue, la ville et le code postal pour la prestation à domicile';
      }
    }
    
    // Vérifier la disponibilité
    if (!isSlotAvailableForDate(selectedDate, selectedTime)) {
      return 'Ce créneau n\'est plus disponible. Veuillez choisir un autre horaire.';
    }
    
    return null;
  }, [user, coiffeur, selectedService, selectedDate, selectedTime, bookingMode, clientAddress, isSlotAvailableForDate]);
  
  // Soumettre le formulaire
  const handleSubmit = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const bookingData: BookingFormData = {
        serviceId: selectedService!._id,
        coiffeurId: coiffeur._id,
        date: selectedDate,
        time: selectedTime,
        mode: bookingMode,
        price: selectedService!.price,
        duration: selectedService!.duration,
        notes: `Réservation pour ${selectedService!.name}`,
        address: bookingMode === 'domicile' ? {
          street: clientAddress.street,
          streetNumber: clientAddress.streetNumber,
          city: clientAddress.city,
          postalCode: clientAddress.postalCode,
          country: 'France'
        } : undefined
      };
      
      const booking = await bookingService.createBooking(bookingData);
      
      if (booking && booking.success && booking.data) {
        const createdBookingData = booking.data;
        setCreatedBooking(createdBookingData);
        
        // Sauvegarder l'adresse si domicile
        if (bookingMode === 'domicile' && user._id) {
          try {
            const addressData = {
              type: addressType === 'home' ? 'domicile' : addressType === 'office' ? 'bureau' : 'autre',
              ...clientAddress
            };
            await userService.addBookingAddress(user._id, addressData);
          } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'adresse:', error);
            // Ne pas bloquer la réservation si l'adresse ne peut pas être sauvegardée
          }
        }
        
        // Afficher le modal CGV
        try {
          setShowCGVModal(true);
        } catch (error) {
          console.warn('Erreur lors de l\'affichage du modal CGV, affichage direct de Stripe:', error);
          setCgvAccepted(true);
          setShowPaymentModal(true);
        }
      } else {
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
  }, [validateForm, selectedService, coiffeur, selectedDate, selectedTime, bookingMode, clientAddress, addressType, user, onSuccess, navigate]);
  
  // Gérer l'acceptation des CGV
  const handleCGVAccept = useCallback((version: string) => {
    console.log('✅ CGV acceptées, version:', version);
    setCgvAccepted(true);
    setShowCGVModal(false);
    setShowPaymentModal(true);
  }, []);
  
  // Gérer la fermeture du modal CGV
  const handleCGVClose = useCallback(() => {
    setShowCGVModal(false);
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/client/bookings');
    }
  }, [onSuccess, navigate]);
  
  // Gérer le succès du paiement
  const handlePaymentSuccess = useCallback(() => {
    console.log('✅ Paiement réussi');
    setShowPaymentModal(false);
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/client/bookings');
    }
  }, [onSuccess, navigate]);
  
  // Gérer la fermeture du modal de paiement
  const handlePaymentClose = useCallback(() => {
    setShowPaymentModal(false);
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/client/bookings');
    }
  }, [onSuccess, navigate]);
  
  return {
    // États
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    bookingMode,
    setBookingMode,
    loading,
    error,
    showCGVModal,
    showPaymentModal,
    createdBooking,
    cgvAccepted,
    addressType,
    setAddressType,
    clientAddress,
    setClientAddress,
    coiffeurBookings,
    setCoiffeurBookings,
    
    // Données calculées
    coiffeurAvailability,
    coiffeurModes,
    
    // Fonctions
    getAvailableSlots,
    isSlotAvailableForDate,
    validateForm,
    handleSubmit,
    handleCGVAccept,
    handleCGVClose,
    handlePaymentSuccess,
    handlePaymentClose,
    
    // Utilitaires
    setError
  };
};

