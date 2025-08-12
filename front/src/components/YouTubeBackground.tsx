import React, { useState, useEffect } from 'react';

interface YouTubeBackgroundProps {
  className?: string;
}

const YouTubeBackground: React.FC<YouTubeBackgroundProps> = ({ className = '' }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // IDs de vidéos YouTube de salons de coiffure
  const youtubeVideos = [
    // Vidéos de salons de coiffure sur YouTube
    'dQw4w9WgXcQ', // Exemple - remplacez par de vraies vidéos de coiffure
    'jNQXAC9IVRw', // Exemple - remplacez par de vraies vidéos de coiffure
    '9bZkp7q19f0', // Exemple - remplacez par de vraies vidéos de coiffure
  ];

  useEffect(() => {
    // Changer de vidéo toutes les 30 secondes
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % youtubeVideos.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [youtubeVideos.length]);

  // Beau fond de remplacement fashion week avec couleurs sombres élégantes
  const fashionWeekGradient = "linear-gradient(135deg, #2c3e50 0%, #34495e 25%, #5d6d7e 50%, #85929e 75%, #aeb6bf 100%)";

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Fond de remplacement fashion week élégant avec couleurs sombres */}
      <div 
        className="absolute inset-0 animate-gradient"
        style={{ 
          background: fashionWeekGradient,
          backgroundSize: '400% 400%'
        }}
      ></div>

      {/* Vidéo YouTube en fond */}
      <div className="absolute inset-0">
        <iframe
          key={currentVideoIndex}
          src={`https://www.youtube.com/embed/${youtubeVideos[currentVideoIndex]}?autoplay=1&mute=1&loop=1&playlist=${youtubeVideos[currentVideoIndex]}&controls=0&showinfo=0&rel=0&modestbranding=1&enablejsapi=1&version=3&playerapiid=ytplayer&origin=${window.location.origin}`}
          className="w-full h-full"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            zIndex: 1
          }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>

      {/* Motif géométrique subtil fashion week */}
      <div className="absolute inset-0 opacity-10" style={{ zIndex: 2 }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, #ecf0f1 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, #ecf0f1 1px, transparent 1px),
            radial-gradient(circle at 40% 60%, #ecf0f1 1px, transparent 1px),
            radial-gradient(circle at 60% 40%, #ecf0f1 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}></div>
      </div>

      {/* Overlay sombre pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-black/30" style={{ zIndex: 3 }}></div>

      {/* Particules élégantes fashion week */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/30 rounded-full animate-float"></div>
        <div className="absolute top-3/4 right-1/3 w-0.5 h-0.5 bg-white/40 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white/25 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-0.5 h-0.5 bg-white/35 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/4 right-1/2 w-1 h-1 bg-white/20 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Lignes élégantes subtiles */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/30 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Indicateur de debug (optionnel) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 z-30">
          <div className="px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
            YouTube {currentVideoIndex + 1}/{youtubeVideos.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeBackground; 