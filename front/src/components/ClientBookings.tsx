import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Card } from './ui/card';
import { Button } from './ui/Button';
import { FaCalendarAlt, FaUser, FaCheck, FaTimes, FaStar } from 'react-icons/fa';
import { bookingService } from '../services/api/bookings';
import { reviewService } from '../services/api/reviews';
import BookingNotification from './BookingNotification';
import ReviewForm from './ReviewForm';
import Modal from './ui/Modal';
import type { User } from '../types/models';

interface Booking {
  _id: string;
  coiffeur: User;
  service: string;
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
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
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
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Toutes ({bookings.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'pending' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          En attente ({bookings.filter(b => b.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'confirmed' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Confirmées ({bookings.filter(b => b.status === 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'completed' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Terminées ({bookings.filter(b => b.status === 'completed').length})
        </button>
      </div>

      {/* Notifications de validation */}
      {bookings.filter(b => b.status === 'confirmed' || b.status === 'cancelled' || b.status === 'completed').map((booking) => (
        <BookingNotification
          key={booking._id}
          booking={booking}
          onViewDetails={() => {
            // Scroll to booking
            const element = document.getElementById(`booking-${booking._id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
      ))}

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
            <Card key={booking._id} id={`booking-${booking._id}`} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Informations de base */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <FaCalendarAlt className="text-accent" />
                    <div>
                      <h3 className="font-semibold text-lg">{booking.service}</h3>
                      <p className="text-gray-600">
                        {new Date(booking.date).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(booking.date).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Informations coiffeur */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-3">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FaUser className="text-accent" />
                      Coiffeur
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Nom:</span>
                        <span>{booking.coiffeur.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Email:</span>
                        <span>{booking.coiffeur.email}</span>
                      </div>
                      {booking.coiffeur.phone && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Téléphone:</span>
                          <span>{booking.coiffeur.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Prix:</span>
                        <span>{booking.price}€ ({booking.duration} min)</span>
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
                        <span className="font-medium">Adresse:</span>
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
                      <Button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
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
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                      >
                        <FaStar className="mr-2" />
                        Laisser un avis
                      </Button>
                    )}
                  </div>
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