import React from 'react';
import { selectCurrentUser } from '../store/slices/authSlice';
import Dashboard from '../components/Dashboard';
import type { User } from '../types/models';
import { useAppSelector } from '../store/hooks';

const ClientDashboardPage = () => {
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
      <Dashboard user={user} isCoiffeur={false} />
    </div>
  );
};

export default ClientDashboardPage; 