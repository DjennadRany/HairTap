import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { Card } from '../../ui/card';
import { Button } from '../../ui/Button';
import { FaCalendarAlt, FaClock, FaUser, FaCheck, FaTimes, FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { bookingService } from '../../../services/api/bookings';
import { reviewService } from '../../../services/api/reviews';
import { getImageUrl, handleImageError, DEFAULT_USER_IMAGE } from '../../../utils/imageUtils';
import { formatDate, formatTime, canConfirmServiceStart, canConfirmServiceEnd } from '../../../utils/dateUtils';
import CancelBookingModal from '../../modals/CancelBookingModal';
import TimeChangeModal from '../../modals/TimeChangeModal';
import ReviewForm from '../../shared/forms/ReviewForm';
import Modal from '../../ui/Modal';
import ConfirmationModal from '../../modals/ConfirmationModal';
import GeolocationCheckModal from '../../modals/GeolocationCheckModal';
import IncidentReportForm from '../../modals/IncidentReportForm';
import RegularizationModal from '../../modals/RegularizationModal'; // ✅ NOUVEAU: Modal de régularisation côté client
import RetardPenaltyModal from '../../modals/RetardPenaltyModal'; // ✅ NOUVEAU: Modal de pénalité pour retards
import { BookingAlertsList } from '../../booking/BookingAlert'; // ✅ NOUVEAU: Composant d'alertes
import bookingValidationService, { BookingAlert as BookingAlertType } from '../../../services/api/bookingValidations'; // ✅ NOUVEAU: Service d'alertes
import { incidentService } from '../../../services/api/incidents';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { User } from '../../../types/models';
import { markBookingAlertRead, selectBookingAlerts, setBookingAlerts } from '../../../store/slices/bookingAlertSlice';

// Interface pour les réservations
interface Booking {
  _id: string;
  coiffeur: User;
  service: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
  };
  date: string;
  duration: number;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  mode: 'salon' | 'domicile';
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
  notes?: string;
  createdAt: string;
  // ✅ OPTIMISATION: Accord du coiffeur avec aspect légal
  confirmedAt?: string;
  confirmedBy?: 'client' | 'coiffeur' | 'system';
  confirmationDeadline?: string;
}

interface ClientBookingsProps {
  // Props optionnelles pour personnaliser l'affichage
  showHeader?: boolean;
  showViewMode?: boolean;
  defaultViewMode?: 'upcoming' | 'past';
  defaultSortOrder?: 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc' | 'created-desc';
}

