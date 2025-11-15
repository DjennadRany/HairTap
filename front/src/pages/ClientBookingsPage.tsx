import React, { useState, useEffect } from 'react';
import { selectCurrentUser } from '../store/slices/authSlice';
import { useAppSelector } from '../store/hooks';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { FaCalendarAlt, FaClock, FaUser, FaCheck, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import { bookingService } from '../services/api/bookings';
import { getImageUrl, handleImageError, DEFAULT_USER_IMAGE } from '../utils/imageUtils';
import CancelBookingModal from '../components/modals/CancelBookingModal';
import TimeChangeModal from '../components/modals/TimeChangeModal';
import type { User } from '../types/models';

// Interface locale pour l'affichage
interface BookingDisplay {
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
}

const ClientBookingsPage: React.FC = () => {
  const user = useAppSelector(selectCurrentUser) as User | null;
  const [bookings, setBookings] = useState<BookingDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'upcoming' | 'past'>('upcoming');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDisplay | null>(null);

  // Charger les vraies réservations depuis l'API
  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const bookingsData = await bookingService.getClientBookings();
        console.log('📅 Réservations chargées:', bookingsData);
        // Convertir les données API vers le format d'affichage
        const displayBookings: BookingDisplay[] = bookingsData.map((booking: any) => ({
          _id: booking._id,
          coiffeur: booking.coiffeur,
          service: booking.service,
          date: booking.date,
          duration: booking.duration,
          price: booking.price,
          status: booking.status,
          mode: booking.mode,
          address: booking.address,
          notes: booking.notes,
          createdAt: booking.createdAt
        }));
        setBookings(displayBookings);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des réservations:', error);
        setError('Erreur lors du chargement des réservations');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadBookings();
    }
  }, [user]);

  const getStatusColor = (status: BookingDisplay['status']) => {
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

  const getStatusIcon = (status: BookingDisplay['status']) => {
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

  const getStatusText = (status: BookingDisplay['status']) => {
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

  // Filtrer les réservations selon le mode de vue et le statut
  const filteredBookings = bookings.filter(booking => {
    const now = new Date();
    const bookingDate = new Date(booking.date);
    
    // Filtrer par mode de vue (à venir vs passées)
    if (viewMode === 'upcoming' && bookingDate < now) {
      return false;
    }
    if (viewMode === 'past' && bookingDate >= now) {
      return false;
    }
    
    // Filtrer par statut
    if (filterStatus !== 'all' && booking.status !== filterStatus) {
      return false;
    }
    
    return true;
  });

  const upcomingCount = bookings.filter(booking => new Date(booking.date) >= new Date()).length;
  const pastCount = bookings.filter(booking => new Date(booking.date) < new Date()).length;

  const handleCancelBooking = (booking: BookingDisplay) => {
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

  const handleEditBooking = (booking: BookingDisplay) => {
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    // Recharger les réservations après modification
    const loadBookings = async () => {
      try {
        const bookingsData = await bookingService.getClientBookings();
        // Convertir les données API vers le format d'affichage
        const displayBookings: BookingDisplay[] = bookingsData.map((booking: any) => ({
          _id: booking._id,
          coiffeur: booking.coiffeur,
          service: booking.service,
          date: booking.date,
          duration: booking.duration,
          price: booking.price,
          status: booking.status,
          mode: booking.mode,
          address: booking.address,
          notes: booking.notes,
          createdAt: booking.createdAt
        }));
        setBookings(displayBookings);
      } catch (error) {
        console.error('Erreur lors du rechargement:', error);
      }
    };
    loadBookings();
  };

  if (!user) {
    return <div>Veuillez vous connecter.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Réservations</h1>
            <p className="text-gray-600">Gérez vos rendez-vous et suivez vos réservations</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
        </div>

        {/* Message d'erreur */}
        {error && (
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
        )}

        {/* Liste des réservations */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des réservations...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <FaCalendarAlt className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {viewMode === 'upcoming' ? 'Aucune réservation à venir' : 'Aucune réservation passée'}
            </h3>
            <p className="text-gray-500">
              {viewMode === 'upcoming' 
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
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {booking.service.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          Réservation #{booking._id.slice(-6)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-medium">{booking.price}€</span>
                          <span>{booking.duration} min</span>
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {getStatusText(booking.status)}
                      </span>
                    </div>

                    {/* Détails de la réservation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaCalendarAlt className="text-blue-500" />
                        <span>{formatDate(booking.date)} à {formatTime(booking.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaMapMarkerAlt className="text-green-500" />
                        <span className="capitalize">{booking.mode === 'salon' ? 'Mode Salon' : 'À domicile'}</span>
                      </div>
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
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

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
      </div>
    </div>
  );
};

export default ClientBookingsPage;