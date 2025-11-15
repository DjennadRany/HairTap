
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Card } from '../../ui/card';
import { Button } from '../../ui/Button';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaEuroSign, FaUser } from 'react-icons/fa';
import { bookingService } from '../../../services/api/bookings';
import { userService } from '../../../services/api/users';
import { workingSlotsService } from '../../../services/api/workingSlots';
import { coiffeurService } from '../../../services/api/coiffeurs';
import StripePaymentModal from '../../modals/StripePaymentModal';
import cgvService, { CGV } from '../../../services/api/cgv';
import { FaChevronDown, FaChevronUp, FaSpinner } from 'react-icons/fa';
import { bookingSchema, type BookingFormData } from '../../../utils/bookingValidation';
import { generateTimeSlotsFromOpeningHours, generateTimeSlotsFromWorkingSlots, generateTimeSlots } from '../../../utils/dateUtils';
import type { User } from '../../../types/models';

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

  // ✅ Utiliser react-hook-form avec yup pour la validation
  const {
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<BookingFormData>({
    resolver: yupResolver(bookingSchema),
    defaultValues: {
      serviceId: selectedService?._id || '',
      coiffeurId: coiffeur._id || '',
      date: '',
      time: '',
      mode: 'salon',
      price: selectedService?.price || 0,
      duration: selectedService?.duration || 0,
      notes: '',
      address: undefined
    }
  });

  // ✅ Mettre à jour les valeurs par défaut quand selectedService change
  useEffect(() => {
    if (selectedService) {
      setValue('serviceId', selectedService._id);
      setValue('price', selectedService.price);
      setValue('duration', selectedService.duration);
    }
    if (coiffeur._id) {
      setValue('coiffeurId', coiffeur._id);
    }
  }, [selectedService, coiffeur._id, setValue]);

  // Watch les valeurs du formulaire
  const watchedMode = watch('mode');
  const watchedDate = watch('date');
  const watchedTime = watch('time');

  const [userWithAddresses, setUserWithAddresses] = useState<UserWithAddresses | null>(null);
  // ✅ Garder selectedDate et selectedTime pour la compatibilité avec l'UI existante
  const selectedDate = watchedDate;
  const selectedTime = watchedTime;
  const bookingMode = watchedMode as 'salon' | 'domicile';
  
  // ✅ DEBUG: Vérifier le mode à chaque changement
  useEffect(() => {
    console.log('🎯 [BookingForm] Mode changé:', {
      watchedMode,
      bookingMode,
      timestamp: new Date().toISOString()
    });
  }, [watchedMode, bookingMode]);

  // ✅ Helpers pour mettre à jour les valeurs du formulaire (compatibilité avec l'UI existante)
  const setSelectedDate = (date: string) => {
    setValue('date', date, { shouldValidate: true });
  };
  const setSelectedTime = (time: string) => {
    setValue('time', time, { shouldValidate: true });
  };
  const setBookingMode = (mode: 'salon' | 'domicile') => {
    console.log('🔄 [BookingForm] setBookingMode appelé avec:', mode);
    setValue('mode', mode, { shouldValidate: true });
    // ✅ Si on passe en mode salon, on peut réinitialiser l'adresse dans le formulaire
    if (mode === 'salon') {
      setValue('address', null, { shouldValidate: false });
    }
    console.log('✅ [BookingForm] Mode mis à jour dans le formulaire');
  };
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [cgvExpanded, setCgvExpanded] = useState(false);
  const [cgv, setCgv] = useState<CGV | null>(null);
  const [cgvLoading, setCgvLoading] = useState(false);
  const [cgvError, setCgvError] = useState<string | null>(null);
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

  // ✅ CORRECTION BUG: Synchroniser clientAddress avec data.address dans react-hook-form
  // Cette synchronisation permet à la validation yup de voir les valeurs de l'adresse
  // On synchronise seulement quand les champs requis sont remplis (respect de la norme de validation)
  useEffect(() => {
    if (bookingMode === 'domicile') {
      // Synchroniser seulement si les champs requis sont remplis (street, city, postalCode)
      // La validation yup vérifiera que tous les champs requis sont présents
      if (clientAddress.street && clientAddress.city && clientAddress.postalCode) {
        setValue('address', {
          street: clientAddress.street,
          streetNumber: clientAddress.streetNumber || '',
          city: clientAddress.city,
          postalCode: clientAddress.postalCode,
          country: 'France'
        }, { shouldValidate: true });
      } else {
        // Si les champs requis ne sont pas remplis, mettre null pour que yup valide
        setValue('address', null, { shouldValidate: true });
      }
    } else if (bookingMode === 'salon') {
      setValue('address', null, { shouldValidate: false });
    }
  }, [clientAddress, bookingMode, setValue]);

  const [coiffeurBookings, setCoiffeurBookings] = useState<any[]>([]);
  const [workingSlots, setWorkingSlots] = useState<any[]>([]);
  const [coiffeurSlots, setCoiffeurSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modes de travail du coiffeur - CORRIGÉ
  const coiffeurModes = coiffeur.workingMode && coiffeur.workingMode.length > 0 
    ? coiffeur.workingMode 
    : ['salon', 'domicile']; // Valeur par défaut si pas de données

  // ✅ CORRIGÉ: Générer les disponibilités selon les heures réelles du coiffeur
  // Prend en compte le mode de réservation (salon ou domicile)
  // Utilise la même logique que IntelligentCalendar pour cohérence
  // ⚠️ IMPORTANT: Utiliser useCallback pour que la fonction soit mémorisée et se recalcule quand bookingMode change
  // ⚠️ CRITIQUE: Cette fonction DOIT être déclarée APRÈS les states pour avoir accès aux valeurs à jour
  const generateTimeSlotsForDay = useCallback((date: string): string[] => {
    const dateObj = new Date(date);
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    
    // ✅ CORRIGÉ: Pour mode domicile, TOUJOURS générer tous les créneaux 00h-00h
    // Même si le serveur ne les renvoie pas, on doit afficher tous les créneaux 24h/24h
    if (bookingMode === 'domicile') {
      // Générer tous les créneaux 00h-00h
      const allSlots24h = generateTimeSlots(0, 24, 60);
      
      console.log('🏠 [BookingForm] Mode DOMICILE - Créneaux 00h-00h générés:', {
        date: dateStr,
        bookingMode,
        count: allSlots24h.length,
        first: allSlots24h.slice(0, 3),
        last: allSlots24h.slice(-3)
      });
      
      // Si on a des données du serveur, on peut les utiliser pour marquer les créneaux réservés
      // mais on affiche TOUJOURS tous les créneaux 00h-00h
      if (coiffeurSlots.length > 0) {
        const daySlots = coiffeurSlots.filter((slot: any) => slot.date === dateStr);
        if (daySlots.length > 0) {
          // Retourner tous les créneaux 00h-00h (les réservés seront marqués par isSlotAvailable)
          return allSlots24h;
        }
      }
      
      // Si pas de données serveur, retourner tous les créneaux 00h-00h
      return allSlots24h;
    }
    
    // Pour mode salon, utiliser la logique normale avec priorité
    // Priorité 1: Utiliser CoiffeurSlotDTO si disponibles (données calculées côté serveur)
    if (coiffeurSlots.length > 0) {
      const daySlots = coiffeurSlots.filter((slot: any) => {
        // Filtrer par date
        if (slot.date !== dateStr) return false;
        // Filtrer selon le mode - le slot doit supporter le mode demandé
        if (bookingMode && slot.supportedModes && !slot.supportedModes.includes(bookingMode)) return false;
        return true;
      });
      
      if (daySlots.length > 0) {
        const availableSlots = daySlots
          .filter((slot: any) => slot.remainingCapacity > 0)
          .map((slot: any) => {
            const [hour, minute] = slot.startTime.split(':').map(Number);
            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          });
        
        return availableSlots;
      }
    }
    
    // Priorité 2: Utiliser WorkingSlots si disponibles (uniquement pour salon)
    if (bookingMode === 'salon' && workingSlots.length > 0) {
      const slots = generateTimeSlotsFromWorkingSlots(workingSlots, dateObj, 60, bookingMode);
      if (slots.length > 0) {
        return slots;
      }
    }
    
    // Priorité 3: Utiliser openingHours si disponibles (uniquement pour salon)
    if (bookingMode === 'salon' && coiffeur.salonAddress?.openingHours) {
      const slots = generateTimeSlotsFromOpeningHours(coiffeur.salonAddress.openingHours, dateObj, 60);
      if (slots.length > 0) {
        return slots;
      }
    }
    
    // Fallback: Créneaux par défaut selon le mode
    // ✅ CORRIGÉ: Pour domicile, mode 24h/24h (00h-00h) - TOUJOURS
    if (bookingMode === 'domicile') {
      return generateTimeSlots(0, 24, 60); // 00h-00h (24h/24h)
    }
    // Pour salon, créneaux par défaut (9h-19h)
    return generateTimeSlots(9, 19, 60);
  }, [bookingMode, coiffeurSlots, workingSlots, coiffeur.salonAddress?.openingHours]);

  // ✅ CORRIGÉ: Générer les disponibilités selon les heures réelles du coiffeur
  // Cette fonction est recalculée quand coiffeurSlots, workingSlots ou bookingMode change
  const coiffeurAvailability = useMemo(() => {
    // ✅ DEBUG: Vérifier le mode (TOUJOURS actif pour diagnostiquer)
    console.log('🔄 [BookingForm] Recalcul coiffeurAvailability - Mode:', bookingMode, 'watchedMode:', watchedMode);
    
    const availability = Array.from({ length: 7 }, (_, i) => {
      const date = format(addDays(new Date(), i), 'yyyy-MM-dd');
      const slots = generateTimeSlotsForDay(date);
      
      // ✅ DEBUG: Vérifier les créneaux générés (TOUJOURS actif)
      if (i === 0) {
        console.log('🕐 [BookingForm] Créneaux générés pour date:', {
          date,
          bookingMode,
          slotsCount: slots.length,
          firstSlots: slots.slice(0, 5),
          lastSlots: slots.slice(-5)
        });
      }
      
      return {
        date,
        slots // ✅ SYNCHRONISÉ: Utilise les heures réelles selon le mode
      };
    });
    
    return availability;
  }, [coiffeurSlots, workingSlots, coiffeur.salonAddress?.openingHours, bookingMode, generateTimeSlotsForDay, watchedMode]);

  // ✅ CRITIQUE: Récupérer les données du coiffeur QUAND LE MODE CHANGE
  // Cela déclenchera le recalcul de coiffeurAvailability
  useEffect(() => {
    const fetchCoiffeurData = async () => {
      if (!coiffeur._id) {
        console.error('Coiffeur ID is undefined');
        return;
      }
      
      console.log('📡 [BookingForm] fetchCoiffeurData appelé - Mode:', bookingMode);
      
      try {
        // ✅ CORRIGÉ: Récupérer les réservations, working slots ET coiffeur slots en parallèle
        // Utiliser la même logique que IntelligentCalendar pour cohérence
        const startDate = new Date();
        const endDate = addDays(new Date(), 6); // 7 prochains jours
        
        const [bookings, slots, slotsDTO] = await Promise.all([
          bookingService.getCoiffeurBookings(coiffeur._id).catch(() => []),
          workingSlotsService.getCoiffeurSlots(coiffeur._id, true).catch(() => []),
          coiffeurService.getCoiffeurSlots(coiffeur._id, {
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            mode: bookingMode
          }).catch(() => [])
        ]);
        
        console.log('📡 [BookingForm] Données récupérées:', {
          bookingsCount: bookings.length,
          slotsCount: slots.length,
          slotsDTOCount: slotsDTO.length,
          mode: bookingMode
        });
        
        setCoiffeurBookings(bookings);
        setWorkingSlots(slots);
        setCoiffeurSlots(slotsDTO);
      } catch (error) {
        console.error('Error fetching coiffeur data:', error);
      }
    };

    fetchCoiffeurData();
  }, [coiffeur._id, bookingMode]);

  // Charger les CGV au montage du composant
  useEffect(() => {
    const loadCGV = async () => {
      try {
        setCgvLoading(true);
        setCgvError(null);
        const response = await cgvService.getActiveCGV();
        
        if (response.success && response.data) {
          setCgv(response.data);
        } else {
          console.warn('⚠️ Aucune CGV active trouvée');
          setCgvError('Aucune CGV disponible');
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement des CGV:', err);
        setCgvError('Impossible de charger les CGV');
      } finally {
        setCgvLoading(false);
      }
    };

    loadCGV();
  }, []);

  const getAvailableSlots = () => {
    if (!selectedDate) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ [BookingForm] getAvailableSlots: Pas de date sélectionnée');
      }
      return [];
    }
    const dayAvailability = coiffeurAvailability.find((a: any) => a.date === selectedDate);
    const slots = dayAvailability?.slots || [];
    
    // ✅ DEBUG: Vérifier ce qui est retourné (TOUJOURS actif)
    console.log('🔍 [BookingForm] getAvailableSlots:', {
      selectedDate,
      bookingMode,
      coiffeurAvailabilityLength: coiffeurAvailability.length,
      dayAvailability: dayAvailability ? { date: dayAvailability.date, slotsCount: dayAvailability.slots?.length } : null,
      slotsCount: slots.length,
      firstSlots: slots.slice(0, 5),
      lastSlots: slots.slice(-5)
    });
    
    return slots;
  };

  // ✅ CORRIGÉ: Vérifier si le créneau est disponible (gère les durées)
  // Un créneau est disponible SI :
  // 1. Il est dans les heures de travail du coiffeur (déjà filtré par getAvailableSlots)
  // 2. Il n'est pas dans le passé
  // 3. Il n'est pas déjà réservé (en tenant compte des durées)
  const isSlotAvailable = (date: string, time: string) => {
    if (!date || !time) return false;
    
    try {
      // ✅ Vérifier si la date/heure est dans le futur
      const bookingDateTime = new Date(`${date}T${time}:00`);
      const now = new Date();
      
      // Si la date/heure est dans le passé, le créneau n'est pas disponible
      if (bookingDateTime <= now) {
        return false;
      }
      
      // ✅ Vérifier si le créneau est dans les heures de travail
      // Si le créneau n'est pas dans getAvailableSlots(), il n'est pas disponible
      const availableSlots = getAvailableSlots();
      if (!availableSlots.includes(time)) {
        return false; // Pas dans les heures de travail = Indisponible (pas Occupé)
      }
      
      // ✅ CORRIGÉ: Vérifier si le créneau est déjà réservé (gère les durées)
      const [slotHour, slotMinute] = time.split(':').map(Number);
      const slotTime = slotHour * 60 + slotMinute; // Minutes depuis minuit
      
      const hasOverlappingBooking = coiffeurBookings.some(booking => {
        // Ignorer les réservations annulées ou terminées
        if (booking.status === 'cancelled' || booking.status === 'completed') {
          return false;
        }
        
        if (!booking.date) return false;
        
        const bookingDate = new Date(booking.date);
        const bookingDateStr = bookingDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Vérifier que c'est le même jour
        if (bookingDateStr !== date) {
          return false;
        }
        
        const bookingHour = bookingDate.getHours();
        const bookingMinute = bookingDate.getMinutes();
        const bookingStartTime = bookingHour * 60 + bookingMinute; // Minutes depuis minuit
        const bookingEndTime = bookingStartTime + (booking.duration || 60); // Durée en minutes
        
        // ✅ CORRIGÉ: Vérifier si le créneau chevauche avec la réservation
        // Le créneau est réservé s'il est dans l'intervalle [bookingStartTime, bookingEndTime)
        return slotTime >= bookingStartTime && slotTime < bookingEndTime;
      });
      
      // Si réservé = Occupé, sinon = Disponible
      return !hasOverlappingBooking;
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error);
      return false;
    }
  };

  // ✅ Nouveau handleSubmit avec react-hook-form
  const onSubmit = async (data: BookingFormData) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!coiffeur._id) {
      setError('Erreur : ID du coiffeur manquant');
      return;
    }
    if (!selectedService) {
      setError('Service manquant');
      return;
    }

    // ✅ Validation de l'adresse si mode domicile
    if (data.mode === 'domicile' && (!clientAddress.street || !clientAddress.city || !clientAddress.postalCode)) {
      setError('Veuillez remplir au minimum la rue, la ville et le code postal pour la prestation à domicile');
      return;
    }

    // Vérifier la disponibilité du créneau
    if (!isSlotAvailable(data.date, data.time)) {
      setError('Ce créneau n\'est plus disponible. Veuillez choisir un autre horaire.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Préparer les données selon le type CreateBookingData
      // ✅ Utiliser clientAddress directement (comme dans l'UI existante)
      const bookingData = {
        serviceId: data.serviceId || selectedService._id,
        coiffeurId: data.coiffeurId || coiffeur._id,
        date: data.date,
        time: data.time,
        mode: data.mode,
        price: data.price || selectedService.price,
        duration: data.duration || selectedService.duration,
        notes: data.notes || `Réservation pour ${selectedService.name}`,
        address: data.mode === 'domicile' ? {
          street: clientAddress.street,
          streetNumber: clientAddress.streetNumber,
          city: clientAddress.city,
          postalCode: clientAddress.postalCode,
          country: 'France'
        } : undefined
      };

      console.log('📤 [BookingForm] Données envoyées pour réservation:', bookingData);

      // Créer la réservation
      const booking = await bookingService.createBooking(bookingData);
      
      // Sauvegarder l'adresse de réservation si c'est un domicile
      if (data.mode === 'domicile' && user._id) {
        try {
          const addressData = {
            type: addressType === 'home' ? 'domicile' : addressType === 'office' ? 'bureau' : 'autre',
            street: clientAddress.street,
            streetNumber: clientAddress.streetNumber,
            city: clientAddress.city,
            postalCode: clientAddress.postalCode,
            floor: clientAddress.floor,
            apartment: clientAddress.apartment,
            buildingCode: clientAddress.buildingCode,
            additionalInfo: clientAddress.additionalInfo
          };
          
          console.log('📍 [BookingForm] Sauvegarde de l\'adresse de réservation:', addressData);
          
          await userService.addBookingAddress(user._id, addressData);
          console.log('✅ [BookingForm] Adresse de réservation sauvegardée');
        } catch (error) {
          console.error('❌ [BookingForm] Erreur lors de la sauvegarde de l\'adresse:', error);
          // Ne pas bloquer la réservation si l'adresse ne peut pas être sauvegardée
        }
      }
      
      // ✅ CORRECTION CRITIQUE : TOUJOURS ouvrir le modal Stripe après création
      // Conformité PCI-DSS : Le paiement doit TOUJOURS être effectué avant confirmation
      if (booking && (booking._id || booking.data?._id || (booking.success && booking.data?._id))) {
        // Gérer les différents formats de réponse de l'API
        const createdBookingData = booking.data || booking;
        const bookingId = createdBookingData._id || booking._id;
        
        console.log('✅ [BookingForm] Réservation créée avec succès:', bookingId);
        
        // ✅ CGV déjà acceptées via l'accordéon intégré
        setCreatedBooking(createdBookingData);
        
        // ✅ CRITIQUE : TOUJOURS ouvrir le modal Stripe (conformité PCI-DSS)
        // Attendre un court délai pour s'assurer que tout est prêt avant d'afficher le modal Stripe
        // Cela évite l'erreur "Element not mounted" de Stripe
        setTimeout(() => {
          setShowPaymentModal(true);
        }, 100);
      } else {
        // Seulement si erreur de création (pas de booking créé)
        console.error('❌ [BookingForm] Erreur : Réservation non créée');
        setError('Erreur lors de la création de la réservation. Veuillez réessayer.');
        // ❌ NE PAS rediriger ici - laisser l'utilisateur corriger l'erreur
      }
    } catch (error: any) {
      console.error('❌ [BookingForm] Error creating booking:', error);
      
      // Afficher les erreurs de validation détaillées
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          // Afficher toutes les erreurs de validation
          const errorMessages = errorData.errors.map((err: any) => err.msg || err.message).join(', ');
          setError(`Erreurs de validation: ${errorMessages}`);
        } else {
          setError(errorData?.message || 'Erreur lors de la création de la réservation. Vérifiez que tous les champs sont correctement remplis.');
        }
      } else if (error.response?.status === 409) {
        setError('Ce créneau n\'est plus disponible. Veuillez choisir un autre horaire.');
      } else {
        setError(error.response?.data?.message || error.message || 'Erreur lors de la création de la réservation');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    console.log('✅ [BookingForm] Paiement réussi');
    
    // ✅ CRITIQUE : Vérifier que le paiement a bien été confirmé côté serveur
    // Conformité PCI-DSS : S'assurer que le paiement est réellement confirmé
    try {
      if (createdBooking?._id) {
        // Recharger la réservation pour vérifier le statut du paiement
        const updatedBooking = await bookingService.getBookingById(createdBooking._id);
        
        if (updatedBooking?.paymentStatus === 'paid') {
          // Paiement confirmé, on peut fermer et rediriger
          setShowPaymentModal(false);
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/client/bookings');
          }
        } else {
          // Paiement en cours de traitement (webhook en attente)
          console.log('⏳ [BookingForm] Paiement en cours de traitement...');
          // Attendre quelques secondes et réessayer
          setTimeout(async () => {
            const retryBooking = await bookingService.getBookingById(createdBooking._id);
            if (retryBooking?.paymentStatus === 'paid') {
              setShowPaymentModal(false);
              if (onSuccess) {
                onSuccess();
              } else {
                navigate('/client/bookings');
              }
            } else {
              // Afficher un message d'attente
              setError('Paiement en cours de traitement. Veuillez patienter...');
            }
          }, 2000);
        }
      } else {
        // Pas de booking ID, fermer quand même (cas d'erreur)
        setShowPaymentModal(false);
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/client/bookings');
        }
      }
    } catch (error) {
      console.error('❌ [BookingForm] Erreur lors de la vérification du paiement:', error);
      // En cas d'erreur, fermer quand même (le webhook confirmera)
      setShowPaymentModal(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/client/bookings');
      }
    }
  };

  const handleCGVAccept = async () => {
    if (!cgvAccepted && cgv) {
      try {
        const response = await cgvService.acceptCGV(cgv.version);
        if (response.success) {
          console.log('✅ [BookingForm] CGV acceptées, version:', cgv.version);
          setCgvAccepted(true);
        } else {
          console.warn('⚠️ Erreur lors de l\'enregistrement de l\'acceptation, mais on continue');
          setCgvAccepted(true);
        }
      } catch (err: any) {
        console.error('Erreur lors de l\'acceptation des CGV:', err);
        // Même en cas d'erreur, permettre de continuer
        setCgvAccepted(true);
      }
    } else {
      setCgvAccepted(!cgvAccepted);
    }
  };

  const handlePaymentClose = () => {
    // ✅ CRITIQUE : Vérifier si le paiement a été effectué avant de fermer
    // Conformité PCI-DSS : Ne pas permettre de quitter sans paiement
    if (createdBooking?.paymentStatus === 'paid') {
      // Paiement confirmé, on peut fermer et rediriger
      setShowPaymentModal(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/client/bookings');
      }
    } else {
      // Paiement non effectué - Afficher un avertissement
      const confirmed = window.confirm(
        'Le paiement n\'a pas été effectué. Si vous quittez maintenant, votre réservation restera en attente de paiement.\n\n' +
        'Souhaitez-vous vraiment quitter ?'
      );
      
      if (confirmed) {
        setShowPaymentModal(false);
        // La réservation reste en 'pending' avec paymentStatus: 'pending'
        // L'utilisateur pourra payer plus tard depuis /client/bookings
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/client/bookings');
        }
      }
      // Sinon, garder le modal ouvert
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
            <h2 className="text-2xl font-bold text-fashion-black">Réserver avec {coiffeur?.name || 'Coiffeur'}</h2>
            <p className="text-fashion-gray-600">{coiffeur?.email || ''}</p>
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

      {/* ✅ Erreurs de validation react-hook-form */}
      {(errors.date || errors.time || errors.mode || errors.address) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
          <div className="space-y-2">
            {errors.date && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{errors.date.message}</span>
              </div>
            )}
            {errors.time && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{errors.time.message}</span>
              </div>
            )}
            {errors.mode && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{errors.mode.message}</span>
              </div>
            )}
            {errors.address && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{errors.address.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ Erreurs générales */}
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
                  // ✅ NOUVEAU: Distinguer "Temps passé", "Occupé" (réservé) et "Indisponible"
                  const bookingDateTime = new Date(`${selectedDate}T${slot}:00`);
                  const now = new Date();
                  const isPast = bookingDateTime <= now;
                  
                  // Vérifier si réservé
                  const isReserved = !isAvailable && !isPast && (() => {
                    const existingBookings = coiffeurBookings.filter(booking => {
                      if (!booking.date) return false;
                      const bookingDate = new Date(booking.date);
                      const bookingDateStr = bookingDate.toISOString().split('T')[0];
                      const bookingHour = bookingDate.getHours();
                      const bookingMinute = bookingDate.getMinutes();
                      const [slotHour, slotMinute] = slot.split(':').map(Number);
                      return bookingDateStr === selectedDate && bookingHour === slotHour && bookingMinute === slotMinute;
                    });
                    return existingBookings.length > 0;
                  })();
                  
                  // Déterminer le statut
                  let statusText = '';
                  if (isPast) {
                    statusText = 'Temps passé';
                  } else if (isReserved) {
                    statusText = 'Occupé';
                  } else if (!isAvailable) {
                    statusText = 'Indisponible';
                  }
                  
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
                      {statusText && (
                        <span className="text-xs block mt-1">{statusText}</span>
                      )}
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

      {/* Accordéon CGV intégré */}
      <Card className="mt-6 border-2 border-gray-200">
        <button
          onClick={() => setCgvExpanded(!cgvExpanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="accept-cgv"
              checked={cgvAccepted}
              onChange={handleCGVAccept}
              onClick={(e) => e.stopPropagation()}
              disabled={cgvLoading || !cgv}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="accept-cgv"
              className="text-sm font-medium text-gray-900 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              J'accepte les Conditions Générales de Vente
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>
          {cgvExpanded ? (
            <FaChevronUp className="text-gray-400" />
          ) : (
            <FaChevronDown className="text-gray-400" />
          )}
        </button>

        {cgvExpanded && (
          <div className="border-t border-gray-200 p-4 max-h-96 overflow-y-auto">
            {cgvLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FaSpinner className="animate-spin text-2xl text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Chargement des CGV...</p>
              </div>
            ) : cgvError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{cgvError}</p>
                <button
                  onClick={async () => {
                    setCgvLoading(true);
                    setCgvError(null);
                    try {
                      const response = await cgvService.getActiveCGV();
                      if (response.success && response.data) {
                        setCgv(response.data);
                        setCgvError(null);
                      } else {
                        setCgvError('Aucune CGV disponible');
                      }
                    } catch (err) {
                      setCgvError('Impossible de charger les CGV');
                    } finally {
                      setCgvLoading(false);
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                >
                  Réessayer
                </button>
              </div>
            ) : cgv ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Version:</strong> {cgv.version}
                  </p>
                  <p className="text-xs text-blue-800">
                    <strong>Date d'entrée en vigueur:</strong>{' '}
                    {new Date(cgv.effectiveDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="prose prose-sm max-w-none">
                  <div
                    className="text-gray-700 whitespace-pre-wrap text-sm"
                    dangerouslySetInnerHTML={{ __html: cgv.content }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600">Aucune CGV disponible</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Boutons d'action */}
      <div className="flex gap-4 mt-8">
        <Button
          onClick={handleFormSubmit(onSubmit)}
          disabled={!selectedService || !selectedDate || !selectedTime || isSubmitting || loading || !cgvAccepted}
          className="flex-1 bg-fashion-black text-white hover:bg-fashion-gray-800 py-4 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(loading || isSubmitting) ? (
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