import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Card } from './ui/card';
import { FaCalendarAlt, FaUsers, FaStar, FaEuroSign, FaClock } from 'react-icons/fa';
import { userService } from '../services/api/users';
import { bookingService } from '../services/api/bookings';
import type { User } from '../types/models';

interface DashboardProps {
  user: User;
  isCoiffeur?: boolean;
}

interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalClients: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user, isCoiffeur = false }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    upcomingBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalClients: 0
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (isCoiffeur) {
          // Données pour les coiffeurs
          const bookings = await bookingService.getCoiffeurBookings(user._id);
          const upcomingBookings = bookings.filter((b: any) => 
            new Date(b.date) > new Date() && b.status !== 'cancelled'
          );
          
          const totalRevenue = bookings
            .filter((b: any) => b.status === 'completed')
            .reduce((sum: number, b: any) => sum + (b.price || 0), 0);
          
          const uniqueClients = new Set(bookings.map((b: any) => b.client)).size;
          
          setStats({
            totalBookings: bookings.length,
            upcomingBookings: upcomingBookings.length,
            totalRevenue,
            averageRating: user.rating || 0,
            totalClients: uniqueClients
          });
          
          setRecentBookings(bookings.slice(0, 5));
        } else {
          // Données pour les clients
          const bookings = await bookingService.getClientBookings();
          const upcomingBookings = bookings.filter((b: any) => 
            new Date(b.date) > new Date() && b.status !== 'cancelled'
          );
          
          setStats({
            totalBookings: bookings.length,
            upcomingBookings: upcomingBookings.length,
            totalRevenue: 0, // Pas de revenus pour les clients
            averageRating: 0,
            totalClients: 0
          });
          
          setRecentBookings(bookings.slice(0, 5));
        }
      } catch (error: any) {
        // Ne pas afficher d'erreur si c'est une erreur d'authentification
        if (error?.response?.status !== 401) {
          console.error('Error fetching dashboard data:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user._id) {
      fetchDashboardData();
    }
  }, [user._id, isCoiffeur]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
        <p className="text-gray-600 mt-2">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          Bienvenue, {user.name} !
        </h1>
        <p className="text-gray-600">
          {isCoiffeur ? 'Gérez vos réservations et votre activité' : 'Suivez vos rendez-vous'}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Réservations totales</p>
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
            </div>
            <FaCalendarAlt className="text-accent text-2xl" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prochains rendez-vous</p>
              <p className="text-2xl font-bold">{stats.upcomingBookings}</p>
            </div>
            <FaClock className="text-green-500 text-2xl" />
          </div>
        </Card>

        {isCoiffeur && (
          <>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
                  <p className="text-2xl font-bold">{stats.totalRevenue}€</p>
                </div>
                <FaEuroSign className="text-green-500 text-2xl" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Note moyenne</p>
                  <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                </div>
                <FaStar className="text-yellow-500 text-2xl" />
              </div>
            </Card>
          </>
        )}

        {!isCoiffeur && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Coiffeurs favoris</p>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
              </div>
              <FaUsers className="text-blue-500 text-2xl" />
            </div>
          </Card>
        )}
      </div>

      {/* Réservations récentes */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Réservations récentes</h2>
        {recentBookings.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            Aucune réservation récente
          </p>
        ) : (
          <div className="space-y-4">
            {recentBookings.map((booking: any) => (
              <div key={booking._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <FaCalendarAlt className="text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">{booking.service}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.date).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(booking.date).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status === 'confirmed' ? 'Confirmé' :
                     booking.status === 'pending' ? 'En attente' :
                     booking.status === 'cancelled' ? 'Annulé' :
                     'Terminé'}
                  </span>
                  {isCoiffeur && (
                    <p className="text-sm text-gray-600 mt-1">{booking.price}€</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard; 