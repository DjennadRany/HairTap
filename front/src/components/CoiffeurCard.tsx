import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { coiffeurService } from '../services/api/coiffeurs';
import { FaStar, FaMapMarkerAlt, FaClock, FaHeart, FaImages, FaEuroSign } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import Modal from './ui/Modal';
import ImageOptimized from './ui/ImageOptimized';
import type { User } from '../types/models';

interface CoiffeurCardProps {
  coiffeur: User;
  onFavoriteToggle?: (coiffeurId: string) => void;
  isFavorite?: boolean;
  onClick?: () => void;
  userLocation?: { latitude: number; longitude: number } | null | undefined;
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
  userLocation
}) => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [serviceImages, setServiceImages] = useState<ServiceImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ServiceImage | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchServiceImages();
  }, [coiffeur._id]);

  const fetchServiceImages = async () => {
    try {
      const services = await coiffeurService.getCoiffeurServices(coiffeur._id);
      const images: ServiceImage[] = [];
      
      services.forEach(service => {
        if (service.examplePhotos && service.examplePhotos.length > 0) {
          service.examplePhotos.forEach((photo: string) => {
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
      console.error('Error fetching service images:', error);
    }
  };

  const handleImageClick = (image: ServiceImage) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const handleReservation = () => {
    if (selectedImage) {
      // Rediriger vers la page de réservation
      navigate(`/booking/${selectedImage.serviceId}`);
      setShowImageModal(false);
    }
  };

  return (
    <>
      <div 
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
        onClick={onClick}
      >
        {/* En-tête avec photo et infos principales */}
        <div className="relative">
          {/* Photo de profil avec fallback */}
          <div className="h-48 bg-gradient-to-br from-accent/10 to-accent/20 relative">
            <ImageOptimized
              src={coiffeur.photo || '/default-avatar.png'}
              alt={coiffeur.name}
              className="w-full h-full object-cover"
              fallbackSrc="/default-avatar.png"
            />
            
            {/* Badge vérifié */}
            {coiffeur.sirenStatus === 'verified' && (
              <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1">
                <MdVerified className="text-lg" />
              </div>
            )}

            {/* Bouton favori - ÉTOILE au lieu du cœur */}
            {user && user.role === 'client' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFavoriteToggle?.(coiffeur._id);
                }}
                className={`absolute top-3 left-3 p-2 rounded-full transition-all duration-300 ${
                  isFavorite 
                    ? 'bg-yellow-500 text-white shadow-lg' 
                    : 'bg-white/80 text-gray-600 hover:bg-yellow-500 hover:text-white'
                }`}
                title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <FaStar className={`text-lg ${isFavorite ? 'text-white' : 'text-gray-600'}`} />
              </button>
            )}
          </div>

          {/* Infos principales */}
          <div className="p-4">
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
                        <ImageOptimized
                          src={image.url}
                          alt={image.serviceName}
                          className="w-full h-full object-cover"
                          fallbackSrc="/default-service-image.png"
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
                className="flex-1 bg-accent text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-accent/90 transition-colors"
              >
                Voir le profil
              </Link>
            </div>
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
            <ImageOptimized
              src={selectedImage.url}
              alt={selectedImage.serviceName}
              className="w-full h-auto max-h-96 object-contain rounded-lg"
              fallbackSrc="/default-service-image.png"
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
                className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent/90 transition-colors"
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