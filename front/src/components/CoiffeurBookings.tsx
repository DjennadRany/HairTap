import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/Button';
import { FaCalendarAlt, FaUser, FaPhone, FaEnvelope, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import { bookingService } from '../services/api/bookings';
import type { User } from '../types/models';

interface Booking {
  _id: string;
  client: User;
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

interface CoiffeurBookingsProps {
  coiffeurId: string;
}

const CoiffeurBookings: React.FC<CoiffeurBookingsProps> = ({ coiffeurId }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getCoiffeurBookings(coiffeurId);
        setBookings(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Erreur lors du chargement des réservations');
      } finally {
        setLoading(false);
      }
    };

    if (coiffeurId) {
      fetchBookings();
    }
  }, [coiffeurId]);

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await bookingService.confirmBooking(bookingId);
      setBookings(prev => 
        prev.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: 'confirmed' as const }
            : booking
        )
      );
    } catch (error) {
      console.error('Error confirming booking:', error);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      try {
        await bookingService.cancelBooking(bookingId, 'Annulé par le coiffeur');
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

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      await bookingService.completeBooking(bookingId);
      setBookings(prev => 
        prev.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: 'completed' as const }
            : booking
        )
      );
    } catch (error) {
      console.error('Error completing booking:', error);
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
            <Card key={booking._id} className="p-6">
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

                  {/* Informations client */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-3">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FaUser className="text-accent" />
                      Informations client
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Nom:</span>
                        <span>{booking.client.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaEnvelope className="text-gray-500" />
                        <span>{booking.client.email}</span>
                      </div>
                      {booking.client.phone && (
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
                      <>
                        <Button
                          onClick={() => handleConfirmBooking(booking._id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <FaCheck className="mr-2" />
                          Confirmer
                        </Button>
                        <Button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          <FaTimes className="mr-2" />
                          Refuser
                        </Button>
                      </>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <Button
                        onClick={() => handleCompleteBooking(booking._id)}
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
    </div>
  );
};

export default CoiffeurBookings; 