import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCut, FaArrowRight } from 'react-icons/fa';
import BackgroundVideo from '../components/BackgroundVideo';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Vidéo de fond */}
      <BackgroundVideo />
      
      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Logo et titre principal */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-4xl font-bold text-white">TH</span>
            </div>
          </div>
          <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-pink-400 via-purple-500 to-pink-600 bg-clip-text text-transparent mb-6">
            TapHair
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 max-w-4xl mx-auto leading-relaxed mb-4">
            Découvrez les plus belles coupes et trouvez votre coiffeur idéal
          </p>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Rejoignez notre communauté de professionnels et clients passionnés de coiffure
          </p>
        </div>

        {/* Choix du rôle - Section principale */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Comment souhaitez-vous utiliser TapHair ?
          </h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            {/* Carte Client */}
            <div 
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 flex flex-col items-center max-w-sm w-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
              onClick={() => navigate('/signin/client')}
            >
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <FaUser className="text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Je suis un Client</h3>
              <p className="text-white/80 text-center mb-6">
                Trouvez votre coiffeur idéal, réservez facilement et découvrez les dernières tendances.
              </p>
              <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors duration-300">
                Commencer <FaArrowRight className="ml-2" />
              </button>
            </div>

            {/* Carte Coiffeur */}
            <div 
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 flex flex-col items-center max-w-sm w-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
              onClick={() => navigate('/signin/coiffeur')}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <FaCut className="text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Je suis un Coiffeur</h3>
              <p className="text-white/80 text-center mb-6">
                Développez votre clientèle, gérez vos réservations et montrez votre talent.
              </p>
              <button className="flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium hover:from-pink-600 hover:to-purple-700 transition-colors duration-300">
                Commencer <FaArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Section Découverte sans inscription */}
        <div className="text-white/70 text-lg mb-8">
          Vous n'êtes pas encore prêt à vous inscrire ?
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/hub?tab=gallery')}
            className="group flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            Explorer la galerie <FaArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/hub?tab=coiffeurs')}
            className="group flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            Rechercher un coiffeur <FaArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;