import React, { useState, useEffect, useRef } from 'react';
import { FaHeart, FaShare, FaVolumeUp, FaVolumeMute, FaComment, FaBookmark } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, handleImageError, DEFAULT_SERVICE_IMAGE } from '../utils/imageUtils';
import InstagramComments from './InstagramComments';
import BottomSheet from './BottomSheet';
import BookingForm from './BookingForm';
import { coiffeurService } from '../services/api/coiffeurs';

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  specialities: Array<{
    specialtyId: {
      _id: string;
      name: string;
      category: string;
    };
    expertiseLevel: number;
  }>;
  coiffeur: {
    _id: string;
    name: string;
    rating: number;
    address: {
      city: string;
    };
  };
  examplePhotos: string[];
  gallery: Array<{
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption: string;
    tags: string[];
    likes: number;
    createdAt: Date;
  }>;
  likes: number;
  views: number;
  popularityScore: number;
  style: string;
  targetAudience: string[];
}

interface InstagramGalleryProps {
  className?: string;
  services?: Service[];
  loading?: boolean;
  isProfileGallery?: boolean; // Pour distinguer les galeries de profil
}

export const InstagramGallery: React.FC<InstagramGalleryProps> = ({ 
  className = "", 
  services: propServices = [], 
  loading: propLoading = false,
  isProfileGallery = false
}) => {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(true);
  const [likedServices, setLikedServices] = useState<Set<string>>(new Set());
  const [savedServices, setSavedServices] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [showBooking, setShowBooking] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const [displayedServices, setDisplayedServices] = useState<Service[]>([]);
  const loading = propLoading;

  // Gérer le son des vidéos
  useEffect(() => {
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  // Initialiser les services affichés
  useEffect(() => {
    setDisplayedServices(propServices);
    loadUserLikes();
  }, [propServices]);

  // Charger les likes de l'utilisateur connecté
  const loadUserLikes = async () => {
    try {
      // Récupérer les services likés par l'utilisateur
      const response = await coiffeurService.getUserLikedServices();
      if (response && response.data) {
        const likedServiceIds = response.data.map(service => service._id);
        setLikedServices(new Set(likedServiceIds));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des likes:', error);
    }
  };

  // Gérer le scroll infini - continuer à défiler par le bas (seulement pour la page search)
  useEffect(() => {
    if (isProfileGallery) return; // Pas de scroll infini pour les galeries de profil

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Si on arrive en bas, ajouter plus de services
      if (scrollTop + windowHeight >= documentHeight - 200) {
        setDisplayedServices(prev => [...prev, ...propServices]);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [propServices, isProfileGallery]);


  // Obtenir le média principal d'un service
  const getServiceMedia = (service: Service) => {
    if (service.gallery && service.gallery.length > 0) {
      const firstItem = service.gallery[0];
      const mediaUrl = firstItem.mediaUrl || (firstItem as any).photoUrl;
      return {
        url: getImageUrl(mediaUrl, DEFAULT_SERVICE_IMAGE),
        type: firstItem.mediaType || 'image'
      };
    }
    if (service.images && service.images.length > 0) {
      return {
        url: getImageUrl(service.images[0], DEFAULT_SERVICE_IMAGE),
        type: 'image'
      };
    }
    return {
      url: DEFAULT_SERVICE_IMAGE,
      type: 'image'
    };
  };

  // Obtenir les spécialités
  const getServiceSpecialities = (service: Service) => {
    if (service.specialities && service.specialities.length > 0) {
      return service.specialities
        .filter(spec => spec.specialtyId && spec.specialtyId.name)
        .map(spec => spec.specialtyId.name);
    }
    return [];
  };

  // Gestion des likes avec API (comme Gallery.tsx)
  const handleLike = async (serviceId: string) => {
    try {
      // Trouver le service pour obtenir le coiffeurId
      const service = displayedServices.find(s => s._id === serviceId);
      if (!service || !service.coiffeur) {
        console.error('Service ou coiffeur introuvable');
        return;
      }

      const coiffeurId = typeof service.coiffeur === 'string' ? service.coiffeur : service.coiffeur._id;
      
      // Appeler l'API pour liker/unliker
      const response = await coiffeurService.toggleServiceLike(coiffeurId, serviceId);
      
      // Utiliser la nouvelle structure de réponse
      const likes = response.data?.likes || response.likes || 0;
      const isLiked = response.data?.isLiked || response.isLiked || false;
      
      // Mettre à jour l'état local
      setDisplayedServices(prevServices => 
        prevServices.map(s => 
          s._id === serviceId 
            ? { ...s, likes: likes }
            : s
        )
      );

      // Mettre à jour les likes locaux
      setLikedServices(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(serviceId);
        } else {
          newSet.delete(serviceId);
        }
        return newSet;
      });
      
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  // Gestion des sauvegardes
  const handleSave = (serviceId: string) => {
    setSavedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  // Gestion de l'affichage des commentaires
  const handleToggleComments = (serviceId: string) => {
    setShowComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  // Gestion du son
  const toggleSound = () => {
    setIsMuted(!isMuted);
  };

  // Clic sur un service - ouvrir le BottomSheet de réservation (comme desktop)
  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setShowBooking(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Chargement des services...</p>
        </div>
      </div>
    );
  }

  if (displayedServices.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">✂️</div>
          <h3 className="text-xl font-semibold mb-2">Aucun service disponible</h3>
          <p className="text-gray-400">Revenez plus tard pour découvrir de nouveaux services</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black">
      {/* Scroll vertical Instagram-like */}
      <div className="space-y-0">
        {displayedServices.map((service, index) => {
          const media = getServiceMedia(service);
          const specialities = getServiceSpecialities(service);
          const isLiked = likedServices.has(service._id);
          const isSaved = savedServices.has(service._id);

          return (
            <React.Fragment key={service._id}>
              <div className="relative h-screen w-full bg-black">
              {/* Média principal - plein écran */}
              <div 
                className="relative h-full w-full cursor-pointer"
                onClick={() => {
                  if (service.coiffeur) {
                    const coiffeurId = typeof service.coiffeur === 'string' ? service.coiffeur : service.coiffeur._id;
                    navigate(`/coiffeur/${coiffeurId}`);
                  }
                }}
              >
                {media.type === 'video' ? (
                  <video
                    ref={el => videoRefs.current[index] = el}
                    src={media.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted={isMuted}
                    loop
                    playsInline
                    onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
                  />
                ) : (
                  <img
                    src={media.url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
                  />
                )}
              </div>

              {/* Contrôle du son - uniquement pour les vidéos */}
              {media.type === 'video' && (
                <div className="absolute top-4 left-4 z-20">
                  <button
                    onClick={toggleSound}
                    className="p-3 rounded-full bg-black/50 text-white"
                  >
                    {isMuted ? <FaVolumeMute className="text-xl" /> : <FaVolumeUp className="text-xl" />}
                  </button>
                </div>
              )}

              {/* Actions à droite - style Instagram */}
              <div className={`absolute right-4 z-20 flex flex-col gap-4 transition-all duration-300 ${
                showComments.has(service._id) ? 'bottom-80' : 'bottom-32'
              }`}>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleLike(service._id)}
                    className={`p-3 rounded-full ${isLiked ? 'bg-red-500' : 'bg-black/50'} text-white`}
                  >
                    <FaHeart className={`text-xl ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                  <span className="text-white text-xs mt-1 font-medium">
                    {service.likes || 0}
                  </span>
                </div>
                
                <button 
                  onClick={() => handleToggleComments(service._id)}
                  className="p-3 rounded-full bg-black/50 text-white"
                >
                  <FaComment className="text-xl" />
                </button>
                
                <button className="p-3 rounded-full bg-black/50 text-white">
                  <FaShare className="text-xl" />
                </button>
                
                {/* Bouton "enregistré" supprimé - garder seulement "Favoris" */}
              </div>

              {/* Informations en bas - style Instagram */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="text-white">
                  {/* Informations du coiffeur */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">{(service.coiffeur?.name || 'C').charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{service.coiffeur?.name || 'Coiffeur'}</h3>
                      <p className="text-xs text-gray-300">{service.coiffeur?.address?.city || 'Ville'}</p>
                    </div>
                  </div>

                  {/* Description du service */}
                  <div className="mb-3">
                    <p className="text-sm">
                      <span className="font-semibold">{service.name}</span> - {service.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-300">
                      <span>{service.price}€</span>
                      <span>•</span>
                      <span>{service.duration || 30} min</span>
                    </div>
                  </div>

                  {/* Spécialités */}
                  {specialities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {specialities.slice(0, 3).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="bg-white/20 text-white px-2 py-1 rounded-full text-xs"
                        >
                          #{specialty}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bouton Réserver */}
                  <button
                    onClick={() => handleServiceClick(service)}
                    className="bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold w-full"
                  >
                    Réserver
                  </button>
                </div>
              </div>

              {/* Section des commentaires */}
              {showComments.has(service._id) && (
                <div className="absolute bottom-0 left-0 right-0 bg-white max-h-96 overflow-y-auto">
                  <InstagramComments
                    serviceId={service._id}
                    coiffeurId={service.coiffeur._id}
                    maxComments={3}
                  />
                </div>
              )}
              </div>
              {/* Bordure blanche de 40px */}
              <div className="w-full h-10 bg-white"></div>
            </React.Fragment>
          );
        })}
        
      </div>

      {/* Bottom Sheet de réservation - Identique au comportement desktop */}
      <BottomSheet
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        title="Réservation"
      >
        {selectedService && (
          <div className="p-4 pb-6">
            <BookingForm
              coiffeur={{ 
                _id: selectedService.coiffeur,
                name: selectedService.coiffeur?.name || 'Coiffeur',
                email: selectedService.coiffeur?.email || '',
                address: selectedService.coiffeur?.address || { city: 'Ville' }
              }} // Convertir ObjectId en objet avec données de base
              selectedService={selectedService}
              onClose={() => setShowBooking(false)}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default InstagramGallery;
