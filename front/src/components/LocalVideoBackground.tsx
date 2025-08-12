import React, { useState, useEffect } from 'react';
import '../styles/video-transitions.css';

interface LocalVideoBackgroundProps {
  className?: string;
}

const LocalVideoBackground: React.FC<LocalVideoBackgroundProps> = ({ className = '' }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Vos vraies vidéos du dossier public/videos
  const localVideos = [
    '/videos/6144280-uhd_4096_2160_25fps.mp4',
    '/videos/7305158-uhd_4096_2160_25fps.mp4',
    '/videos/3996972-uhd_4096_2160_25fps.mp4',
    '/videos/3996895-uhd_4096_2160_25fps.mp4',
    '/videos/4498965-uhd_3840_2160_25fps.mp4',
    '/videos/3997028-uhd_4096_2160_25fps.mp4',
    '/videos/3998455-uhd_4096_2160_25fps.mp4',
    '/videos/4178342-hd_1920_1080_30fps.mp4',
    '/videos/3996900-uhd_4096_2160_25fps.mp4',
    '/videos/3998516-uhd_4096_2160_25fps.mp4',
    '/videos/3997198-uhd_4096_2160_25fps.mp4',
  ];

  useEffect(() => {
    // Changer de vidéo toutes les 5 secondes avec transition UX-friendly
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      // Attendre pour l'animation de fade-out UX-friendly
      setTimeout(() => {
        setCurrentVideoIndex((prev) => (prev + 1) % localVideos.length);
        setIsTransitioning(false);
      }, 800); // Durée de la transition
    }, 5000);

    return () => clearInterval(interval);
  }, [localVideos.length]);

  return (
    <div className={`absolute inset-0 w-full h-full ${className}`}>
      {/* Vidéo avec transition UX-friendly */}
      <video
        key={currentVideoIndex}
        className={`w-full h-full object-cover video-transition ${
          isTransitioning ? 'fade-out' : 'fade-in'
        }`}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      >
        <source src={localVideos[currentVideoIndex]} type="video/mp4" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
    </div>
  );
};

export default LocalVideoBackground; 