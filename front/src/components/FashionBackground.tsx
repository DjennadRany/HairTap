import React from 'react';

interface FashionBackgroundProps {
  className?: string;
}

function FashionBackground({ className = '' }: FashionBackgroundProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Gradient de fond fashion week élégant avec couleurs claires */}
      <div 
        className="absolute inset-0 animate-gradient"
        style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #dee2e6 50%, #ced4da 75%, #adb5bd 100%)',
          backgroundSize: '400% 400%'
        }}
      ></div>

      {/* Motif géométrique subtil fashion week */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, #6c757d 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, #6c757d 1px, transparent 1px),
            radial-gradient(circle at 40% 60%, #6c757d 1px, transparent 1px),
            radial-gradient(circle at 60% 40%, #6c757d 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}></div>
      </div>

      {/* Particules élégantes fashion week */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Particules flottantes subtiles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-gray-400/30 rounded-full animate-float"></div>
        <div className="absolute top-3/4 right-1/3 w-0.5 h-0.5 bg-gray-500/40 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-gray-400/25 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-0.5 h-0.5 bg-gray-500/35 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/4 right-1/2 w-1 h-1 bg-gray-400/20 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
        
        {/* Lignes élégantes subtiles */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-gray-400/20 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Overlay subtil pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-white/10"></div>
    </div>
  );
}

export default FashionBackground; 