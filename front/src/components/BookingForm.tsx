
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Card } from './ui/card';
import { addDays } from 'date-fns';
import {
  FaMapMarkerAlt,
  FaUser,
  FaExclamationTriangle,
  FaRedo,
  FaClock
} from 'react-icons/fa';
import { bookingService, type CreateBookingData } from '../services/api/bookings';
import { userService } from '../services/api/users';
import { type CoiffeurSlotDTO, type CoiffeurSlotMode } from '../services/api/coiffeurs';
import availabilityService, { type AvailabilitySlot } from '../services/api/availability';
import StripePaymentModal from './modals/StripePaymentModal';
import type { User } from '../types/models';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useBookingValidation } from '../hooks/useBookingValidation';
import { setPaymentStatus as setGlobalPaymentStatus, type PaymentStatus } from '../store/slices/paymentSlice';
import BookingSlotList from './booking/BookingSlotList';
import BookingSummary from './booking/BookingSummary';
import BookingActionBar from './booking/BookingActionBar';
import { useNotification } from './ui/NotificationManager';
import { cn } from '../lib/utils';
import { formatTime, isValidTimeFormat } from '../utils/timeUtils';

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
  const user = useAppSelector(selectCurrentUser) as UserWithAddresses;
  const dispatch = useAppDispatch();
  const { showNotification } = useNotification();
  const errorRef = useRef<HTMLDivElement>(null);
  
  const [userWithAddresses, setUserWithAddresses] = useState<UserWithAddresses | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingMode, setBookingMode] = useState<'salon' | 'domicile'>('salon');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [paymentStatus, setLocalPaymentStatus] = useState<PaymentStatus>('initiated');
  const [showRecoveryScreen, setShowRecoveryScreen] = useState(false);
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedCancellationPolicy, setAcceptedCancellationPolicy] = useState(false);
  const [acceptedPaymentConsent, setAcceptedPaymentConsent] = useState(false);
  const [acceptedTermsAt, setAcceptedTermsAt] = useState<string | null>(null);
  const [acceptedCancellationPolicyAt, setAcceptedCancellationPolicyAt] = useState<string | null>(null);
  const [acceptedPaymentConsentAt, setAcceptedPaymentConsentAt] = useState<string | null>(null);

  // Charger les données complètes de l'utilisateur
  useEffect(() => {
    const loadUserData = async () => {
      if (user?._id) {
        try {
          const userData = await userService.getUser(user._id);
          setUserWithAddresses(userData);
        } catch (error) {
          setUserWithAddresses(user);
        }
      }
    };

    loadUserData();
  }, [user?._id]);

  // Charger l'adresse selon le type sélectionné
  useEffect(() => {
    const currentUser = userWithAddresses || user;
    
    if (currentUser?.addresses) {
      // Charger l'adresse selon le type sélectionné
      let selectedAddress = null;
      if (addressType === 'home' && currentUser.addresses.home) {
        selectedAddress = currentUser.addresses.home;
      } else if (addressType === 'office' && currentUser.addresses.office) {
        selectedAddress = currentUser.addresses.office;
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
      } else {
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
    } else {
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
  }, [userWithAddresses, user, addressType]);
  const [coiffeurBookings, setCoiffeurBookings] = useState<any[]>([]);
  const [clientBookings, setClientBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<CoiffeurSlotDTO[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<CoiffeurSlotDTO | null>(null);

  useEffect(() => {
    if (!createdBooking) {
      setShowRecoveryScreen(false);
      return;
    }

    if (showPaymentModal) {
      setShowRecoveryScreen(false);
      return;
    }

    setShowRecoveryScreen(paymentStatus === 'cancelled' || paymentStatus === 'pending');
  }, [createdBooking, paymentStatus, showPaymentModal]);

  const resolveCreatedBookingId = useCallback(() => {
    if (!createdBooking) {
      return undefined;
    }
    // createdBooking est déjà un Booking (pas un BookingResponse)
    return createdBooking._id;
  }, [createdBooking]);

  const handlePaymentStatusChange = useCallback(
    async (status: PaymentStatus) => {
      setLocalPaymentStatus(status);
      const bookingId = resolveCreatedBookingId();
      if (bookingId) {
        dispatch(setGlobalPaymentStatus({ bookingId, status }));
      }
    },
    [dispatch, resolveCreatedBookingId]
  );

  // Modes de travail du coiffeur - CORRIGÉ
  const coiffeurModes = coiffeur.workingMode && coiffeur.workingMode.length > 0
    ? coiffeur.workingMode
    : ['salon', 'domicile']; // Valeur par défaut si pas de données

  const slotsByDate = useMemo(() => {
    const grouped: Record<string, CoiffeurSlotDTO[]> = {};
    
    availableSlots.forEach((slot) => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });

    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });


    return grouped;
  }, [availableSlots, bookingMode]);

  const availableDates = useMemo(() => Object.keys(slotsByDate).sort(), [slotsByDate]);
  const slotsForSelectedDate = selectedDate ? slotsByDate[selectedDate] || [] : [];

  // Combiner les réservations du coiffeur ET du client pour vérifier les conflits
  const allExistingBookings = useMemo(() => {
    return [...coiffeurBookings, ...clientBookings];
  }, [coiffeurBookings, clientBookings]);

  const { validateBooking } = useBookingValidation({
    existingBookings: allExistingBookings,
    coiffeurModes,
  });

  const getSlotValidation = useCallback(
    (slot: CoiffeurSlotDTO) => {
      if (!selectedService) {
        return { isValid: false, errors: ['Sélectionnez un service'] };
      }
      
      // Utiliser conflict et availability du backend (source de vérité)
      if (slot.conflict === true) {
        return { isValid: false, errors: ['Ce créneau chevauche une réservation existante.'] };
      }
      if (slot.availability === 'occupied') {
        return { isValid: false, errors: ['Ce créneau n\'est plus disponible.'] };
      }
      // Vérifier seulement les autres règles (modes, durée, capacité)
      const errors: string[] = [];
      
      if (!slot.supportedModes.includes(bookingMode)) {
        errors.push('Ce créneau ne permet pas la réservation dans ce mode.');
      }
      
      if (slot.durationMinutes < selectedService.duration) {
        errors.push('La durée du service dépasse la durée disponible du créneau.');
      }
      
      if (slot.remainingCapacity !== undefined && slot.remainingCapacity <= 0) {
        errors.push('Ce créneau n\'est plus disponible.');
      }
      
      return { isValid: errors.length === 0, errors };
    },
    [bookingMode, selectedService]
  );

  useEffect(() => {
    const fetchCoiffeurBookings = async () => {
      if (!coiffeur._id) {
        return;
      }

      try {
        const bookings = await bookingService.getCoiffeurBookings(coiffeur._id);
        setCoiffeurBookings(bookings);
      } catch (error) {
      }
    };

    fetchCoiffeurBookings();
    
    // Récupérer aussi les réservations du client pour vérifier les conflits
    const fetchClientBookings = async () => {
      if (!user?._id) return;
      try {
        const bookings = await bookingService.getClientBookings();
        setClientBookings(bookings || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des réservations client:', error);
      }
    };
    
    fetchClientBookings();
    
    // Fallback polling si SSE indisponible (5 minutes)
    const interval = setInterval(() => {
      fetchCoiffeurBookings();
      fetchClientBookings();
    }, 300000);
    return () => clearInterval(interval);
  }, [coiffeur._id, user?._id]);

  const fetchSlots = useCallback(async () => {
    if (!coiffeur._id) {
      return;
    }

    setSlotsLoading(true);
    setSlotsError(null);

    try {
      const start = new Date();
      const end = addDays(new Date(), 13);
      
      const response = await availabilityService.fetchAvailability(coiffeur._id, {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        mode: bookingMode,
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Erreur lors de la récupération des disponibilités');
      }

      const now = new Date();
      const convertedSlots: CoiffeurSlotDTO[] = response.data
        .filter((slot: AvailabilitySlot) => {
          if (!slot.startTime || !slot.date) return false;
          
          const formattedTime = formatTime(slot.startTime);
          if (!isValidTimeFormat(formattedTime) || formattedTime === '00:00') {
            return false;
          }
          
          const [hours, minutes] = formattedTime.split(':').map(Number);
          if (isNaN(hours) || isNaN(minutes)) return false;
          
          const slotDate = new Date(slot.date);
          slotDate.setHours(hours, minutes, 0, 0);
          return slotDate.getTime() > now.getTime();
        })
        .map((slot: AvailabilitySlot) => {
          const startTime = formatTime(slot.startTime);
          const endTime = formatTime(slot.endTime);
          
          if (startTime === '00:00' || endTime === '00:00') {
            return null;
          }
          
          const [startHours, startMinutes] = startTime.split(':').map(Number);
          const [endHours, endMinutes] = endTime.split(':').map(Number);
          
          const startTotalMinutes = (startHours * 60) + startMinutes;
          const endTotalMinutes = (endHours * 60) + endMinutes;
          const calculatedDuration = endTotalMinutes - startTotalMinutes;
          const durationMinutes = calculatedDuration > 0 ? calculatedDuration : 60;
          
          const totalBookings = slot.overlappingBookings?.length || 0;
          const maxCapacity = Math.max(slot.remainingCapacity + totalBookings, 1);
          
          const supportedModes: CoiffeurSlotMode[] = slot.supportedModes && slot.supportedModes.length > 0
            ? (slot.supportedModes as CoiffeurSlotMode[])
            : (bookingMode ? [bookingMode] : ['salon', 'domicile']);
          
          return {
            id: slot.id,
            slotId: slot.slotId,
            date: slot.date,
            startTime,
            endTime,
            durationMinutes,
            supportedModes,
            maxCapacity,
            remainingCapacity: slot.remainingCapacity,
            isRecurring: false,
            status: slot.status || 'available',
            dayOfWeek: new Date(slot.date).getDay(),
            serviceTypes: [],
            conflict: slot.conflict,
            availability: slot.availability,
          };
        })
        .filter((slot) => slot !== null) as CoiffeurSlotDTO[];
      
      setAvailableSlots(convertedSlots);
    } catch (err) {
      setSlotsError('Impossible de récupérer les créneaux disponibles pour le moment.');
    } finally {
      setSlotsLoading(false);
    }
  }, [coiffeur._id, bookingMode]);

  // Recharger les créneaux quand le mode change
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // SSE pour synchronisation temps réel
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      const interval = setInterval(fetchSlots, 300000);
      return () => clearInterval(interval);
    }

    let bookingEventServiceInstance: any = null;

    const handleEvent = (event: any) => {
      if (event.coiffeurId === coiffeur._id) {
        fetchSlots();
      }
    };

    import('../services/api/bookingEvents').then(({ bookingEventService }) => {
      bookingEventServiceInstance = bookingEventService;
      bookingEventService.connect(token, handleEvent);
    });

    return () => {
      if (bookingEventServiceInstance) {
        bookingEventServiceInstance.removeHandler(handleEvent);
      }
    };
  }, [fetchSlots, coiffeur._id]);

  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  useEffect(() => {
    if (slotsError) {
      showNotification({
        type: 'error',
        title: 'Créneaux indisponibles',
        message: slotsError,
      });
    }
  }, [slotsError, showNotification]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleDateSelect = (dateValue: string) => {
    setSelectedDate(dateValue);
    setSelectedTime('');
    setSelectedSlot(null);
  };

  const handleTimeSelect = (slot: CoiffeurSlotDTO) => {
    setSelectedTime(slot.startTime);
    setSelectedSlot(slot);
  };

  useEffect(() => {
    if (selectedSlot && !slotsForSelectedDate.some((slot) => slot.id === selectedSlot.id)) {
      setSelectedSlot(null);
      setSelectedTime('');
    }
  }, [selectedSlot, slotsForSelectedDate]);

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

    const validationResult = validateBooking({
      bookingMode,
      serviceDuration: selectedService.duration,
      selectedDate,
      selectedTime,
      slot: selectedSlot ?? undefined,
    });

    if (!validationResult.isValid) {
      setError(validationResult.errors[0]);
      return;
    }

    if (!acceptedTerms || !acceptedCancellationPolicy || !acceptedPaymentConsent) {
      setError('Vous devez accepter les CGV, la politique d’annulation et le consentement de paiement pour continuer.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nowIso = new Date().toISOString();
      const bookingPayload: CreateBookingData = {
        serviceId: selectedService._id,
        coiffeurId: coiffeur._id,
        slotId: selectedSlot?.slotId,
        date: selectedDate,
        time: selectedTime,
        duration: selectedService.duration,
        price: selectedService.price,
        mode: bookingMode,
        address: bookingMode === 'domicile' ? clientAddress : undefined,
        notes: `Réservation pour ${selectedService.name}`,
        acceptedTermsAt: acceptedTermsAt ?? nowIso,
        acceptedCancellationPolicyAt: acceptedCancellationPolicyAt ?? nowIso,
        acceptedPaymentConsentAt: acceptedPaymentConsentAt ?? nowIso
      };

      // Créer la réservation
      const booking = await bookingService.createBooking(bookingPayload);

      // Sauvegarder l'adresse de réservation si c'est un domicile
      if (bookingMode === 'domicile' && user._id) {
        try {
          const addressData = {
            type: addressType === 'home' ? 'domicile' : addressType === 'office' ? 'bureau' : 'autre',
            ...clientAddress
          };
          
          await userService.addBookingAddress(user._id, addressData);
        } catch (error) {
          // Ne pas bloquer la réservation si l'adresse ne peut pas être sauvegardée
        }
      }
      
      // Vérifier explicitement le succès de l'API
      if (!booking || booking.success !== true || !booking.data) {
        const errorMsg = booking?.message || 'Erreur lors de la création de la réservation';
        setError(errorMsg);
        showNotification({
          type: 'error',
          title: 'Erreur de réservation',
          message: errorMsg,
        });
        if (onCancel) {
          onCancel();
        }
        return;
      }

      const bookingData = booking.data;
      const bookingId = bookingData._id;

      if (!bookingId) {
        throw new Error('ID de réservation manquant dans la réponse');
      }

      showNotification({
        type: 'success',
        title: 'Réservation créée',
        message: 'En attente de confirmation du coiffeur.',
      });

      // Afficher le modal de paiement Stripe
      setCreatedBooking(bookingData);
      setLocalPaymentStatus('initiated');
      dispatch(setGlobalPaymentStatus({ bookingId, status: 'initiated' }));
      setShowRecoveryScreen(false);
      setShowPaymentModal(true);
    } catch (error: any) {

      if (error.response?.status === 409) {
        setError('Ce créneau n\'est plus disponible. Veuillez choisir un autre horaire.');
      } else {
        setError(error.response?.data?.message || 'Erreur lors de la création de la réservation');
      }
      showNotification({
        type: 'error',
        title: 'Erreur de réservation',
        message: error.response?.data?.message || 'Impossible de créer la réservation. Veuillez réessayer.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    await handlePaymentStatusChange('confirmed');
    setShowPaymentModal(false);
    setShowRecoveryScreen(false);
    showNotification({
      type: 'success',
      title: 'Paiement confirmé',
      message: 'Votre réservation est validée.',
    });
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/client/bookings');
    }
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    if (paymentStatus === 'confirmed') {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/client/bookings');
      }
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleResumePayment = async () => {
    if (!createdBooking) {
      return;
    }
    await handlePaymentStatusChange('initiated');
    setShowRecoveryScreen(false);
    setShowPaymentModal(true);
    showNotification({
      type: 'info',
      title: 'Paiement relancé',
      message: 'Vous pouvez finaliser le règlement de votre réservation.',
    });
  };

  const handleDeferPayment = () => {
    showNotification({
      type: 'warning',
      title: 'Paiement différé',
      message: 'Vous pourrez reprendre le paiement depuis vos réservations client.',
    });
    if (onCancel) {
      onCancel();
    } else {
      navigate('/client/bookings');
    }
  };



  const isPaymentPending = paymentStatus === 'pending';
  const bookingIdentifier = resolveCreatedBookingId();
  const secondaryAction = onCancel ?? onClose;
  const isPrimaryDisabled = !selectedService || !selectedDate || !selectedTime;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {showPaymentModal && createdBooking && selectedService && bookingIdentifier && (
        <StripePaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
          onStatusChange={handlePaymentStatusChange}
          paymentStatus={paymentStatus}
          bookingId={bookingIdentifier}
          amount={selectedService.price}
          serviceName={selectedService.name}
        />
      )}

      {showRecoveryScreen && createdBooking && !showPaymentModal && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-3">
            <FaExclamationTriangle className="text-xl text-amber-500" aria-hidden="true" />
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-amber-900">
                {isPaymentPending ? 'Paiement en cours de validation' : 'Paiement à finaliser'}
              </h3>
              <p className="text-sm text-amber-800">
                {isPaymentPending
                  ? 'Nous avons bien enregistré votre réservation. Le paiement est toujours en attente de validation par votre banque.'
                  : 'Nous avons bien enregistré votre réservation mais le paiement n’a pas été finalisé.'}
              </p>
              <p className="text-xs text-amber-700">
                Vous pouvez reprendre le paiement immédiatement ou depuis l’historique de vos réservations.
              </p>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleResumePayment}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-900"
                >
                  <FaRedo aria-hidden="true" /> Reprendre le paiement
                </button>
                <button
                  type="button"
                  onClick={handleDeferPayment}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                >
                  Continuer plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col gap-4 rounded-2xl border border-fashion-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-fashion-gray-200">
            <FaUser className="text-2xl text-fashion-gray-600" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-fashion-black">Réserver avec {coiffeur.name}</h2>
            <p className="text-sm text-fashion-gray-600">{coiffeur.email}</p>
          </div>
        </div>
        {selectedService && (
          <p className="text-sm text-fashion-gray-600">
            Vous avez sélectionné <span className="font-medium text-fashion-black">{selectedService.name}</span>.
          </p>
        )}
      </header>

      {error && (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="space-y-6">
          <BookingSlotList
            dates={availableDates}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            slots={slotsForSelectedDate}
            onSlotSelect={handleTimeSelect}
            selectedSlot={selectedSlot}
            getSlotState={getSlotValidation}
            loading={slotsLoading}
            error={slotsError}
            onRetry={fetchSlots}
            disabled={loading}
          />

          <Card className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-fashion-black" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-fashion-black">Mode de réservation</h3>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {coiffeurModes.map((mode: string) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setBookingMode(mode as 'salon' | 'domicile')}
                  aria-pressed={bookingMode === mode}
                  className={cn(
                    'flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-fashion-black focus-visible:ring-offset-2',
                    bookingMode === mode
                      ? 'border-fashion-black bg-fashion-black text-white shadow-lg'
                      : 'border-fashion-gray-200 bg-fashion-gray-50 text-fashion-gray-700 hover:border-fashion-black/40 hover:bg-white'
                  )}
                >
                  {mode === 'salon' ? 'En salon' : 'À domicile'}
                </button>
              ))}
            </div>
          </Card>

          {bookingMode === 'domicile' && (
            <Card className="space-y-4 p-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-fashion-black">Adresse de prestation</h3>
                <p className="text-sm text-fashion-gray-600">
                  Indiquez le lieu exact pour votre rendez-vous à domicile.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-medium text-fashion-gray-700">Type d'adresse</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {(
                    [
                      { type: 'home', label: '🏠 Domicile' },
                      { type: 'office', label: '🏢 Bureau' },
                      { type: 'other', label: '📍 Autre lieu' },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => setAddressType(option.type)}
                      aria-pressed={addressType === option.type}
                      className={cn(
                        'rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fashion-black focus-visible:ring-offset-2',
                        addressType === option.type
                          ? 'border-fashion-black bg-fashion-black text-white'
                          : 'border-fashion-gray-200 bg-fashion-gray-50 text-fashion-gray-700 hover:border-fashion-black/40 hover:bg-white'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {addressType === 'other' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (navigator.geolocation) {
                        try {
                          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                              enableHighAccuracy: true,
                              timeout: 10000,
                              maximumAge: 60000,
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
                              additionalInfo: `Géolocalisé: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                            });
                          }
                        } catch (geoError) {
                          alert('Impossible de récupérer votre position.');
                        }
                      } else {
                        alert('La géolocalisation n\'est pas supportée.');
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                    aria-label="Utiliser ma position actuelle"
                  >
                    📍 Utiliser ma position actuelle
                  </button>
                )}
              </div>

              {(user?.addresses && (user.addresses.home || user.addresses.office) || (user?.address && addressType === 'home')) &&
              addressType !== 'other' ? (
                <div className="rounded-lg border border-fashion-gray-200 bg-fashion-gray-50 p-4" aria-live="polite">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="font-medium text-fashion-black">
                      Adresse {addressType === 'home' ? 'domicile' : 'bureau'} sauvegardée
                    </h4>
                    <button
                      type="button"
                      onClick={() => setAddressType('other')}
                      className="text-sm font-semibold text-accent hover:underline"
                    >
                      Utiliser une autre adresse
                    </button>
                  </div>
                  <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                    <div>
                      <dt className="text-fashion-gray-600">Numéro de rue</dt>
                      <dd className="font-medium text-fashion-black">{clientAddress.streetNumber || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-fashion-gray-600">Rue</dt>
                      <dd className="font-medium text-fashion-black">{clientAddress.street || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-fashion-gray-600">Code postal</dt>
                      <dd className="font-medium text-fashion-black">{clientAddress.postalCode || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-fashion-gray-600">Ville</dt>
                      <dd className="font-medium text-fashion-black">{clientAddress.city || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-fashion-gray-600">Étage</dt>
                      <dd className="font-medium text-fashion-black">{clientAddress.floor || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-fashion-gray-600">Appartement</dt>
                      <dd className="font-medium text-fashion-black">{clientAddress.apartment || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-fashion-gray-600">Code d'entrée</dt>
                      <dd className="font-medium text-fashion-black">{clientAddress.buildingCode || '-'}</dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-fashion-gray-600">Informations complémentaires</dt>
                      <dd className="font-medium text-fashion-black">{clientAddress.additionalInfo || '-'}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-fashion-gray-700" htmlFor={`${coiffeur._id}-street-number`}>
                      Numéro de rue
                    </label>
                    <input
                      id={`${coiffeur._id}-street-number`}
                      type="text"
                      value={clientAddress.streetNumber}
                      onChange={(e) => setClientAddress({ ...clientAddress, streetNumber: e.target.value })}
                      placeholder="123"
                      className="w-full rounded-lg border border-fashion-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-fashion-gray-700" htmlFor={`${coiffeur._id}-street`}>
                      Rue
                    </label>
                    <input
                      id={`${coiffeur._id}-street`}
                      type="text"
                      value={clientAddress.street}
                      onChange={(e) => setClientAddress({ ...clientAddress, street: e.target.value })}
                      placeholder="Rue de la Paix"
                      className="w-full rounded-lg border border-fashion-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-fashion-gray-700" htmlFor={`${coiffeur._id}-postal`}>
                      Code postal
                    </label>
                    <input
                      id={`${coiffeur._id}-postal`}
                      type="text"
                      value={clientAddress.postalCode}
                      onChange={(e) => setClientAddress({ ...clientAddress, postalCode: e.target.value })}
                      placeholder="75001"
                      className="w-full rounded-lg border border-fashion-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-fashion-gray-700" htmlFor={`${coiffeur._id}-city`}>
                      Ville
                    </label>
                    <input
                      id={`${coiffeur._id}-city`}
                      type="text"
                      value={clientAddress.city}
                      onChange={(e) => setClientAddress({ ...clientAddress, city: e.target.value })}
                      placeholder="Paris"
                      className="w-full rounded-lg border border-fashion-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-fashion-gray-700" htmlFor={`${coiffeur._id}-floor`}>
                      Étage
                    </label>
                    <input
                      id={`${coiffeur._id}-floor`}
                      type="text"
                      value={clientAddress.floor}
                      onChange={(e) => setClientAddress({ ...clientAddress, floor: e.target.value })}
                      placeholder="2ème étage"
                      className="w-full rounded-lg border border-fashion-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-fashion-gray-700" htmlFor={`${coiffeur._id}-apartment`}>
                      Appartement
                    </label>
                    <input
                      id={`${coiffeur._id}-apartment`}
                      type="text"
                      value={clientAddress.apartment}
                      onChange={(e) => setClientAddress({ ...clientAddress, apartment: e.target.value })}
                      placeholder="Apt 4B"
                      className="w-full rounded-lg border border-fashion-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-fashion-gray-700" htmlFor={`${coiffeur._id}-code`}>
                      Code d'entrée
                    </label>
                    <input
                      id={`${coiffeur._id}-code`}
                      type="text"
                      value={clientAddress.buildingCode}
                      onChange={(e) => setClientAddress({ ...clientAddress, buildingCode: e.target.value })}
                      placeholder="1234"
                      className="w-full rounded-lg border border-fashion-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-fashion-gray-700" htmlFor={`${coiffeur._id}-additional`}>
                      Informations complémentaires
                    </label>
                    <textarea
                      id={`${coiffeur._id}-additional`}
                      value={clientAddress.additionalInfo}
                      onChange={(e) => setClientAddress({ ...clientAddress, additionalInfo: e.target.value })}
                      placeholder="Instructions d'accès, interphone, etc."
                      rows={3}
                      className="w-full rounded-lg border border-fashion-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-black focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card className="space-y-3 bg-fashion-gray-50 p-6">
            <h3 className="text-lg font-semibold text-fashion-black">Informations importantes</h3>
            <div className="space-y-2 text-sm text-fashion-gray-700">
              <div className="flex items-start gap-2">
                <FaClock className="mt-1 text-fashion-black" aria-hidden="true" />
                <span>Annulation gratuite jusqu'à 24h avant le rendez-vous.</span>
              </div>
              <div className="flex items-start gap-2">
                <FaUser className="mt-1 text-fashion-black" aria-hidden="true" />
                <span>Contact direct : {coiffeur.phone || coiffeur.email}</span>
              </div>
            </div>
          </Card>

          {/* Consentements obligatoires */}
          <Card className="p-6 border border-fashion-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-fashion-black">Consentements nécessaires</h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setAcceptedTerms(checked);
                    setAcceptedTermsAt(checked ? new Date().toISOString() : null);
                    if (checked && acceptedCancellationPolicy && acceptedPaymentConsent) {
                      setError(null);
                    }
                  }}
                  className="mt-1 h-5 w-5 rounded border-fashion-gray-300 text-fashion-black focus:ring-fashion-black"
                  required
                />
                <span className="text-sm text-fashion-gray-700">
                  J'ai lu et j'accepte les <a href="/conditions-generales" target="_blank" rel="noopener noreferrer" className="text-fashion-black underline">Conditions Générales de Vente</a>.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedCancellationPolicy}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setAcceptedCancellationPolicy(checked);
                    setAcceptedCancellationPolicyAt(checked ? new Date().toISOString() : null);
                    if (checked && acceptedTerms && acceptedPaymentConsent) {
                      setError(null);
                    }
                  }}
                  className="mt-1 h-5 w-5 rounded border-fashion-gray-300 text-fashion-black focus:ring-fashion-black"
                  required
                />
                <span className="text-sm text-fashion-gray-700">
                  Je reconnais avoir été informé(e) de la <a href="/politique-annulation" target="_blank" rel="noopener noreferrer" className="text-fashion-black underline">politique d'annulation</a> et l'accepte.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedPaymentConsent}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setAcceptedPaymentConsent(checked);
                    setAcceptedPaymentConsentAt(checked ? new Date().toISOString() : null);
                    if (checked && acceptedTerms && acceptedCancellationPolicy) {
                      setError(null);
                    }
                  }}
                  className="mt-1 h-5 w-5 rounded border-fashion-gray-300 text-fashion-black focus:ring-fashion-black"
                  required
                />
                <span className="text-sm text-fashion-gray-700">
                  J'autorise le prélèvement du montant indiqué pour cette réservation si le professionnel confirme la prestation.
                </span>
              </label>
            </div>
            <p className="text-xs text-fashion-gray-500 mt-4">
              Ces consentements sont indispensables pour garantir la traçabilité et la conformité de votre réservation.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <BookingSummary
            coiffeur={coiffeur}
            service={selectedService}
            bookingMode={bookingMode}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
          />
        </div>
      </div>

      <BookingActionBar
        primaryLabel="Confirmer ma réservation"
        onPrimaryAction={handleSubmit}
        primaryDisabled={isPrimaryDisabled}
        primaryLoading={loading}
        secondaryLabel={secondaryAction ? 'Annuler' : undefined}
        onSecondaryAction={secondaryAction}
      />
    </div>
  );
};

export default BookingForm;