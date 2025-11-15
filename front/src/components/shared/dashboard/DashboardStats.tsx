import React from 'react';
import { FaChartLine, FaUsers, FaStar, FaHeart, FaShoppingCart, FaBox } from 'react-icons/fa';

interface DashboardStatsProps {
  stats: {
    revenue: number;
    clients: number;
    rating: number;
    likes: number;
    profileViews?: number;
    productRevenue?: number;
    totalOrders?: number;
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
      
      {stats.productRevenue !== undefined && (
        <div className="bg-fashion-light-gray rounded-lg shadow p-6 flex flex-col items-center">
          <FaShoppingCart className="text-green-500 text-2xl mb-2" />
          <span className="text-3xl font-bold">{stats.productRevenue}€</span>
          <span className="text-gray-600 mt-2">Ventes produits</span>
        </div>
      )}
      
      {stats.totalOrders !== undefined && (
        <div className="bg-fashion-light-gray rounded-lg shadow p-6 flex flex-col items-center">
          <FaBox className="text-purple-500 text-2xl mb-2" />
          <span className="text-3xl font-bold">{stats.totalOrders}</span>
          <span className="text-gray-600 mt-2">Commandes</span>
        </div>
      )}
    </div>
  );
};

export default DashboardStats; 