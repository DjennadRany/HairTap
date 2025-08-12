import React, { useState, useEffect } from 'react';

interface HairSalonBackgroundProps {
  className?: string;
}

const HairSalonBackground: React.FC<HairSalonBackgroundProps> = ({ className = '' }) => {
  const [currentImage, setCurrentImage] = useState(0);

  // Images de salons de coiffure luxe
  const salonImages = [
    // Images de salons de coiffure (remplacez par vos vraies images)
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1521590832167-7acbfebba3f5?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1521590832167-7acbfebba3f5?w=1200&h=800&fit=crop',
  ];

  useEffect(() => {
    // Changer d'image toutes les 8 secondes
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % salonImages.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [salonImages.length]);

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

      {/* Images de salon de coiffure en slideshow */}
      <div className="absolute inset-0">
        {salonImages.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 w-full h-full transition-opacity duration-1000"
            style={{
              opacity: index === currentImage ? 1 : 0,
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        ))}
      </div>

      {/* Motif géométrique subtil fashion week */}
      <div className="absolute inset-0 opacity-10">
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
      <div className="absolute inset-0 bg-black/40" style={{ zIndex: 2 }}></div>

      {/* Particules élégantes fashion week */}
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

      {/* Indicateur de slideshow */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex gap-2">
          {salonImages.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImage 
                  ? 'bg-white' 
                  : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Indicateur de debug (optionnel) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 z-30">
          <div className="px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
            Salon {currentImage + 1}/{salonImages.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default HairSalonBackground; 