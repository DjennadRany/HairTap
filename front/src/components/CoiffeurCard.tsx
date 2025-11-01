import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { coiffeurService } from '../services/api/coiffeurs';
import { favoriteService } from '../services/api/favorites';
import { useNotification } from './ui/NotificationManager';
import { FaStar, FaMapMarkerAlt, FaClock, FaHeart, FaImages, FaEuroSign } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import Modal from './ui/Modal';
import { getImageUrl, handleImageError, DEFAULT_COIFFEUR_IMAGE, DEFAULT_SERVICE_IMAGE } from '../utils/imageUtils';
import { ConnectionIndicator } from './ConnectionIndicator';
// ImageOptimized component removed - will be reimplemented later
import type { User } from '../types/models';

interface CoiffeurCardProps {
  coiffeur: User;
  onFavoriteToggle?: (coiffeurId: string) => void;
  isFavorite?: boolean;
  onClick?: () => void;
  userLocation?: { latitude: number; longitude: number } | null | undefined;
  viewMode?: 'grid' | 'list';
}

interface ServiceImage {
  _id: string;
  url: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  serviceId: string;
}

const CoiffeurCard: React.FC<CoiffeurCardProps> = ({
  coiffeur,
  onFavoriteToggle,
  isFavorite = false,
  onClick,
  userLocation,
  viewMode = 'grid'
}) => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [serviceImages, setServiceImages] = useState<ServiceImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ServiceImage | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [favoriteState, setFavoriteState] = useState(isFavorite);
  const [connectionStatus, setConnectionStatus] = useState(coiffeur.connectionStatus);

  useEffect(() => {
    fetchServiceImages();
  }, [coiffeur._id]);

  // Rafraîchir le statut de connexion périodiquement
  useEffect(() => {
    const updateConnectionStatus = async () => {
      try {
        // Vérifier si le coiffeur est vraiment en ligne
        const now = new Date();
        const lastSeen = new Date(coiffeur.connectionStatus?.lastSeen || new Date());
        const timeDiff = now.getTime() - lastSeen.getTime();
        const timeoutMinutes = 2; // 2 minutes de timeout
        
        // Si lastSeen est trop ancien, considérer comme hors ligne
        const isReallyOnline = coiffeur.connectionStatus?.isOnline && timeDiff < (timeoutMinutes * 60 * 1000);
        
        setConnectionStatus({
          isOnline: isReallyOnline || false,
          lastSeen: coiffeur.connectionStatus?.lastSeen || new Date(),
          status: isReallyOnline ? (coiffeur.connectionStatus?.status || 'offline') : 'offline',
          availability: {
            isAvailable: Boolean(isReallyOnline && coiffeur.connectionStatus?.availability?.isAvailable),
            nextAvailable: coiffeur.connectionStatus?.availability?.nextAvailable,
            workingHours: coiffeur.connectionStatus?.availability?.workingHours || {
              monday: { start: '09:00', end: '18:00', isAvailable: false },
              tuesday: { start: '09:00', end: '18:00', isAvailable: false },
              wednesday: { start: '09:00', end: '18:00', isAvailable: false },
              thursday: { start: '09:00', end: '18:00', isAvailable: false },
              friday: { start: '09:00', end: '18:00', isAvailable: false },
              saturday: { start: '09:00', end: '18:00', isAvailable: false },
              sunday: { start: '09:00', end: '18:00', isAvailable: false }
            }
          }
        });
      } catch (error) {
        // Erreur mise à jour statut connexion - gérée silencieusement
      }
    };

    // Mettre à jour immédiatement
    updateConnectionStatus();
    
    // Puis toutes les 30 secondes
    const interval = setInterval(updateConnectionStatus, 30000);
    
    return () => clearInterval(interval);
  }, [coiffeur.connectionStatus]);

  // Synchroniser l'état des favoris
  useEffect(() => {
    setFavoriteState(isFavorite);
  }, [isFavorite]);

  const fetchServiceImages = async () => {
    try {
      const services = await coiffeurService.getCoiffeurServices(coiffeur._id);
      const images: ServiceImage[] = [];
      
      services.forEach(service => {
        if (service.images && service.images.length > 0) {
          service.images.forEach((photo: string) => {
            images.push({
              _id: `${service._id}_${photo}`,
              url: photo,
              serviceName: service.name,
              servicePrice: service.price,
              serviceDuration: service.duration,
              serviceId: service._id
            });
          });
        }
      });
      
      setServiceImages(images.slice(0, 4)); // Limiter à 4 images
    } catch (error) {
      // Erreur lors de la récupération des images de service
    }
  };

  const handleImageClick = (image: ServiceImage) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const handleReservation = () => {
    if (selectedImage) {
      // Rediriger vers la page du coiffeur avec la modal de réservation ouverte
      navigate(`/coiffeur/${coiffeur._id}?booking=true&service=${selectedImage.serviceId}`);
      setShowImageModal(false);
    }
  };

  // Fonction pour gérer les favoris
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user || user.role !== 'client') {
      showNotification({
        type: 'error',
        title: 'Accès refusé',
        message: 'Vous devez être connecté en tant que client pour ajouter des favoris'
      });
      return;
    }

    try {
      if (favoriteState) {
        await favoriteService.removeFavorite(coiffeur._id);
        setFavoriteState(false);
        showNotification({
          type: 'success',
          title: 'Favori retiré',
          message: 'Coiffeur retiré des favoris'
        });
      } else {
        await favoriteService.addFavorite(coiffeur._id);
        setFavoriteState(true);
        showNotification({
          type: 'success',
          title: 'Favori ajouté',
          message: 'Coiffeur ajouté aux favoris'
        });
      }
      
      // Appeler la fonction parent si elle existe
      onFavoriteToggle?.(coiffeur._id);
    } catch (error) {
      // Erreur lors de la gestion des favoris
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la gestion des favoris'
      });
    }
  };

  return (
    <>
      <div 
        className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer ${
          viewMode === 'list' ? 'flex' : ''
        }`}
        onClick={onClick}
      >
        {/* En-tête avec photo et infos principales */}
        <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
          {/* Photo de profil avec fallback */}
          <img
            src={getImageUrl(coiffeur.photo, DEFAULT_COIFFEUR_IMAGE)}
            alt={coiffeur.name}
            className={`object-cover ${viewMode === 'list' ? 'w-full h-full' : 'w-full h-48 rounded-t-lg'}`}
            onError={(e) => handleImageError(e, DEFAULT_COIFFEUR_IMAGE)}
          />
          
          {/* Indicateur de connexion - EN HAUT À DROITE */}
          <div className="absolute top-3 right-3">
            <ConnectionIndicator
              status={connectionStatus || undefined}
              size="sm"
              className="bg-white/90 rounded-full p-1"
            />
          </div>
          
          {/* Bouton favori - EN HAUT À GAUCHE */}
          <button
            onClick={handleFavoriteToggle}
            className={`absolute top-3 left-3 p-2 rounded-full transition-all duration-300 ${
              isFavorite 
                ? 'bg-red-500 text-white hover:bg-red-600 hover:scale-110'
                : 'bg-gray-600 text-white hover:bg-black hover:scale-110'
            }`}
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <FaHeart className="text-sm" />
          </button>
        </div>

          {/* Infos principales */}
          <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  {coiffeur.name}
                </h3>
                <p className="text-gray-600 text-sm mb-2">{coiffeur.email}</p>
                
                {/* Note et avis */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <FaStar className="text-yellow-400" />
                    <span className="font-semibold">{coiffeur.rating || 0}</span>
                    <span className="text-gray-500 text-sm">({coiffeur.totalRatings || 0} avis)</span>
                  </div>
                </div>

                {/* Spécialités */}
                {coiffeur.specialities && coiffeur.specialities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {coiffeur.specialities.slice(0, 3).map((speciality, index) => (
                      <span
                        key={index}
                        className="bg-accent/10 text-accent px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {speciality}
                      </span>
                    ))}
                  </div>
                )}

                {/* Localisation */}
                {coiffeur.address && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                    <FaMapMarkerAlt />
                    <span>{coiffeur.address.city}</span>
                  </div>
                )}

                {/* Mode de travail */}
                {coiffeur.workingMode && coiffeur.workingMode.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {coiffeur.workingMode.map((mode, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {mode === 'salon' ? 'En salon' : mode === 'domicile' ? 'À domicile' : mode}
                      </span>
                    ))}
                  </div>
                )}

                {/* Galerie d'images */}
                {serviceImages.length > 0 && (
                  <div className="flex gap-1 mb-3">
                    {serviceImages.slice(0, 3).map((image, index) => (
                      <div
                        key={image._id}
                        className="w-12 h-12 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageClick(image);
                        }}
                      >
                        <img
                          src={getImageUrl(image.url, DEFAULT_SERVICE_IMAGE)}
                          alt={image.serviceName}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
                        />
                      </div>
                    ))}
                    {serviceImages.length > 3 && (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-600">
                        +{serviceImages.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link
                to={`/coiffeur/${coiffeur._id}`}
                className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-black transition-colors"
              >
                Voir le profil
              </Link>
            </div>
          </div>
        </div>

      {/* Modal pour l'image et réservation */}
      {showImageModal && selectedImage && (
        <Modal
          open={showImageModal}
          onClose={() => setShowImageModal(false)}
          title=""
        >
          <div className="relative">
            <img
              src={getImageUrl(selectedImage.url, DEFAULT_SERVICE_IMAGE)}
              alt={selectedImage.serviceName}
              className="w-full h-auto max-h-96 object-contain rounded-lg"
              onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
            />
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold mb-2">{selectedImage.serviceName}</h3>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <FaEuroSign />
                  {selectedImage.servicePrice}€
                </span>
                <span className="flex items-center gap-1">
                  <FaClock />
                  {selectedImage.serviceDuration}min
                </span>
              </div>
              <button
                onClick={handleReservation}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-black transition-colors"
              >
                Réserver ce service
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default CoiffeurCard; 