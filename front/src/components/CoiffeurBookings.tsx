import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/Button';
import { FaCalendarAlt, FaUser, FaPhone, FaEnvelope, FaCheck, FaTimes, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { bookingService } from '../services/api/bookings';
import { coiffeurService } from '../services/api/coiffeurs';
import { IntelligentCalendar } from './calendar/IntelligentCalendar';
import ConfirmationModal from './modals/ConfirmationModal'; // ✅ NOUVEAU: Modal de confirmation
import IncidentReportForm from './modals/IncidentReportForm'; // ✅ NOUVEAU: Modal d'incident
import { canConfirmServiceStart, canConfirmServiceEnd } from '../utils/dateUtils'; // ✅ NOUVEAU: Utilitaires de confirmation
import type { User } from '../types/models';

interface Booking {
  _id: string;
  client: User;
  service: string | {
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
  paymentStatus?: 'pending' | 'confirmed' | 'initiated' | 'cancelled' | 'refunded';
  platformFee?: number;
  coiffeurAmount?: number;
}

interface CoiffeurBookingsProps {
  coiffeurId: string;
}

const CoiffeurBookings: React.FC<CoiffeurBookingsProps> = ({ coiffeurId }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [coiffeur, setCoiffeur] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMode, setCalendarMode] = useState<'salon' | 'domicile'>('salon');
  // ✅ NOUVEAU: États pour modals (v0.7.17)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [confirmationType, setConfirmationType] = useState<'service_start' | 'service_end'>('service_start');

  // ✅ NOUVEAU: Récupérer les réservations ET les données du coiffeur
  useEffect(() => {
    const fetchData = async () => {
      if (!coiffeurId) return;

      try {
        setLoading(true);
        setError(null);

        // Récupérer les réservations et les données du coiffeur en parallèle
        const [bookingsData, coiffeurData] = await Promise.all([
          bookingService.getCoiffeurBookings(coiffeurId),
          coiffeurService.getCoiffeur(coiffeurId).catch(() => null)
        ]);

        setBookings(bookingsData);
        setCoiffeur(coiffeurData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coiffeurId]);

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await bookingService.confirmBooking(bookingId);
      // ✅ NOUVEAU: Recharger les données depuis la base pour synchronisation
      await refreshData();
      if (selectedBooking?._id === bookingId) {
        const updated = bookings.find(b => b._id === bookingId);
        setSelectedBooking(updated ? { ...updated, status: 'confirmed' as const } : null);
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Erreur lors de la confirmation de la réservation');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      try {
        await bookingService.cancelBooking(bookingId, 'Annulé par le coiffeur');
        // ✅ NOUVEAU: Recharger les données depuis la base pour synchronisation
        await refreshData();
        if (selectedBooking?._id === bookingId) {
          setSelectedBooking(null);
        }
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Erreur lors de l\'annulation de la réservation');
      }
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      await bookingService.completeBooking(bookingId);
      // ✅ NOUVEAU: Recharger les données depuis la base pour synchronisation
      await refreshData();
      if (selectedBooking?._id === bookingId) {
        const updated = bookings.find(b => b._id === bookingId);
        setSelectedBooking(updated ? { ...updated, status: 'completed' as const } : null);
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Erreur lors de la finalisation de la réservation');
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Filtrer les réservations par date
    const bookingOnDate = bookings.find(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === date.toDateString();
    });
    if (bookingOnDate) {
      setSelectedBooking(bookingOnDate);
    }
  };

  const handleSlotSelect = (slot: any, date: Date) => {
    console.log('Créneau sélectionné:', slot, date);
    // Si le créneau a une réservation, l'afficher
    if (slot.booking) {
      setSelectedBooking(slot.booking);
    }
  };

  // ✅ NOUVEAU: Recharger les données après modification
  const refreshData = async () => {
    if (!coiffeurId) return;

    try {
      const [bookingsData, coiffeurData] = await Promise.all([
        bookingService.getCoiffeurBookings(coiffeurId),
        coiffeurService.getCoiffeur(coiffeurId).catch(() => null)
      ]);

      setBookings(bookingsData);
      setCoiffeur(coiffeurData);
      
      // ✅ NOUVEAU: Forcer le rafraîchissement de l'agenda si en mode calendrier
      // L'IntelligentCalendar se rafraîchira automatiquement via ses dépendances
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter !== 'all' && booking.status !== filter) {
      return false;
    }
    if (selectedDate) {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === selectedDate.toDateString();
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      case 'completed': return 'Terminé';
      default: return status;
    }
  };

  const getServiceName = (service: string | { name: string }): string => {
    if (typeof service === 'string') {
      return service;
    }
    return service.name;
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
        <p className="text-gray-600 mt-2">Chargement des réservations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-600 text-center">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4 mx-auto"
        >
          Réessayer
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle vue liste/calendrier */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Toutes ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'pending' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            En attente ({bookings.filter(b => b.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'confirmed' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Confirmées ({bookings.filter(b => b.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'completed' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Terminées ({bookings.filter(b => b.status === 'completed').length})
          </button>
        </div>

        {/* Toggle vue et mode */}
        <div className="flex gap-2">
          {/* ✅ NOUVEAU: Toggle mode salon/domicile (v0.7.17) */}
          {viewMode === 'calendar' && (
            <div className="flex gap-2 mr-4">
              <button
                onClick={() => setCalendarMode('salon')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  calendarMode === 'salon' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Salon
              </button>
              <button
                onClick={() => setCalendarMode('domicile')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  calendarMode === 'domicile' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Domicile
              </button>
            </div>
          )}
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <FaClock className="inline mr-2" />
            Liste
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'calendar' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <FaCalendarAlt className="inline mr-2" />
            Calendrier
          </button>
        </div>
      </div>

      {/* Vue calendrier ou liste */}
      {viewMode === 'calendar' ? (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Agenda des réservations</h3>
            <IntelligentCalendar
              coiffeurId={coiffeurId}
              isClient={false}
              onSlotSelect={handleSlotSelect}
              onDateSelect={handleDateSelect}
              mode={calendarMode}
              coiffeur={coiffeur ? {
                salonAddress: coiffeur.salonAddress
              } : undefined}
            />
          </Card>

          {/* Détails de la réservation sélectionnée */}
          {selectedBooking && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  Réservation #{selectedBooking._id.slice(-6)}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                  {getStatusText(selectedBooking.status)}
                </span>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FaUser className="text-accent" />
                    Informations client
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Nom:</span> {typeof selectedBooking.client === 'object' ? selectedBooking.client.name : 'N/A'}
                    </div>
                    <div>
                      <FaEnvelope className="inline mr-2 text-gray-500" />
                      {typeof selectedBooking.client === 'object' ? selectedBooking.client.email : 'N/A'}
                    </div>
                    {typeof selectedBooking.client === 'object' && selectedBooking.client.phone && (
                      <div>
                        <FaPhone className="inline mr-2 text-gray-500" />
                        {selectedBooking.client.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Service</h4>
                  <p className="text-lg font-medium">{getServiceName(selectedBooking.service)}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.duration} min - {selectedBooking.price}€</p>
                  {selectedBooking.platformFee && selectedBooking.coiffeurAmount && (
                    <div className="mt-2 text-xs text-gray-600">
                      <div>Commission TapHair: -{selectedBooking.platformFee.toFixed(2)}€</div>
                      <div className="font-semibold text-green-600">Vous recevez: {selectedBooking.coiffeurAmount.toFixed(2)}€</div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Date et heure</h4>
                  <p>{formatDate(selectedBooking.date)}</p>
                  <p>{formatTime(selectedBooking.date)}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-accent" />
                    Mode
                  </h4>
                  <p className="capitalize">{selectedBooking.mode}</p>
                  {selectedBooking.mode === 'domicile' && selectedBooking.address && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedBooking.address.street}, {selectedBooking.address.city} {selectedBooking.address.postalCode}
                    </p>
                  )}
                </div>

                {selectedBooking.notes && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-gray-700">{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  {selectedBooking.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleConfirmBooking(selectedBooking._id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <FaCheck className="mr-2" />
                        Confirmer
                      </Button>
                      <Button
                        onClick={() => handleCancelBooking(selectedBooking._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        <FaTimes className="mr-2" />
                        Refuser
                      </Button>
                    </>
                  )}
                  
                  {selectedBooking.status === 'confirmed' && (
                    <>
                      {/* ✅ NOUVEAU: Boutons de confirmation début/fin (v0.7.17) */}
                      {canConfirmServiceStart(selectedBooking.date, selectedBooking.duration) && (
                        <Button
                          onClick={() => {
                            setConfirmationType('service_start');
                            setShowConfirmationModal(true);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <FaCheck className="mr-2" />
                          Confirmer le début
                        </Button>
                      )}
                      {canConfirmServiceEnd(selectedBooking.date, selectedBooking.duration) && (
                        <Button
                          onClick={() => {
                            setConfirmationType('service_end');
                            setShowConfirmationModal(true);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <FaCheck className="mr-2" />
                          Confirmer la fin
                        </Button>
                      )}
                      <Button
                        onClick={() => handleCompleteBooking(selectedBooking._id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <FaCheck className="mr-2" />
                        Terminer
                      </Button>
                    </>
                  )}
                  
                  {/* ✅ NOUVEAU: Bouton signaler incident (v0.7.17) */}
                  {selectedBooking.status === 'completed' && (
                    <Button
                      onClick={() => setShowIncidentModal(true)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      Signaler un incident
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* Vue liste */
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-gray-600">
                Aucune réservation {filter !== 'all' ? `avec le statut "${getStatusText(filter)}"` : ''}
              </p>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card 
                key={booking._id} 
                className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Informations de base */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <FaCalendarAlt className="text-accent" />
                      <div>
                        <h3 className="font-semibold text-lg">{getServiceName(booking.service)}</h3>
                        <p className="text-gray-600">
                          {formatDate(booking.date)} à {formatTime(booking.date)}
                        </p>
                      </div>
                    </div>

                    {/* Informations client */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-3">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FaUser className="text-accent" />
                        Informations client
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Nom:</span>
                          <span>{typeof booking.client === 'object' ? booking.client.name : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="text-gray-500" />
                          <span>{typeof booking.client === 'object' ? booking.client.email : 'N/A'}</span>
                        </div>
                        {typeof booking.client === 'object' && booking.client.phone && (
                          <div className="flex items-center gap-2">
                            <FaPhone className="text-gray-500" />
                            <span>{booking.client.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FaClock className="text-gray-500" />
                          <span>{booking.duration} min - {booking.price}€</span>
                        </div>
                      </div>
                    </div>

                    {/* Détails de la réservation */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Mode:</span>
                        <span className="capitalize">{booking.mode}</span>
                      </div>
                      {booking.mode === 'domicile' && booking.address && (
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-gray-500" />
                          <span>{booking.address.street}, {booking.address.city}</span>
                        </div>
                      )}
                      {booking.notes && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Notes:</span>
                          <span>{booking.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-center ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                    
                    <div className="flex gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmBooking(booking._id);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <FaCheck className="mr-2" />
                            Confirmer
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelBooking(booking._id);
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                          >
                            <FaTimes className="mr-2" />
                            Refuser
                          </Button>
                        </>
                      )}
                      
                      {booking.status === 'confirmed' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteBooking(booking._id);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <FaCheck className="mr-2" />
                          Terminer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal détails réservation (pour vue liste) */}
      {viewMode === 'list' && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBooking(null)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Détails de la réservation</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FaUser className="text-accent" />
                    Informations client
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Nom:</span> {typeof selectedBooking.client === 'object' ? selectedBooking.client.name : 'N/A'}
                    </div>
                    <div>
                      <FaEnvelope className="inline mr-2 text-gray-500" />
                      {typeof selectedBooking.client === 'object' ? selectedBooking.client.email : 'N/A'}
                    </div>
                    {typeof selectedBooking.client === 'object' && selectedBooking.client.phone && (
                      <div>
                        <FaPhone className="inline mr-2 text-gray-500" />
                        {selectedBooking.client.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Service</h4>
                  <p className="text-lg font-medium">{getServiceName(selectedBooking.service)}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.duration} min - {selectedBooking.price}€</p>
                  {selectedBooking.platformFee && selectedBooking.coiffeurAmount && (
                    <div className="mt-2 text-xs text-gray-600">
                      <div>Commission TapHair (10%): -{selectedBooking.platformFee.toFixed(2)}€</div>
                      <div className="font-semibold text-green-600">Montant net à recevoir: {selectedBooking.coiffeurAmount.toFixed(2)}€</div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Date et heure</h4>
                  <p>{formatDate(selectedBooking.date)}</p>
                  <p>{formatTime(selectedBooking.date)}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-accent" />
                    Mode
                  </h4>
                  <p className="capitalize">{selectedBooking.mode}</p>
                  {selectedBooking.mode === 'domicile' && selectedBooking.address && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedBooking.address.street}, {selectedBooking.address.city} {selectedBooking.address.postalCode}
                    </p>
                  )}
                </div>

                {selectedBooking.notes && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-gray-700">{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  {selectedBooking.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => {
                          handleConfirmBooking(selectedBooking._id);
                          setSelectedBooking(null);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <FaCheck className="mr-2" />
                        Confirmer
                      </Button>
                      <Button
                        onClick={() => {
                          handleCancelBooking(selectedBooking._id);
                          setSelectedBooking(null);
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        <FaTimes className="mr-2" />
                        Refuser
                      </Button>
                    </>
                  )}
                  
                  {selectedBooking.status === 'confirmed' && (
                    <>
                      {/* ✅ NOUVEAU: Boutons de confirmation début/fin (v0.7.17) */}
                      {canConfirmServiceStart(selectedBooking.date, selectedBooking.duration) && (
                        <Button
                          onClick={() => {
                            setConfirmationType('service_start');
                            setShowConfirmationModal(true);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <FaCheck className="mr-2" />
                          Confirmer le début
                        </Button>
                      )}
                      {canConfirmServiceEnd(selectedBooking.date, selectedBooking.duration) && (
                        <Button
                          onClick={() => {
                            setConfirmationType('service_end');
                            setShowConfirmationModal(true);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <FaCheck className="mr-2" />
                          Confirmer la fin
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          handleCompleteBooking(selectedBooking._id);
                          setSelectedBooking(null);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <FaCheck className="mr-2" />
                        Terminer
                      </Button>
                    </>
                  )}
                  
                  {/* ✅ NOUVEAU: Bouton signaler incident (v0.7.17) */}
                  {selectedBooking.status === 'completed' && (
                    <Button
                      onClick={() => setShowIncidentModal(true)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      Signaler un incident
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ✅ NOUVEAU: Modals (v0.7.17) */}
      {showConfirmationModal && selectedBooking && (
        <ConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          bookingInfo={{
            serviceName: getServiceName(selectedBooking.service),
            date: selectedBooking.date,
            coiffeurName: coiffeur?.name,
            clientName: typeof selectedBooking.client === 'object' ? selectedBooking.client.name : 'N/A'
          }}
          type={confirmationType}
          onConfirm={async (data) => {
            // Logique de confirmation à implémenter selon le type
            console.log('Confirmation:', confirmationType, data);
            setShowConfirmationModal(false);
            await refreshData();
          }}
        />
      )}

      {showIncidentModal && selectedBooking && (
        <IncidentReportForm
          isOpen={showIncidentModal}
          onClose={() => setShowIncidentModal(false)}
          bookingId={selectedBooking._id}
          onSuccess={async () => {
            setShowIncidentModal(false);
            await refreshData();
          }}
          bookingInfo={{
            serviceName: getServiceName(selectedBooking.service),
            date: selectedBooking.date,
            coiffeurName: coiffeur?.name,
            clientName: typeof selectedBooking.client === 'object' ? selectedBooking.client.name : 'N/A'
          }}
        />
      )}
    </div>
  );
};

export default CoiffeurBookings;
