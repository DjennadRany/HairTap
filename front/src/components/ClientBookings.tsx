import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Card } from './ui/card';
import { Button } from './ui/Button';
import { FaCalendarAlt, FaUser, FaCheck, FaTimes, FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { bookingService } from '../services/api/bookings';
import { reviewService } from '../services/api/reviews';
import BookingNotification from './BookingNotification';
import ReviewForm from './ReviewForm';
import Modal from './ui/Modal';
import { getImageUrl, handleImageError, DEFAULT_USER_IMAGE } from '../utils/imageUtils';
import type { User } from '../types/models';

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
}

const ClientBookings: React.FC = () => {
  const user = useSelector(selectCurrentUser) as User | null;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await bookingService.getClientBookings();
        setBookings(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Erreur lors du chargement des réservations');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      try {
        await bookingService.cancelBooking(bookingId, 'Annulé par le client');
        setBookings(prev => 
          prev.map(booking => 
            booking._id === bookingId 
              ? { ...booking, status: 'cancelled' as const }
              : booking
          )
        );
      } catch (error) {
        console.error('Error cancelling booking:', error);
      }
    }
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

      setShowReviewModal(false);
      setSelectedBooking(null);
      
      // Rafraîchir les réservations
      const updatedBookings = await bookingService.getClientBookings();
      setBookings(updatedBookings);
    } catch (error) {
      console.error('Error leaving review:', error);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
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

      {/* Notifications de validation - Version compacte et flottante */}
      {bookings.filter(b => b.status === 'confirmed' || b.status === 'cancelled' || b.status === 'completed').length > 0 && (
        <div className="fixed top-20 right-4 w-80 bg-white shadow-lg rounded-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
          </div>
          <div className="p-2">
            {bookings.filter(b => b.status === 'confirmed' || b.status === 'cancelled' || b.status === 'completed').slice(0, 5).map((booking) => (
              <div key={booking._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  {booking.status === 'confirmed' && <FaCheck className="text-green-600 text-xs" />}
                  {booking.status === 'cancelled' && <FaTimes className="text-red-600 text-xs" />}
                  {booking.status === 'completed' && <FaStar className="text-blue-600 text-xs" />}
                  <span className="text-xs font-medium truncate">{booking.service}</span>
                </div>
                <button
                  onClick={() => {
                    const element = document.getElementById(`booking-${booking._id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Voir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des réservations */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-gray-600">
              Aucune réservation {filter !== 'all' ? `avec le statut "${getStatusText(filter)}"` : ''}
            </p>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking._id} id={`booking-${booking._id}`} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Informations principales */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-accent mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg">{booking.service.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {new Date(booking.date).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(booking.date).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Status compact */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>

                  {/* Informations coiffeur et service */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <FaUser className="text-accent" />
                        Coiffeur
                      </h4>
                      <div className="flex items-center gap-3 mb-2">
                        {booking.coiffeur.photo ? (
                          <img 
                            src={getImageUrl(booking.coiffeur.photo, DEFAULT_USER_IMAGE)} 
                            alt={booking.coiffeur.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => handleImageError(e, DEFAULT_USER_IMAGE)}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <FaUser className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{booking.coiffeur.name}</div>
                          {booking.coiffeur.phone && (
                            <div className="text-sm text-gray-600">{booking.coiffeur.phone}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div><span className="font-medium">Prix:</span> {booking.price}€ ({booking.duration} min)</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <FaMapMarkerAlt className="text-accent" />
                        Détails
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Mode:</span> <span className="capitalize">{booking.mode}</span></div>
                        {booking.mode === 'domicile' && booking.address && (
                          <div><span className="font-medium">Adresse:</span> {booking.address.street}</div>
                        )}
                        {booking.notes && (
                          <div><span className="font-medium">Notes:</span> {booking.notes}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 min-w-[150px]">
                  {booking.status === 'pending' && (
                    <Button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-sm"
                    >
                      <FaTimes className="mr-2" />
                      Annuler
                    </Button>
                  )}
                  
                  {booking.status === 'completed' && (
                    <Button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowReviewModal(true);
                      }}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-sm"
                    >
                      <FaStar className="mr-2" />
                      Laisser un avis
                    </Button>
                  )}

                  {/* Bouton d'avis toujours visible pour les réservations terminées */}
                  {booking.status === 'completed' && (
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowReviewModal(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Donner mon avis
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal pour laisser un avis */}
      {showReviewModal && selectedBooking && (
        <Modal
          open={showReviewModal}
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
    </div>
  );
};

export default ClientBookings; 