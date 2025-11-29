import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/Button';
import { FaCalendarAlt, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { bookingService } from '../services/api/bookings';
import { coiffeurService } from '../services/api/coiffeurs';
import { IntelligentCalendar } from './calendar/IntelligentCalendar';
import BookingActionModal from './modals/BookingActionModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { User } from '../types/models';
import { formatTime } from '../utils/timeUtils';

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
  time?: string; // ✅ CORRECTION: Ajouter le champ time
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
  const [showActionModal, setShowActionModal] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      if (!coiffeurId) {
        setError('ID du coiffeur manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [bookingsData, coiffeurData] = await Promise.all([
          bookingService.getCoiffeurBookings(coiffeurId).catch(() => []),
          coiffeurService.getCoiffeur(coiffeurId).catch(() => null)
        ]);

        setBookings(bookingsData || []);
        setCoiffeur(coiffeurData);
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || 'Erreur lors du chargement des données';
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`, {
          position: 'top-right',
          autoClose: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coiffeurId]);

  const handleActionComplete = useCallback(async () => {
    try {
      const bookingsData = await bookingService.getCoiffeurBookings(coiffeurId);
      setBookings(bookingsData || []);
      if (selectedBooking) {
        const updated = bookingsData?.find(b => b._id === selectedBooking._id);
        if (updated) {
          setSelectedBooking(updated);
        }
      }
    } catch (error: any) {
      console.error('Erreur lors du rafraîchissement:', error);
    }
  }, [coiffeurId, selectedBooking]);

  // SSE pour synchronisation temps réel
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !coiffeurId) {
      return;
    }

    const handleEvent = async (event: any) => {
      if (event.coiffeurId !== coiffeurId) {
        return;
      }

      // Rafraîchir les réservations
      try {
        const bookingsData = await bookingService.getCoiffeurBookings(coiffeurId);
        setBookings(bookingsData || []);
      } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error);
      }

      // Afficher notifications selon le type d'événement
      switch (event.type) {
        case 'booking:created':
          toast.info('Nouvelle réservation en attente', {
            position: 'top-right',
            autoClose: 4000
          });
          break;

        case 'booking:cancelled':
          toast.warning('Réservation annulée par le client', {
            position: 'top-right',
            autoClose: 5000
          });
          break;

        case 'booking:updated':
          toast.info('Réservation mise à jour', {
            position: 'top-right',
            autoClose: 3000
          });
          break;
      }
    };

    import('../services/api/bookingEvents').then(({ bookingEventService }) => {
      bookingEventService.connect(token, handleEvent);
    });

    return () => {
      import('../services/api/bookingEvents').then(({ bookingEventService }) => {
        bookingEventService.removeHandler(handleEvent);
      });
    };
  }, [coiffeurId]);


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

  const handleSlotSelect = (slot: any) => {
    if (slot.booking) {
      setSelectedBooking(slot.booking);
    }
  };


  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Filtre par statut
      if (filter !== 'all' && booking.status !== filter) {
        return false;
      }
      
      // Filtre par date si une date est sélectionnée
      if (selectedDate) {
        const bookingDate = new Date(booking.date);
        const selected = new Date(selectedDate);
        bookingDate.setHours(0, 0, 0, 0);
        selected.setHours(0, 0, 0, 0);
        if (bookingDate.getTime() !== selected.getTime()) {
          return false;
        }
      }
      
      // Filtre par mode (salon/domicile) si en mode calendrier
      if (viewMode === 'calendar' && calendarMode) {
        if (booking.mode !== calendarMode) {
          return false;
        }
      }
      
      return true;
    });
  }, [bookings, filter, selectedDate, viewMode, calendarMode]);

  const bookingCounts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length
    };
  }, [bookings]);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return `px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-300'}`;
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

  const getActionButtonClass = (status: string) => {
    const base = 'flex-1 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed';
    const styles = {
      pending: `${base} bg-yellow-500 hover:bg-yellow-600 text-white`,
      confirmed: `${base} bg-blue-500 hover:bg-blue-600 text-white`,
      completed: `${base} bg-gray-500 hover:bg-gray-600 text-white`,
      cancelled: `${base} bg-gray-400 text-white cursor-not-allowed`
    };
    return styles[status as keyof typeof styles] || `${base} bg-gray-400 text-white`;
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

  // ✅ CORRECTION: Utiliser booking.time si disponible, sinon extraire de booking.date
  const getBookingTime = (booking: Booking): string => {
    if (booking.time) {
      return formatTime(booking.time);
    }
    // Extraire l'heure de booking.date (qui contient déjà l'heure complète)
    const bookingDate = new Date(booking.date);
    const hours = bookingDate.getHours();
    const minutes = bookingDate.getMinutes();
    return formatTime(hours + (minutes / 60));
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
            Toutes ({bookingCounts.all})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'pending' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            En attente ({bookingCounts.pending})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'confirmed' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Confirmées ({bookingCounts.confirmed})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'completed' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Terminées ({bookingCounts.completed})
          </button>
        </div>

        {/* Toggle vue et mode */}
        <div className="flex gap-2">
          {/* Toggle mode salon/domicile */}
          {viewMode === 'calendar' && (
            <div className="flex gap-2 mr-4">
              <button
                onClick={() => {
                  setCalendarMode('salon');
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  calendarMode === 'salon' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Salon
              </button>
              <button
                onClick={() => {
                  setCalendarMode('domicile');
                }}
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
              key={`calendar-${calendarMode}`}
            />
          </Card>

          {/* Détails des réservations du jour sélectionné */}
          {selectedDate && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  Réservations du {formatDate(selectedDate.toISOString())}
                </h3>
                <span className="text-sm text-gray-600">
                  {filteredBookings.filter(b => {
                    const bookingDate = new Date(b.date);
                    return bookingDate.toDateString() === selectedDate.toDateString();
                  }).length} réservation(s)
                </span>
              </div>
              
              {/* Liste de toutes les réservations du jour */}
              <div className="space-y-4">
                {filteredBookings
                  .filter(b => {
                    const bookingDate = new Date(b.date);
                    return bookingDate.toDateString() === selectedDate.toDateString();
                  })
                  .map((booking) => (
                    <div
                      key={booking._id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedBooking?._id === booking._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{getServiceName(booking.service)}</p>
                          <p className="text-sm text-gray-600">{getBookingTime(booking)}</p>
                          <p className="text-xs text-gray-500 capitalize">{booking.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{booking.price}€</p>
                          <p className="text-xs text-gray-500 capitalize">{booking.mode}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
          
          {/* Détails de la réservation sélectionnée */}
          {selectedBooking && !selectedDate && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  Réservation #{selectedBooking._id.slice(-6)}
                </h3>
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
                  <p>{getBookingTime(selectedBooking)}</p>
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

                <div className="flex flex-col gap-2 pt-4">
                  <p className="text-sm text-gray-600 font-medium">La réservation est :</p>
                  {selectedBooking.status !== 'cancelled' && (
                    <Button
                      onClick={() => {
                        setShowActionModal(true);
                      }}
                      className={getActionButtonClass(selectedBooking.status)}
                    >
                      {getStatusText(selectedBooking.status)}
                    </Button>
                  )}
                  {selectedBooking.status === 'cancelled' && (
                    <span className={getStatusBadge(selectedBooking.status)}>
                      {getStatusText(selectedBooking.status)}
                    </span>
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
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Informations de base */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <FaCalendarAlt className="text-accent" />
                      <div>
                        <h3 className="font-semibold text-lg">{getServiceName(booking.service)}</h3>
                        <p className="text-gray-600">
                          {formatDate(booking.date)} à {getBookingTime(booking)}
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

                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <p className="text-sm text-gray-600 font-medium">La réservation est :</p>
                    {booking.status !== 'cancelled' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(booking);
                          setShowActionModal(true);
                        }}
                        className={getActionButtonClass(booking.status)}
                      >
                        {getStatusText(booking.status)}
                      </Button>
                    )}
                    {booking.status === 'cancelled' && (
                      <span className={getStatusBadge(booking.status)}>
                        {getStatusText(booking.status)}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}


      {showActionModal && selectedBooking && (
        <BookingActionModal
          isOpen={showActionModal}
          onClose={() => {
            setShowActionModal(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          coiffeurName={coiffeur?.name}
          onActionComplete={handleActionComplete}
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

export default CoiffeurBookings;
