import React from 'react';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/slices/authSlice';
import ClientBookings from '../components/pages/ClientBookings/ClientBookings';
import type { User } from '../types/models';

const ClientBookingsPage: React.FC = () => {
  const user = useAppSelector(selectCurrentUser) as User | null;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mes Réservations</h1>
        <p className="text-gray-600">
          Suivez vos rendez-vous et recevez les notifications de validation
        </p>
      </div>
      
      <ClientBookings />
    </div>
  );
};

export default ClientBookingsPage;