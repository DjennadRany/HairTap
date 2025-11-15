import React, { useState, useEffect } from 'react';

interface BackgroundVideoProps {
  className?: string;
}

const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ className = '' }) => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // URLs de vidéos qui fonctionnent vraiment
  const luxuryHairVideos = [
    // Vidéo simple qui fonctionne toujours
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    // Vidéos locales (test)
    '/videos/4178342-hd_1920_1080_30fps.mp4',
    '/videos/3998516-uhd_4096_2160_25fps.mp4',
  ];

  const handleVideoError = () => {
    console.error(`❌ ERREUR VIDÉO ${currentVideoIndex + 1}/${luxuryHairVideos.length}`);
    console.error(`❌ URL: ${luxuryHairVideos[currentVideoIndex]}`);
    console.error(`❌ Erreur complète:`, arguments);
    
    // Essayer la vidéo suivante
    if (currentVideoIndex < luxuryHairVideos.length - 1) {
      console.log(`🔄 Tentative avec la vidéo suivante...`);
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else {
      console.log('🚫 Toutes les vidéos ont échoué, utilisation du fallback gradient');
      setVideoError(true);
      setVideoLoaded(false);
    }
  };

  const handleVideoLoad = () => {
    console.log(`✅ VIDÉO CHARGÉE AVEC SUCCÈS !`);
    console.log(`✅ Index: ${currentVideoIndex + 1}/${luxuryHairVideos.length}`);
    console.log(`✅ URL: ${luxuryHairVideos[currentVideoIndex]}`);
    setVideoLoaded(true);
    setVideoError(false);
  };

  // Beau fond de remplacement fashion week avec couleurs sombres élégantes
  const fashionWeekGradient = "linear-gradient(135deg, #2c3e50 0%, #34495e 25%, #5d6d7e 50%, #85929e 75%, #aeb6bf 100%)";

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Fond de remplacement élégant */}
      <div 
        className="absolute inset-0 animate-gradient"
        style={{ 
          background: fashionWeekGradient,
          backgroundSize: '400% 400%'
        }}
      ></div>

      {/* Motif géométrique subtil */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, #ffffff 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, #ffffff 1px, transparent 1px),
            radial-gradient(circle at 40% 60%, #ffffff 1px, transparent 1px),
            radial-gradient(circle at 60% 40%, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}></div>
      </div>

      {/* Vidéo de fond avec fallback automatique */}
      <div className="absolute inset-0">
        {!videoError && (
          <video
            key={currentVideoIndex}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            onError={handleVideoError}
            onLoadStart={() => console.log(`🔄 CHARGEMENT VIDÉO ${currentVideoIndex + 1}...`)}
            onCanPlay={handleVideoLoad}
            onLoadedData={handleVideoLoad}
            onLoad={() => console.log(`📥 VIDÉO LOADED: ${currentVideoIndex + 1}`)}
            onPlay={() => console.log(`▶️ VIDÉO EN COURS DE LECTURE: ${currentVideoIndex + 1}`)}
            onPause={() => console.log(`⏸️ VIDÉO EN PAUSE: ${currentVideoIndex + 1}`)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1
            }}
          >
            <source src={luxuryHairVideos[currentVideoIndex]} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        )}
      </div>

      {/* Overlay sombre pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-black/30" style={{ zIndex: 2 }}></div>

      {/* Particules élégantes */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/30 rounded-full animate-float"></div>
        <div className="absolute top-3/4 right-1/3 w-0.5 h-0.5 bg-white/40 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white/25 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-0.5 h-0.5 bg-white/35 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/4 right-1/2 w-1 h-1 bg-white/20 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Lignes élégantes subtiles */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/30 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Indicateur de debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 z-30">
          <div className="px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
            {videoError ? '🚫 Gradient' : videoLoaded ? `✅ Vidéo ${currentVideoIndex + 1}` : `⏳ Chargement...`}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundVideo;
