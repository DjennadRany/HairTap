import React from 'react';
import { Link } from 'react-router-dom';
import LocalVideoBackground from '../components/LocalVideoBackground';
import { FaSearch, FaUser, FaArrowRight, FaPlay } from 'react-icons/fa';

function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Vidéo en arrière-plan */}
      <LocalVideoBackground />
      
      {/* Overlay pour la lisibilité */}
      <div className="absolute inset-0 bg-black/20 z-10"></div>
      
      {/* Contenu principal */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo et titre */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-elegant font-bold text-white mb-4 tracking-tight drop-shadow-lg">
            TapHair
          </h1>
          <p className="text-xl md:text-2xl text-white font-fashion font-light mb-8 max-w-2xl drop-shadow-md">
            Découvrez l'excellence de la coiffure. 
            <br />
            <span className="text-white font-medium">Votre style, notre passion.</span>
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-6 mb-12 animate-slide-up">
          <Link
            to="/search"
            className="group relative px-8 py-4 bg-black text-white rounded-full font-fashion font-medium text-lg hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <FaSearch className="text-xl" />
              <span>Rechercher un coiffeur</span>
              <FaArrowRight className="text-lg group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </Link>

          <Link
            to="/login"
            className="group relative px-8 py-4 bg-fashion-light-gray/20 backdrop-blur-md text-white border-2 border-white/50 rounded-full font-fashion font-medium text-lg hover:bg-fashion-light-gray/30 hover:border-white/70 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <FaUser className="text-xl" />
              <span>Se connecter</span>
            </div>
          </Link>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">500+</div>
            <div className="text-white font-fashion drop-shadow-md">Coiffeurs experts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">10k+</div>
            <div className="text-white font-fashion drop-shadow-md">Clients satisfaits</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">50+</div>
            <div className="text-white font-fashion drop-shadow-md">Villes couvertes</div>
          </div>
        </div>

        {/* Call-to-action secondaire */}
        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <p className="text-white font-fashion text-lg mb-4 drop-shadow-md">
            Prêt à transformer votre style ?
          </p>
          <button className="inline-flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-300">
            <FaPlay className="text-sm" />
            <span className="font-fashion">Découvrir nos services</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage; 