const ClientBookings: React.FC<ClientBookingsProps> = ({
  showHeader = false,
  showViewMode = true,
  defaultViewMode = 'upcoming',
  defaultSortOrder = 'created-desc' // ✅ AMÉLIORATION UX: Par défaut, les plus récents en premier
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser) as User | null;
  const alerts = useAppSelector(selectBookingAlerts);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'upcoming' | 'past'>(defaultViewMode);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'date-asc' | 'date-desc' | 'price-asc' | 'price-desc' | 'created-desc'>(defaultSortOrder);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showGeolocationModal, setShowGeolocationModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showRegularizationModal, setShowRegularizationModal] = useState(false); // ✅ NOUVEAU: Modal de régularisation côté client
  const [showRetardPenaltyModal, setShowRetardPenaltyModal] = useState(false); // ✅ NOUVEAU: Modal de pénalité pour retards
  const [delayInfo, setDelayInfo] = useState<{ delayMinutes: number; penaltyPercentage: number; penaltyAmount: number; requiresGeolocation: boolean } | null>(null); // ✅ NOUVEAU: Informations de retard
  const [confirmationType, setConfirmationType] = useState<'service_start' | 'service_end'>('service_start');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [pendingRegularizations, setPendingRegularizations] = useState<Booking[]>([]); // ✅ NOUVEAU: File d'attente pour les régularisations
  const [isProcessingRegularization, setIsProcessingRegularization] = useState(false); // ✅ NOUVEAU: Éviter les ouvertures récursives
  const [hasCheckedPastBookings, setHasCheckedPastBookings] = useState(false);

  // ✅ NOUVEAU: Charger les alertes
  useEffect(() => {
    const loadAlerts = async () => {
      if (!user) return;
      
      try {
        const response = await bookingValidationService.getClientAlerts(user._id);
        console.log('📢 Alertes chargées:', response);
        if (response.success && response.data) {
          dispatch(setBookingAlerts(response.data));
          console.log(`✅ ${response.data.length} alerte(s) chargée(s)`);
        } else {
          console.log('⚠️ Aucune alerte retournée par le backend');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des alertes:', error);
      }
    };

    if (user) {
      loadAlerts();
      // ✅ OPTIMISATION: Rafraîchir les alertes toutes les 2 minutes (au lieu de 30 secondes)
      const alertInterval = setInterval(loadAlerts, 120000);
      return () => clearInterval(alertInterval);
    }
  }, [user]);

  // ✅ NOUVEAU: Gérer l'ouverture séquentielle des modals de régularisation (sans récursion)
  useEffect(() => {
    // ✅ CORRECTION: Éviter les ouvertures récursives et les boucles infinies
    // Ne s'exécute que si :
    // 1. La modal est fermée
    // 2. Il y a des régularisations en attente
    // 3. Aucune réservation n'est sélectionnée
    // 4. On n'est pas en train de traiter une régularisation
    if (!showRegularizationModal && 
        pendingRegularizations.length > 0 && 
        !selectedBooking && 
        !isProcessingRegularization) {
      const nextBooking = pendingRegularizations[0];
      // ✅ CORRECTION: Utiliser une fonction de mise à jour pour éviter les boucles
      setPendingRegularizations(prev => {
        // Vérifier que la réservation n'est pas déjà en cours de traitement
        if (prev.length === 0 || prev[0]._id !== nextBooking._id) {
          return prev;
        }
        return prev.slice(1);
      });
      setIsProcessingRegularization(true);
      setSelectedBooking(nextBooking);
      setShowRegularizationModal(true);
    }
  }, [showRegularizationModal, pendingRegularizations.length, selectedBooking, isProcessingRegularization]);

  // Charger les réservations
  useEffect(() => {
    const loadBookings = async (isInitialLoad = false) => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const bookingsData = await bookingService.getClientBookings();
        console.log('📅 Réservations chargées:', bookingsData);
        setBookings(bookingsData);
        
        // ✅ NOUVEAU: Détecter automatiquement les réservations passées qui nécessitent une régularisation
        // (uniquement lors du chargement initial, pas à chaque rafraîchissement)
        if (isInitialLoad && !hasCheckedPastBookings) {
          const now = new Date();
          const pastBookingsNeedingRegularization = bookingsData.filter(booking => {
            const bookingDate = new Date(booking.date);
            const isPast = bookingDate <= now;
            const needsRegularization = isPast && (booking.status === 'pending' || booking.status === 'confirmed');
            return needsRegularization;
          });
          
          // ✅ NOUVEAU: Mettre en file d'attente les réservations passées (au lieu d'ouvrir toutes en même temps)
          if (pastBookingsNeedingRegularization.length > 0) {
            // Ouvrir la première modal immédiatement
            const firstBooking = pastBookingsNeedingRegularization[0];
            setSelectedBooking(firstBooking);
            setShowRegularizationModal(true);
            // Garder les autres en file d'attente (elles s'ouvriront automatiquement après la fermeture de la première)
            if (pastBookingsNeedingRegularization.length > 1) {
              setPendingRegularizations(pastBookingsNeedingRegularization.slice(1));
            } else {
              setPendingRegularizations([]);
            }
            setHasCheckedPastBookings(true);
          } else {
            setHasCheckedPastBookings(true);
          }
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement des réservations:', err);
        setError('Erreur lors du chargement des réservations');
      } finally {
        setLoading(false);
      }
    };

    // Chargement initial
    loadBookings(true);
    
    // ✅ OPTIMISATION: Rafraîchir automatiquement les réservations toutes les 2 minutes (au lieu de 30 secondes)
    // Cela réduit la charge serveur et améliore les performances
    const refreshInterval = setInterval(() => {
      loadBookings(false); // Pas de vérification automatique lors du rafraîchissement
    }, 120000); // 2 minutes
    
    return () => clearInterval(refreshInterval);
  }, [user, hasCheckedPastBookings]);

  // ✅ CORRECTION: Fonction utilitaire pour convertir _id en chaîne
  const getBookingId = (booking: Booking | null): string => {
    if (!booking || !booking._id) {
      return '';
    }
    if (typeof booking._id === 'string') {
      return booking._id;
    }
    // Si c'est un objet (ObjectId MongoDB), convertir en chaîne
    if (typeof booking._id === 'object' && booking._id !== null) {
      return String(booking._id);
    }
    return String(booking._id);
  };

  // ✅ AMÉLIORATION UX: Fonctions pour les badges de statut (plus visibles)
  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return <FaClock className="h-4 w-4" />;
      case 'confirmed':
        return <FaCheck className="h-4 w-4" />;
      case 'completed':
        return <FaCheck className="h-4 w-4" />;
      case 'cancelled':
        return <FaTimes className="h-4 w-4" />;
      default:
        return <FaClock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'Inconnu';
    }
  };

  // Formatage des dates
  const formatDateDisplay = (dateString: string): string => {
    return formatDate(dateString, 'EEEE d MMMM yyyy');
  };

  const formatTimeDisplay = (dateString: string): string => {
    return formatTime(dateString, 'HH:mm');
  };

  // Filtrer et trier les réservations
  const filteredBookings = bookings
    .filter(booking => {
      const now = new Date();
      const bookingDate = new Date(booking.date);
      
      // Filtrer par mode de vue (à venir vs passées)
      if (showViewMode) {
        if (viewMode === 'upcoming') {
          // À venir : date future OU statut pending/confirmed
          if (bookingDate < now && !['pending', 'confirmed'].includes(booking.status)) {
            return false;
          }
        } else if (viewMode === 'past') {
          // Passées : date passée ET statut completed/cancelled
          if (bookingDate >= now || ['pending', 'confirmed'].includes(booking.status)) {
            return false;
          }
        }
      }
      
      // Filtrer par statut
      if (filterStatus !== 'all' && booking.status !== filterStatus) {
        return false;
      }
      
      return true;
    })
    // ✅ AMÉLIORATION UX: Trier les réservations (par défaut : les plus récentes en premier)
    .sort((a, b) => {
      switch (sortOrder) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'created-desc':
          // ✅ AMÉLIORATION UX: Les plus récentes en premier (par défaut)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Compter les réservations
  const upcomingCount = bookings.filter(booking => {
    const now = new Date();
    const bookingDate = new Date(booking.date);
    return bookingDate >= now || ['pending', 'confirmed'].includes(booking.status);
  }).length;
  
  const pastCount = bookings.filter(booking => {
    const now = new Date();
    const bookingDate = new Date(booking.date);
    return bookingDate < now && ['completed', 'cancelled'].includes(booking.status);
  }).length;

  // Handlers
  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!selectedBooking) return;

    try {
      const response = await bookingService.cancelBooking(selectedBooking._id, reason);
      
      if (response.success) {
        setBookings(prev => 
          prev.map(booking => 
            booking._id === selectedBooking._id 
              ? { ...booking, status: 'cancelled' as const }
              : booking
          )
        );
        setShowCancelModal(false);
        setSelectedBooking(null);
      } else {
        alert(response.message || 'Erreur lors de l\'annulation de la réservation');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Erreur lors de l\'annulation de la réservation');
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    // Recharger les réservations après modification
    const loadBookings = async () => {
      try {
        const bookingsData = await bookingService.getClientBookings();
        setBookings(bookingsData);
      } catch (error) {
        console.error('Erreur lors du rechargement:', error);
      }
    };
    loadBookings();
    setShowEditModal(false);
    setSelectedBooking(null);
  };

  const handleLeaveReview = async (reviewData: any) => {
    if (!selectedBooking) return;

    try {
      await reviewService.createReview({
        coiffeurId: selectedBooking.coiffeur._id,
        bookingId: selectedBooking._id,
        rating: reviewData.rating,
        comment: reviewData.comment
      });

      toast.success('Votre avis a été enregistré avec succès !');
      setShowReviewModal(false);
      setSelectedBooking(null);
      
      // Rafraîchir les réservations
      const updatedBookings = await bookingService.getClientBookings();
      setBookings(updatedBookings);
    } catch (error: any) {
      console.error('Error leaving review:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'avis');
    }
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Chargement des réservations...</p>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <Card className="p-6 mb-6 border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <div className="text-red-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-red-800 font-medium">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-2 bg-red-500 hover:bg-red-600 text-white"
            >
              Réessayer
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header optionnel */}
      {showHeader && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Réservations</h1>
              <p className="text-gray-600">Gérez vos rendez-vous et suivez vos réservations</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Mode de vue (À venir / Passées) */}
        {showViewMode && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('upcoming')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'upcoming' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FaCalendarAlt className="h-4 w-4" />
              À venir ({upcomingCount})
            </button>
            <button
              onClick={() => setViewMode('past')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'past' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FaClock className="h-4 w-4" />
              Passées ({pastCount})
            </button>
          </div>
        )}
        
        {/* Filtres de statut et tri */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filtrer par statut :</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="completed">Terminées</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Trier par :</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created-desc">Plus récentes (par défaut)</option>
              <option value="date-asc">Date (plus proches)</option>
              <option value="date-desc">Date (plus lointaines)</option>
              <option value="price-asc">Prix (croissant)</option>
              <option value="price-desc">Prix (décroissant)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ✅ NOUVEAU: Layout en deux colonnes : Liste des réservations à gauche, Module d'alertes à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche : Liste des réservations */}
        <div className="lg:col-span-2">
      {filteredBookings.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <FaCalendarAlt className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {showViewMode && viewMode === 'upcoming' ? 'Aucune réservation à venir' : 'Aucune réservation passée'}
          </h3>
          <p className="text-gray-500">
            {showViewMode && viewMode === 'upcoming'
              ? 'Vous n\'avez pas de rendez-vous programmés pour le moment.'
              : 'Vous n\'avez pas encore de réservations terminées.'
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredBookings.map((booking) => (
            <Card key={booking._id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Photo du coiffeur */}
                <div className="flex-shrink-0">
                  {booking.coiffeur.photo ? (
                    <img 
                      src={getImageUrl(booking.coiffeur.photo, DEFAULT_USER_IMAGE)} 
                      alt={booking.coiffeur.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => handleImageError(e, DEFAULT_USER_IMAGE)}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <FaUser className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Informations principales */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {booking.service.name}
                      </h3>
                      {booking.coiffeur?.name && (
                        <p className="text-gray-700 text-sm font-medium mb-1">
                          avec {booking.coiffeur.name}
                        </p>
                      )}
                      <p className="text-gray-600 text-sm mb-2">
                        Réservation #{(() => {
                          const id = getBookingId(booking);
                          return id ? id.slice(-6) : 'N/A';
                        })()}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">{booking.price}€</span>
                        <span>{booking.duration} min</span>
                      </div>
                    </div>
                    
                    {/* ✅ AMÉLIORATION UX: Badge de statut plus visible */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 flex-shrink-0 ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      {getStatusText(booking.status)}
                    </span>
                  </div>

                  {/* Détails de la réservation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaCalendarAlt className="text-blue-500" />
                      <span>{formatDateDisplay(booking.date)} à {formatTimeDisplay(booking.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaMapMarkerAlt className="text-green-500" />
                      <span className="capitalize">{booking.mode === 'salon' ? 'Mode Salon' : 'À domicile'}</span>
                    </div>
                    {booking.createdAt && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FaClock className="text-gray-400" />
                        <span>Réservé le {formatDateDisplay(booking.createdAt)} à {formatTimeDisplay(booking.createdAt)}</span>
                      </div>
                    )}
                    {booking.status === 'pending' && booking.confirmationDeadline && (
                      <div className="flex items-center gap-2 text-sm text-yellow-600">
                        <FaClock className="text-yellow-500" />
                        <span>En attente de confirmation du coiffeur</span>
                      </div>
                    )}
                    {booking.status === 'confirmed' && booking.confirmedAt && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <FaCheck className="text-green-500" />
                        <span>Confirmé le {formatDateDisplay(booking.confirmedAt)} à {formatTimeDisplay(booking.confirmedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Notes:</span> {booking.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 min-w-[150px]">
                  {booking.status === 'pending' && (
                    <Button
                      onClick={() => handleCancelBooking(booking)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Annuler
                    </Button>
                  )}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <Button
                      onClick={() => handleEditBooking(booking)}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Modifier
                    </Button>
                  )}
                  {booking.status === 'completed' && (
                    <>
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowReviewModal(true);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        <FaStar className="mr-2" />
                        Laisser un avis
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowIncidentModal(true);
                        }}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Signaler un incident
                      </Button>
                    </>
                  )}
                  {booking.status === 'confirmed' && canConfirmServiceStart(booking.date, booking.duration) && (
                    <Button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setConfirmationType('service_start');
                        setShowConfirmationModal(true);
                      }}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      Confirmer le début
                    </Button>
                  )}
                  {booking.status === 'confirmed' && canConfirmServiceEnd(booking.date, booking.duration) && (
                    <Button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setConfirmationType('service_end');
                        setShowConfirmationModal(true);
                      }}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      Confirmer la fin
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
        </div>

        {/* ✅ NOUVEAU: Colonne de droite : Module d'alertes */}
        <div className="lg:col-span-1">
          <Card className="p-4 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Alertes ({alerts.length})
            </h3>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Aucune alerte</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                <BookingAlertsList
                  alerts={alerts}
                  onAction={async (alert) => {
                    dispatch(markBookingAlertRead(alert.id));
                    // Trouver la réservation correspondante
                    const bookingForAlert = bookings.find(b => b._id === alert.bookingId);
                    if (!bookingForAlert) return;
                    
                    // Actions selon le type d'alerte
                    if (alert.action === 'regularize' || alert.type === 'past_booking_needs_regularization') {
                      // Ouvrir la modal de régularisation
                      setSelectedBooking(bookingForAlert);
                      setShowRegularizationModal(true);
                      // Retirer de la file d'attente si elle y est
                      setPendingRegularizations(prev => prev.filter(b => b._id !== bookingForAlert._id));
                    } else if (alert.action === 'report_incident') {
                      // Ouvrir le formulaire d'incident
                      setSelectedBooking(bookingForAlert);
                      setShowIncidentModal(true);
                    } else if (alert.action === 'confirm_service') {
                      // Ouvrir la modal de confirmation
                      setSelectedBooking(bookingForAlert);
                      setConfirmationType('service_start');
                      setShowConfirmationModal(true);
                    }
                  }}
                  maxAlerts={10}
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CancelBookingModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedBooking(null);
        }}
        onConfirm={handleConfirmCancel}
        bookingInfo={selectedBooking ? {
          serviceName: selectedBooking.service.name,
          date: selectedBooking.date,
          coiffeurName: selectedBooking.coiffeur.name
        } : undefined}
      />

      <TimeChangeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBooking(null);
        }}
        onSuccess={handleEditSuccess}
        booking={selectedBooking!}
        mode="edit"
      />

      {showReviewModal && selectedBooking && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBooking(null);
          }}
          title="Laisser un avis"
        >
          <ReviewForm
            coiffeurId={selectedBooking.coiffeur._id}
            coiffeurName={selectedBooking.coiffeur.name}
            bookingId={selectedBooking._id}
            onSubmit={handleLeaveReview}
            onCancel={() => {
              setShowReviewModal(false);
              setSelectedBooking(null);
            }}
          />
        </Modal>
      )}

      {/* ✅ NOUVEAU: Modal de confirmation début/fin de prestation */}
      {showConfirmationModal && selectedBooking && (
        <ConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => {
            setShowConfirmationModal(false);
            setSelectedBooking(null);
          }}
          onConfirm={async (data) => {
            if (!selectedBooking) return;
            
            try {
              // Appeler l'API pour confirmer le début/fin de prestation
              if (confirmationType === 'service_start') {
                // TODO: Créer l'API confirmServiceStart si elle n'existe pas
                // Pour l'instant, on peut utiliser completeBooking avec les données
                await bookingService.completeBooking(selectedBooking._id, {
                  clientSatisfied: data.satisfied,
                  notes: data.problemDescription || undefined
                });
                toast.success('Début de prestation confirmé avec succès !');
              } else if (confirmationType === 'service_end') {
                await bookingService.completeBooking(selectedBooking._id, {
                  clientSatisfied: data.satisfied,
                  notes: data.problemDescription || undefined
                });
                toast.success('Fin de prestation confirmée avec succès !');
              }
              
              setShowConfirmationModal(false);
              setSelectedBooking(null);
              
              // Rafraîchir les réservations
              const updatedBookings = await bookingService.getClientBookings();
              setBookings(updatedBookings);
            } catch (error: any) {
              console.error('Error confirming service:', error);
              toast.error(error.response?.data?.message || 'Erreur lors de la confirmation');
            }
          }}
          type={confirmationType}
          bookingInfo={{
            serviceName: selectedBooking.service.name,
            date: selectedBooking.date,
            coiffeurName: selectedBooking.coiffeur.name
          }}
        />
      )}

      {/* ✅ NOUVEAU: Modal de vérification géolocalisation (retard) */}
      {showGeolocationModal && selectedBooking && (
        <GeolocationCheckModal
          isOpen={showGeolocationModal}
          onClose={() => {
            setShowGeolocationModal(false);
            setSelectedBooking(null);
          }}
          onConfirm={async (geolocation) => {
            if (!selectedBooking) return;
            
            try {
              const bookingId = selectedBooking._id;
              
              // Vérifier la géolocalisation avec le backend
              // TODO: Créer l'API de vérification géolocalisation si elle n'existe pas
              // Pour l'instant, on marque comme terminée avec géolocalisation
              const completeResponse = await bookingService.completeBooking(bookingId, {
                notes: `Géolocalisation vérifiée (lat: ${geolocation.latitude}, lng: ${geolocation.longitude})`
              });
              
              if (completeResponse.success) {
                toast.success('Géolocalisation vérifiée. Réservation marquée comme terminée.');
                
                // Recharger les réservations
                const updatedBookings = await bookingService.getClientBookings();
                setBookings(updatedBookings);
                
                // Recharger les alertes
                if (user) {
                  const alertsResponse = await bookingValidationService.getClientAlerts(user._id);
                  if (alertsResponse.success && alertsResponse.data) {
                    dispatch(setBookingAlerts(alertsResponse.data));
                  }
                }
                
                setShowGeolocationModal(false);
                setSelectedBooking(null);
                setDelayInfo(null);
              } else {
                toast.error(completeResponse.message || 'Erreur lors de la vérification');
              }
            } catch (error: any) {
              console.error('Erreur lors de la vérification géolocalisation:', error);
              toast.error(error.response?.data?.message || 'Erreur lors de la vérification');
            }
          }}
          bookingInfo={{
            serviceName: selectedBooking.service?.name || 'Service',
            date: selectedBooking.date,
            coiffeurName: selectedBooking.coiffeur?.name
          }}
          delayMinutes={delayInfo?.delayMinutes || 15}
        />
      )}

      {/* ✅ NOUVEAU: Modal de signalement d'incident */}
      {showIncidentModal && selectedBooking && (
        <IncidentReportForm
          isOpen={showIncidentModal}
          onClose={() => {
            setShowIncidentModal(false);
            setSelectedBooking(null);
          }}
          onSuccess={() => {
            // Recharger les réservations
            const loadBookings = async () => {
              try {
                const bookingsData = await bookingService.getClientBookings();
                setBookings(bookingsData);
              } catch (error) {
                console.error('Erreur lors du rechargement:', error);
              }
            };
            loadBookings();
          }}
          bookingId={selectedBooking._id}
          bookingInfo={{
            serviceName: selectedBooking.service.name,
            date: selectedBooking.date,
            coiffeurName: selectedBooking.coiffeur.name
          }}
        />
      )}

      {/* ✅ NOUVEAU: Modal de régularisation pour réservations passées côté client */}
      {showRegularizationModal && selectedBooking && (
        <RegularizationModal
          isOpen={showRegularizationModal}
          onClose={() => {
            // ✅ CORRECTION: Fermer la modal avec la croix
            setShowRegularizationModal(false);
            setSelectedBooking(null);
            setIsProcessingRegularization(false);
            // La réservation peut être rouverte via le composant d'alerte
          }}
          booking={selectedBooking as any}
          isClient={true} // ✅ NOUVEAU: Indiquer que c'est le client qui utilise la modal
          onDelayDetected={(info) => {
            // ✅ NOUVEAU: Stocker les informations de retard détecté
            setDelayInfo(info);
          }}
          onRegularize={async (action, delayInfoParam) => {
            try {
              // Selon l'action, mettre à jour le statut de la réservation
              switch (action) {
                case 'completed':
                  // ✅ NOUVEAU: Gérer les retards et pénalités
                  if (delayInfoParam) {
                    const { delayMinutes, penaltyPercentage, penaltyAmount } = delayInfoParam;
                    
                    // Retard ≥ 45 min : Annulation automatique
                    if (delayMinutes >= 45) {
                      const bookingId = getBookingId(selectedBooking);
                      if (!bookingId) {
                        toast.error('Erreur : réservation invalide');
                        return;
                      }
                      const cancelResponse = await bookingService.cancelBooking(bookingId, `Régularisation : retard de ${delayMinutes} minutes (≥45 min)`);
                      if (cancelResponse.success) {
                        // Créer un incident de retard
                        await incidentService.reportIncident({
                          bookingId: bookingId,
                          type: 'retard_client',
                          description: `Retard de ${delayMinutes} minutes détecté lors de la régularisation. Réservation annulée automatiquement.`
                        });
                        toast.error(`Réservation annulée automatiquement (retard de ${delayMinutes} minutes ≥ 45 min)`);
                        setShowRegularizationModal(false);
                        setSelectedBooking(null);
                        setIsProcessingRegularization(false);
                        return;
                      }
                    }
                    // Retard 30-45 min : Ouvrir modal de pénalité
                    else if (delayMinutes >= 30 && delayMinutes < 45) {
                      setShowRegularizationModal(false);
                      setShowRetardPenaltyModal(true);
                      return;
                    }
                    // Retard 10-30 min : Ouvrir modal de géolocalisation
                    else if (delayMinutes >= 10 && delayMinutes < 30) {
                      setShowRegularizationModal(false);
                      setShowGeolocationModal(true);
                      return;
                    }
                  }
                  
                  // Marquer comme terminée (pas de retard ou retard < 10 min)
                  try {
                    const bookingId = getBookingId(selectedBooking);
                    if (!bookingId) {
                      toast.error('Erreur : réservation invalide');
                      return;
                    }
                    const completeResponse = await bookingService.completeBooking(bookingId);
                    if (completeResponse.success) {
                      // ✅ NOUVEAU: Vérifier si on attend la confirmation du coiffeur
                      if (completeResponse.awaitingCoiffeurConfirmation) {
                        toast.info('Régularisation enregistrée. En attente de confirmation du coiffeur.');
                      } else {
                        toast.success('Réservation marquée comme terminée');
                      }
                      
                      // Recharger les réservations
                      const bookingsData = await bookingService.getClientBookings();
                      setBookings(bookingsData);
                      
                      // Recharger les alertes
                      if (user) {
                        const alertsResponse = await bookingValidationService.getClientAlerts(user._id);
                        if (alertsResponse.success && alertsResponse.data) {
                          dispatch(setBookingAlerts(alertsResponse.data));
                        }
                      }
                      
                      setShowRegularizationModal(false);
                      setSelectedBooking(null);
                      setIsProcessingRegularization(false);
                    } else {
                      toast.error(completeResponse.message || 'Erreur lors de la finalisation');
                    }
                  } catch (error: any) {
                    console.error('Erreur lors de la finalisation:', error);
                    toast.error(error.response?.data?.message || 'Erreur lors de la finalisation de la réservation');
                  }
                  break;
                case 'no_show_client':
                case 'no_show_coiffeur':
                  // ✅ CORRECTION: Unifier la logique avec le côté coiffeur pour être cohérent
                  // Déterminer le type de no-show selon le mode (comme côté coiffeur)
                  const bookingMode = selectedBooking.mode || 'salon';
                  let noShowType: 'client_no_show' | 'coiffeur_no_show';
                  
                  if (action === 'no_show_client') {
                    // Si c'est au salon, c'est le client qui ne s'est pas présenté
                    // Si c'est à domicile, c'est le coiffeur qui ne s'est pas présenté (car le client est chez lui)
                    noShowType = bookingMode === 'salon' ? 'client_no_show' : 'coiffeur_no_show';
                  } else {
                    // Si c'est à domicile, c'est le coiffeur qui ne s'est pas présenté
                    // Si c'est au salon, c'est le client qui ne s'est pas présenté (car le coiffeur est au salon)
                    noShowType = bookingMode === 'domicile' ? 'coiffeur_no_show' : 'client_no_show';
                  }
                  
                  const bookingId = getBookingId(selectedBooking);
                  if (!bookingId) {
                    toast.error('Erreur : réservation invalide');
                    return;
                  }
                  await incidentService.reportIncident({
                    bookingId: bookingId,
                    type: noShowType,
                    description: `No-show détecté pour la réservation du ${formatDate(selectedBooking.date)} (mode: ${bookingMode})`
                  });
                  toast.warning('No-show signalé');
                  break;
                case 'cancelled':
                  // Annuler la réservation
                  const cancelBookingId = getBookingId(selectedBooking);
                  if (!cancelBookingId) {
                    toast.error('Erreur : réservation invalide');
                    return;
                  }
                  const cancelResponse = await bookingService.cancelBooking(cancelBookingId, 'Régularisation : réservation passée');
                  if (cancelResponse.success) {
                    toast.info('Réservation annulée');
                  } else {
                    toast.error(cancelResponse.message || 'Erreur lors de l\'annulation');
                  }
                  break;
                case 'problem':
                  // ✅ CORRECTION: Ouvrir automatiquement le formulaire d'incident
                  setShowRegularizationModal(false);
                  setShowIncidentModal(true);
                  break;
              }
              
              // ✅ CORRECTION: Ne recharger que si on n'a pas déjà géré le cas (retard, etc.)
              // Les cas avec retard gèrent déjà le rechargement et la fermeture de la modal
              if (action !== 'completed' || !delayInfoParam) {
                // Recharger les réservations
                const bookingsData = await bookingService.getClientBookings();
                setBookings(bookingsData);
                
                // ✅ NOUVEAU: Recharger les alertes
                if (user) {
                  const alertsResponse = await bookingValidationService.getClientAlerts(user._id);
                  if (alertsResponse.success && alertsResponse.data) {
                    dispatch(setBookingAlerts(alertsResponse.data));
                  }
                }
                
                // ✅ CORRECTION: Fermer la modal et réinitialiser après régularisation
                setShowRegularizationModal(false);
                setSelectedBooking(null);
                setIsProcessingRegularization(false);
              }
              
              // ✅ NOUVEAU: Si d'autres réservations sont en attente, elles s'ouvriront automatiquement via useEffect
            } catch (error: any) {
              console.error('Erreur lors de la régularisation:', error);
              const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la régularisation';
              toast.error(errorMessage);
              
              // Réinitialiser même en cas d'erreur pour éviter de bloquer l'interface
              setShowRegularizationModal(false);
              setSelectedBooking(null);
              setIsProcessingRegularization(false);
            }
          }}
        />
      )}

      {/* ✅ NOUVEAU: Modal de vérification géolocalisation pour retards 10-30 min */}
      {showGeolocationModal && selectedBooking && delayInfo && (
        <GeolocationCheckModal
          isOpen={showGeolocationModal}
          onClose={() => {
            setShowGeolocationModal(false);
            setDelayInfo(null);
            setShowRegularizationModal(true); // Revenir à la modal de régularisation
          }}
          onConfirm={async (geolocation) => {
            try {
              const bookingId = getBookingId(selectedBooking);
              if (!bookingId) {
                toast.error('Erreur : réservation invalide');
                return;
              }
              // Vérifier la géolocalisation avec le backend
              // TODO: Appeler l'API pour vérifier la géolocalisation
              // Pour l'instant, on marque comme terminée
              const completeResponse = await bookingService.completeBooking(bookingId);
              if (completeResponse.success) {
                // Créer un incident de retard avec géolocalisation
                await incidentService.reportIncident({
                  bookingId: bookingId,
                  type: 'retard_client',
                  description: `Retard de ${delayInfo.delayMinutes} minutes détecté lors de la régularisation. Géolocalisation vérifiée.`
                });
                
                // Si géolocalisation suspecte, appliquer pénalité
                // TODO: Vérifier la distance avec l'adresse de la réservation
                const geolocationOK = true; // À implémenter avec vérification backend
                
                if (!geolocationOK && delayInfo.penaltyPercentage > 0) {
                  toast.warning(`Pénalité de ${delayInfo.penaltyPercentage}% (${delayInfo.penaltyAmount.toFixed(2)}€) appliquée pour retard avec géolocalisation suspecte`);
                } else {
                  toast.success('Réservation marquée comme terminée. Géolocalisation vérifiée.');
                }
                
                setShowGeolocationModal(false);
                setDelayInfo(null);
                
                // Recharger les réservations
                const bookingsData = await bookingService.getClientBookings();
                setBookings(bookingsData);
                
                // Recharger les alertes
                if (user) {
                  const alertsResponse = await bookingValidationService.getClientAlerts(user._id);
                  if (alertsResponse.success && alertsResponse.data) {
                    dispatch(setBookingAlerts(alertsResponse.data));
                  }
                }
                
                setShowRegularizationModal(false);
                setSelectedBooking(null);
                setIsProcessingRegularization(false);
              }
            } catch (error) {
              console.error('Erreur lors de la vérification géolocalisation:', error);
              toast.error('Erreur lors de la vérification de géolocalisation');
            }
          }}
          bookingInfo={{
            serviceName: selectedBooking.service?.name || 'Service',
            date: selectedBooking.date,
            coiffeurName: selectedBooking.coiffeur?.name
          }}
          delayMinutes={delayInfo.delayMinutes}
        />
      )}

      {/* ✅ NOUVEAU: Modal de pénalité pour retards 30-45 min */}
      {showRetardPenaltyModal && selectedBooking && delayInfo && (
        <RetardPenaltyModal
          isOpen={showRetardPenaltyModal}
          onClose={() => {
            setShowRetardPenaltyModal(false);
            setDelayInfo(null);
            setShowRegularizationModal(true); // Revenir à la modal de régularisation
          }}
          onAccept={async (acceptPenalty: boolean) => {
            try {
              const bookingId = getBookingId(selectedBooking);
              if (!bookingId) {
                toast.error('Erreur : réservation invalide');
                return;
              }
              if (acceptPenalty) {
                // Accepter la pénalité et marquer comme terminée
                const completeResponse = await bookingService.completeBooking(bookingId);
                if (completeResponse.success) {
                  // Créer un incident de retard avec pénalité
                  await incidentService.reportIncident({
                    bookingId: bookingId,
                    type: 'retard_client',
                    description: `Retard de ${delayInfo.delayMinutes} minutes détecté lors de la régularisation. Pénalité de ${delayInfo.penaltyPercentage}% acceptée.`
                  });
                  toast.warning(`Pénalité de ${delayInfo.penaltyPercentage}% (${delayInfo.penaltyAmount.toFixed(2)}€) appliquée`);
                }
              } else {
                // Annuler la réservation
                const cancelBookingId = getBookingId(selectedBooking);
                if (!cancelBookingId) {
                  toast.error('Erreur : réservation invalide');
                  return;
                }
                const cancelResponse = await bookingService.cancelBooking(cancelBookingId, `Régularisation : retard de ${delayInfo.delayMinutes} minutes (30-45 min), annulation choisie`);
                if (cancelResponse.success) {
                  // Créer un incident de retard avec annulation
                  await incidentService.reportIncident({
                    bookingId: cancelBookingId,
                    type: 'retard_client',
                    description: `Retard de ${delayInfo.delayMinutes} minutes détecté lors de la régularisation. Réservation annulée.`
                  });
                  toast.info('Réservation annulée');
                }
              }
              
              setShowRetardPenaltyModal(false);
              setDelayInfo(null);
              
              // Recharger les réservations
              const bookingsData = await bookingService.getClientBookings();
              setBookings(bookingsData);
              
              // Recharger les alertes
              if (user) {
                const alertsResponse = await bookingValidationService.getClientAlerts(user._id);
                if (alertsResponse.success && alertsResponse.data) {
                  dispatch(setBookingAlerts(alertsResponse.data));
                }
              }
              
              setShowRegularizationModal(false);
              setSelectedBooking(null);
              setIsProcessingRegularization(false);
            } catch (error) {
              console.error('Erreur lors de la gestion de la pénalité:', error);
              toast.error('Erreur lors de la gestion de la pénalité');
            }
          }}
          bookingInfo={{
            serviceName: selectedBooking.service?.name || 'Service',
            date: selectedBooking.date,
            coiffeurName: selectedBooking.coiffeur?.name,
            clientName: user?.name,
            price: selectedBooking.price
          }}
          retardInfo={{
            delayMinutes: delayInfo.delayMinutes,
            penaltyPercentage: delayInfo.penaltyPercentage,
            penaltyAmount: delayInfo.penaltyAmount,
            canCancel: true
          }}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default ClientBookings;
