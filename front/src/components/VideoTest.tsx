import React, { useState } from 'react';

interface VideoTestProps {
  className?: string;
  showStatus?: boolean;
  videoSrc?: string;
}

const VideoTest: React.FC<VideoTestProps> = ({ 
  className = '', 
  showStatus = true,
  videoSrc = "/src/assets/videos/6144280-uhd_4096_2160_25fps.mp4"
}) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setVideoError(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
    setVideoLoaded(false);
  };

  return (
    <div className={`absolute inset-0 w-full h-full ${className}`}>
      <video
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        onError={handleVideoError}
        onCanPlay={handleVideoLoad}
        onLoadedData={handleVideoLoad}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
      
      {/* Indicateur de statut conditionnel */}
      {showStatus && (
        <div className="absolute top-4 left-4 z-30">
          <div className="px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
            {videoError ? '❌ Erreur' : videoLoaded ? '✅ Chargée' : '⏳ Chargement...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTest;
