import React, { useState } from 'react';
import { FaImages, FaUserTie, FaSearch, FaFilter, FaMapMarkerAlt } from 'react-icons/fa';
import { GalleryHub } from './GalleryHub';
import { SearchPage } from '../features/search/presentation/SearchPage';

type HubTab = 'gallery' | 'coiffeurs';

export const MainHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HubTab>('gallery');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête principal */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center py-8 space-y-6">
            {/* Logo et titre */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">TH</span>
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  TapHair
                </h1>
              </div>
              <p className="text-xl text-gray-600 max-w-2xl">
                Découvrez les plus belles coupes et trouvez votre coiffeur idéal
              </p>
            </div>

            {/* Onglets de navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'gallery'
                    ? 'bg-white text-pink-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <FaImages className="w-5 h-5" />
                <span>Galerie des Services</span>
              </button>
              <button
                onClick={() => setActiveTab('coiffeurs')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'coiffeurs'
                    ? 'bg-white text-pink-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <FaUserTie className="w-5 h-5" />
                <span>Rechercher des Coiffeurs</span>
              </button>
            </div>

            {/* Description de l'onglet actif */}
            <div className="text-center">
              {activeTab === 'gallery' ? (
                <p className="text-gray-500">
                  Explorez notre collection de coupes et styles pour trouver l'inspiration
                </p>
              ) : (
                <p className="text-gray-500">
                  Trouvez le coiffeur parfait selon vos besoins et votre localisation
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'gallery' ? (
          <GalleryHub />
        ) : (
          <SearchPage />
        )}
      </div>
    </div>
  );
};
