import React, { useRef, useEffect, useState, useMemo } from 'react';
import VideoManager from './VideoManager';

interface LazyVideoProps {
  src: string;
  className?: string;
  alt?: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  onError?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  videoRef?: React.RefObject<HTMLVideoElement>; // ✅ Pour compatibilité avec videoRefs existants
}

/**
 * Composant vidéo avec lazy loading optimisé
 * - Ne charge la vidéo QUE si elle est visible dans le viewport (≥30%)
 * - Utilise IntersectionObserver pour détecter la visibilité
 * - Limite à 3-4 vidéos en lecture simultanée (gestionnaire global)
 * - Utilise data-src au lieu de src pour éviter le chargement automatique
 * - Charge les 9 premières vidéos au départ (métadonnées seulement)
 */
export const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  className = '',
  alt = '',
  poster,
  autoplay = false,
  muted = true,
  loop = true,
  playsInline = true,
  onError,
  videoRef: externalVideoRef
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const videoManager = useMemo(() => VideoManager.getInstance(), []);
  const videoId = useMemo(() => `video-${Math.random().toString(36).substring(2, 9)}`, []);
  
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(undefined); // ✅ Utiliser data-src initialement
  const [preloadMode, setPreloadMode] = useState<'none' | 'metadata' | 'auto'>('none'); // ✅ Mode de préchargement

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ✅ IntersectionObserver pour détecter la visibilité
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isIntersecting = entry.isIntersecting;
          const intersectionRatio = entry.intersectionRatio;
          setIsVisible(isIntersecting);

          // ✅ Charger les métadonnées des 9 premières vidéos visibles au départ (≥10%)
          // ✅ Charger la vidéo complète seulement si visible (≥30%)
          if (isIntersecting) {
            // Charger les métadonnées si visible ≥10% (pour les 9 premières)
            if (intersectionRatio >= 0.1 && !currentSrc) {
              setCurrentSrc(src);
              // Si visible ≥10% mais <30%, charger seulement les métadonnées
              if (intersectionRatio >= 0.1 && intersectionRatio < 0.3) {
                setPreloadMode('metadata'); // ✅ Charger les métadonnées seulement
              } else if (intersectionRatio >= 0.3) {
                setPreloadMode('auto'); // ✅ Charger la vidéo complète
              }
            } else if (intersectionRatio >= 0.3 && preloadMode === 'metadata') {
              // Passer de metadata à auto si devient plus visible
              setPreloadMode('auto');
            }
            
            // ✅ Auto-play seulement si visible (au moins 50% dans le viewport) ET autoplay activé
            if (intersectionRatio >= 0.5 && autoplay) {
              setShouldPlay(true);
            } else {
              setShouldPlay(false);
            }
            
            // ✅ Mettre à jour le gestionnaire global
            if (videoRef.current) {
              videoManager.updateIntersectionRatio(videoId, intersectionRatio);
            }
          } else {
            // ✅ Pause si non visible
            setShouldPlay(false);
            if (videoRef.current) {
              videoManager.updateIntersectionRatio(videoId, 0);
            }
          }
        });
      },
      {
        threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0], // Plusieurs seuils pour un contrôle fin
        rootMargin: '50px' // Commencer à charger 50px avant d'être visible
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      videoManager.unregisterVideo(videoId);
    };
  }, [autoplay, isLoaded, currentSrc, src, videoId, videoManager, videoRef, preloadMode]);

  // ✅ Gérer le play/pause selon la visibilité et le gestionnaire global
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc) return;

    if (shouldPlay && isVisible) {
      // ✅ Enregistrer la vidéo dans le gestionnaire global
      videoManager.registerVideo(videoId, video, isVisible ? 0.5 : 0);
      
      video.play()
        .then(() => {
          videoManager.setPlaying(videoId, true);
        })
        .catch((error) => {
          // Ignorer les erreurs de play (peut être bloqué par le navigateur)
          console.warn('Impossible de jouer la vidéo automatiquement:', error);
          videoManager.setPlaying(videoId, false);
        });
    } else {
      video.pause();
      videoManager.setPlaying(videoId, false);
    }
  }, [shouldPlay, isVisible, currentSrc, videoId, videoManager, videoRef]);

  // ✅ Pause la vidéo si la page devient cachée
  useEffect(() => {
    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (!video) return;

      if (document.hidden) {
        video.pause();
        videoManager.setPlaying(videoId, false);
      } else if (shouldPlay && isVisible) {
        video.play()
          .then(() => {
            videoManager.setPlaying(videoId, true);
          })
          .catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shouldPlay, isVisible, videoId, videoManager]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {/* ✅ Afficher le poster si la vidéo n'est pas chargée */}
      {(!isLoaded || !currentSrc) && poster && (
        <img
          src={poster}
          alt={alt}
          className="w-full h-full object-cover absolute inset-0 z-10"
        />
      )}
      
      {/* ✅ Vidéo avec data-src au lieu de src pour éviter le chargement automatique */}
      <video
        ref={videoRef}
        src={currentSrc} // ✅ Défini seulement si visible (≥10% pour métadonnées, ≥30% pour complet)
        data-src={src} // ✅ Stocker l'URL dans data-src
        className={`w-full h-full object-cover ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
        poster={poster}
        preload={preloadMode} // ✅ CRITIQUE: 'none' → 'metadata' → 'auto' selon la visibilité
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        onError={onError}
        onLoadedMetadata={() => {
          // ✅ Métadonnées chargées (pour les 9 premières)
          if (preloadMode === 'metadata') {
            // Enregistrer la vidéo dans le gestionnaire global même si seulement métadonnées
            if (videoRef.current) {
              videoManager.registerVideo(videoId, videoRef.current, isVisible ? 0.3 : 0);
            }
          }
        }}
        onLoadedData={() => {
          setIsLoaded(true);
          // ✅ Enregistrer la vidéo dans le gestionnaire global
          if (videoRef.current) {
            videoManager.registerVideo(videoId, videoRef.current, isVisible ? 0.5 : 0);
          }
          // Vidéo chargée, prête à jouer
          if (shouldPlay) {
            videoRef.current?.play()
              .then(() => {
                videoManager.setPlaying(videoId, true);
              })
              .catch(() => {});
          }
        }}
      />
    </div>
  );
};

