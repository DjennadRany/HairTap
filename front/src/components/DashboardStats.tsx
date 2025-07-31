import React from 'react';
import { FaChartLine, FaUsers, FaStar, FaHeart } from 'react-icons/fa';

interface DashboardStatsProps {
  stats: {
    revenue: number;
    clients: number;
    rating: number;
    likes: number;
    profileViews?: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-fashion-light-gray rounded-lg shadow p-6 flex flex-col items-center">
        <FaChartLine className="text-accent text-2xl mb-2" />
        <span className="text-3xl font-bold text-accent">{stats.revenue}€</span>
        <span className="text-gray-600 mt-2">Revenus estimés</span>
      </div>
      
      <div className="bg-fashion-light-gray rounded-lg shadow p-6 flex flex-col items-center">
        <FaUsers className="text-blue-500 text-2xl mb-2" />
        <span className="text-3xl font-bold">{stats.clients}</span>
        <span className="text-gray-600 mt-2">Prestations</span>
      </div>
      
      <div className="bg-fashion-light-gray rounded-lg shadow p-6 flex flex-col items-center">
        <FaStar className="text-yellow-500 text-2xl mb-2" />
        <span className="text-3xl font-bold">{stats.rating}★</span>
        <span className="text-gray-600 mt-2">Note moyenne</span>
      </div>
      
      <div className="bg-fashion-light-gray rounded-lg shadow p-6 flex flex-col items-center">
        <FaHeart className="text-red-500 text-2xl mb-2" />
        <span className="text-3xl font-bold">{stats.likes}</span>
        <span className="text-gray-600 mt-2">Likes</span>
      </div>
    </div>
  );
};

export default DashboardStats; 