import React, { useState, useEffect } from 'react';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Navigate } from 'react-router-dom';
import { bookingService, Booking } from '../services/api/bookings';
import { IntelligentCalendar } from '../components/calendar/IntelligentCalendar';
import { 
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  PhoneIcon,
  MapPinIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import type { User } from '../types/models';
import { useAppSelector } from '../store/hooks';

const CoiffeurReservationsPage: React.FC = () => {
  const user = useAppSelector(selectCurrentUser) as User | null;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0
  });

  const getPaymentStatusDisplay = (status?: Booking['paymentStatus']) => {
    switch (status) {
      case 'confirmed':
        return { tone: 'text-green-600', label: 'Confirmé' };
      case 'pending':
        return { tone: 'text-yellow-600', label: 'En attente' };
      case 'initiated':
        return { tone: 'text-blue-600', label: 'Initiée' };
      case 'cancelled':
        return { tone: 'text-rose-600', label: 'Annulé' };
      case 'refunded':
        return { tone: 'text-purple-600', label: 'Remboursé' };
      default:
        return { tone: 'text-gray-600', label: 'Non défini' };
    }
  };

  // Charger les vraies réservations depuis l'API
  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const bookingsData = await bookingService.getCoiffeurBookings(user!._id);
        console.log('📅 Réservations coiffeur chargées:', bookingsData);
        setBookings(bookingsData);
        calculateStats(bookingsData);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des réservations:', error);
        setError('Erreur lors du chargement des réservations');
      } finally {
        setLoading(false);
      }
    };

    if (user && user._id) {
      loadBookings();
    }
  }, [user]);

  const calculateStats = (bookingsData: Booking[]) => {
    const total = bookingsData.length;
    const pending = bookingsData.filter(b => b.status === 'pending').length;
    const confirmed = bookingsData.filter(b => b.status === 'confirmed').length;
    const completed = bookingsData.filter(b => b.status === 'completed').length;
    const cancelled = bookingsData.filter(b => b.status === 'cancelled').length;
    // Calculer les revenus avec commission : utiliser coiffeurAmount si disponible, sinon price - 10%
    const revenue = bookingsData
      .filter(b => (b.status === 'confirmed' || b.status === 'completed') && b.paymentStatus === 'confirmed')
      .reduce((sum, b) => {
        // Si coiffeurAmount existe (90% après commission), l'utiliser
        // Sinon, calculer 90% du prix
        const coiffeurAmount = b.coiffeurAmount || (b.price * 0.90);
        return sum + coiffeurAmount;
      }, 0);

    setStats({ total, pending, confirmed, completed, cancelled, revenue });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Ici, on pourrait filtrer les réservations par date
  };

  const handleSlotSelect = (slot: any, date: Date) => {
    // Pour les coiffeurs, on peut voir les créneaux disponibles
    console.log('Créneau sélectionné:', slot, date);
  };

  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      // Appeler l'API pour mettre à jour le statut
      await bookingService.updateBooking(bookingId, { status: newStatus });
      
      // Recharger les réservations
      const updatedBookings = await bookingService.getCoiffeurBookings(user!._id);
      setBookings(updatedBookings);
      calculateStats(updatedBookings);
      
      // Fermer les détails si la réservation est terminée
      if (newStatus === 'completed' || newStatus === 'cancelled') {
        setShowBookingDetails(false);
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut. Veuillez réessayer.');
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: Booking['status']) => {
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus !== 'all' && booking.status !== filterStatus) {
      return false;
    }
    if (selectedDate) {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === selectedDate.toDateString();
    }
    return true;
  });

  if (!user || user.role !== 'coiffeur') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mes Réservations</h1>
                <p className="text-gray-600 mt-1">
                  Gérez vos rendez-vous et confirmez vos réservations
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    viewMode === 'calendar'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <CalendarDaysIcon className="h-4 w-4 inline mr-2" />
                  Calendrier
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    viewMode === 'list'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <ClockIcon className="h-4 w-4 inline mr-2" />
                  Liste
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gestion des erreurs */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-600">Confirmées</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Terminées</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Annulées</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.revenue.toFixed(2)}€</div>
            <div className="text-sm text-gray-600">Revenus nets</div>
            <div className="text-xs text-gray-500 mt-1">(après commission 10%)</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne de gauche - Filtres et liste */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">Filtrer par statut</h3>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmées</option>
                <option value="completed">Terminées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>

            {/* Liste des réservations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">
                  Réservations ({filteredBookings.length})
                </h3>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {filteredBookings.map(booking => (
                  <div
                    key={booking._id}
                    onClick={() => handleBookingSelect(booking)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedBooking?._id === booking._id
                        ? 'border-gray-800 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{booking.service}</h4>
                        <p className="text-sm text-gray-600 truncate">
                          Client #{typeof booking.client === 'object' && booking.client._id 
                            ? booking.client._id.slice(-6) 
                            : typeof booking.client === 'string' 
                              ? booking.client.slice(-6) 
                              : 'N/A'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDate(booking.date)} {formatTime(booking.date)}
                          </span>
                          <span className="text-xs font-medium text-gray-900">{booking.price}€</span>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne centrale - Calendrier ou détails */}
          <div className="lg:col-span-2">
            {viewMode === 'calendar' ? (
              <div className="space-y-6">
                {/* En-tête du calendrier */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Vue calendrier</h3>
                  <p className="text-sm text-gray-600">
                    Visualisez vos réservations dans le temps et gérez vos créneaux
                  </p>
                </div>

                {/* Calendrier intelligent */}
                <IntelligentCalendar
                  coiffeurId={user._id}
                  isClient={false}
                  onSlotSelect={handleSlotSelect}
                  onDateSelect={handleDateSelect}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* En-tête de la liste */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Vue liste</h3>
                  <p className="text-sm text-gray-600">
                    Gérez vos réservations une par une avec tous les détails
                  </p>
                </div>

                {/* Détails de la réservation sélectionnée */}
                {selectedBooking ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-medium text-gray-900">
                        Réservation #{selectedBooking._id.slice(-6)}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedBooking.status)}`}>
                        {getStatusIcon(selectedBooking.status)}
                        <span className="ml-2">{getStatusLabel(selectedBooking.status)}</span>
                      </div>
                    </div>

                    {/* Informations service */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-8 w-8 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{selectedBooking.service}</h4>
                          <div className="text-sm text-gray-600">Service réservé</div>
                        </div>
                      </div>
                    </div>

                    {/* Détails de la réservation */}
                    <div className="mb-6 space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Service</h5>
                          <p className="text-sm text-gray-600">{selectedBooking.duration} minutes</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-medium text-gray-900">{selectedBooking.price}€</div>
                          {/* Affichage commission si disponible */}
                          {selectedBooking.platformFee && selectedBooking.coiffeurAmount && (
                            <div className="text-xs text-gray-500 mt-1">
                              <div>Commission TapHair: -{selectedBooking.platformFee.toFixed(2)}€</div>
                              <div className="font-semibold text-green-600">Vous recevez: {selectedBooking.coiffeurAmount.toFixed(2)}€</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Date et heure</h5>
                          <p className="text-sm text-gray-600">
                            {formatDate(selectedBooking.date)} à {formatTime(selectedBooking.date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Mode</h5>
                          <p className="text-sm text-gray-600">
                            {selectedBooking.mode === 'salon' ? 'Salon' : 'Domicile'}
                          </p>
                        </div>
                      </div>

                      {selectedBooking.notes && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2">Notes du client</h5>
                          <p className="text-sm text-gray-600">{selectedBooking.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                      {selectedBooking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(selectedBooking._id, 'confirmed')}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => handleStatusChange(selectedBooking._id, 'cancelled')}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                          >
                            Refuser
                          </button>
                        </>
                      )}
                      
                      {selectedBooking.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(selectedBooking._id, 'completed')}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                        >
                          Marquer comme terminée
                        </button>
                      )}

                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200">
                        <ChatBubbleLeftIcon className="h-4 w-4 inline mr-2" />
                        Contacter
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Sélectionnez une réservation
                    </h3>
                    <p className="text-gray-600">
                      Cliquez sur une réservation dans la liste à gauche pour voir les détails
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de détails de réservation */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Détails de la réservation
                </h2>
                <button
                  onClick={() => setShowBookingDetails(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  ✕
                </button>
              </div>

              {/* Contenu du modal */}
              <div className="space-y-6">
                {/* Service info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Service réservé</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{selectedBooking.service}</span>
                    <span className="font-medium text-gray-900">{selectedBooking.price}€</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Durée: {selectedBooking.duration} minutes</p>
                  {/* Affichage commission et paiement si disponible */}
                  {selectedBooking.platformFee && selectedBooking.coiffeurAmount && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Commission TapHair (10%):</span>
                          <span className="text-red-600">-{selectedBooking.platformFee.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between font-semibold text-gray-900">
                          <span>Montant net à recevoir:</span>
                          <span className="text-green-600">{selectedBooking.coiffeurAmount.toFixed(2)}€</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedBooking.paymentStatus && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs">
                        <span className="text-gray-600">Statut paiement: </span>
                        {(() => {
                          const { tone, label } = getPaymentStatusDisplay(selectedBooking.paymentStatus);
                          return <span className={`font-medium ${tone}`}>{label}</span>;
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date and time */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Date et heure</h4>
                  <p className="text-gray-700">
                    {formatDate(selectedBooking.date)}
                  </p>
                  <p className="text-gray-700">À {formatTime(selectedBooking.date)}</p>
                </div>

                {/* Mode */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Mode</h4>
                  <p className="text-gray-700">
                    {selectedBooking.mode === 'salon' ? 'Salon' : 'Domicile'}
                  </p>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Notes du client</h4>
                    <p className="text-gray-700">{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  {selectedBooking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleStatusChange(selectedBooking._id, 'confirmed');
                          setShowBookingDetails(false);
                        }}
                        className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                      >
                        Confirmer la réservation
                      </button>
                      <button
                        onClick={() => {
                          handleStatusChange(selectedBooking._id, 'cancelled');
                          setShowBookingDetails(false);
                        }}
                        className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                      >
                        Refuser
                      </button>
                    </>
                  )}
                  
                  {selectedBooking.status === 'confirmed' && (
                    <button
                      onClick={() => {
                        handleStatusChange(selectedBooking._id, 'completed');
                        setShowBookingDetails(false);
                      }}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                    >
                      Marquer comme terminée
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoiffeurReservationsPage; 