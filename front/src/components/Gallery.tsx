import React, { useState, useEffect } from 'react';
import { FaSpinner, FaImage } from 'react-icons/fa';
import { coiffeurService } from '../services/api/coiffeurs';
import { getImageUrl, handleImageError } from '../utils/imageUtils';
import Modal from './ui/Modal';

interface GalleryProps {
  coiffeurId: string;
  isOwner?: boolean;
}

interface GalleryImage {
  _id: string;
  url: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  serviceId: string;
}

const Gallery: React.FC<GalleryProps> = ({ coiffeurId, isOwner = false }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchGalleryImages();
  }, [coiffeurId]);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      const services = await coiffeurService.getCoiffeurServices(coiffeurId);
      const galleryImages: GalleryImage[] = [];
      
      services.forEach(service => {
        if (service.examplePhotos && service.examplePhotos.length > 0) {
          service.examplePhotos.forEach((photo: string) => {
            galleryImages.push({
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
      
      setImages(galleryImages);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="text-gray-600 mt-4">Chargement de la galerie...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <FaImage className="text-6xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune image</h3>
        <p className="text-gray-500">
          {isOwner 
            ? 'Ajoutez des photos d\'exemple à vos services pour enrichir votre galerie'
            : 'Ce coiffeur n\'a pas encore ajouté d\'images à sa galerie'
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image._id}
            className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            onClick={() => handleImageClick(image)}
          >
            <img
              src={getImageUrl(image.url, 'http://localhost:5000/default-service-image.png')}
              alt={image.serviceName}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => handleImageError(e, 'http://localhost:5000/default-service-image.png')}
            />
            
            {/* Overlay avec informations */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
              <div className="p-3 text-white w-full">
                <h4 className="font-semibold text-sm mb-1">{image.serviceName}</h4>
                <div className="flex justify-between items-center text-xs">
                  <span>{image.servicePrice}€</span>
                  <span>{image.serviceDuration}min</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal pour afficher l'image en grand */}
      {showModal && selectedImage && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title=""
        >
          <div className="relative">
            <img
              src={getImageUrl(selectedImage.url, 'http://localhost:5000/default-service-image.png')}
              alt={selectedImage.serviceName}
              className="w-full h-auto max-h-96 object-contain rounded-lg"
              onError={(e) => handleImageError(e, 'http://localhost:5000/default-service-image.png')}
            />
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold mb-2">{selectedImage.serviceName}</h3>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <span>{selectedImage.servicePrice}€</span>
                <span>•</span>
                <span>{selectedImage.serviceDuration} min</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Gallery; 