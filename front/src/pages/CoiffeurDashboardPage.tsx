import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import Dashboard from '../components/Dashboard';
import ServiceManager from '../components/ServiceManager';
import CoiffeurBookings from '../components/CoiffeurBookings';
import TimeChangeRequestsManager from '../components/coiffeur/TimeChangeRequestsManager';

import { Card } from '../components/ui/card';
import { FaChartBar, FaCog, FaCalendarAlt, FaUsers, FaStar, FaEuroSign } from 'react-icons/fa';
import type { User } from '../types/models';

const CoiffeurDashboardPage = () => {
  const user = useSelector(selectCurrentUser) as User | null;
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'bookings' | 'timeChanges'>('overview');

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
      {/* En-tête avec onglets */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-fashion-dark-gray text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaChartBar className="inline mr-2" />
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'bookings'
                  ? 'bg-fashion-dark-gray text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaCalendarAlt className="inline mr-2" />
              Réservations
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'services'
                  ? 'bg-fashion-dark-gray text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaCog className="inline mr-2" />
              Mes Services
            </button>
            <button
              onClick={() => setActiveTab('timeChanges')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'timeChanges'
                  ? 'bg-fashion-dark-gray text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaCalendarAlt className="inline mr-2" />
              Modifications d'horaire
            </button>
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 gap-6">
          <Dashboard user={user} isCoiffeur={true} />
        </div>
      ) : activeTab === 'bookings' ? (
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Gestion des réservations</h2>
            <CoiffeurBookings coiffeurId={user._id} />
          </Card>
        </div>
      ) : activeTab === 'timeChanges' ? (
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Demandes de modification d'horaire</h2>
            <TimeChangeRequestsManager coiffeurId={user._id} />
          </Card>
        </div>
      ) : (
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Gestion des services</h2>
            <ServiceManager coiffeurId={user._id} isOwner={true} />
          </Card>
        </div>
      )}
    </div>
  );
};

export default CoiffeurDashboardPage; 