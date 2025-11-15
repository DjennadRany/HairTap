import React from 'react';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Navigate } from 'react-router-dom';
import CoiffeurBookings from '../components/CoiffeurBookings';
import type { User } from '../types/models';

const CoiffeurReservationsPage: React.FC = () => {
  const user = useAppSelector(selectCurrentUser) as User | null;

  if (!user || user.role !== 'coiffeur') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mes Réservations</h1>
        <p className="text-gray-600">
          Gérez vos réservations et confirmez vos rendez-vous
        </p>
      </div>
      
      <CoiffeurBookings coiffeurId={user._id} />
    </div>
  );
};

export default CoiffeurReservationsPage;
